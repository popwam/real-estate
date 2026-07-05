import http from "k6/http";
import { check, fail, sleep } from "k6";
import { Rate } from "k6/metrics";

const apiHost = (
  __ENV.LOAD_API_URL ||
  __ENV.API_BASE_URL ||
  "https://api-staging.popwam.com"
).replace(/\/$/, "");
const token = __ENV.CONVERSATION_TOKEN || "";
const enableWrites = __ENV.ENABLE_WRITES === "true";
const errorRate = new Rate("errors");
const messageSuccessRate = new Rate("conversation_message_success");

export const options = {
  scenarios: {
    public_conversation: {
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
    conversation_message_success: ["rate>0.98"],
  },
};

export function setup() {
  if (!token) {
    fail(
      "CONVERSATION_TOKEN is required. Use a staging test token and do not paste it into reports.",
    );
  }
  if (!enableWrites) {
    fail(
      "Refusing to create conversation messages. Re-run with ENABLE_WRITES=true after cleanup is ready.",
    );
  }
}

export default function () {
  const read = http.get(
    `${apiHost}/conversations/by-token/${encodeURIComponent(token)}`,
    {
      headers: { Accept: "application/json" },
      tags: { flow: "public_conversation_read" },
    },
  );
  const readOk = check(read, {
    "conversation loads": (res) => res.status === 200,
  });

  const stamp = `${Date.now()}-${__VU}-${__ITER}`;
  const write = http.post(
    `${apiHost}/conversations/by-token/${encodeURIComponent(token)}/messages`,
    JSON.stringify({
      senderName: "Load Test Visitor",
      body: `Load test message ${stamp}`,
    }),
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      tags: { flow: "public_conversation_write" },
    },
  );
  const writeOk = check(write, {
    "message accepted": (res) => res.status === 200 || res.status === 201,
  });

  errorRate.add(!(readOk && writeOk));
  messageSuccessRate.add(writeOk);
  sleep(1);
}
