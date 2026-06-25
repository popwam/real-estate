import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function Field({
  label,
  error,
  hint,
  required = false,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <Label>
        {label}
        {required ? <span className="ms-1 text-[var(--color-danger)]" aria-hidden="true">*</span> : null}
      </Label>
      {children}
      {hint && !error ? <p className="text-xs leading-5 text-[var(--color-muted)]">{hint}</p> : null}
      {error ? <p className="text-sm text-[var(--color-danger)]" role="alert">{error}</p> : null}
    </label>
  );
}

export function TextInput(props: ComponentProps<typeof Input>) {
  return <Input {...props} />;
}

export function TextAreaInput(props: ComponentProps<typeof Textarea>) {
  return <Textarea {...props} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="ui-input appearance-none pe-9"
      {...props}
    />
  );
}
