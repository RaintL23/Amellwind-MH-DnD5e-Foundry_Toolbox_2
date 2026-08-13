import { ShieldCheck, Sword, X } from "lucide-react";
import { MaterialEffectSlot, Rune } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { BuildSlotType, useRuneBuild } from "../../context/RuneBuildContext";

interface TrinketSlotRowProps {
  label: string;
  rune: Rune | null;
  kind: MaterialEffectSlot | null;
  slotType: Extract<BuildSlotType, "trinket1" | "trinket2">;
}

export function TrinketSlotRow({
  label,
  rune,
  kind,
  slotType,
}: TrinketSlotRowProps) {
  const { removeRune } = useRuneBuild();
  const effectKind = kind ?? (rune?.weaponEffect ? "weapon" : "armor");

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {rune ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-foreground truncate">
                {rune.name}
              </p>
              <Badge
                variant="outline"
                className="shrink-0 gap-1 border-purple-700/40 text-purple-300"
              >
                {effectKind === "weapon" ? (
                  <Sword className="h-3 w-3" />
                ) : (
                  <ShieldCheck className="h-3 w-3" />
                )}
                {effectKind === "weapon" ? "Weapon" : "Armor"}
              </Badge>
            </div>
            <p className="text-muted-foreground/60 truncate">
              {rune.monsterName}
            </p>
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
          Empty slot
        </div>
      )}
    </div>
  );
}
