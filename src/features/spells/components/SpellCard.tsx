import { Spell } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface SpellCardProps {
  spell: Spell;
  onClick: () => void;
}

function LevelBadge({ level }: { level: number }) {
  return (
    <span
      className={cn(
        "inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold",
        level === 0
          ? "border-sky-800/50 bg-sky-950/40 text-sky-400"
          : "border-violet-800/50 bg-violet-950/40 text-violet-400",
      )}
    >
      {level === 0 ? "Cantrip" : `Lvl ${level}`}
    </span>
  );
}

export function SpellCard({ spell, onClick }: SpellCardProps) {
  return (
    <Card
      asChild
      className="w-full text-left p-4 transition-all duration-200 hover:bg-card/80 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-violet-500/40"
    >
      <button type="button" onClick={onClick}>
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-md p-2 shrink-0 bg-violet-950/60">
          <Sparkles className="h-5 w-5 text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground leading-tight truncate">
            {spell.name}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <LevelBadge level={spell.level} />
            <span className="inline-block rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {spell.schoolName}
            </span>
            {spell.isRitual && (
              <span className="inline-block rounded border border-emerald-800/50 bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                Ritual
              </span>
            )}
            {spell.isConcentration && (
              <span className="inline-block rounded border border-amber-800/50 bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                Conc.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-2 flex gap-3">
        <span>{spell.castingTime}</span>
        <span>·</span>
        <span>{spell.range}</span>
      </div>

      {spell.summary && (
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {spell.summary}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5 mt-3">
        <span>{spell.source}</span>
        {spell.page !== undefined && <span>p. {spell.page}</span>}
      </div>
      </button>
    </Card>
  );
}
