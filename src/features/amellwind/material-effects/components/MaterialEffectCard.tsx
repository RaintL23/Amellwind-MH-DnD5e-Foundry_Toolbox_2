import type { MaterialEffect } from "@/shared/types";
import {
  MATERIAL_EFFECT_SLOT_LABELS,
  RESOURCE_RARITY_STYLES,
} from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { Link2 } from "lucide-react";

interface MaterialEffectCardProps {
  effect: MaterialEffect;
  onClick: () => void;
}

export function MaterialEffectCard({ effect, onClick }: MaterialEffectCardProps) {
  const style = RESOURCE_RARITY_STYLES[effect.rarity];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border p-3 bg-gradient-to-br transition-all duration-150",
        "hover:scale-[1.02] hover:shadow-md cursor-pointer",
        style.bg,
        style.border,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("font-semibold text-sm truncate", style.text)}>
            {effect.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {effect.summary}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <Badge variant="outline" className={cn("text-xs", style.badge)}>
            {effect.rarity}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              effect.slot === "weapon"
                ? "bg-orange-950/40 text-orange-300 border-orange-800/50"
                : "bg-blue-950/40 text-blue-300 border-blue-800/50",
            )}
          >
            {MATERIAL_EFFECT_SLOT_LABELS[effect.slot]}
          </Badge>
        </div>
      </div>
      {effect.isReference && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Link2 className="h-3 w-3" />
          References a monster material
        </div>
      )}
    </button>
  );
}
