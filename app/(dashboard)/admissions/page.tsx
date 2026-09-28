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
import { canManageAdmissions } from "@/lib/auth/permissions";
import { useAdmissionList } from "@/lib/admissions/queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { AdmissionStatus } from "@/lib/admissions/types";

function statusBadge(status: AdmissionStatus) {
  if (status === "approved") return <Badge>Approved</Badge>;
  if (status === "rejected") return <Badge variant="outline">Rejected</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

function AdmissionsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdmissionStatus | "">("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const admissionsQuery = useAdmissionList({
    search: debouncedSearch || undefined,
    status: status || undefined,
    page,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="admission-search" className="text-xs font-medium text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="admission-search"
                placeholder="Applicant name, admission no."
                className="w-64 pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="admission-status" className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <Select
              id="admission-status"
              className="w-36"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as AdmissionStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </div>
        <Link href="/admissions/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New admission
        </Link>
      </div>

      {admissionsQuery.isPending && <LoadingState label="Loading admissions…" />}
      {admissionsQuery.isError && (
        <ErrorState error={admissionsQuery.error} onRetry={() => admissionsQuery.refetch()} />
      )}

      {admissionsQuery.isSuccess && admissionsQuery.data.data.length === 0 && (
        <EmptyState
          title={debouncedSearch || status ? "No admissions match these filters." : "No admissions found."}
          description={
            debouncedSearch || status
              ? "Try adjusting your search or status filter."
              : "Create an admission to start the enrollment process for a new applicant."
          }
          action={
            !(debouncedSearch || status) && (
              <Link href="/admissions/new" className={buttonVariants({ size: "sm" })}>
                New Admission
              </Link>
            )
          }
        />
      )}

      {admissionsQuery.isSuccess && admissionsQuery.data.data.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission no.</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Intended class</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissionsQuery.data.data.map((admission) => (
                <TableRow key={admission.id}>
                  <TableCell className="font-medium">{admission.admission_no}</TableCell>
                  <TableCell>{admission.applicant_name}</TableCell>
                  <TableCell>{admission.intended_class?.name ?? "—"}</TableCell>
                  <TableCell>{admission.application_date}</TableCell>
                  <TableCell>{statusBadge(admission.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admissions/${admission.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            page={admissionsQuery.data.meta.current_page}
            lastPage={admissionsQuery.data.meta.last_page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default function AdmissionsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">Admissions</h1>
        <p className="text-sm text-muted-foreground">Review and manage applications for admission.</p>
      </div>
      <AdminOnly
        check={canManageAdmissions}
        description="Admissions are managed by school administrators and registrars."
      >
        <AdmissionsList />
      </AdminOnly>
    </main>
  );
}
