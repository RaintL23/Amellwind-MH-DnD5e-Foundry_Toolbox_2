import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Dices,
  Download,
  FileDown,
  FileJson,
  RotateCcw,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useCharacterSheetExport } from "../../hooks/useCharacterSheetExport";
import { useBuilderCharacterExport } from "../../hooks/useBuilderCharacterExport";
import { useBuilderCharacterImport } from "../../hooks/useBuilderCharacterImport";
import { useBuildCompleteness } from "../../context/BuildCompletenessContext";
import { useBuilderSlotSelection } from "../../hooks/useBuilderSlotSelection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useCharacterRandomizer } from "../../hooks/useCharacterRandomizer";
import {
  formatAlignmentLabel,
  parseAlignmentAxes,
} from "../../utils/alignment.utils";
import { getFeatSlotLevels } from "../../utils/builder-class.utils";
import { AbilityScoresSection } from "./ability-scores/AbilityScoresSection";
import { BuilderPanel } from "../shared/BuilderPanel";
import { CompletenessHighlightBanner } from "../shared/CompletenessHighlightBanner";
import { ConfirmActionDialog } from "../shared/ConfirmActionDialog";
import { MulticlassPanel } from "./MulticlassPanel";
import { NumberStepper } from "../shared";
import type { BuildCompletenessIssue } from "../../utils/build-completeness.types";

// Set to true to re-enable Foundry VTT JSON export/import once the exporter is ready.
const FOUNDRY_JSON_UI_ENABLED = false;

const ICON_BUTTON_CLASS = "h-7 w-7 shrink-0";
const FOUNDRY_DISABLED_TITLE =
  "Temporarily unavailable while the Foundry exporter is being improved";

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
      {children}
    </p>
  );
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-[11px] font-medium text-muted-foreground"
    >
      {children}
    </Label>
  );
}

type PendingConfirm =
  | { kind: "reset" }
  | { kind: "randomize" }
  | { kind: "level"; nextLevel: number; lostFeatSlots: number }
  | { kind: "multiclass-off" };

