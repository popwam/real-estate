import { ChangePasswordForm } from "@/app/(app)/(auth)/change-password/change-password-form";
import { AuthGuard } from "@/components/auth-guard";

export default function ChangePasswordPage() {
  return (
    <AuthGuard>
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-10">
        <div className="ui-card w-full max-w-md p-6 shadow-[var(--shadow-lg)] sm:p-8">
          <ChangePasswordForm />
        </div>
      </main>
    </AuthGuard>
  );
}
