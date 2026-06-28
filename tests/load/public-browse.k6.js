import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const publicHost = (__ENV.PUBLIC_BASE_URL || "https://staging.popwam.com").replace(/\/$/, "");
const errorRate = new Rate("errors");

export const options = {
  scenarios: {
    public_browse: {
      executor: "ramping-vus",
      stages: [
        { target: 10, duration: "2m" },
        { target: 50, duration: "5m" },
        { target: 100, duration: "5m" },
        { target: 250, duration: "5m" },
        { target: 0, duration: "1m" },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    errors: ["rate<0.02"],
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<2000"],
  },
};

const paths = [
  "/",
  "/projects",
  "/projects/northline-residences",
  "/northline",
  "/landing/northline-launch",
];

export default function () {
  for (const path of paths) {
    const response = http.get(`${publicHost}${path}`, {
      tags: { flow: "public_browse", path },
    });
    const ok = check(response, {
      "status is 2xx": (res) => res.status >= 200 && res.status < 300,
      "no 5xx": (res) => res.status < 500,
    });
    errorRate.add(!ok);
    sleep(1);
  }
}
