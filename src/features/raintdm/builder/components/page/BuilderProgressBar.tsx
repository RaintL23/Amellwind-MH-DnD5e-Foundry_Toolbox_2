import { CheckCircle2, Circle, ListChecks } from "lucide-react";
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
import type { BuildCompletenessIssue } from "../../utils/build-completeness.types";

function goToIssue(
  issue: BuildCompletenessIssue,
  selectSlot: (slot: NonNullable<BuildCompletenessIssue["slot"]>) => void,
  goToSection: (section: BuildCompletenessIssue["section"]) => void,
  activateHighlight: () => void,
) {
  activateHighlight();
  if (issue.slot) {
    selectSlot(issue.slot);
  }
  goToSection(issue.section);
}

export function BuilderProgressBar() {
  const {
    liveResult,
    liveSteps,
    liveProgress,
    goToSection,
    activateHighlight,
  } = useBuildCompleteness();
  const { selectSlot } = useBuilderSlotSelection();

  const pendingIssues = liveResult.issues;
  const hasStarted = liveResult.hasStarted;

  return (
    <div className="sticky top-0 z-20 -mx-3 mb-3 border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:-mx-4 lg:px-4">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3">
        <Popover>
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
          <PopoverContent align="start" className="w-80 p-3">
            {!hasStarted ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Start your character
                </p>
                <p className="text-xs text-muted-foreground">
                  Pick a species, background, and class to begin. The checklist
                  will track remaining choices as you build.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 w-full text-xs"
                  onClick={() => {
                    selectSlot("species");
                    goToSection("identity");
                  }}
                >
                  Choose species
                </Button>
              </div>
            ) : pendingIssues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                Build complete — ready to export
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pending steps
                </p>
                <ul className="space-y-2">
                  {liveSteps
                    .filter((step) => !step.complete)
                    .map((step) => (
                      <li key={step.id} className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <Circle
                            className="h-3 w-3 shrink-0 text-amber-500"
                            aria-hidden
                          />
                          {step.label}
                        </div>
                        <ul className="ml-4 space-y-0.5">
                          {step.issues.map((issue) => (
                            <li key={issue.id}>
                              <button
                                type="button"
                                className="text-left text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                onClick={() =>
                                  goToIssue(
                                    issue,
                                    selectSlot,
                                    goToSection,
                                    activateHighlight,
                                  )
                                }
                              >
                                {issue.message}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                </ul>
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
              ? "Start by picking a species, background, and class"
              : pendingIssues.length === 0
                ? "All required steps complete"
                : `${pendingIssues.length} pending choice${pendingIssues.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>
    </div>
  );
}
