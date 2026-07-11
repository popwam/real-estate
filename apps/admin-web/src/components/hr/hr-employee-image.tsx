"use client";

import { ImageOff, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";
import { fetchHrEmployeeImageBlob, type HrEmployeeImagePurpose } from "@/lib/hr-employees-api";

export function HrEmployeeImage({
  fileId,
  purpose = "profile_photo",
  alt,
  initials,
  className = "h-14 w-14",
}: {
  fileId?: string | null;
  purpose?: HrEmployeeImagePurpose;
  alt: string;
  initials?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [imageState, setImageState] = useState<{ fileId: string; url: string } | null>(null);
  const [failedFileId, setFailedFileId] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    let nextUrl: string | null = null;
    void fetchHrEmployeeImageBlob(fileId, purpose)
      .then((blob) => {
        nextUrl = URL.createObjectURL(blob);
        if (!cancelled) setImageState({ fileId, url: nextUrl });
      })
      .catch(() => {
        if (!cancelled) setFailedFileId(fileId);
      });
    return () => {
      cancelled = true;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [fileId, purpose]);

  const objectUrl = imageState && imageState.fileId === fileId ? imageState.url : null;
  const failed = Boolean(fileId && failedFileId === fileId);

  if (objectUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} className={`${className} rounded-md object-cover`} src={objectUrl} />;
  }

  return (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-muted)] text-[var(--color-muted)]`} title={failed ? t("hr360.photoPreviewUnavailable") : alt}>
      {failed ? <ImageOff className="h-5 w-5" aria-hidden="true" /> : initials ? <span className="text-sm font-bold">{initials}</span> : <UserRound className="h-5 w-5" aria-hidden="true" />}
    </div>
  );
}
