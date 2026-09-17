import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const PAGE_SIZE_OPTIONS = [10, 20, 25, 30, 40, 50];

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  function getPageNumbers(): (number | "…")[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "…")[] = [1];

    if (page > 2) pages.push("…");

    const start = Math.max(2, page);
    const end = Math.min(totalPages - 1, page);
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) pages.push(i);
    }

    if (page < totalPages - 1) pages.push("…");
    pages.push(totalPages);

    return pages;
  }

  const btnBase =
    "inline-flex items-center justify-center h-7 min-w-7 px-1.5 rounded-md text-xs sm:h-8 sm:min-w-8 sm:px-2 sm:text-sm transition-colors disabled:pointer-events-none disabled:opacity-40";

  const pageSizeOptions = PAGE_SIZE_OPTIONS.includes(pageSize)
    ? PAGE_SIZE_OPTIONS
    : [...PAGE_SIZE_OPTIONS, pageSize].sort((a, b) => a - b);

  return (
    <div className="flex flex-nowrap items-center justify-between gap-2">
      <div className="flex shrink-0 items-center gap-2">
        <p className="hidden text-xs text-muted-foreground whitespace-nowrap sm:block">
          {from}–{to} of {totalItems}
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Per page:
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Per page"
              className="h-7 rounded-md border border-input bg-background px-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:px-2"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-0.5 overflow-x-auto sm:gap-1">
        <button
          className={cn(btnBase, "hover:bg-muted")}
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          className={cn(btnBase, "hover:bg-muted")}
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="select-none px-0.5 text-xs text-muted-foreground sm:px-1 sm:text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              className={cn(
                btnBase,
                p === page
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}

        <button
          className={cn(btnBase, "hover:bg-muted")}
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          className={cn(btnBase, "hover:bg-muted")}
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
