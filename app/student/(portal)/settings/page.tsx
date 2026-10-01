"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStudentAuth } from "@/lib/student-portal/auth-context";
import { useRequestPasswordReset } from "@/lib/student-portal/queries";
import { ApiError } from "@/lib/api/errors";

/**
 * The backend has no in-session "change password" endpoint (only an
 * unauthenticated email-based forgot/reset-password flow — see the Module
 * 09 report). Rather than build a form for an endpoint that doesn't exist,
 * this reuses that real flow: requesting a reset link sent to the
 * student's own already-known email.
 */
export default function StudentSettingsPage() {
  const { user } = useStudentAuth();
  const requestReset = useRequestPasswordReset();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResetRequest() {
    if (!user) return;
    setError(null);
    setSent(false);
    try {
      await requestReset.mutateAsync(user.email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <main className="flex-1 space-y-8 px-6 py-8">
      <h1 className="text-lg font-semibold">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Account</h2>
        <dl className="max-w-md space-y-1 text-sm">
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user?.email}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Status</dt>
            <dd>{user?.status}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Last signed in</dt>
            <dd>{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="max-w-md space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Password</h2>
        {error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {sent ? (
          <p className="text-sm text-muted-foreground">
            If the address {user?.email} has an account, a password reset link has been sent to it.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              We&apos;ll email a password reset link to {user?.email}.
            </p>
            <Button variant="outline" size="sm" disabled={requestReset.isPending} onClick={handleResetRequest}>
              {requestReset.isPending ? "Sending…" : "Send reset link"}
            </Button>
          </>
        )}
      </section>
    </main>
  );
}
