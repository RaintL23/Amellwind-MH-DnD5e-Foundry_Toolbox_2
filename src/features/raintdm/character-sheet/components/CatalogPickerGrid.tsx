import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

/** Dense responsive catalog grid for Add-item / Add-condition pickers. */
export function CatalogPickerGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid max-h-[55dvh] grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-1 overflow-y-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CatalogPickerTile({
  title,
  subtitle,
  selected,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string;
  subtitle?: string | null;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "min-w-0 rounded border px-1.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/15 ring-1 ring-primary"
          : "border-border hover:bg-muted/50",
        className,
      )}
      title={title}
      {...props}
    >
      <span className="block text-sm font-medium leading-snug line-clamp-2">
        {title}
      </span>
      {subtitle ? (
        <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground line-clamp-1">
          {subtitle}
        </span>
      ) : null}
    </button>
  );
}
