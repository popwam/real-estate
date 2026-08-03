"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, Clock, LogIn, LogOut, MapPin, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import {
  checkInApi,
  checkOutApi,
  getAttendanceSettingsApi,
  getMyAttendanceHistoryApi,
  getMyAttendanceTodayApi,
  listBranchesApi,
  preflightCheckInApi,
  uploadAttendanceEvidencePhotoApi,
  type AttendanceCheckInPreflight,
} from "@/lib/hr-settings-api";
import { useI18n } from "@/i18n";

type LocationPayload = {
  latitude: number;
  longitude: number;
  locationAccuracyMeters: number;
  locationCapturedAt: string;
};

type CheckInStage = "idle" | "checking-location" | "verifying-location" | "starting-camera" | "camera" | "preview" | "uploading-photo" | "recording-attendance" | "checking-out";

export function SelfAttendancePage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const submittingRef = useRef(false);
  const [branchId, setBranchId] = useState("");
  const [stage, setStage] = useState<CheckInStage>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [preflight, setPreflight] = useState<AttendanceCheckInPreflight | null>(null);
  const [location, setLocation] = useState<LocationPayload | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const today = useQuery({ queryKey: ["hr-attendance", "me", "today"], queryFn: getMyAttendanceTodayApi });
  const history = useQuery({ queryKey: ["hr-attendance", "me", "history"], queryFn: getMyAttendanceHistoryApi });
  const branches = useQuery({ queryKey: ["hr-branches", "self"], queryFn: listBranchesApi });
  const settings = useQuery({ queryKey: ["hr-attendance-settings", "self"], queryFn: getAttendanceSettingsApi });

  const invalidate = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["hr-attendance", "me", "today"] }),
      qc.invalidateQueries({ queryKey: ["hr-attendance", "me", "history"] }),
    ]);
  }, [qc]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhoto(null);
  }, [previewUrl]);

  useEffect(() => () => {
    stopCamera();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl, stopCamera]);

  const startCamera = useCallback(async () => {
    setStage("starting-camera");
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("CAMERA_NOT_AVAILABLE");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("CAMERA_NOT_AVAILABLE");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStage("camera");
    } catch (error) {
      stopCamera();
      throw error;
    }
  }, [stopCamera]);

  const cancelCheckIn = useCallback(() => {
    stopCamera();
    clearPreview();
    setLocation(null);
    setPreflight(null);
    setFeedback(null);
    setStage("idle");
    submittingRef.current = false;
  }, [clearPreview, stopCamera]);

  const beginCheckIn = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setFeedback(null);
    setPreflight(null);
    clearPreview();
    try {
      setStage("checking-location");
      const capturedLocation = await getBrowserLocation();
      setLocation(capturedLocation);

      setStage("verifying-location");
      const decision = await preflightCheckInApi({ ...capturedLocation, branchId: branchId || undefined });
      setPreflight(decision);
      if (!decision.allowed) {
        setFeedback(preflightMessage(decision, t));
        setStage("idle");
        submittingRef.current = false;
        return;
      }
      await startCamera();
    } catch (error) {
      setFeedback(attendanceErrorMessage(error, t));
      setStage("idle");
      submittingRef.current = false;
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      setFeedback(t("attendance.self.cameraUnavailable"));
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) {
      setFeedback(t("attendance.self.photoCaptureFailed"));
      return;
    }
    stopCamera();
    clearPreview();
    setPhoto(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setFeedback(null);
    setStage("preview");
  };

  const retakePhoto = async () => {
    clearPreview();
    setFeedback(null);
    try {
      await startCamera();
    } catch (error) {
      setFeedback(attendanceErrorMessage(error, t));
      setStage("preview");
    }
  };

  const usePhoto = async () => {
    if (!photo || !location || submittingRef.current === false) return;
    try {
      setFeedback(null);
      setStage("uploading-photo");
      const file = new File([photo], "attendance-check-in.jpg", { type: "image/jpeg" });
      const uploaded = await uploadAttendanceEvidencePhotoApi(file);
      setStage("recording-attendance");
      await checkInApi({
        ...location,
        branchId: branchId || undefined,
        photoFileId: uploaded.fileId,
      });
      await invalidate();
      stopCamera();
      clearPreview();
      setLocation(null);
      setStage("idle");
      submittingRef.current = false;
    } catch (error) {
      setFeedback(attendanceErrorMessage(error, t));
      setStage("preview");
    }
  };

  const checkOut = useMutation({
    mutationFn: async () => {
      setFeedback(null);
      setStage("checking-out");
      const capturedLocation = await getBrowserLocation();
      return checkOutApi({ ...capturedLocation, branchId: branchId || undefined });
    },
    onSuccess: invalidate,
    onError: (error) => setFeedback(attendanceErrorMessage(error, t)),
    onSettled: () => setStage("idle"),
  });

  const record = today.data;
  const hasOpenRecord = Boolean(record?.checkInAt && !record?.checkOutAt);
  const isCompleted = Boolean(record?.checkInAt && record?.checkOutAt);
  const checkInInProgress = stage !== "idle" && stage !== "checking-out";

  return (
    <div className="space-y-5">
      <PageHeader title={t("attendance.self.title")} description={t("attendance.self.description")} />
      <DetailCard title={t("attendance.self.today")}>
        {today.isLoading ? <LoadingState label={t("attendance.self.loadingToday")} /> : null}
        {record ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Metric icon={<Clock className="h-4 w-4" />} label={t("attendance.self.checkIn")} value={formatDateTime(record.checkInAt)} />
            <Metric icon={<Clock className="h-4 w-4" />} label={t("attendance.self.checkOut")} value={formatDateTime(record.checkOutAt)} />
            <Metric icon={<MapPin className="h-4 w-4" />} label={t("attendance.self.status")} value={record.status ?? t("common.notSet")} />
          </div>
        ) : null}
        {settings.data ? <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-muted)]">{t("companySettings.browserWifiLimitation")}</p> : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="attendanceBranch">{t("attendance.self.branch")}</Label>
            <select id="attendanceBranch" className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)]" value={branchId} onChange={(event) => setBranchId(event.target.value)} disabled={checkInInProgress || checkOut.isPending}>
              <option value="">{t("attendance.self.noBranch")}</option>
              {branches.data?.filter((branch) => branch.isActive).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </div>
          {!today.isLoading && !record ? <Button type="button" onClick={beginCheckIn} disabled={checkInInProgress || checkOut.isPending}><LogIn className="h-4 w-4" aria-hidden="true" />{stageLabel(stage, t, t("attendance.self.checkInAction"))}</Button> : null}
          {!today.isLoading && hasOpenRecord ? <Button type="button" className="ui-button-secondary" onClick={() => checkOut.mutate()} disabled={checkInInProgress || checkOut.isPending}><LogOut className="h-4 w-4" aria-hidden="true" />{stage === "checking-out" ? t("attendance.self.recordingAttendance") : t("attendance.self.checkOutAction")}</Button> : null}
          {isCompleted ? <p className="text-sm font-medium text-[var(--color-muted)]">{t("attendance.self.completedToday")}</p> : null}
        </div>

        {stage === "starting-camera" || stage === "camera" ? <CameraPanel videoRef={videoRef} loading={stage === "starting-camera"} onCapture={capturePhoto} onCancel={cancelCheckIn} t={t} /> : null}
        {stage === "preview" && previewUrl ? <PhotoPreview previewUrl={previewUrl} busy={false} onUse={usePhoto} onRetake={retakePhoto} onCancel={cancelCheckIn} t={t} /> : null}
        {stage === "uploading-photo" || stage === "recording-attendance" ? <LoadingState label={stageLabel(stage, t, t("common.saving"))} /> : null}
        {preflight && !preflight.allowed ? <PreflightDetails decision={preflight} t={t} /> : null}
        {record?.minutesLate ? <FeedbackState className="mt-4" tone="success" title={t("attendance.self.latePenalty")} description={t("attendance.self.latePenaltyDescription", { minutes: record.minutesLate, penalty: record.penaltyType ?? t("common.notSet") })} /> : null}
        {feedback ? <FeedbackState className="mt-4" tone="error" title={t("attendance.self.checkInError")} description={feedback} /> : null}
      </DetailCard>

      <DetailCard title={t("attendance.self.history")}>
        {history.isLoading ? <LoadingState label={t("attendance.self.loadingHistory")} /> : null}
        {history.data?.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--color-muted)]"><tr><th className="px-3 py-2">{t("attendance.self.date")}</th><th className="px-3 py-2">{t("attendance.self.checkIn")}</th><th className="px-3 py-2">{t("attendance.self.checkOut")}</th><th className="px-3 py-2">{t("attendance.self.status")}</th></tr></thead><tbody>{history.data.map((row) => <tr key={row.id ?? row.date} className="border-t border-[var(--color-border)]"><td className="px-3 py-2">{formatDate(row.date)}</td><td className="px-3 py-2">{formatDateTime(row.checkInAt)}</td><td className="px-3 py-2">{formatDateTime(row.checkOutAt)}</td><td className="px-3 py-2">{row.status ?? "-"}</td></tr>)}</tbody></table></div> : <p className="text-sm text-[var(--color-muted)]">{t("attendance.self.emptyHistory")}</p>}
      </DetailCard>
    </div>
  );
}

