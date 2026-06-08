import { X } from "lucide-react";
import { Rune } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface BuildSlotRowProps {
  index: number;
  rune: Rune | null;
  onRemove: () => void;
}

export function BuildSlotRow({ index, rune, onRemove }: BuildSlotRowProps) {
  const isEmpty = rune === null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors",
        isEmpty
          ? "border-dashed border-border/50 text-muted-foreground/40"
          : "border-border bg-muted/20",
      )}
    >
      <span className="shrink-0 w-5 text-center font-mono text-muted-foreground/50">
        {index + 1}
      </span>
      {isEmpty ? (
        <span className="flex-1 italic">Slot vacío</span>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{rune.name}</p>
            <p className="text-muted-foreground/60 truncate">{rune.monsterName}</p>
          </div>
          <button
            onClick={onRemove}
            className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`Quitar ${rune.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}
