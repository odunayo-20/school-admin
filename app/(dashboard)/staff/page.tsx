"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Briefcase,
  ChevronRight,
  Filter,
  GraduationCap,
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { canManageStaff } from "@/lib/auth/permissions";
import { useStaffList } from "@/lib/staff/queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { Staff, StaffType } from "@/lib/staff/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function normalizeStatus(staff: Staff): "ACTIVE" | "INACTIVE" | "TERMINATED" | string {
  return (staff.status ?? "").toUpperCase();
}

function StatusBadge({ staff }: { staff: Staff }) {
  const status = normalizeStatus(staff);
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }
  if (status === "TERMINATED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Terminated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Inactive
    </span>
  );
}

function StaffTypeBadge({ type }: { type: StaffType | string | undefined }) {
  const normalized = (type ?? "").toUpperCase();
  if (normalized === "TEACHING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
        <GraduationCap className="h-3 w-3" />
        Teaching
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
      <Briefcase className="h-3 w-3" />
      Non-teaching
    </span>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function DirectorySkeleton() {
  return (
    <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
      <div className="divide-y divide-border/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main directory component ──────────────────────────────────────────────────

function StaffDirectory() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [staffType, setStaffType] = useState<StaffType | "">("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search);

  const staffQuery = useStaffList({
    search: debouncedSearch || undefined,
    status: status || undefined,
    staff_type: staffType || undefined,
    page,
  });

  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const hasFilters = !!(debouncedSearch || status || staffType);
  const staffList = staffQuery.data?.data ?? [];
  const meta = staffQuery.data?.meta;

  // KPI counts from current page data (approximate when paginated)
  const activeCount = staffList.filter((s) => normalizeStatus(s) === "ACTIVE").length;
  const teachingCount = staffList.filter(
    (s) => (s.staff_type ?? "").toUpperCase() === "TEACHING"
  ).length;

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="staff-search" className="text-xs font-medium text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="staff-search"
                placeholder="Name, staff number, email…"
                className="w-64 pl-8 h-9 text-sm"
                value={search}
                onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Status
            </label>
            <Select
              id="status-filter"
              className="w-36 h-9 text-sm"
              value={status}
              onChange={(e) => resetToFirstPage(setStatus)(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TERMINATED">Terminated</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label htmlFor="type-filter" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Staff type
            </label>
            <Select
              id="type-filter"
              className="w-40 h-9 text-sm"
              value={staffType}
              onChange={(e) => resetToFirstPage(setStaffType)(e.target.value as StaffType | "")}
            >
              <option value="">All staff</option>
              <option value="TEACHING">Teaching</option>
              <option value="NON_TEACHING">Non-teaching</option>
            </Select>
          </div>
        </div>

        <Link href="/staff/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add staff member
        </Link>
      </div>

      {/* Loading */}
      {staffQuery.isPending && <DirectorySkeleton />}

      {/* Error */}
      {staffQuery.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load staff records</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The staff directory could not be retrieved.
          </p>
          <button
            className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            onClick={() => staffQuery.refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {staffQuery.isSuccess && staffList.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/40 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {hasFilters ? "No staff match these filters" : "No staff records yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            {hasFilters
              ? "Try adjusting your search or clearing filters to see all staff."
              : "Add your first staff member to start building the school directory."}
          </p>
          {!hasFilters && (
            <Link href="/staff/new" className={buttonVariants({ size: "sm", className: "mt-5" })}>
              <Plus className="h-4 w-4" />
              Add first staff member
            </Link>
          )}
        </div>
      )}

      {/* Staff list */}
      {staffQuery.isSuccess && staffList.length > 0 && (
        <>
          <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
            <div className="divide-y divide-border/60">
              {staffList.map((staff) => {
                const displayName = staff.name || "—";
                const initials = getInitials(displayName);
                const isTeaching = (staff.staff_type ?? "").toUpperCase() === "TEACHING";

                return (
                  <Link
                    key={staff.id}
                    href={`/staff/${staff.id}`}
                    className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-inner ${
                        isTeaching
                          ? "bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-violet-500/5 text-violet-600 dark:text-violet-400"
                          : "bg-gradient-to-br from-sky-500/20 via-sky-500/10 to-sky-500/5 text-sky-600 dark:text-sky-400"
                      }`}
                    >
                      {initials}
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {displayName}
                        </span>
                        <StaffTypeBadge type={staff.staff_type} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">
                          {staff.staff_number ?? staff.staff_no ?? `#${staff.id}`}
                        </span>
                        {staff.designation && (
                          <>
                            <span className="text-border">·</span>
                            <span className="truncate">{staff.designation}</span>
                          </>
                        )}
                        {staff.email && (
                          <>
                            <span className="text-border">·</span>
                            <span className="truncate hidden md:inline">{staff.email}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Account status */}
                    {staff.account_status && (
                      <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
                        {(staff.account_status ?? "").toUpperCase() === "ACTIVE" ? (
                          <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="capitalize">{staff.account_status.toLowerCase()} account</span>
                      </div>
                    )}

                    {/* Employment status */}
                    <StatusBadge staff={staff} />

                    {/* Chevron */}
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </div>

          {meta && (
            <PaginationControls
              page={meta.current_page}
              lastPage={meta.last_page}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StaffDirectoryPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-600 dark:text-violet-400">
            <Users className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Staff Directory</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-10">
          Manage staff records, roles, and academic assignments.
        </p>
      </div>

      <AdminOnly
        check={canManageStaff}
        description="Staff records are managed by school administrators and registrars."
      >
        <StaffDirectory />
      </AdminOnly>
    </main>
  );
}
