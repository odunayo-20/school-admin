import { Suspense } from "react";
import type { Metadata } from "next";
import { StudentResetPasswordForm } from "@/components/student-portal/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password | School Admin",
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-sm text-muted-foreground">Choose a new password for your account</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {/* Reads token/email query params via useSearchParams(), which
              requires a Suspense boundary in the App Router. */}
          <Suspense>
            <StudentResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