function CameraPanel({ videoRef, loading, onCapture, onCancel, t }: { videoRef: React.RefObject<HTMLVideoElement | null>; loading: boolean; onCapture: () => void; onCancel: () => void; t: (key: string, values?: Record<string, string | number>) => string }) {
  return <div className="mt-5 space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"><p className="text-sm font-medium">{loading ? t("attendance.self.startingCamera") : t("attendance.self.cameraReady")}</p><video ref={videoRef} className="aspect-video w-full rounded-[var(--radius-md)] bg-black object-cover" autoPlay muted playsInline /><div className="flex flex-wrap gap-2"><Button type="button" onClick={onCapture} disabled={loading}><Camera className="h-4 w-4" />{t("attendance.self.capturePhoto")}</Button><Button type="button" className="ui-button-secondary" onClick={onCancel}><X className="h-4 w-4" />{t("common.cancel")}</Button></div></div>;
}

function PhotoPreview({ previewUrl, busy, onUse, onRetake, onCancel, t }: { previewUrl: string; busy: boolean; onUse: () => void; onRetake: () => void; onCancel: () => void; t: (key: string, values?: Record<string, string | number>) => string }) {
  return <div className="mt-5 space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"><p className="text-sm font-medium">{t("attendance.self.photoPreview")}</p><img src={previewUrl} alt={t("attendance.self.photoPreview")} className="aspect-video w-full rounded-[var(--radius-md)] object-cover" /><div className="flex flex-wrap gap-2"><Button type="button" onClick={onUse} disabled={busy}><Check className="h-4 w-4" />{t("attendance.self.usePhoto")}</Button><Button type="button" className="ui-button-secondary" onClick={onRetake} disabled={busy}><RotateCcw className="h-4 w-4" />{t("attendance.self.retakePhoto")}</Button><Button type="button" className="ui-button-secondary" onClick={onCancel} disabled={busy}><X className="h-4 w-4" />{t("common.cancel")}</Button></div></div>;
}

