import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/utils/cn";

interface ClearableSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Smaller control for dense layouts (builder libraries, compact toolbars). */
  compact?: boolean;
}

export function ClearableSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  inputClassName,
  compact = false,
}: ClearableSearchInputProps) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Search
        className={cn(
          "absolute left-2.5 text-muted-foreground pointer-events-none",
          compact
            ? "top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            : "top-1/2 h-4 w-4 -translate-y-1/2",
        )}
      />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "pl-8",
          value && "pr-8",
          compact && "h-8 text-xs",
          inputClassName,
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
          )}
          aria-label="Clear search"
        >
          <X className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        </button>
      ) : null}
    </div>
  );
}
