import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { GuestGuard } from "@/components/auth/guest-guard";

export const metadata: Metadata = {
  title: "Sign in | School Admin",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">School Admin</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>

        <GuestGuard>
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <LoginForm />
          </div>
        </GuestGuard>
      </div>
    </main>
  );
}
