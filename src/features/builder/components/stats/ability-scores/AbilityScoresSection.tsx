import { OriginBonusesPanel } from "./OriginBonusesPanel";
import { GenerationMethodSelector } from "./GenerationMethodSelector";
import { MethodHintPanels } from "./MethodHintPanels";
import { AbilityScoreGrid } from "./AbilityScoreGrid";
import { useAbilityScoreBreakdowns } from "./useAbilityScoreBreakdowns";
import { useAbilityGenerationState } from "./useAbilityGenerationState";

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

  return (
    <div className="space-y-2">
      <OriginBonusesPanel compact={compact} />
      <GenerationMethodSelector
        compact={compact}
        method={method}
        onMethodChange={handleMethodChange}
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
    </div>
  );
}
