"use client";

import { Download, ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { DetailCard } from "@/components/platform/detail-card";
import { getAccessToken } from "@/lib/auth";
import { useI18n } from "@/i18n";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

type EvidenceItem = {
  label: string;
  fileId?: string | null;
};

export function AttendanceEvidencePreview({
  items,
}: {
  items: EvidenceItem[];
}) {
  const { t } = useI18n();

  return (
    <DetailCard title={t("attendance.admin.photoEvidence")}>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <EvidencePreviewItem
            key={item.label}
            label={item.label}
            fileId={item.fileId}
          />
        ))}
      </div>
    </DetailCard>
  );
}

function EvidencePreviewItem({ label, fileId }: EvidenceItem) {
  const { t } = useI18n();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    let nextUrl: string | null = null;
    const previewUnavailable = t("attendance.admin.previewUnavailable");

    async function loadPreview() {
      setError(null);
      const token = getAccessToken();
      if (!token) {
        setError(previewUnavailable);
        return;
      }
      const response = await fetch(
        `${API_BASE_URL}/files/${encodeURIComponent(fileId!)}/preview`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        setError(previewUnavailable);
        return;
      }
      const blob = await response.blob();
      nextUrl = URL.createObjectURL(blob);
      if (!cancelled) setObjectUrl(nextUrl);
    }

    void loadPreview().catch(() => setError(previewUnavailable));

    return () => {
      cancelled = true;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [fileId, t]);

  if (!fileId) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
        <p className="font-medium text-zinc-900">{label}</p>
        <p>{t("attendance.admin.noPhotoEvidence")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-zinc-200 p-4">
      <div>
        <p className="font-medium text-zinc-900">{label}</p>
        <p className="break-all text-xs text-zinc-500">
          {t("attendance.admin.fileId")}: {fileId}
        </p>
      </div>
      {objectUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={label}
          className="max-h-64 w-full rounded-md border border-zinc-200 object-contain"
          src={objectUrl}
        />
      ) : (
        <div className="flex min-h-36 items-center justify-center rounded-md border border-dashed border-zinc-300 text-sm text-zinc-600">
          <ImageOff className="mr-2 size-4" />
          {error ?? t("attendance.admin.loadingPreview")}
        </div>
      )}
      <a
        className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50"
        href={`${API_BASE_URL}/files/${encodeURIComponent(fileId)}/download`}
        onClick={(event) => {
          event.preventDefault();
          void downloadFile(fileId);
        }}
      >
        <Download className="size-4" />
        {t("attendance.admin.downloadPhoto")}
      </a>
    </div>
  );
}

async function downloadFile(fileId: string) {
  const token = getAccessToken();
  if (!token) return;
  const response = await fetch(
    `${API_BASE_URL}/files/${encodeURIComponent(fileId)}/download`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!response.ok) return;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance-evidence-${fileId}`;
  link.click();
  URL.revokeObjectURL(url);
}
