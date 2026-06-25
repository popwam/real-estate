import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { VerificationStatusBadge } from "@/components/platform/verification-status-badge";
import type { Verification } from "@/types/platform";

function formatBytes(value?: number | null) {
  if (!value) return "Unknown size";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentMetadataList({ documents }: { documents: Verification[] }) {
  if (!documents.length) {
    return (
      <EmptyState
        title="No verification documents"
        description="Submitted document metadata will appear here when available."
      />
    );
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {documents.map((document) => (
        <div
          key={document.id}
          className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex min-w-0 gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-[var(--color-foreground)]">{document.documentType.replaceAll("_", " ")}</p>
                <VerificationStatusBadge status={document.status} />
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {document.uploadedFile?.mimeType ?? "No mime type"} · {formatBytes(document.uploadedFile?.sizeBytes)}
              </p>
              {document.rejectionReason ? (
                <p className="mt-1 text-sm text-[var(--color-danger)]">{document.rejectionReason}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 md:justify-end">
            <Link className="ui-button ui-button-secondary h-9 px-3" href={`/platform/verifications/${document.id}`}>
              Review
            </Link>
            {document.documentUrl || document.uploadedFile?.url ? (
              <a
                className="ui-button ui-button-secondary h-9 px-3"
                href={document.documentUrl ?? document.uploadedFile?.url ?? "#"}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open
              </a>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
