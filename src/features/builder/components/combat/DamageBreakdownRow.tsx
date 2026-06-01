import { DamageBreakdown } from "@/shared/types";
import { CritSection } from "./CritSection";

export function DamageBreakdownRow({
  label,
  breakdown,
}: {
  label: string;
  breakdown: DamageBreakdown;
}) {
  return (
    <div className="space-y-1.5 rounded-md border border-border/50 bg-background/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground uppercase">{label}</span>
        <span className="text-xs text-muted-foreground">
          {breakdown.attacksPerTurn} attack{breakdown.attacksPerTurn > 1 ? "s" : ""}/turn
        </span>
      </div>

      <div className="text-sm font-mono text-primary">{breakdown.diceExpression}</div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Attack Bonus</span>
          <span className="font-medium text-foreground">+{breakdown.attackBonus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Ability ({breakdown.abilityUsed.toUpperCase()})
          </span>
          <span className="font-medium text-foreground">
            {breakdown.abilityModifier >= 0 ? "+" : ""}
            {breakdown.abilityModifier}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg/Hit</span>
          <span className="font-medium text-foreground">
            {breakdown.totalPerHit.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg/Turn</span>
          <span className="font-bold text-primary">{breakdown.totalPerTurn.toFixed(1)}</span>
        </div>
      </div>

      {breakdown.sources && breakdown.sources.length > 0 && (
        <div className="border-t border-border/30 pt-2 space-y-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase">
            Damage Sources
          </span>
          {breakdown.sources.map((src, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground truncate max-w-[60%]">{src.source}</span>
              <span className="font-mono text-foreground">
                {src.dice ? src.dice.notation : src.flatBonus >= 0 ? `+${src.flatBonus}` : src.flatBonus}
                <span className="text-muted-foreground ml-1">({src.average.toFixed(1)} avg)</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border/30 pt-2">
        <CritSection breakdown={breakdown} />
      </div>
    </div>
  );
}
