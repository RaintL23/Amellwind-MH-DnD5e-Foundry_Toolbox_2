import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Dices,
  FileDown,
  FileJson,
  ListChecks,
  Lock,
  RotateCcw,
  ScrollText,
  Upload,
  type LucideIcon,
} from "lucide-react";
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
import {
  BuilderCharacterActionsProvider,
  useBuilderCharacterActions,
} from "../../context/BuilderCharacterActionsContext";
import { useBuilderLayoutOptional } from "../../context/BuilderLayoutContext";
import { useBuilderDerivedStats } from "../../hooks/useBuilderDerivedStats";
import { formatModifier } from "@/shared/utils/cr.utils";
import type { CompletenessStep } from "../../utils/build-completeness/group-completeness-steps.utils";
import { NextStepCard } from "./NextStepCard";
import { AutosaveIndicator } from "./AutosaveIndicator";
import { BuilderMobileSettingsMenu } from "./BuilderMobileSettingsMenu";

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

function ActionRow({
  icon: Icon,
  label,
  onSelect,
  disabled,
  spinning,
  destructive,
}: Readonly<{
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  spinning?: boolean;
  destructive?: boolean;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
        destructive && "text-destructive hover:bg-destructive/10",
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5 shrink-0", spinning && "animate-spin")}
        aria-hidden
      />
      {label}
    </button>
  );
}

function CharacterActionsSection({ onDone }: Readonly<{ onDone: () => void }>) {
  const a = useBuilderCharacterActions();
  const run = (fn: () => void) => () => {
    onDone();
    fn();
  };
  return (
    <div className="space-y-0.5 border-t border-border/60 pt-2">
      <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Character
      </p>
      <ActionRow
        icon={FileDown}
        label="Download Character Sheet PDF"
        disabled={a.exporting}
        onSelect={run(a.exportPdf)}
      />
      <ActionRow
        icon={ScrollText}
        label="Send to Character Sheet"
        disabled={a.sendingToSheet}
        onSelect={run(a.sendToSheet)}
      />
      {a.linkedId && (
        <ActionRow
          icon={ScrollText}
          label="Update linked Sheet"
          disabled={a.sendingToSheet}
          onSelect={run(a.updateLinkedSheet)}
        />
      )}
      <ActionRow
        icon={FileJson}
        label="Save as Builder JSON"
        onSelect={run(a.exportJson)}
      />
      <ActionRow
        icon={Upload}
        label="Load Builder JSON"
        disabled={a.importing}
        onSelect={run(a.loadJson)}
      />
      <div className="my-1 border-t border-border/60" />
      <ActionRow
        icon={Dices}
        label="Randomize character"
        disabled={!a.canRandomize || a.isRandomizing}
        spinning={a.isRandomizing}
        onSelect={run(a.randomize)}
      />
      <ActionRow
        icon={RotateCcw}
        label="Reset character"
        destructive
        onSelect={run(a.reset)}
      />
    </div>
  );
}

/** Desktop: one labelled segment per step, so progress reads at a glance. */
function StepperSegments() {
  const { liveSteps, liveResult, goToIssue } = useBuildCompleteness();
  const firstPendingId = liveSteps.find((step) => step.status === "pending")?.id;

  return (
    <ol className="flex min-w-0 flex-1 gap-2" aria-label="Creation steps">
      {liveSteps.map((step, index) => {
        const isCurrent = liveResult.hasStarted && step.id === firstPendingId;
        const [issue] = step.issues;
        return (
          <li key={step.id} className="min-w-0 flex-1">
            <button
              type="button"
              disabled={!issue}
              onClick={() => issue && goToIssue(issue)}
              className="group flex w-full min-w-0 flex-col gap-1 text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  "h-1.5 w-full rounded-full transition-colors",
                  liveResult.hasStarted && step.status === "complete"
                    ? "bg-emerald-500"
                    : isCurrent
                      ? "bg-primary"
                      : "bg-muted",
                )}
              />
              <span
                className={cn(
                  "flex min-w-0 items-center gap-1 text-[11px]",
                  isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                  issue && "group-hover:text-foreground",
                )}
              >
                <StepStatusIcon
                  status={liveResult.hasStarted ? step.status : "pending"}
                />
                <span className="truncate">
                  {index + 1}. {step.label}
                </span>
                <span className="sr-only">
                  ({STEP_STATUS_LABEL[step.status]})
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function BuilderProgressBar() {
  return (
    <BuilderCharacterActionsProvider>
      <BuilderProgressBarContent />
    </BuilderCharacterActionsProvider>
  );
}

function BuilderProgressBarContent() {
  const {
    liveResult,
    liveSteps,
    liveProgress,
    nextStep,
    goToIssue,
  } = useBuildCompleteness();
  const isMobileLayout = useBuilderLayoutOptional()?.isMobileLayout ?? false;
  const [open, setOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);

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
                <span>{liveProgress.total} steps</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-h-[70vh] w-80 overflow-y-auto p-3"
          >
            <div className="space-y-3">
                {hasStarted && pendingIssues.length === 0 && (
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
                <CharacterActionsSection onDone={() => setOpen(false)} />
            </div>
          </PopoverContent>
        </Popover>

        {!isMobileLayout && <StepperSegments />}
        {!isMobileLayout && hasStarted && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1 px-2 text-xs text-muted-foreground"
            aria-expanded={guideOpen}
            aria-controls="builder-guide-panel"
            onClick={() => setGuideOpen((value) => !value)}
          >
            Guide
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                guideOpen && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
        )}
        <div className={cn("min-w-0 flex-1 space-y-1", !isMobileLayout && "hidden")}>
          <Progress
            value={hasStarted ? liveProgress.percent : 0}
            className={cn(
              "h-1.5",
              hasStarted && pendingIssues.length === 0 && "[&>div]:bg-emerald-500",
            )}
            aria-label={
              hasStarted
                ? `Build progress ${liveProgress.percent} percent`
                : "Build not started"
            }
          />
          {hasStarted ? (
            <button
              type="button"
              className="flex w-full min-w-0 items-center gap-1 text-left text-[11px] text-muted-foreground hover:text-foreground"
              aria-expanded={guideOpen}
              aria-controls="builder-guide-panel"
              onClick={() => setGuideOpen((value) => !value)}
            >
              <span
                className={cn(
                  "truncate",
                  !guideOpen && nextStep && "font-medium text-primary",
                )}
              >
                {guideOpen || !nextStep
                  ? pendingIssues.length === 0
                    ? "All required steps complete"
                    : `${pendingIssues.length} pending choice${pendingIssues.length === 1 ? "" : "s"}`
                  : `Next: ${nextStep.issue.message}`}
              </span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 shrink-0 transition-transform",
                  guideOpen && "rotate-180",
                )}
                aria-hidden
              />
              <span className="sr-only">
                {guideOpen ? "Hide guide" : "Show guide"}
              </span>
            </button>
          ) : (
            <p className="truncate text-[11px] italic text-muted-foreground">
              Not started yet
            </p>
          )}
        </div>
        <AutosaveIndicator />
        {isMobileLayout && <BuilderMobileSettingsMenu />}
      </div>
      {(guideOpen || !hasStarted) && (
        <div
          id="builder-guide-panel"
          className="mx-auto mt-2 w-full max-w-[1400px] [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-0"
        >
          <NextStepCard />
        </div>
      )}
      {isMobileLayout && hasStarted && <CombatSummaryStrip />}
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
