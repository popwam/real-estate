"use client";

import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { OrganizationStatusBadge } from "@/components/platform/organization-status-badge";
import { formatDate, formatPlainDate } from "@/lib/format";
import type { Organization } from "@/types/platform";
import { useI18n } from "@/i18n";

function organizationNextAction(organization: Organization) {
  if (organization.status === "PENDING_REVIEW") return "Review profile and documents";
  if (organization.status === "DRAFT") return "Create invitation or request profile completion";
  if (organization.status === "SUSPENDED") return "Resolve suspension before reactivation";
  if (organization.status === "REVOKED") return "Review compliance history";
  return "Monitor trust status";
}

function organizationLocation(organization: Organization) {
  return [organization.city, organization.country].filter(Boolean).join(", ") || "Location not set";
}

export function OrganizationResponsiveList({
  organizations,
  totalCount,
}: {
  organizations: Organization[];
  totalCount: number;
}) {
  const { t } = useI18n();

  if (!organizations.length) {
    return (
      <EmptyState
        icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
        title={t("adminSweep.no.organizations.match.these.filters.1ae9cdba")}
        description={
          totalCount
            ? "Change the type or status filter to broaden the trust queue."
            : "Create the first company record, then open it to review profile data and invite users."
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {organizations.map((organization) => (
        <article
          key={organization.id}
          className="ui-card grid gap-4 p-4 transition hover:border-[var(--color-border-strong)] md:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)_auto]"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                className="text-base font-semibold text-[var(--color-foreground)] hover:underline"
                href={`/platform/organizations/${organization.id}`}
              >
                {organization.name}
              </Link>
              <OrganizationStatusBadge status={organization.status} />
            </div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {organization.type.replaceAll("_", " ")} · {organizationLocation(organization)}
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("adminSweep.plan.335c04da")}</span>{" "}
                <span className="text-[var(--color-muted)]">{organization.planName ?? organization.plan ?? "Not set"}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("adminSweep.plan.expires.90599f88")}</span>{" "}
                <span className="text-[var(--color-muted)]">{formatPlainDate(organization.planExpiresAt)}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("adminSweep.created.0c78dab1")}</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(organization.createdAt)}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("adminSweep.updated.702cad2f")}</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(organization.updatedAt)}</span>
              </p>
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("adminSweep.next.required.action.5c39ddd2")}</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">
                  {organizationNextAction(organization)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center md:justify-end">
            <Link
              className="ui-button ui-button-secondary w-full justify-center md:w-auto"
              href={`/platform/organizations/${organization.id}`}
            >{t("adminSweep.open.dossier.4f24d6eb")}<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
