import { CheckCircle2, Circle, ListChecks, Lock } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import {
  useBuildCompleteness,
} from "../../context/BuildCompletenessContext";
import { useBuilderSlotSelection } from "../../hooks/useBuilderSlotSelection";
import { useBuilderLayoutOptional } from "../../context/BuilderLayoutContext";
import { useBuilderDerivedStats } from "../../hooks/useBuilderDerivedStats";
import { formatModifier } from "@/shared/utils/cr.utils";
import type { CompletenessStep } from "../../utils/build-completeness/group-completeness-steps.utils";

function StepStatusIcon({ status }: Readonly<{ status: CompletenessStep["status"] }>) {
  if (status === "complete") {
    return (
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
    );
  }
  if (status === "locked") {
    return <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />;
  }
  return <Circle className="h-3 w-3 shrink-0 text-amber-500" aria-hidden />;
}

const STEP_STATUS_LABEL: Record<CompletenessStep["status"], string> = {
  complete: "done",
  pending: "to do",
  locked: "unlocks after choosing a class",
};

export function BuilderProgressBar() {
  const { liveResult, liveSteps, liveProgress, goToSection, goToIssue } =
    useBuildCompleteness();
  const { selectSlot } = useBuilderSlotSelection();
  const isMobileLayout = useBuilderLayoutOptional()?.isMobileLayout ?? false;
  const [open, setOpen] = useState(false);

  const pendingIssues = liveResult.issues;
  const hasStarted = liveResult.hasStarted;

  return (
    <div
      className={cn(
        "z-20 border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        isMobileLayout ? "shrink-0" : "shrink-0 rounded-t-lg px-4",
      )}
    >
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1.5 text-xs"
              aria-label="Open build progress checklist"
            >
              <ListChecks className="h-3.5 w-3.5" aria-hidden />
              {hasStarted ? (
                <span>
                  {liveProgress.completed} of {liveProgress.total} steps
                </span>
              ) : (
                <span>Get started</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-h-[70vh] w-80 overflow-y-auto p-3"
          >
            {!hasStarted ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Start your character
                </p>
                <p className="text-xs text-muted-foreground">
                  Start with your class: it decides which ability scores,
                  skills and spells matter. The checklist then tracks every
                  remaining choice.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 w-full text-xs"
                  onClick={() => {
                    setOpen(false);
                    selectSlot("class");
                    goToSection("identity");
                  }}
                >
                  Choose a class
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingIssues.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                    Build complete — ready to export
                  </div>
                )}
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Creation checklist
                </p>
                <ol className="space-y-2">
                  {liveSteps.map((step, index) => (
                    <li key={step.id} className="space-y-1">
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium",
                          step.status === "pending"
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        <StepStatusIcon status={step.status} />
                        <span>
                          {index + 1}. {step.label}
                        </span>
                        <span className="sr-only">
                          ({STEP_STATUS_LABEL[step.status]})
                        </span>
                        {step.status === "locked" && (
                          <span className="ml-auto text-[11px] font-normal">
                            Needs a class
                          </span>
                        )}
                      </div>
                      {step.issues.length > 0 && (
                        <ul className="ml-5 space-y-0.5">
                          {step.issues.map((issue) => (
                            <li key={issue.id}>
                              <button
                                type="button"
                                className="text-left text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                onClick={() => {
                                  setOpen(false);
                                  goToIssue(issue);
                                }}
                              >
                                {issue.message}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <div className="min-w-0 flex-1 space-y-1">
          <Progress
            value={hasStarted ? liveProgress.percent : 0}
            className="h-1.5"
            aria-label={
              hasStarted
                ? `Build progress ${liveProgress.percent} percent`
                : "Build not started"
            }
          />
          <p
            className={cn(
              "truncate text-[11px] text-muted-foreground",
              !hasStarted && "italic",
            )}
          >
            {!hasStarted
              ? "Start by choosing a class"
              : pendingIssues.length === 0
                ? "All required steps complete"
                : `${pendingIssues.length} pending choice${pendingIssues.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>
      {isMobileLayout && <CombatSummaryStrip />}
    </div>
  );
}

/** Mobile-only: key combat stats visible from every tab. */
function CombatSummaryStrip() {
  const { hitPoints, armorClass, speed, initiative, proficiencyBonus } =
    useBuilderDerivedStats();
  const chips: { label: string; value: string }[] = [
    { label: "HP", value: hitPoints ? String(hitPoints.max) : "—" },
    { label: "AC", value: String(armorClass.total) },
    { label: "Spd", value: speed.display },
    { label: "Init", value: formatModifier(initiative) },
    { label: "Prof", value: `+${proficiencyBonus}` },
  ];
  return (
    <dl className="mt-2 grid grid-cols-5 gap-1" aria-label="Combat summary">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="flex min-w-0 flex-col items-center rounded-md border border-border/50 bg-muted/30 px-1 py-0.5"
        >
          <dt className="text-[9px] uppercase tracking-wide text-muted-foreground">
            {chip.label}
          </dt>
          <dd className="w-full truncate text-center text-xs font-semibold text-foreground">
            {chip.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
