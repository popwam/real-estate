import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/app/(app)/(auth)/login/login-form";
import { DisplayPreferences } from "@/components/layout/display-preferences";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-[var(--color-primary)] p-10 text-[var(--color-primary-foreground)] lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          className="pointer-events-none absolute -end-40 -top-40 h-96 w-96 rounded-full opacity-25 blur-3xl [background:var(--color-accent)]"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-accent)] text-sm font-bold text-[var(--color-accent-foreground)] shadow-[var(--shadow-md)]">
            P
          </span>
          <div>
            <p className="font-semibold tracking-tight">POPWAM</p>
            <p className="text-xs opacity-65">Real Estate Marketplace &amp; CRM</p>
          </div>
        </div>

        <div className="relative max-w-xl py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">
            One trusted workspace
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Move property operations forward with clarity.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 opacity-75">
            Review organizations, manage projects and inventory, follow leads, and
            keep every deal moving from one secure workspace.
          </p>
          <ul className="mt-9 grid gap-4 text-sm sm:grid-cols-2" aria-label="Platform capabilities">
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
              Verified marketplace operations
            </li>
            <li className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
              Role-focused company workspaces
            </li>
            <li className="flex items-center gap-3 sm:col-span-2">
              <CheckCircle2 className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
              CRM, reservations, deals, and governance in one flow
            </li>
          </ul>
        </div>

        <p className="relative text-xs opacity-55">
          Secure access for authorized POPWAM teams and partners.
        </p>
      </section>

      <section className="flex min-h-screen flex-col px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-xs font-bold text-[var(--color-primary-foreground)]">
              P
            </span>
            <span className="font-semibold text-[var(--color-foreground)]">POPWAM</span>
          </div>
          <DisplayPreferences compact />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="ui-card p-6 shadow-[var(--shadow-lg)] sm:p-8">
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                  Authorized workspace
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-foreground)]">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  Sign in with your platform, developer, or brokerage account.
                </p>
              </div>
              <LoginForm />
            </div>
            <p className="mt-5 text-center text-xs leading-5 text-[var(--color-muted)]">
              Access is limited to authorized POPWAM users. Your workspace is selected
              automatically after sign-in.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
