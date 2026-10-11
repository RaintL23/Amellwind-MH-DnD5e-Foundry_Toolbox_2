import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  useBuildCompleteness,
  useSectionCompletenessHighlight,
} from "../../../context/BuildCompletenessContext";
import { BASE_ABILITIES_HIGHLIGHT_KEY } from "../../../utils/build-completeness/evaluate-ability-scores.utils";
import { CompletenessHighlightBanner } from "../../shared/CompletenessHighlightBanner";
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
  const { nextStep } = useBuildCompleteness();
  const { highlighted, issues: baseIssues } = useSectionCompletenessHighlight(
    "ability-scores",
    BASE_ABILITIES_HIGHLIGHT_KEY,
  );
  const nextBaseIssue =
    !highlighted &&
    nextStep?.issue.highlightKey === BASE_ABILITIES_HIGHLIGHT_KEY
      ? nextStep.issue
      : null;

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
      <div
        className={cn(
          "space-y-2",
          (highlighted || nextBaseIssue) && "rounded-md border p-1.5",
          highlighted &&
            "border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30",
          nextBaseIssue && "border-primary/50 bg-primary/5 ring-1 ring-primary/30",
        )}
      >
        {highlighted && <CompletenessHighlightBanner issues={baseIssues} />}
        {nextBaseIssue && (
          <p className="flex items-center gap-1 text-[11px] font-medium text-primary">
            <ArrowRight className="h-3 w-3 shrink-0" aria-hidden />
            Next: {nextBaseIssue.message}
          </p>
        )}
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
      </div>

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
