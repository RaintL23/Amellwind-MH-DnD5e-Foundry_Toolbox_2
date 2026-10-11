import { useEffect, useRef, type ChangeEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Dices,
  Download,
  FileJson,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { useBuildCompleteness } from "../../context/BuildCompletenessContext";
import { useBuilderSlotSelection } from "../../hooks/useBuilderSlotSelection";
import { useCharacterRandomizer } from "../../hooks/useCharacterRandomizer";
import { useBuilderCharacterImport } from "../../hooks/useBuilderCharacterImport";
import { useBuilderCharacterExport } from "../../hooks/useBuilderCharacterExport";

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
  const { exportCharacter } = useBuilderCharacterExport();

  return (
    <section
      aria-labelledby="builder-ready-title"
      className={cn(CARD_CLASS, "border-emerald-500/40 bg-emerald-500/5")}
    >
      <h2
        id="builder-ready-title"
        className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
      >
        <CheckCircle2
          className="h-4 w-4 shrink-0 text-emerald-500"
          aria-hidden
        />
        Your character is ready
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Every required choice is made. Save a copy now, or use the{" "}
        <Download className="inline h-3 w-3 align-[-2px]" aria-hidden />{" "}
        Download menu in the Character panel for a printable PDF or to send it
        to the Character Sheet.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2.5 h-8 gap-1.5 text-xs"
        onClick={() => exportCharacter()}
      >
        <FileJson className="h-3.5 w-3.5" aria-hidden />
        Save as Builder JSON
      </Button>
    </section>
  );
}

function BuilderWelcomeCard() {
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
        and explains why it matters. Your progress is saved automatically in
        this browser.
      </p>
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
