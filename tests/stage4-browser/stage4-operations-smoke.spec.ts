import { expect, request as playwrightRequest, test, type APIRequestContext, type Page } from "@playwright/test";

const API_URL = (process.env.STAGE4_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ADMIN_URL = (process.env.STAGE4_ADMIN_URL ?? "http://127.0.0.1:3203").replace(/\/$/, "");

const accounts = {
  developer: { email: "developer.demo@popwam.local", password: "Demo@123456" },
  platform: { email: "ceo@popwam.com", password: "30@@mmMM" },
};

let api: APIRequestContext;
let developerToken = "";
let fixtures: {
  employeeId?: string;
  transactionId?: string;
  legalDocumentId?: string;
  campaignId?: string;
  cameraId?: string;
} = {};

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  api = await playwrightRequest.newContext({ baseURL: API_URL, extraHTTPHeaders: { Accept: "application/json" } });
  const health = await api.get("/health");
  expect(health.ok(), `API health failed at ${API_URL}/health`).toBeTruthy();
  developerToken = await loginApi(accounts.developer.email, accounts.developer.password);
  fixtures = await createOperationsFixtures(developerToken);
});

test.afterAll(async () => {
  await api?.dispose();
});

test("developer operations pages render and expose foundation controls", async ({ page }) => {
  await loginAdmin(page, accounts.developer.email, accounts.developer.password);

  await page.goto(`${ADMIN_URL}/developer/operations/overview`);
  await expect(page.getByRole("heading", { name: "Operations overview" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Summary cards" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent operations activity" })).toBeVisible();

  await page.goto(`${ADMIN_URL}/developer/crm/pipeline`);
  await expect(page.getByRole("heading", { name: "CRM pipeline" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pipeline controls" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Lead to move" })).toBeVisible();
  await expect(page.getByPlaceholder("Lead, status, or project")).toBeVisible();

  await page.goto(`${ADMIN_URL}/developer/crm/tasks`);
  await expect(page.getByRole("heading", { name: "CRM tasks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create follow-up task" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tasks", exact: true })).toBeVisible();

  await expectOperationsPage(page, "/developer/hr/employees", "HR employees", "Create record", "Records");
  await expectOperationsPage(page, "/developer/hr/departments", "HR departments", "Create record", "Records");
  await expectOperationsPage(page, "/developer/hr/attendance", "HR attendance", "Create record", "Records");

  await expectOperationsPage(page, "/developer/accounting/transactions", "Accounting transactions", "Create record", "Records");
  await page.goto(`${ADMIN_URL}/developer/accounting/summary`);
  await expect(page.getByRole("heading", { name: "Accounting summary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Summary", exact: true })).toBeVisible();

  await expectOperationsPage(page, "/developer/legal/documents", "Legal documents", "Create record", "Records");
  await expectOperationsPage(page, "/developer/legal/cases", "Legal cases", "Create record", "Records");

  await expectOperationsPage(page, "/developer/ads/campaigns", "Ads campaigns", "Create record", "Records");
  await expect(page.getByText("This does not publish to Google, Meta, or TikTok yet.")).toBeVisible();

  await expectOperationsPage(page, "/developer/cameras/devices", "Camera devices", "Create record", "Records");
  await expect(page.getByText("No live stream, DVR connection, credentials, or AI analysis is active.")).toBeVisible();

  await expectDetailPage(page, `/developer/hr/employees/${fixtures.employeeId}`, "HR employee detail");
  await expectDetailPage(page, `/developer/accounting/transactions/${fixtures.transactionId}`, "Accounting transaction detail");
  await expectDetailPage(page, `/developer/legal/documents/${fixtures.legalDocumentId}`, "Legal document detail");
  await expectDetailPage(page, `/developer/ads/campaigns/${fixtures.campaignId}`, "Ads campaign detail");
  await expectDetailPage(page, `/developer/cameras/devices/${fixtures.cameraId}`, "Camera device detail");
  await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error/i);
});

test("platform operations overview pages render", async ({ page }) => {
  await loginAdmin(page, accounts.platform.email, accounts.platform.password);

  for (const [path, heading] of [
    ["/platform/crm/pipeline", "CRM pipeline"],
    ["/platform/crm/tasks", "CRM tasks"],
    ["/platform/hr/overview", "HR overview"],
    ["/platform/accounting/overview", "Accounting overview"],
    ["/platform/legal/overview", "Legal overview"],
    ["/platform/ads/overview", "Ads overview"],
    ["/platform/cameras/overview", "Cameras overview"],
    ["/platform/operations/overview", "Operations overview"],
  ] as const) {
    await page.goto(`${ADMIN_URL}${path}`);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error/i);
  }
});

async function expectOperationsPage(page: Page, path: string, heading: string, createHeading: string, recordsHeading: string) {
  await page.goto(`${ADMIN_URL}${path}`);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Filters" })).toBeVisible();
  await expect(page.getByRole("heading", { name: createHeading })).toBeVisible();
  await expect(page.getByRole("heading", { name: recordsHeading })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error/i);
}

async function expectDetailPage(page: Page, path: string, heading: string) {
  await page.goto(`${ADMIN_URL}${path}`);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Record summary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Edit record" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Operations activity" })).toBeVisible();
  await expect(page.locator("body")).toContainText(/created|updated|No operations activity recorded yet/i);
  await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error/i);
}

