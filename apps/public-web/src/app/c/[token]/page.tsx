import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PublicConversationState } from "@/components/conversation/public-conversation-state";
import { PublicConversationView } from "@/components/conversation/public-conversation-view";
import { normalizeLocale, tServer } from "@/i18n/server";
import { getPublicConversationByToken } from "@/lib/public-data";
import { getPublicCompanyPortal, PublicApiError, type ApiCompanyPortal } from "@/lib/public-api";
import { createSeoMetadata } from "@/lib/seo";

type ConversationPageProps = {
  params: Promise<{ token: string }>;
};

type ConversationResult =
  | Awaited<ReturnType<typeof getPublicConversationByToken>>
  | { error: ConversationError };

type ConversationError = "invalid" | "expired" | "inaccessible" | "network";

export async function generateMetadata({ params }: ConversationPageProps) {
  const { token } = await params;

  return createSeoMetadata({
    title: "Private Conversation",
    description: "Private POPWAM conversation link.",
    path: `/c/${token}`,
    noindex: true,
  });
}

export default async function PublicConversationPage({
  params,
}: ConversationPageProps) {
  const { token } = await params;
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);
  const company = await getCompanyPortalResult(token);
  if (company && company.domain?.redirectMode === "REDIRECT_TO_EXTERNAL" && safeRedirectUrl(company.domain.redirectUrl)) {
    redirect(company.domain.redirectUrl);
  }
  if (company) {
    return <CompanyPortalView portal={company} locale={locale} />;
  }
  const result = await getConversationResult(token);

  return (
    <div className="bg-[var(--color-background)] px-4 py-8 sm:px-6">
      {"error" in result ? (
        <ConversationErrorState error={result.error} locale={locale} />
      ) : (
        <PublicConversationView token={token} initialConversation={result} />
      )}
    </div>
  );
}

async function getCompanyPortalResult(token: string) {
  try {
    return await getPublicCompanyPortal(token);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) return null;
    return null;
  }
}

function CompanyPortalView({
  portal,
  locale,
}: {
  portal: ApiCompanyPortal;
  locale: string;
}) {
  const t = (key: string) => tServer(locale, key);
  const organization = portal.organization;
  const contact = organization.contact;
  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase text-[var(--color-accent)]">{t("companyPortal.companyPortal")}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{organization.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            {organization.profile.summary || t("companyPortal.defaultSummary")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {contact.phone ? <a className="ui-button ui-button-primary" href={`tel:${contact.phone}`}>{t("companyPortal.callCompany")}</a> : null}
            {contact.email ? <a className="ui-button ui-button-secondary" href={`mailto:${contact.email}`}>{t("companyPortal.emailCompany")}</a> : null}
            {organization.profile.website ? <a className="ui-button ui-button-secondary" href={organization.profile.website}>{t("companyPortal.website")}</a> : null}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-lg font-semibold">{t("companyPortal.offices")}</h2>
          <div className="mt-4 grid gap-3">
            {portal.offices.length ? portal.offices.map((office) => (
              <article key={office.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <h3 className="font-semibold">{office.name}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{[office.address, office.city, office.country].filter(Boolean).join(", ") || t("companyPortal.locationNotSet")}</p>
              </article>
            )) : <p className="text-sm text-[var(--color-muted)]">{t("companyPortal.noPublicOffices")}</p>}
          </div>
        </div>
        <aside className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-sm font-semibold">{t("companyPortal.publicLink")}</h2>
          <p className="mt-2 break-all text-sm text-[var(--color-muted)]">{portal.portalLinks.fallbackPath}</p>
          <p className="mt-3 break-all text-sm text-[var(--color-muted)]">{portal.portalLinks.systemSubdomain}</p>
        </aside>
      </section>
    </main>
  );
}

function safeRedirectUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function getConversationResult(token: string): Promise<ConversationResult> {
  try {
    return await getPublicConversationByToken(token);
  } catch (error) {
    if (error instanceof PublicApiError) {
      if (error.status === 404) return { error: "invalid" };
      if (error.status === 410) return { error: "expired" };
      if (error.status === 401 || error.status === 403) {
        return { error: "inaccessible" };
      }
    }

    return { error: "network" };
  }
}

function ConversationErrorState({
  error,
  locale,
}: {
  error: ConversationError;
  locale: string;
}) {
  const t = (key: string) => tServer(locale, key);

  if (error === "expired") {
    return (
      <PublicConversationState
        title={t("conversation.error.expired")}
        body={t("conversation.error.expiredBody")}
      />
    );
  }

  if (error === "inaccessible") {
    return (
      <PublicConversationState
        title={t("conversation.error.inaccessibleTitle")}
        body={t("conversation.error.inaccessibleBody")}
      />
    );
  }

  if (error === "network") {
    return (
      <PublicConversationState
        title={t("conversation.errorLoadTitle")}
        body={t("conversation.error.networkBody")}
      />
    );
  }

  return (
    <PublicConversationState
      title={t("conversation.error.invalidTitle")}
      body={t("conversation.error.invalidBody")}
    />
  );
}
