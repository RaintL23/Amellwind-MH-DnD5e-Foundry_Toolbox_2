import { Swords, TrendingUp } from "lucide-react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { DamageBreakdownRow } from "./combat/DamageBreakdownRow";

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

          {combat.mainHand && (
            <DamageBreakdownRow label="Main Hand" breakdown={combat.mainHand} />
          )}
          {combat.offHand && (
            <DamageBreakdownRow
              label="Off Hand (Bonus Action)"
              breakdown={combat.offHand}
            />
          )}
        </>
      )}
    </div>
  );
}
