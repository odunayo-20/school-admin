"use client";

import { Badge } from "@/components/ui/badge";
import { useStaffAuth } from "@/lib/staff-portal/auth-context";

/**
 * Read-only, and limited to what /auth/me itself returns. The backend has
 * no staff self-service profile endpoint: `staff.view` is withheld from
 * STAFF entirely (even for their own record), and UserResource carries no
 * nested "staff" object the way it does a "student" one for a STUDENT
 * caller. Phone, designation, employment date and staff number are real
 * fields on the Staff record, but there is no authorized way for a staff
 * member to read their own — see the Module 10 report's backend gaps.
 */
export default function StaffProfilePage() {
  const { user } = useStaffAuth();

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <h1 className="text-lg font-semibold">Profile</h1>

      <dl className="max-w-md space-y-1 text-sm">
        <div className="flex justify-between border-b border-border py-1.5">
          <dt className="text-muted-foreground">Full name</dt>
          <dd className="font-medium">{user?.name}</dd>
        </div>
        <div className="flex justify-between border-b border-border py-1.5">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user?.email}</dd>
        </div>
        <div className="flex justify-between border-b border-border py-1.5">
          <dt className="text-muted-foreground">Staff type</dt>
          <dd>{user?.staff_type === "TEACHING" ? "Teaching" : "Non-teaching"}</dd>
        </div>
        <div className="flex justify-between border-b border-border py-1.5">
          <dt className="text-muted-foreground">Status</dt>
          <dd>{user?.status === "ACTIVE" ? <Badge>Active</Badge> : <Badge variant="outline">{user?.status}</Badge>}</dd>
        </div>
        <div className="flex justify-between border-b border-border py-1.5">
          <dt className="text-muted-foreground">Email verified</dt>
          <dd>{user?.email_verified ? "Yes" : "No"}</dd>
        </div>
        <div className="flex justify-between border-b border-border py-1.5">
          <dt className="text-muted-foreground">Last signed in</dt>
          <dd>{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : "—"}</dd>
        </div>
      </dl>

      <p className="max-w-md text-sm text-muted-foreground">
        Additional staff details (phone, designation, employment date) aren&apos;t available in
        your own profile view yet, and editing isn&apos;t available in the portal — contact your
        school&apos;s office for either.
      </p>
    </main>
  );
}
