import { X } from "lucide-react";
import { Rune } from "@/shared/types";
import { BuildSlotType, useRuneBuild } from "../context/RuneBuildContext";

interface TrinketSlotRowProps {
  label: string;
  rune: Rune | null;
  slotType: Extract<BuildSlotType, "trinket1" | "trinket2">;
}

export function TrinketSlotRow({ label, rune, slotType }: TrinketSlotRowProps) {
  const { removeRune } = useRuneBuild();

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {rune ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{rune.name}</p>
            <p className="text-muted-foreground/60 truncate">{rune.monsterName}</p>
          </div>
          <button
            onClick={() => removeRune(slotType)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border/50 px-3 py-2 text-xs text-muted-foreground/40 italic">
          Slot vacío
        </div>
      )}
    </div>
  );
}
