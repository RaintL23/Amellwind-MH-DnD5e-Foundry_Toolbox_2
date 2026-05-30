import { Swords, TrendingUp, Target } from "lucide-react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { DamageBreakdown } from "@/shared/types";

function CritSection({ breakdown }: { breakdown: DamageBreakdown }) {
  const { critRange, critRunes } = breakdown;
  const critPercent = ((21 - critRange) / 20) * 100;
  const hasExpansion = critRange < 20;
  const permanent = critRunes.filter((c) => !c.conditional);
  const conditional = critRunes.filter((c) => c.conditional);

  return (
    <div className="space-y-1.5">
      {/* Main crit row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Target className="h-3.5 w-3.5 shrink-0" />
          <span>
            Crit range:{" "}
            <span className={hasExpansion ? "text-amber-400 font-semibold" : "text-foreground font-medium"}>
              {critRange === 20 ? "20" : `${critRange}–20`}
            </span>
          </span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${hasExpansion ? "text-amber-400" : "text-muted-foreground"}`}>
          {critPercent.toFixed(0)}%
        </span>
      </div>

      {/* Permanent crit runes */}
      {permanent.map((c) => (
        <div key={`${c.name}-${c.monsterName}`} className="flex items-center gap-1.5 text-[10px] text-amber-400/80 pl-5">
          <span className="shrink-0">+{c.rangeBonus} range</span>
          <span className="text-muted-foreground/60">—</span>
          <span className="truncate">{c.name}</span>
        </div>
      ))}

      {/* Conditional crit runes */}
      {conditional.map((c) => (
        <div key={`${c.name}-${c.monsterName}`} className="flex items-start gap-1.5 text-[10px] text-blue-400/80 pl-5">
          <span className="shrink-0 mt-0.5">⚡ 1st round</span>
          <span className="text-muted-foreground/60">—</span>
          <span className="leading-tight">{c.description} ({c.name})</span>
        </div>
      ))}
    </div>
  );
}

function BreakdownRow({ label, breakdown }: { label: string; breakdown: DamageBreakdown }) {
  return (
    <div className="space-y-1.5 rounded-md border border-border/50 bg-background/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground uppercase">{label}</span>
        <span className="text-xs text-muted-foreground">
          {breakdown.attacksPerTurn} attack{breakdown.attacksPerTurn > 1 ? "s" : ""}/turn
        </span>
      </div>

      {/* Dice expression */}
      <div className="text-sm font-mono text-primary">{breakdown.diceExpression}</div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Attack Bonus</span>
          <span className="font-medium text-foreground">+{breakdown.attackBonus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ability ({breakdown.abilityUsed.toUpperCase()})</span>
          <span className="font-medium text-foreground">
            {breakdown.abilityModifier >= 0 ? "+" : ""}{breakdown.abilityModifier}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg/Hit</span>
          <span className="font-medium text-foreground">{breakdown.totalPerHit.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg/Turn</span>
          <span className="font-bold text-primary">{breakdown.totalPerTurn.toFixed(1)}</span>
        </div>
      </div>

      {/* Detailed damage sources */}
      {breakdown.sources && breakdown.sources.length > 0 && (
        <div className="border-t border-border/30 pt-2 space-y-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase">Damage Sources</span>
          {breakdown.sources.map((src, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground truncate max-w-[60%]">{src.source}</span>
              <span className="font-mono text-foreground">
                {src.dice ? src.dice.notation : (src.flatBonus >= 0 ? `+${src.flatBonus}` : src.flatBonus)}
                <span className="text-muted-foreground ml-1">({src.average.toFixed(1)} avg)</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Critical hit info */}
      <div className="border-t border-border/30 pt-2">
        <CritSection breakdown={breakdown} />
      </div>
    </div>
  );
}

export function CombatResultsPanel() {
  const { combat, character, effectiveAttacksPerTurn } = useCharacterBuilder();

  const hasEquipment = combat.mainHand || combat.offHand;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4 h-fit">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
        <Swords className="h-4 w-4" />
        Combat Calculator
      </h2>

      {!hasEquipment ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          <Swords className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Equip a weapon to see damage calculations.</p>
        </div>
      ) : (
        <>
          {/* Total DPT highlight */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase mb-1">
              Avg Damage per Turn
            </div>
            <div className="text-4xl font-bold text-primary tabular-nums">
              {combat.totalDPT.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Level {character.level} • {effectiveAttacksPerTurn} attacks
            </div>
          </div>

          {/* Breakdowns */}
          {combat.mainHand && (
            <BreakdownRow label="Main Hand" breakdown={combat.mainHand} />
          )}
          {combat.offHand && (
            <BreakdownRow label="Off Hand (Bonus Action)" breakdown={combat.offHand} />
          )}
        </>
      )}
    </div>
  );
}
