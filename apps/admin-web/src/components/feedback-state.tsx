import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeedbackState({
  tone,
  title,
  description,
  action,
  className,
}: {
  tone: "error" | "success";
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;

  return (
    <div
      className={cn(
        "ui-feedback flex items-start gap-3",
        tone === "error" ? "ui-feedback-error" : "ui-feedback-success",
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {description ? <p className="mt-1 leading-6 opacity-90">{description}</p> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
