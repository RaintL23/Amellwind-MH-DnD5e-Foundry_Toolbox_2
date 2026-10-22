import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Dices,
  Eye,
  FileJson,
  ListChecks,
  Lock,
  RotateCcw,
  ScrollText,
  Settings2,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

/** Checklist marker: number while pending, check when done, lock until a class. */
function StepBadge({
  status,
  number,
  current,
}: Readonly<{
  status: CompletenessStep["status"];
  number: number;
  current: boolean;
}>) {
  if (status === "complete") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Check className="h-3 w-3" aria-hidden />
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="h-2.5 w-2.5" aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
        current
          ? "bg-primary text-primary-foreground"
          : "border border-amber-500/60 text-amber-600 dark:text-amber-400",
      )}
      aria-hidden
    >
      {number}
    </span>
  );
}

function BuildChecklist({ onNavigate }: Readonly<{ onNavigate: () => void }>) {
  const { liveResult, liveSteps, liveProgress, goToIssue } = useBuildCompleteness();
  const firstPendingId = liveSteps.find((step) => step.status === "pending")?.id;
  const isComplete = liveResult.hasStarted && liveResult.issues.length === 0;

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border/60 bg-popover px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Creation checklist
          </p>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {liveResult.hasStarted ? liveProgress.completed : 0} / {liveProgress.total}
          </span>
        </div>
        <Progress
          value={liveResult.hasStarted ? liveProgress.percent : 0}
          className={cn("mt-2 h-1", isComplete && "[&>div]:bg-emerald-500")}
          aria-hidden
        />
        {isComplete && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Build complete — ready to export
          </p>
        )}
      </div>
      <ol className="space-y-1 p-2">
        {liveSteps.map((step, index) => {
          const isCurrent = step.id === firstPendingId;
          return (
            <li
              key={step.id}
              className={cn(
                "rounded-md px-2 py-1.5",
                isCurrent && "bg-primary/5 ring-1 ring-inset ring-primary/25",
              )}
            >
              <div className="flex items-center gap-2">
                <StepBadge
                  status={step.status}
                  number={index + 1}
                  current={isCurrent}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-xs font-medium",
                    step.status === "pending"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span className="sr-only">({STEP_STATUS_LABEL[step.status]})</span>
                {step.status === "locked" && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    Needs a class
                  </span>
                )}
                {step.status === "complete" && (
                  <span className="shrink-0 text-[10px] text-emerald-600 dark:text-emerald-400">
                    Done
                  </span>
                )}
              </div>
              {step.issues.length > 0 && (
                <ul className="ml-7 mt-1 space-y-0.5">
                  {step.issues.map((issue) => (
                    <li key={issue.id}>
                      <button
                        type="button"
                        className="group flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px] leading-snug text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        onClick={() => {
                          onNavigate();
                          goToIssue(issue);
                        }}
                      >
                        <span className="min-w-0 flex-1">{issue.message}</span>
                        <ChevronRight
                          className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function OptionItem({
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
    <DropdownMenuItem
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "text-xs",
        destructive && "text-destructive focus:bg-destructive/10 focus:text-destructive",
      )}
    >
      <Icon className={cn("!size-3.5", spinning && "animate-spin")} aria-hidden />
      {label}
    </DropdownMenuItem>
  );
}

const OPTIONS_LABEL_CLASS =
  "pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground";

/** Character-level actions (export, import, randomize, reset), apart from progress. */
function BuilderOptionsMenu({ compact }: Readonly<{ compact: boolean }>) {
  const a = useBuilderCharacterActions();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-8 shrink-0 gap-1.5 text-xs", compact && "w-8 p-0")}
          aria-label="Character options"
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden />
          {!compact && (
            <>
              Options
              <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className={OPTIONS_LABEL_CLASS}>Export</DropdownMenuLabel>
        <OptionItem
          icon={Eye}
          label="Preview character sheet PDF"
          disabled={a.previewing || !a.buildHasStarted}
          onSelect={a.previewPdf}
        />
        <OptionItem
          icon={ScrollText}
          label="Send to Character Sheet"
          disabled={a.sendingToSheet}
          onSelect={a.sendToSheet}
        />
        {a.linkedId && (
          <OptionItem
            icon={ScrollText}
            label="Update linked Sheet"
            disabled={a.sendingToSheet}
            onSelect={a.updateLinkedSheet}
          />
        )}
        <OptionItem icon={FileJson} label="Save as Builder JSON" onSelect={a.exportJson} />
        <DropdownMenuSeparator />
        <DropdownMenuLabel className={OPTIONS_LABEL_CLASS}>Import</DropdownMenuLabel>
        <OptionItem
          icon={Upload}
          label="Load Builder JSON"
          disabled={a.importing}
          onSelect={a.loadJson}
        />
        <DropdownMenuSeparator />
        <DropdownMenuLabel className={OPTIONS_LABEL_CLASS}>Build</DropdownMenuLabel>
        <OptionItem
          icon={Dices}
          label="Randomize character"
          disabled={!a.canRandomize || a.isRandomizing}
          spinning={a.isRandomizing}
          onSelect={a.randomize}
        />
        <OptionItem icon={RotateCcw} label="Start over" destructive onSelect={a.reset} />
      </DropdownMenuContent>
    </DropdownMenu>
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
  const { liveResult, liveProgress, nextStep } = useBuildCompleteness();
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
      {(guideOpen || !hasStarted) && (
        <div
          id="builder-guide-panel"
          className="mx-auto mb-2 w-full max-w-[1400px] [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-0"
        >
          <NextStepCard />
        </div>
      )}
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
            className="max-h-[70vh] w-80 overflow-y-auto p-0"
          >
            <BuildChecklist onNavigate={() => setOpen(false)} />
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
        <BuilderOptionsMenu compact={isMobileLayout} />
        {isMobileLayout && <BuilderMobileSettingsMenu />}
      </div>
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