export function StatsPanel() {
  const {
    character,
    setName,
    setCreatureSize,
    setLawChaosAlignment,
    setGoodEvilAlignment,
    setLevel,
    resetBuild,
    multiclassEnabled,
    setMulticlassEnabled,
    featSelections,
    class: classSelection,
  } = useCharacterBuilder();
  const { randomize, isRandomizing, canRandomize } = useCharacterRandomizer();
  const {
    exportSheet,
    exporting,
    error: exportError,
  } = useCharacterSheetExport();
  const { exportCharacter, error: builderExportError } =
    useBuilderCharacterExport();
  const {
    importFromFile: importBuilderFromFile,
    importing: importingBuilder,
    error: builderImportError,
    summary: builderImportSummary,
    clearResult: clearBuilderImport,
  } = useBuilderCharacterImport();
  const builderFileInputRef = useRef<HTMLInputElement>(null);
  const {
    evaluate,
    activateHighlight,
    clearHighlight,
    highlightActive,
    issues,
    goToSection,
    liveResult,
  } = useBuildCompleteness();
  const { selectSlot } = useBuilderSlotSelection();
  const { lawChaos, goodEvil } = parseAlignmentAxes(character.alignment);
  const alignmentLabel = formatAlignmentLabel(lawChaos, goodEvil);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );
  const buildHasStarted = liveResult.hasStarted;

  function handleLevelChange(nextLevel: number) {
    if (multiclassEnabled) return;
    if (nextLevel >= character.level) {
      setLevel(nextLevel);
      return;
    }
    const className = classSelection?.name ?? "";
    const currentSlots = getFeatSlotLevels(className, character.level).length;
    const nextSlots = getFeatSlotLevels(className, nextLevel).length;
    const filledBeyond = featSelections.slice(nextSlots).filter(Boolean).length;
    if (filledBeyond > 0 || currentSlots > nextSlots) {
      setPendingConfirm({
        kind: "level",
        nextLevel,
        lostFeatSlots: Math.max(filledBeyond, currentSlots - nextSlots),
      });
      return;
    }
    setLevel(nextLevel);
  }

  function handleMulticlassToggle(checked: boolean) {
    if (checked) {
      setMulticlassEnabled(true);
      return;
    }
    if (multiclassEnabled) {
      setPendingConfirm({ kind: "multiclass-off" });
      return;
    }
    setMulticlassEnabled(false);
  }

  function runPendingConfirm() {
    if (!pendingConfirm) return;
    switch (pendingConfirm.kind) {
      case "reset":
        clearHighlight();
        resetBuild();
        toast.message("Build reset");
        break;
      case "randomize":
        clearHighlight();
        void randomize().then(() => toast.message("Character randomized"));
        break;
      case "level":
        setLevel(pendingConfirm.nextLevel);
        toast.message(
          pendingConfirm.lostFeatSlots > 0
            ? `Level set to ${pendingConfirm.nextLevel} · ${pendingConfirm.lostFeatSlots} feat pick${pendingConfirm.lostFeatSlots === 1 ? "" : "s"} removed`
            : `Level set to ${pendingConfirm.nextLevel}`,
        );
        break;
      case "multiclass-off":
        setMulticlassEnabled(false);
        toast.message("Multiclass disabled");
        break;
    }
  }

  function handleIssueClick(issue: BuildCompletenessIssue) {
    activateHighlight();
    if (issue.slot) selectSlot(issue.slot);
    goToSection(issue.section);
  }

  async function handleExportPdf() {
    const result = evaluate();
    if (result.shouldBlockExport) {
      activateHighlight();
      return;
    }
    clearHighlight();
    await exportSheet();
  }

  function handleBuilderFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    clearHighlight();
    void importBuilderFromFile(file);
  }

  const confirmCopy =
    pendingConfirm?.kind === "reset"
      ? {
          title: "Reset character?",
          description:
            "This clears the entire build and cannot be undone. Autosave will be wiped.",
          confirmLabel: "Reset build",
        }
      : pendingConfirm?.kind === "randomize"
        ? {
            title: "Randomize character?",
            description:
              "This replaces your current choices with a randomized build at the same level.",
            confirmLabel: "Randomize",
          }
        : pendingConfirm?.kind === "level"
          ? {
              title: `Lower level to ${pendingConfirm.nextLevel}?`,
              description:
                "Lowering level removes feat slots and optional features that no longer apply.",
              confirmLabel: "Lower level",
              lossItems: [
                `${pendingConfirm.lostFeatSlots} feat pick${pendingConfirm.lostFeatSlots === 1 ? "" : "s"} may be removed`,
              ],
            }
          : pendingConfirm?.kind === "multiclass-off"
            ? {
                title: "Disable multiclass?",
                description:
                  "Additional class entries will be cleared and total level stays on your primary class.",
                confirmLabel: "Disable multiclass",
              }
            : null;

  return (
    <TooltipProvider delayDuration={300}>
      <BuilderPanel
        sectionId="ability-scores"
        title={
          <>
            <User className="h-3.5 w-3.5" aria-hidden /> Character
          </>
        }
        action={
          <div className="ml-auto flex items-center gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={ICON_BUTTON_CLASS}
                  disabled={exporting}
                  aria-label="Download character"
                  title="Download character"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem
                  className="gap-2 text-xs"
                  disabled={exporting}
                  onSelect={() => void handleExportPdf()}
                >
                  <FileDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  D&amp;D Character Sheet PDF
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 text-xs">
                    <FileJson className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    JSON
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="text-xs">
                    <DropdownMenuItem
                      className="gap-2 text-xs"
                      onSelect={() => exportCharacter()}
                    >
                      <FileDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Download Builder JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-xs text-muted-foreground"
                      disabled={!FOUNDRY_JSON_UI_ENABLED}
                      title={FOUNDRY_DISABLED_TITLE}
                    >
                      <FileDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Download Foundry VTT JSON
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={ICON_BUTTON_CLASS}
                  disabled={importingBuilder}
                  aria-label="Import character"
                  title="Import character"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem
                  className="gap-2 text-xs"
                  disabled={importingBuilder}
                  onSelect={() => builderFileInputRef.current?.click()}
                >
                  <FileJson className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Builder JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-xs text-muted-foreground"
                  disabled={!FOUNDRY_JSON_UI_ENABLED}
                  title={FOUNDRY_DISABLED_TITLE}
                >
                  <FileJson className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Foundry VTT JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <input
              ref={builderFileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleBuilderFileSelected}
              aria-hidden
            />

            <Separator orientation="vertical" className="mx-0.5 h-4" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={ICON_BUTTON_CLASS}
                  onClick={() => {
                    if (buildHasStarted) setPendingConfirm({ kind: "reset" });
                    else {
                      clearHighlight();
                      resetBuild();
                    }
                  }}
                  aria-label="Reset character"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Reset character</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={ICON_BUTTON_CLASS}
                  disabled={!canRandomize || isRandomizing}
                  onClick={() => {
                    if (buildHasStarted)
                      setPendingConfirm({ kind: "randomize" });
                    else {
                      clearHighlight();
                      void randomize();
                    }
                  }}
                  aria-label="Randomize character"
                >
                  <Dices
                    className={cn(
                      "h-3.5 w-3.5",
                      isRandomizing && "animate-spin",
                    )}
                    aria-hidden
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Randomize character</TooltipContent>
            </Tooltip>
          </div>
        }
      >
        <div className="space-y-4">
          {/* ─── Identity ─── */}
          <section className="space-y-2.5">
            <SectionHeading>Identity</SectionHeading>
            <div className="space-y-1">
              <FieldLabel htmlFor="character-name">Name</FieldLabel>
              <Input
                id="character-name"
                type="text"
                value={character.name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Character name"
                className="h-8 text-xs"
                aria-label="Character name"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <FieldLabel htmlFor="character-size">Size</FieldLabel>
                <Select
                  id="character-size"
                  value={character.size === "S" ? "S" : "M"}
                  onChange={(e) => setCreatureSize(e.target.value as "M" | "S")}
                  className="h-8 w-full px-2 text-xs"
                  aria-label="Creature size"
                >
                  <option value="M">Medium</option>
                  <option value="S">Small</option>
                </Select>
              </div>
              <div className="space-y-1">
                <FieldLabel>
                  {multiclassEnabled ? "Total level" : "Level"}
                </FieldLabel>
                <div className="flex h-8 items-center">
                  <NumberStepper
                    value={character.level}
                    min={1}
                    max={20}
                    onChange={handleLevelChange}
                    ariaLabel="Level"
                    disabled={multiclassEnabled}
                    title={
                      multiclassEnabled
                        ? "Adjust levels in the multiclass section below"
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          <AbilityScoresSection compact />

          <Separator className="my-4" />

          {/* ─── Alignment ─── */}
          <section className="space-y-2">
            <SectionHeading>Alignment: {alignmentLabel}</SectionHeading>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <FieldLabel htmlFor="alignment-law-chaos">
                  Law / Chaos
                </FieldLabel>
                <Select
                  id="alignment-law-chaos"
                  value={lawChaos}
                  onChange={(e) =>
                    setLawChaosAlignment(e.target.value as "L" | "N" | "C")
                  }
                  className="h-8 w-full px-2 text-xs"
                  aria-label="Lawful, neutral, or chaotic alignment"
                >
                  <option value="L">Lawful</option>
                  <option value="N">Neutral</option>
                  <option value="C">Chaotic</option>
                </Select>
              </div>
              <div className="space-y-1">
                <FieldLabel htmlFor="alignment-good-evil">
                  Good / Evil
                </FieldLabel>
                <Select
                  id="alignment-good-evil"
                  value={goodEvil}
                  onChange={(e) =>
                    setGoodEvilAlignment(e.target.value as "G" | "N" | "E")
                  }
                  className="h-8 w-full px-2 text-xs"
                  aria-label="Good, neutral, or evil alignment"
                >
                  <option value="G">Good</option>
                  <option value="N">Neutral</option>
                  <option value="E">Evil</option>
                </Select>
              </div>
            </div>
          </section>

          {/* ─── Class progression ─── */}
          <section className="space-y-2">
            <SectionHeading>Class progression</SectionHeading>
            <div className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2">
              <Checkbox
                id="multiclass-toggle"
                checked={multiclassEnabled}
                onCheckedChange={(checked) =>
                  handleMulticlassToggle(checked === true)
                }
                className="mt-0.5 h-3.5 w-3.5"
                aria-label="Activate multiclass"
              />
              <div className="min-w-0 space-y-0.5">
                <Label
                  htmlFor="multiclass-toggle"
                  className="cursor-pointer text-xs font-medium text-foreground"
                >
                  Multiclass
                </Label>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  Split your total level across two or more classes (D&amp;D 5e
                  rules).
                </p>
              </div>
            </div>
            <MulticlassPanel />
          </section>

          {(highlightActive && issues.length > 0) ||
          exportError ||
          builderExportError ||
          importingBuilder ||
          builderImportError ||
          builderImportSummary ? (
            <div className="space-y-1.5">
              {highlightActive && issues.length > 0 && (
                <CompletenessHighlightBanner
                  issues={issues}
                  onIssueClick={handleIssueClick}
                />
              )}
              {exportError && (
                <p className="text-[11px] text-destructive">{exportError}</p>
              )}
              {builderExportError && (
                <p className="text-[11px] text-destructive">
                  {builderExportError}
                </p>
              )}
              {importingBuilder && (
                <p className="text-[11px] text-muted-foreground">
                  Importing Builder JSON…
                </p>
              )}
              {builderImportError && (
                <p className="text-[11px] text-destructive">
                  {builderImportError}
                </p>
              )}
              {builderImportSummary && (
                <div className="space-y-1 rounded border border-border bg-muted/40 p-2 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      Loaded: {builderImportSummary.name}
                      {builderImportSummary.className &&
                        ` · ${builderImportSummary.className}`}
                      {builderImportSummary.speciesName &&
                        ` · ${builderImportSummary.speciesName}`}
                      {` · Lv ${builderImportSummary.level}`}
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground underline-offset-2 hover:underline"
                      onClick={clearBuilderImport}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </BuilderPanel>

      {confirmCopy && (
        <ConfirmActionDialog
          open={pendingConfirm !== null}
          onOpenChange={(open) => {
            if (!open) setPendingConfirm(null);
          }}
          title={confirmCopy.title}
          description={confirmCopy.description}
          lossItems={
            "lossItems" in confirmCopy ? confirmCopy.lossItems : undefined
          }
          confirmLabel={confirmCopy.confirmLabel}
          onConfirm={runPendingConfirm}
        />
      )}
    </TooltipProvider>
  );
}
