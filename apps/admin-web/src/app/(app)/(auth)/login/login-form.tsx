"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FeedbackState } from "@/components/feedback-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-login";
import { getRoleHome } from "@/lib/auth";
import { useI18n } from "@/i18n";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { t } = useI18n();

  const router = useRouter();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    const session = await login.mutateAsync(values);
    router.replace(getRoleHome(session.user.role, session.organization?.type, session.permissions));
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="identifier">{t("adminSweep.email.or.phone.5a698f5f")}</Label>
        <Input
          id="identifier"
          autoComplete="username"
          placeholder={t("adminSweep.name.company.com.or.201001234567.e1780975")}
          type="text"
          inputMode="email"
          aria-invalid={Boolean(errors.identifier)}
          aria-describedby={errors.identifier ? "identifier-error" : undefined}
          {...register("identifier")}
        />
        {errors.identifier ? (
          <p id="identifier-error" className="text-sm text-[var(--color-danger)]">
            {errors.identifier.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("adminSweep.password.8be3c943")}</Label>
        <div className="relative">
          <Input
            id="password"
            autoComplete="current-password"
            placeholder={t("adminSweep.enter.your.password.1378167d")}
            type={showPassword ? "text" : "password"}
            className="pe-12"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute end-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="password-error" className="text-sm text-[var(--color-danger)]">
            {errors.password.message}
          </p>
        ) : null}
      </div>
      {login.error ? (
        <FeedbackState
          tone="error"
          title={t("adminSweep.we.could.not.sign.you.in.0085c4c3")}
          description={login.error.message}
        />
      ) : null}
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogIn className="h-4 w-4" aria-hidden="true" />
        )}
        {login.isPending ? "Signing in..." : "Sign in securely"}
      </Button>
    </form>
  );
}
