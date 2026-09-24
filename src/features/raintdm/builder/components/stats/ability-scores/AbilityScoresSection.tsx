import { useState } from "react";
import { OriginBonusesPanel } from "./OriginBonusesPanel";
import { GenerationMethodSelector } from "./GenerationMethodSelector";
import { MethodHintPanels } from "./MethodHintPanels";
import { AbilityScoreGrid } from "./AbilityScoreGrid";
import { useAbilityScoreBreakdowns } from "./useAbilityScoreBreakdowns";
import { useAbilityGenerationState } from "./useAbilityGenerationState";
import { ConfirmActionDialog } from "../../shared/ConfirmActionDialog";
import type { GenerationMethod } from "./constants";

export function AbilityScoresSection({
  compact = false,
}: {
  compact?: boolean;
}) {
  const {
    method,
    pool,
    assignments,
    heroicRolls,
    lastRolls,
    setHeroicRolls,
    handleMethodChange,
    handlePoolAssign,
    rollDice,
    adjustPointBuy,
    adjustManual,
    initPointBuy,
    pointsRemaining,
    pointsSpent,
    poolLabel,
    character,
    setAbilityScore,
  } = useAbilityGenerationState();

  const { getBreakdown } = useAbilityScoreBreakdowns();
  const [pendingMethod, setPendingMethod] = useState<GenerationMethod | null>(
    null,
  );

  function hasAssignedScores(): boolean {
    if (method === "standard" || method === "dice") {
      return Object.keys(assignments).length > 0 || pool.length > 0;
    }
    return Object.values(character.abilities).some((v) => v !== 8 && v !== 10);
  }

  function onMethodChange(next: GenerationMethod) {
    if (next === method) return;
    if (hasAssignedScores()) {
      setPendingMethod(next);
      return;
    }
    handleMethodChange(next);
  }

  return (
    <div className="space-y-2">
      <OriginBonusesPanel compact={compact} />
      <GenerationMethodSelector
        compact={compact}
        method={method}
        onMethodChange={onMethodChange}
      />
      <MethodHintPanels
        method={method}
        poolLabel={poolLabel}
        pointsRemaining={pointsRemaining}
        pointsSpent={pointsSpent}
        heroicRolls={heroicRolls}
        lastRolls={lastRolls}
        onInitPointBuy={initPointBuy}
        onRollDice={rollDice}
        onHeroicRollsChange={setHeroicRolls}
      />
      <AbilityScoreGrid
        compact={compact}
        method={method}
        pool={pool}
        assignments={assignments}
        character={character}
        setAbilityScore={setAbilityScore}
        getBreakdown={getBreakdown}
        handlePoolAssign={handlePoolAssign}
        adjustPointBuy={adjustPointBuy}
        adjustManual={adjustManual}
      />
      <MethodHintPanels
        method={method}
        poolLabel={poolLabel}
        pointsRemaining={pointsRemaining}
        pointsSpent={pointsSpent}
        heroicRolls={heroicRolls}
        lastRolls={lastRolls}
        onInitPointBuy={initPointBuy}
        onRollDice={rollDice}
        onHeroicRollsChange={setHeroicRolls}
        placement="after"
      />

      <ConfirmActionDialog
        open={pendingMethod !== null}
        onOpenChange={(open) => {
          if (!open) setPendingMethod(null);
        }}
        title="Change ability score method?"
        description="Switching methods resets your current ability score assignments."
        confirmLabel="Change method"
        onConfirm={() => {
          if (pendingMethod) handleMethodChange(pendingMethod);
        }}
      />
    </div>
  );
}