async function loginAdmin(page: Page, email: string, password: string) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForFunction(() => Boolean(window.localStorage.getItem("popwam.admin.accessToken")));
  await expect(page).not.toHaveURL(/\/login$/);
}

async function loginApi(email: string, password: string) {
  const response = await api.post("/auth/login", { data: { email, password } });
  expect(response.ok(), `API login failed for ${email}`).toBeTruthy();
  const body = await response.json();
  return body.accessToken as string;
}

async function createOperationsFixtures(token: string) {
  const stamp = Date.now();
  const headers = { Authorization: `Bearer ${token}` };
  const department = await api.post("/hr/departments", { headers, data: { name: `Smoke Department ${stamp}` } });
  expect(department.ok()).toBeTruthy();
  const departmentBody = await department.json();

  const employee = await api.post("/hr/employees", {
    headers,
    data: { name: `Smoke Employee ${stamp}`, departmentId: departmentBody.id, roleTitle: "Smoke Tester" },
  });
  expect(employee.ok()).toBeTruthy();

  const category = await api.post("/accounting/categories", { headers, data: { name: `Smoke Income ${stamp}`, type: "INCOME" } });
  expect(category.ok()).toBeTruthy();
  const categoryBody = await category.json();

  const transaction = await api.post("/accounting/transactions", {
    headers,
    data: { type: "INCOME", amount: 42, currency: "EGP", categoryId: categoryBody.id, description: "Stage 4 smoke transaction" },
  });
  expect(transaction.ok()).toBeTruthy();

  const legalDocument = await api.post("/legal/documents", {
    headers,
    data: { title: `Smoke Contract ${stamp}`, type: "CONTRACT", status: "ACTIVE" },
  });
  expect(legalDocument.ok()).toBeTruthy();

  const campaign = await api.post("/ads/campaigns", {
    headers,
    data: { name: `Smoke Campaign ${stamp}`, provider: "OTHER", status: "DRAFT", budgetAmount: 100, currency: "EGP" },
  });
  expect(campaign.ok()).toBeTruthy();

  const camera = await api.post("/cameras/devices", {
    headers,
    data: { name: `Smoke Camera ${stamp}`, provider: "GENERIC", status: "ACTIVE", aiEnabled: false },
  });
  expect(camera.ok()).toBeTruthy();

  return {
    employeeId: (await employee.json()).id as string,
    transactionId: (await transaction.json()).id as string,
    legalDocumentId: (await legalDocument.json()).id as string,
    campaignId: (await campaign.json()).id as string,
    cameraId: (await camera.json()).id as string,
  };
}