function PreflightDetails({ decision, t }: { decision: AttendanceCheckInPreflight; t: (key: string, values?: Record<string, string | number>) => string }) {
  const accuracy = decision.accuracyMeters === null ? (decision.accuracyAccepted ? t("attendance.self.accuracyAccepted") : t("attendance.self.accuracyRejected")) : `${decision.accuracyMeters} m (${decision.accuracyAccepted ? t("attendance.self.accuracyAccepted") : t("attendance.self.accuracyRejected")})`;
  const details = [[t("attendance.self.distance"), decision.distanceMeters], [t("attendance.self.radius"), decision.allowedRadiusMeters], [t("attendance.self.accuracy"), accuracy]].filter(([, value]) => value !== null && value !== undefined);
  return <div className="mt-4 rounded-[var(--radius-md)] border border-red-300 bg-red-50 p-3 text-sm text-red-900"><p className="font-medium">{preflightMessage(decision, t)}</p>{details.length ? <dl className="mt-2 grid gap-1 sm:grid-cols-3">{details.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold">{label}</dt><dd>{typeof value === "number" ? `${value} m` : value}</dd></div>)}</dl> : null}</div>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"><div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--color-muted)]">{icon}{label}</div><p className="mt-2 text-sm font-semibold text-[var(--color-foreground)]">{value}</p></div>; }

async function getBrowserLocation(): Promise<LocationPayload> {
  if (typeof navigator === "undefined" || !navigator.geolocation) throw new Error("LOCATION_NOT_AVAILABLE");
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition((position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, locationAccuracyMeters: position.coords.accuracy, locationCapturedAt: new Date(position.timestamp).toISOString() }), (error) => reject(new Error(error.code === error.PERMISSION_DENIED ? "LOCATION_PERMISSION_DENIED" : "LOCATION_NOT_AVAILABLE")), { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }));
}

