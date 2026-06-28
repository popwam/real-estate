import http from "k6/http";
import { check, fail, sleep } from "k6";
import { Rate } from "k6/metrics";

const apiHost = (__ENV.API_BASE_URL || "https://api-staging.popwam.com").replace(/\/$/, "");
const email = __ENV.ADMIN_EMAIL || "";
const password = __ENV.ADMIN_PASSWORD || "";
const errorRate = new Rate("errors");

export const options = {
  scenarios: {
    admin_light: {
      executor: "ramping-vus",
      stages: [
        { target: 10, duration: "2m" },
        { target: 50, duration: "5m" },
        { target: 100, duration: "5m" },
        { target: 0, duration: "1m" },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    errors: ["rate<0.02"],
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<3000"],
  },
};

export function setup() {
  if (!email || !password) {
    fail("ADMIN_EMAIL and ADMIN_PASSWORD are required. Pass staging-only credentials via environment variables.");
  }
}

export default function () {
  const login = http.post(
    `${apiHost}/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      tags: { flow: "admin_login" },
    },
  );
  const token = login.json("accessToken");
  const loginOk = check(login, {
    "login accepted": (res) => res.status === 200,
    "token returned": () => Boolean(token),
  });

  if (!token) {
    errorRate.add(true);
    sleep(1);
    return;
  }

  const headers = { Accept: "application/json", Authorization: `Bearer ${token}` };
  const paths = [
    "/auth/me",
    "/crm/leads",
    "/conversations",
    "/deal-rooms",
  ];

  let allOk = loginOk;
  for (const path of paths) {
    const response = http.get(`${apiHost}${path}`, {
      headers,
      tags: { flow: "admin_light", path },
    });
    const ok = check(response, {
      "endpoint success or authorized empty": (res) => res.status >= 200 && res.status < 300,
    });
    allOk = allOk && ok;
    sleep(1);
  }

  errorRate.add(!allOk);
}
