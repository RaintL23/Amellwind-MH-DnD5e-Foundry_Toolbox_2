import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

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

  // Generar ventana de páginas: siempre muestra hasta 5 números centrados en la página actual
  function getPageNumbers(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | "…")[] = [1];

    if (page > 3) pages.push("…");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);

    return pages;
  }

  const btnBase =
    "inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-md text-sm transition-colors disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
      {/* Rango visible + selector de tamaño */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {from}–{to} de {totalItems}
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center gap-1">
        <button
          className={cn(btnBase, "hover:bg-muted")}
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          aria-label="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          className={cn(btnBase, "hover:bg-muted")}
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              className={cn(
                btnBase,
                p === page
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted text-muted-foreground"
              )}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className={cn(btnBase, "hover:bg-muted")}
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          className={cn(btnBase, "hover:bg-muted")}
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
