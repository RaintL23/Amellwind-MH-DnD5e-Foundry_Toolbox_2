import { useEffect, useRef, type ChangeEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Compass,
  Dices,
  Eye,
  FileJson,
  ScrollText,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { useBuildCompleteness } from "../../context/BuildCompletenessContext";
import { useBuilderSlotSelection } from "../../hooks/useBuilderSlotSelection";
import { useCharacterRandomizer } from "../../hooks/useCharacterRandomizer";
import { useBuilderCharacterImport } from "../../hooks/useBuilderCharacterImport";
import { useBuilderCharacterActions } from "../../context/BuilderCharacterActionsContext";

const CARD_CLASS = "rounded-lg border p-3.5";
const WELCOME_ACTION_CLASS =
  "h-auto justify-start gap-2 whitespace-normal py-2 text-left text-xs";

/**
 * Guided entry point above the slot grids: welcome options before the build
 * starts, then the single next pending choice, then a ready-to-export state.
 */
export function NextStepCard() {
  const { liveResult, nextStep } = useBuildCompleteness();

  if (!liveResult.hasStarted) return <BuilderWelcomeCard />;
  if (!nextStep) return <BuildReadyCard />;
  return <PendingStepCard />;
}

function PendingStepCard() {
  const { liveSteps, nextStep, goToIssue } = useBuildCompleteness();
  if (!nextStep) return null;

  const { step, position, issue } = nextStep;
  const remainingInStep = step.issues.length - 1;

  return (
    <section
      aria-labelledby="builder-next-step-title"
      className={cn(CARD_CLASS, "border-primary/40 bg-primary/5")}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
        Next step · {position} of {liveSteps.length}
      </p>
      <h2
        id="builder-next-step-title"
        className="mt-0.5 text-sm font-semibold text-foreground"
      >
        {step.label}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {step.description}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => goToIssue(issue)}
        >
          {issue.message}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
        {remainingInStep > 0 && (
          <span className="text-[11px] text-muted-foreground">
            +{remainingInStep} more choice{remainingInStep === 1 ? "" : "s"} in
            this step
          </span>
        )}
      </div>
    </section>
  );
}

function BuildReadyCard() {
  const actions = useBuilderCharacterActions();

  return (
    <section aria-labelledby="builder-ready-title">
      <div className="space-y-2.5 rounded-lg bg-emerald-500/10 px-3 py-2.5 ring-1 ring-inset ring-emerald-500/25 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
        <div className="flex items-center gap-2.5">
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-emerald-500"
            aria-hidden
          />
          <div className="min-w-0">
            <h2
              id="builder-ready-title"
              className="text-sm font-semibold leading-tight text-foreground"
            >
              Your character is ready
            </h2>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Every required choice is made. Take it with you:
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-emerald-500/40 bg-transparent text-xs hover:bg-emerald-500/15"
            disabled={actions.previewing}
            onClick={actions.previewPdf}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Preview PDF
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-emerald-500/40 bg-transparent text-xs hover:bg-emerald-500/15"
            disabled={actions.sendingToSheet}
            onClick={actions.linkedId ? actions.updateLinkedSheet : actions.sendToSheet}
          >
            <ScrollText className="h-3.5 w-3.5" aria-hidden />
            {actions.linkedId ? "Update Sheet" : "Open in Sheet"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-emerald-500/40 bg-transparent text-xs hover:bg-emerald-500/15"
            onClick={actions.exportJson}
            aria-label="Save as Builder JSON"
          >
            <FileJson className="h-3.5 w-3.5" aria-hidden />
            Save JSON
          </Button>
        </div>
      </div>
    </section>
  );
}

function BuilderWelcomeCard() {
  const { liveSteps } = useBuildCompleteness();
  const { selectSlot } = useBuilderSlotSelection();
  const { randomize, isRandomizing } = useCharacterRandomizer();
  const { importFromFile, importing, error } = useBuilderCharacterImport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // A successful import starts the build and swaps this card out, so only
  // failures need explicit feedback here.
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void importFromFile(file);
  }

  return (
    <section
      aria-labelledby="builder-welcome-title"
      className={cn(CARD_CLASS, "border-primary/40 bg-primary/5")}
    >
      <h2
        id="builder-welcome-title"
        className="text-sm font-semibold text-foreground"
      >
        Create your character
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        New to D&amp;D? Go step by step: the builder shows one choice at a time
        and explains why it matters. The checklist in the top bar tracks your
        progress, which is saved automatically in this browser.
      </p>
      <ol
        className="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] text-muted-foreground"
        aria-label="Creation steps"
      >
        {liveSteps.map((step, index) => (
          <li key={step.id} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3 w-3" aria-hidden />}
            <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5">
              {index + 1}. {step.label}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Button
          type="button"
          size="sm"
          className={WELCOME_ACTION_CLASS}
          onClick={() => selectSlot("class")}
        >
          <Compass className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            <span className="block font-semibold">Build step by step</span>
            <span className="block font-normal opacity-80">
              Start by choosing a class
            </span>
          </span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={WELCOME_ACTION_CLASS}
          disabled={isRandomizing}
          onClick={() =>
            void randomize().then(() =>
              toast.message("Random character created — change anything you like"),
            )
          }
        >
          <Dices
            className={cn("h-4 w-4 shrink-0", isRandomizing && "animate-spin")}
            aria-hidden
          />
          <span>
            <span className="block font-semibold">Surprise me</span>
            <span className="block font-normal text-muted-foreground">
              Get a complete random build
            </span>
          </span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={WELCOME_ACTION_CLASS}
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            <span className="block font-semibold">Load a character</span>
            <span className="block font-normal text-muted-foreground">
              From a Builder JSON file
            </span>
          </span>
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileSelected}
        aria-hidden
      />
    </section>
  );
}
