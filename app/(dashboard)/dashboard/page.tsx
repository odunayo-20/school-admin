"use client";

import { useAuth } from "@/lib/auth/context";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="flex flex-1 flex-col gap-2 px-6 py-8">
      <h1 className="text-lg font-semibold">Welcome{user ? `, ${user.name}` : ""}</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as <span className="font-medium">{user?.role}</span>. Module-specific
        dashboards will be built in later modules.
      </p>
    </main>
  );
}
