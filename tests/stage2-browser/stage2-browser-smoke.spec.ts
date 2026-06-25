import { expect, request as playwrightRequest, test, type APIRequestContext, type Page } from "@playwright/test";

const API_URL = (process.env.STAGE2_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ADMIN_URL = (process.env.STAGE2_ADMIN_URL ?? "http://127.0.0.1:3203").replace(/\/$/, "");
const PUBLIC_URL = (process.env.STAGE2_PUBLIC_URL ?? "http://127.0.0.1:3205").replace(/\/$/, "");

const accounts = {
  developer: { email: "developer.demo@popwam.local", password: "Demo@123456" },
  brokerage: { email: "brokerage.demo@popwam.local", password: "Demo@123456" },
  broker: { email: "broker.demo@popwam.local", password: "Demo@123456" },
  platform: { email: "ceo@popwam.com", password: "30@@mmMM" },
};

type AuthSession = {
  accessToken: string;
};

type PublicProject = {
  slug: string;
  name: string;
  developer: {
    slug: string;
  };
};

type PreparedStage2Data = {
  projectSlug: string;
  organizationSlug: string;
  crmLeadId: string;
  conversationId: string;
  shareToken: string;
};

let api: APIRequestContext;
let prepared: PreparedStage2Data;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  api = await playwrightRequest.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Accept: "application/json" },
  });

  const health = await api.get("/health");
  expect(health.ok(), `API health failed at ${API_URL}/health`).toBeTruthy();
  prepared = await prepareCrmConversation(api);
});

test.afterAll(async () => {
  await api?.dispose();
});

