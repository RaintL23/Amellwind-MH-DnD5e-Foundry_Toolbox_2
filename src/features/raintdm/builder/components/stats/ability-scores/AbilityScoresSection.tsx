import { useMemo, useState } from "react";
import { ArrowRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ABILITY_ABBREVIATIONS } from "@/shared/constants/dnd";
import { cn } from "@/shared/utils/cn";
import {
  useSelectedClass,
  useSelectedSubclass,
} from "../../../hooks/useBuilderSelections";
import { resolveClassAbilityPriority } from "../../../utils/randomizer/class-ability-priority.utils";
import { useBuilderUiMode } from "../../../context/BuilderUiModeContext";
import {
  useBuildCompleteness,
  useSectionCompletenessHighlight,
} from "../../../context/BuildCompletenessContext";
import {
  BASE_ABILITIES_HIGHLIGHT_KEY,
  areBaseAbilitiesUntouched,
} from "../../../utils/build-completeness/evaluate-ability-scores.utils";
import { CompletenessHighlightBanner } from "../../shared/CompletenessHighlightBanner";
import { OriginBonusesPanel } from "./OriginBonusesPanel";
import { GenerationMethodSelector } from "./GenerationMethodSelector";
import { MethodHintPanels } from "./MethodHintPanels";
import { AbilityScoreGrid } from "./AbilityScoreGrid";
import { useAbilityScoreBreakdowns } from "./useAbilityScoreBreakdowns";
import { useAbilityGenerationState } from "./useAbilityGenerationState";
import { ConfirmActionDialog } from "../../shared/ConfirmActionDialog";
import type { GenerationMethod } from "./constants";

/** How many top-priority abilities are marked "Key" for the class. */
const KEY_ABILITY_COUNT = 2;

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
    applyRecommendedScores,
    canApplyRecommended,
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
  const [confirmRecommended, setConfirmRecommended] = useState(false);
  const { isSimple } = useBuilderUiMode();
  const { classData } = useSelectedClass();
  const subclassData = useSelectedSubclass();
  const abilityPriority = useMemo(
    () => (classData ? resolveClassAbilityPriority(classData, subclassData) : []),
    [classData, subclassData],
  );
  const keyAbilities = abilityPriority.slice(0, KEY_ABILITY_COUNT);
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
    if (method === "standard") return Object.keys(assignments).length > 0;
    if (method === "dice") {
      // An unassigned roll is still worth confirming before it is discarded.
      return Object.keys(assignments).length > 0 || pool.length > 0;
    }
    return !areBaseAbilitiesUntouched(character.abilities);
  }

  function onMethodChange(next: GenerationMethod) {
    if (next === method) return;
    if (hasAssignedScores()) {
      setPendingMethod(next);
      return;
    }
    handleMethodChange(next);
  }

  function onUseRecommended() {
    const picked =
      method === "standard" || method === "dice"
        ? Object.keys(assignments).length > 0
        : !areBaseAbilitiesUntouched(character.abilities);
    if (picked) {
      setConfirmRecommended(true);
      return;
    }
    applyRecommendedScores(abilityPriority);
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
          simple={isSimple}
        />
        {classData ? (
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5">
            <p className="min-w-0 flex-1 text-[11px] leading-snug text-muted-foreground">
              {canApplyRecommended ? (
                <>
                  Key abilities for {classData.name}:{" "}
                  <span className="font-medium text-foreground">
                    {keyAbilities.map((k) => ABILITY_ABBREVIATIONS[k]).join(", ")}
                  </span>
                </>
              ) : (
                "Roll your scores first, then place them for your class."
              )}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 shrink-0 gap-1 px-2 text-[11px] coarse:h-9"
              disabled={!canApplyRecommended}
              onClick={onUseRecommended}
              aria-label={`Use recommended ability scores for ${classData.name}`}
            >
              <Wand2 className="h-3 w-3" aria-hidden />
              Use recommended
            </Button>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Choose a class to see which abilities matter most for it.
          </p>
        )}
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
          keyAbilities={keyAbilities}
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
      <ConfirmActionDialog
        open={confirmRecommended}
        onOpenChange={setConfirmRecommended}
        title="Replace your ability scores?"
        description={`Your current scores will be rearranged so the highest values go to ${classData?.name ?? "your class"}'s key abilities.`}
        confirmLabel="Use recommended"
        onConfirm={() => applyRecommendedScores(abilityPriority)}
      />
    </div>
  );
}
