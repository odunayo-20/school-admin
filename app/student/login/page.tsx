import type { Metadata } from "next";
import { StudentLoginForm } from "@/components/student-portal/login-form";
import { StudentGuestGuard } from "@/components/student-portal/guest-guard";

export const metadata: Metadata = {
  title: "Student Sign In | School Admin",
};

export default function StudentLoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Student Portal</h1>
          <p className="text-sm text-muted-foreground">Sign in to view your academic record</p>
        </div>

        <StudentGuestGuard>
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <StudentLoginForm />
          </div>
        </StudentGuestGuard>
      </div>
    </main>
  );
}
