import { ChevronDown, Wrench } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ARTIFICER_BONUS_MATERIAL_SLOTS_TOOLTIP,
  getArtificerBonusMaterialSlots,
} from "@/shared/utils/artificer-material-slots.utils";
import { cn } from "@/shared/utils/cn";

interface ArtificerSlotsControlProps {
  enabled: boolean;
  level: number;
  onEnabledChange: (enabled: boolean) => void;
  onLevelChange: (level: number) => void;
}

export function ArtificerSlotsControl({
  enabled,
  level,
  onEnabledChange,
  onLevelChange,
}: ArtificerSlotsControlProps) {
  const bonusSlots = enabled ? getArtificerBonusMaterialSlots(level) : 0;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Wrench className="h-4 w-4 shrink-0 text-amber-500" />
          <Label
            htmlFor="artificer-slots-toggle"
            className="text-sm font-semibold text-foreground"
          >
            Artificer
          </Label>
        </div>
        <Switch
          id="artificer-slots-toggle"
          checked={enabled}
          onCheckedChange={onEnabledChange}
          aria-label="Enable Artificer bonus material slots"
        />
      </div>

      {enabled && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Level:</span>
            <div className="relative">
              <select
                value={level}
                onChange={(e) => onLevelChange(Number(e.target.value))}
                className={cn(
                  "appearance-none rounded-md border border-border bg-muted/30 px-2 py-1 pr-6 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary",
                )}
                aria-label="Artificer level"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((lv) => (
                  <option key={lv} value={lv}>
                    Level {lv}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {bonusSlots > 0
              ? `+${bonusSlots} extra material slot${bonusSlots !== 1 ? "s" : ""} on weapon and armor`
              : "Bonus slots unlock at levels 10, 14, and 18"}
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
        {ARTIFICER_BONUS_MATERIAL_SLOTS_TOOLTIP}
      </p>
    </div>
  );
}