function preflightMessage(decision: AttendanceCheckInPreflight, t: (key: string, values?: Record<string, string | number>) => string) { return decision.blockingReasons.map((reason) => reasonMessage(reason, t)).join(" ") || t("attendance.self.preflightRejected"); }
function attendanceErrorMessage(error: unknown, t: (key: string, values?: Record<string, string | number>) => string) { if (error instanceof ApiError) { const details = error.details as { reasons?: unknown } | undefined; const reasons = Array.isArray(details?.reasons) ? details.reasons.map(String) : []; return reasons.length ? reasons.map((reason) => reasonMessage(reason, t)).join(" ") : t("attendance.self.requestFailed", { requestId: error.requestId ?? "" }); } if (error instanceof DOMException) return error.name === "NotAllowedError" ? reasonMessage(error.name, t) : t("attendance.self.cameraUnavailable"); if (error instanceof Error) return reasonMessage(error.message, t); return t("attendance.self.requestFailed"); }
function reasonMessage(reason: string, t: (key: string, values?: Record<string, string | number>) => string) { const supported = new Set(["LOCATION_PERMISSION_DENIED", "LOCATION_NOT_AVAILABLE", "LOCATION_REQUIRED", "LOCATION_STALE", "GPS_ACCURACY_TOO_LOW", "ATTENDANCE_LOCATION_NOT_CONFIGURED", "OUTSIDE_ALLOWED_LOCATION", "WEB_CHECK_IN_NOT_ALLOWED", "WEB_WIFI_NOT_AVAILABLE", "WEB_WIFI_MANUAL_REVIEW", "PHOTO_REQUIRED", "CAMERA_NOT_AVAILABLE", "NotAllowedError"]); return supported.has(reason) ? t(`attendance.self.reason.${reason}`) : t("attendance.self.verificationFailed"); }
function stageLabel(stage: CheckInStage, t: (key: string, values?: Record<string, string | number>) => string, fallback: string) { return ({ "checking-location": t("attendance.self.checkingLocation"), "verifying-location": t("attendance.self.verifyingLocation"), "starting-camera": t("attendance.self.startingCamera"), "uploading-photo": t("attendance.self.uploadingPhoto"), "recording-attendance": t("attendance.self.recordingAttendance") } as Partial<Record<CheckInStage, string>>)[stage] ?? fallback; }
function formatDate(value: string | null | undefined) { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(); }
function formatDateTime(value: string | null | undefined) { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(); }
