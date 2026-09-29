"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManageStaff } from "@/lib/auth/permissions";
import { useStaffList } from "@/lib/staff/queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { EmploymentType, StaffStatus } from "@/lib/staff/types";

function StaffDirectory() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StaffStatus | "">("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [isTeacher, setIsTeacher] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search);

  const staffQuery = useStaffList({
    search: debouncedSearch || undefined,
    status: status || undefined,
    employment_type: employmentType || undefined,
    is_teacher: isTeacher === "" ? undefined : isTeacher === "true",
    page,
  });

  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="staff-search" className="text-xs font-medium text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="staff-search"
                placeholder="Name, staff ID, email, phone"
                className="w-64 pl-8"
                value={search}
                onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <Select
              id="status-filter"
              className="w-36"
              value={status}
              onChange={(e) => resetToFirstPage(setStatus)(e.target.value as StaffStatus | "")}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="employment-filter" className="text-xs font-medium text-muted-foreground">
              Employment type
            </label>
            <Select
              id="employment-filter"
              className="w-40"
              value={employmentType}
              onChange={(e) => resetToFirstPage(setEmploymentType)(e.target.value as EmploymentType | "")}
            >
              <option value="">All types</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="teacher-filter" className="text-xs font-medium text-muted-foreground">
              Role type
            </label>
            <Select
              id="teacher-filter"
              className="w-36"
              value={isTeacher}
              onChange={(e) => resetToFirstPage(setIsTeacher)(e.target.value as "" | "true" | "false")}
            >
              <option value="">All staff</option>
              <option value="true">Teachers</option>
              <option value="false">Non-teaching</option>
            </Select>
          </div>
        </div>
        <Link href="/staff/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add staff
        </Link>
      </div>

      {staffQuery.isPending && <LoadingState label="Loading staff…" />}
      {staffQuery.isError && <ErrorState error={staffQuery.error} onRetry={() => staffQuery.refetch()} />}

      {staffQuery.isSuccess && staffQuery.data.data.length === 0 && (
        <EmptyState
          title={debouncedSearch || status || employmentType || isTeacher ? "No staff match these filters." : "No staff records found."}
          description={
            debouncedSearch || status || employmentType || isTeacher
              ? "Try adjusting your search or filters."
              : "Add your first staff member to get started."
          }
          action={
            !(debouncedSearch || status || employmentType || isTeacher) && (
              <Link href="/staff/new" className={buttonVariants({ size: "sm" })}>
                Add Staff
              </Link>
            )
          }
        />
      )}

      {staffQuery.isSuccess && staffQuery.data.data.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Login role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffQuery.data.data.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>{staff.staff_no}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {staff.email ?? staff.phone ?? "—"}
                  </TableCell>
                  <TableCell>{staff.designation ?? "—"}</TableCell>
                  <TableCell>
                    {staff.account ? <Badge variant="outline">{staff.account.role}</Badge> : "—"}
                  </TableCell>
                  <TableCell>
                    {staff.status === "active" ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/staff/${staff.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            page={staffQuery.data.meta.current_page}
            lastPage={staffQuery.data.meta.last_page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default function StaffDirectoryPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">Staff</h1>
        <p className="text-sm text-muted-foreground">Manage staff records, roles, and academic assignments.</p>
      </div>
      <AdminOnly check={canManageStaff} description="Staff records are managed by school administrators and registrars.">
        <StaffDirectory />
      </AdminOnly>
    </main>
  );
}
