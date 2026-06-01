import { LoginForm } from "@/app/(app)/(auth)/login/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-zinc-50">
      <section className="hidden flex-1 bg-zinc-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-lg font-semibold tracking-tight">POPWAM</div>
        <div className="max-w-lg">
          <p className="text-4xl font-semibold tracking-tight">Verified marketplace operations</p>
          <p className="mt-5 text-sm leading-6 text-zinc-300">
            Admin, developer, and brokerage workspaces share one authenticated foundation.
          </p>
        </div>
        <p className="text-xs text-zinc-400">Internal platform dashboard</p>
      </section>
      <section className="flex min-h-screen flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">Admin Web</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">Sign in</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Use your POPWAM platform, developer, or brokerage account.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
