import {
  Background,
  BACKGROUND_FACTION_LABELS,
  BackgroundFaction,
} from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { Card } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

const FACTION_ACCENT: Record<BackgroundFaction, string> = {
  "hunters-guild": "text-emerald-400",
  "handlers-guild": "text-sky-400",
  wycademy: "text-violet-400",
};

const FACTION_BG: Record<BackgroundFaction, string> = {
  "hunters-guild": "bg-emerald-950/60",
  "handlers-guild": "bg-sky-950/60",
  wycademy: "bg-violet-950/60",
};

interface BackgroundCardProps {
  background: Background;
  onClick: () => void;
}

export function BackgroundCard({ background, onClick }: BackgroundCardProps) {
  const accent = FACTION_ACCENT[background.faction];
  const iconBg = FACTION_BG[background.faction];

  return (
    <Card
      asChild
      className="w-full text-left p-4 transition-all duration-200 hover:bg-card/80 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-primary/40"
    >
      <button type="button" onClick={onClick}>
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("rounded-md p-2 shrink-0", iconBg)}>
          <ScrollText className={cn("h-5 w-5", accent)} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground leading-tight truncate">
            {background.name}
          </h3>
          <span
            className={cn(
              "inline-block mt-1 rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-medium",
              accent,
            )}
          >
            {BACKGROUND_FACTION_LABELS[background.faction]}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 mb-3 text-sm">
        <p className="text-muted-foreground line-clamp-2">
          <span className="text-foreground/80 font-medium">Skills:</span>{" "}
          {background.proficiencies.skills}
        </p>
        {background.features[0] && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {background.features[0].name}
          </p>
        )}
      </div>

      {background.fluff && (
        <p className="text-xs text-muted-foreground italic line-clamp-2 mb-3">
          {background.fluff}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5">
        <span>{background.source}</span>
        {background.page !== undefined && <span>p. {background.page}</span>}
      </div>
      </button>
    </Card>
  );
}
