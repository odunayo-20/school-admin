import { Button } from "@/components/ui/button";

export function PaginationControls({
  page,
  lastPage,
  onPageChange,
}: {
  page: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}) {
  if (lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <span className="text-sm text-muted-foreground">
        Page {page} of {lastPage}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