test("developer import/export browser flow", async ({ page }) => {
  await loginAdmin(page, accounts.developer.email, accounts.developer.password);
  await page.goto(`${ADMIN_URL}/developer/import-export`);
  await expect(page.getByRole("heading", { name: /project and inventory import/i })).toBeVisible();

  const unique = Date.now();
  const rows = [
    {
      projectName: `Browser Smoke Residences ${unique}`,
      projectSlug: `browser-smoke-residences-${unique}`,
      projectType: "COMPOUND",
      city: "Cairo",
      district: "New Cairo",
      projectStatus: "ACTIVE",
      projectVisibility: "OPEN_MARKETPLACE",
      phaseName: "Phase 1",
      unitCode: `BS-${unique}`,
      unitType: "APARTMENT",
      areaSqm: 128,
      bedrooms: 2,
      bathrooms: 2,
      basePrice: 2600000,
      currency: "EGP",
      planName: "Browser Smoke Plan",
      downPaymentPercent: 10,
      years: 7,
      installmentFrequency: "quarterly",
    },
    {
      projectName: "",
      projectType: "NOT_A_PROJECT_TYPE",
      city: "",
      district: "",
      unitType: "",
      areaSqm: "not-a-number",
      basePrice: "",
    },
  ];

  await page.getByPlaceholder("inventory-import.csv").fill(`browser-smoke-${unique}.json`);
  await page.locator("textarea").first().fill(JSON.stringify(rows, null, 2));
  await page.getByRole("button", { name: "Preview import" }).click();

  await expect(page.getByRole("heading", { name: "Import summary" })).toBeVisible();
  await expect(page.getByText("Valid rows", { exact: true })).toBeVisible();
  await expect(page.getByText("Invalid rows", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Row validation" })).toBeVisible();

  await page.getByRole("button", { name: "Commit valid rows" }).click();
  await expect(
    page.getByText(/Import commit completed\.|This job was already committed\. No duplicate records were created\./i),
  ).toBeVisible();

  const viewJob = page.getByRole("link", { name: "View job" });
  if (await viewJob.isVisible()) {
    await viewJob.click();
    await expect(page.getByRole("heading", { name: /Import job/i })).toBeVisible();
  }

  await page.goto(`${ADMIN_URL}/developer/import-export/export`);
  await expect(page.getByRole("heading", { name: "Data export" })).toBeVisible();
  const datasetSelect = page.locator("select").filter({ hasText: "projects" }).first();
  await datasetSelect.selectOption("projects");
  await page.getByRole("button", { name: "Run export" }).click();
  await expect(page.getByText(/"dataType": "projects"/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Download JSON" })).toBeEnabled();

  await datasetSelect.selectOption("account");
  await page.getByRole("button", { name: "Run export" }).click();
  await expect(page.getByText(/"dataType": "account"/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText("passwordHash");
  await expect(page.locator("body")).not.toContainText("refreshToken");
  await expect(page.locator("body")).not.toContainText("verificationToken");
});

test("brokerage CRM claim and conversation browser flow", async ({ page }) => {
  await loginAdmin(page, accounts.broker.email, accounts.broker.password);
  await page.goto(`${ADMIN_URL}/brokerage/crm/marketplace-leads`);
  await expect(page.getByRole("heading", { name: "Marketplace leads" })).toBeVisible();

  const claimButton = page.getByRole("button", { name: "Claim lead" }).first();
  if (await claimButton.isVisible()) {
    await claimButton.click();
    await expect(page.getByText(/Lead claimed|already been claimed/i)).toBeVisible();
  }

  await page.goto(`${ADMIN_URL}/brokerage/conversations`);
  await expect(page.getByRole("heading", { name: "Conversations" })).toBeVisible();
  await openFirstTableAction(page, "Open");
  await expect(page.getByRole("heading", { name: "Conversation overview" })).toBeVisible();

  const composer = page.getByPlaceholder("Write a conversation message.");
  if (await composer.isVisible()) {
    const body = `Browser smoke broker message ${Date.now()}`;
    await composer.fill(body);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(body).first()).toBeVisible();
  }
});

test("developer CRM leads and conversations browser flow", async ({ page }) => {
  await loginAdmin(page, accounts.developer.email, accounts.developer.password);
  await page.goto(`${ADMIN_URL}/developer/crm/leads`);
  await expect(page.getByRole("heading", { name: "CRM lead inbox" })).toBeVisible();
  await page.goto(`${ADMIN_URL}/developer/crm/leads/${prepared.crmLeadId}`);
  await expect(page.getByRole("heading", { name: "Activity timeline" })).toBeVisible();
  await expectActivityTimelineSurface(page);

  await page.goto(`${ADMIN_URL}/developer/conversations`);
  await expect(page.getByRole("heading", { name: "Conversations" })).toBeVisible();
  await page.goto(`${ADMIN_URL}/developer/conversations/${prepared.conversationId}`);
  await expect(page.getByRole("heading", { name: "Conversation overview" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Private share link" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conversation activity" })).toBeVisible();
  await expectActivityTimelineSurface(page);
});

test("platform overview pages render without app crash", async ({ page }) => {
  await loginAdmin(page, accounts.platform.email, accounts.platform.password);

  for (const path of ["/platform/crm/leads", "/platform/conversations", "/platform/import-export/jobs", "/platform/crm/activities"]) {
    await page.goto(`${ADMIN_URL}${path}`);
    await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error/i);
  }

  await page.goto(`${ADMIN_URL}/platform/import-export/jobs`);
  await expect(page.getByRole("heading", { name: "Import jobs" })).toBeVisible();

  await page.goto(`${ADMIN_URL}/platform/crm/activities`);
  await expect(page.getByRole("heading", { name: "CRM activity" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Filters" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Activity timeline" })).toBeVisible();
  await expectActivityTimelineSurface(page);
  await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error/i);
  await expect(page.locator("body")).not.toContainText("passwordHash");
  await expect(page.locator("body")).not.toContainText("refreshToken");

  await page.goto(`${ADMIN_URL}/platform/crm/leads/${prepared.crmLeadId}`);
  await expect(page.getByRole("heading", { name: "Activity timeline" })).toBeVisible();
  await expectActivityTimelineSurface(page);

  await page.goto(`${ADMIN_URL}/platform/conversations/${prepared.conversationId}`);
  await expect(page.getByRole("heading", { name: "Conversation activity" })).toBeVisible();
  await expectActivityTimelineSurface(page);
});

test("public contact options and public conversation reply route", async ({ page }) => {
  await page.goto(`${PUBLIC_URL}/projects`);
  await expect(page.getByRole("heading", { name: "Public projects" })).toBeVisible();

  const firstProjectLink = page.getByRole("link", { name: "View project" }).first();
  if (await firstProjectLink.isVisible()) {
    await firstProjectLink.click();
  } else {
    await page.goto(`${PUBLIC_URL}/projects/${prepared.projectSlug}`);
  }
  await expect(page.getByRole("heading", { name: "Send your interest" }).first()).toBeVisible();

  await submitPublicLeadForm(page, "CALL");
  await expect(page.getByText("Your request was sent")).toBeVisible();

  await page.goto(`${PUBLIC_URL}/projects/${prepared.projectSlug}`);
  await submitPublicLeadForm(page, "CHAT");
  await expect(page.getByText("Your conversation is ready")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open conversation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Demo/mock conversation link.");
  const chatConversationHref = await page
    .getByRole("link", { name: "Open conversation" })
    .getAttribute("href");
  expect(chatConversationHref).toMatch(/^\/c\/[^/]+$/);
  expect(chatConversationHref).not.toContain("mock-chat");

  await page.goto(`${PUBLIC_URL}${chatConversationHref}`);
  await expect(page.getByRole("main").getByText("Private conversation")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("organizationId");
  await expect(page.locator("body")).not.toContainText("crmLeadId");
  await expect(page.locator("body")).not.toContainText("clientId");
  await expect(page.locator("body")).not.toContainText("claimedByBrokerUserId");

  const publicReply = `Browser public reply ${Date.now()}`;
  await page.getByLabel(/Your name/i).fill("Browser Smoke Visitor");
  await page.getByRole("textbox", { name: "Message" }).fill(publicReply);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Your message was sent.")).toBeVisible();
  await expect(page.getByText(publicReply)).toBeVisible();

  await page.goto(`${PUBLIC_URL}/projects/${prepared.projectSlug}`);
  const popupPromise = page.waitForEvent("popup", { timeout: 5_000 }).catch(() => null);
  await submitPublicLeadForm(page, "WHATSAPP");
  const popup = await popupPromise;
  await popup?.close();
  await expect(page.getByText("Your request was sent")).toBeVisible();

  await page.goto(`${PUBLIC_URL}/c/${prepared.shareToken}`);
  await expect(page.getByRole("main").getByText("Private conversation")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
});

async function loginAdmin(page: Page, email: string, password: string) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForFunction(() => Boolean(window.localStorage.getItem("popwam.admin.accessToken")));
  await expect(page).not.toHaveURL(/\/login$/);
}

async function submitPublicLeadForm(page: Page, method: "CALL" | "CHAT" | "WHATSAPP") {
  const stamp = Date.now();
  const form = page.locator("form").filter({ hasText: "Preferred contact" }).last();
  await form.getByLabel(methodLabel(method)).check();
  await form.getByLabel("Full name").fill(`Browser Smoke ${method} ${stamp}`);
  await form.getByLabel("Phone number").fill(`+2010${String(stamp).slice(-8)}`);
  await form.getByLabel("Email (optional)").fill(`browser-${method.toLowerCase()}-${stamp}@example.com`);
  await form.getByLabel("Message (optional)").fill(`Browser smoke ${method} request.`);
  await form.getByLabel(/I agree that POPWAM may share this request/i).check();
  await form.getByRole("button", { name: submitButtonLabel(method) }).click();
}

function methodLabel(method: "CALL" | "CHAT" | "WHATSAPP") {
  if (method === "CALL") return "Request a call";
  if (method === "CHAT") return "Message online";
  return "WhatsApp";
}

function submitButtonLabel(method: "CALL" | "CHAT" | "WHATSAPP") {
  if (method === "CALL") return "Request a call";
  if (method === "CHAT") return "Send message";
  return "Continue with WhatsApp";
}

async function openFirstTableAction(page: Page, name: string) {
  const action = page.getByRole("link", { name }).first();
  await expect(action).toBeVisible();
  await action.click();
}

async function expectActivityTimelineSurface(page: Page) {
  const emptyState = page.getByText("No activity recorded yet");
  const activityItem = page
    .getByRole("listitem")
    .filter({
      hasText:
        /Lead Created|Lead Converted|Lead Claimed|Lead Status Changed|Conversation Created|Conversation Status Changed|Message Sent|Public Message Sent|Note Added/i,
    })
    .first();

  await expect(emptyState.or(activityItem)).toBeVisible();

  if (await activityItem.isVisible()) {
    await expect(activityItem.getByText(/CRM lead|Public lead|Conversation|Message|status|created|claimed/i).first()).toBeVisible();
  }
}

async function prepareCrmConversation(context: APIRequestContext): Promise<PreparedStage2Data> {
  const developer = await loginApi(context, accounts.developer.email, accounts.developer.password);
  const projects = await getJson<PublicProject[]>(context, "GET", "/public/projects");
  expect(projects.length, "Seeded public projects are required for browser smoke").toBeGreaterThan(0);

  const project = projects[0];
  const unique = Date.now();
  const lead = await getJson<{ id: string }>(context, "POST", "/public/leads", {
    data: {
      organizationSlug: project.developer.slug,
      projectSlug: project.slug,
      name: `Browser Smoke Lead ${unique}`,
      phone: `+2011${String(unique).slice(-8)}`,
      email: `browser-smoke-${unique}@example.com`,
      message: "Browser smoke lead for CRM conversation automation.",
      sourcePage: "/projects",
      utm: { smoke: "playwright" },
      preferredContactMethod: "CHAT",
      consent: true,
      website: "",
      companyWebsite: "",
    },
  });

  const conversion = await getJson<{ crmLead: { id: string } }>(
    context,
    "PATCH",
    `/public-leads/${lead.id}/convert-placeholder`,
    { token: developer.accessToken, data: {} },
  );

  const conversation = await getJson<{ id: string; shareToken: string }>(
    context,
    "POST",
    `/conversations/from-crm-lead/${conversion.crmLead.id}`,
    {
      token: developer.accessToken,
      data: { openingMessage: "Browser smoke conversation created from CRM lead." },
    },
  );

  return {
    projectSlug: project.slug,
    organizationSlug: project.developer.slug,
    crmLeadId: conversion.crmLead.id,
    conversationId: conversation.id,
    shareToken: conversation.shareToken,
  };
}

async function loginApi(context: APIRequestContext, email: string, password: string) {
  return getJson<AuthSession>(context, "POST", "/auth/login", {
    data: { email, password },
  });
}

async function getJson<T>(
  context: APIRequestContext,
  method: "GET" | "POST" | "PATCH",
  path: string,
  options: { data?: unknown; token?: string } = {},
) {
  const response = await context.fetch(path, {
    method,
    data: options.data,
    headers: {
      Accept: "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
  });

  const text = await response.text();
  if (!response.ok()) {
    throw new Error(`${method} ${path} failed with ${response.status()}: ${text}`);
  }

  return text ? (JSON.parse(text) as T) : (null as T);
}
