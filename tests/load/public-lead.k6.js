import http from "k6/http";
import { check, fail, sleep } from "k6";
import { Rate } from "k6/metrics";

const apiHost = (__ENV.API_BASE_URL || "https://api-staging.popwam.com").replace(/\/$/, "");
const projectSlug = __ENV.PROJECT_SLUG || "northline-residences";
const organizationSlug = __ENV.ORGANIZATION_SLUG || "";
const enableWrites = __ENV.ENABLE_WRITES === "true";
const errorRate = new Rate("errors");
const leadSuccessRate = new Rate("lead_creation_success");

export const options = {
  scenarios: {
    public_lead: {
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
    lead_creation_success: ["rate>0.98"],
  },
};

export function setup() {
  if (!enableWrites) {
    fail("Refusing to create lead data. Re-run with ENABLE_WRITES=true after staging seed and cleanup are ready.");
  }

  const project = http.get(`${apiHost}/public/projects/${encodeURIComponent(projectSlug)}`);
  check(project, { "project detail available": (res) => res.status === 200 });
  const body = project.json();
  return {
    organizationSlug: organizationSlug || body?.developer?.slug,
  };
}

export default function (data) {
  const stamp = `${Date.now()}-${__VU}-${__ITER}`;
  const payload = {
    organizationSlug: data.organizationSlug,
    projectSlug,
    name: `Load Test Lead ${stamp}`,
    phone: `+2010${String(Date.now()).slice(-8)}`,
    email: `loadtest-${stamp}@example.com`,
    message: `Load test public lead ${stamp}`,
    sourcePage: "/projects/northline-residences",
    utm: { source: "k6", scenario: "public-lead" },
    preferredContactMethod: "CHAT",
    consent: true,
    website: "",
    companyWebsite: "",
  };

  const response = http.post(`${apiHost}/public/leads`, JSON.stringify(payload), {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    tags: { flow: "public_lead" },
  });

  const ok = check(response, {
    "lead accepted": (res) => res.status === 200 || res.status === 201,
    "success body": (res) => Boolean(res.json("success") ?? res.json("id")),
  });
  errorRate.add(!ok);
  leadSuccessRate.add(ok);
  sleep(1);
}
