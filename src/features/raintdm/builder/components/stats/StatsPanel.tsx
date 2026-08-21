import { useRef, type ChangeEvent } from "react";
import {
  ChevronDown,
  Dices,
  FileDown,
  FileJson,
  FileUp,
  RotateCcw,
  User,
} from "lucide-react";
import { useCharacterSheetExport } from "../../hooks/useCharacterSheetExport";
import { useBuilderCharacterExport } from "../../hooks/useBuilderCharacterExport";
import { useBuilderCharacterImport } from "../../hooks/useBuilderCharacterImport";
import { useBuildCompleteness } from "../../context/BuildCompletenessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useCharacterRandomizer } from "../../hooks/useCharacterRandomizer";
import { parseAlignmentAxes } from "../../utils/alignment.utils";
import { AbilityScoresSection } from "./ability-scores/AbilityScoresSection";
import { BuilderPanel } from "../shared/BuilderPanel";
import { CompletenessHighlightBanner } from "../shared/CompletenessHighlightBanner";
import { MulticlassPanel } from "./MulticlassPanel";
import { NumberStepper } from "../shared";

// Set to true to re-enable Foundry VTT JSON export/import once the exporter is ready.
const FOUNDRY_JSON_UI_ENABLED = false;

const ICON_BUTTON_CLASS = "h-6 w-6 shrink-0";
const FOUNDRY_DISABLED_TITLE =
  "Temporarily unavailable while the Foundry exporter is being improved";

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
  } = useBuildCompleteness();
  const { lawChaos, goodEvil } = parseAlignmentAxes(character.alignment);

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

  return (
    <BuilderPanel
      title={
        <>
          <User className="h-3.5 w-3.5" aria-hidden /> Character
        </>
      }
    >
      <div className="mb-3 space-y-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto min-w-0 flex-1 gap-1.5 px-2 py-1.5 text-[10px] leading-tight"
            onClick={() => void handleExportPdf()}
            disabled={exporting}
            aria-label="Download Character Sheet 2024 PDF"
          >
            <FileDown className="h-3 w-3 shrink-0" aria-hidden />
            Character Sheet 2024 PDF
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-auto min-w-0 flex-1 gap-1.5 px-2 py-1.5 text-[10px] leading-tight"
                disabled={importingBuilder}
                title="Builder JSON / Foundry VTT JSON"
                aria-label="JSON export and import options"
              >
                <FileJson className="h-3 w-3 shrink-0" aria-hidden />
                JSON
                <ChevronDown className="h-3 w-3 shrink-0" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem
                className="gap-2 text-xs"
                onSelect={() => exportCharacter()}
              >
                <FileDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Download Builder JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-xs"
                onSelect={() => builderFileInputRef.current?.click()}
                disabled={importingBuilder}
              >
                <FileUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Upload Builder JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-xs text-muted-foreground"
                disabled={!FOUNDRY_JSON_UI_ENABLED}
                title={FOUNDRY_DISABLED_TITLE}
              >
                <FileDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Download Foundry VTT JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-xs text-muted-foreground"
                disabled={!FOUNDRY_JSON_UI_ENABLED}
                title={FOUNDRY_DISABLED_TITLE}
              >
                <FileUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Upload Foundry VTT JSON
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
        </div>
        {highlightActive && issues.length > 0 && (
          <CompletenessHighlightBanner issues={issues} />
        )}
        {exportError && (
          <p className="text-[10px] text-destructive">{exportError}</p>
        )}
        {builderExportError && (
          <p className="text-[10px] text-destructive">{builderExportError}</p>
        )}
        {importingBuilder && (
          <p className="text-[10px] text-muted-foreground">
            Importing Builder JSON…
          </p>
        )}
        {builderImportError && (
          <p className="text-[10px] text-destructive">{builderImportError}</p>
        )}
        {builderImportSummary && (
          <div className="space-y-1 rounded border border-border bg-muted/40 p-2 text-[10px]">
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
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-[10px] text-muted-foreground">Name</span>
            <Input
              type="text"
              value={character.name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character name"
              className="h-7 text-xs"
              aria-label="Character name"
            />
          </div>
          <div className="shrink-0 space-y-1">
            <span className="text-[10px] text-muted-foreground">Size</span>
            <Select
              value={character.size === "S" ? "S" : "M"}
              onChange={(e) => setCreatureSize(e.target.value as "M" | "S")}
              className="h-7 w-[5.5rem] px-2 text-xs"
              aria-label="Creature size"
            >
              <option value="M">Medium</option>
              <option value="S">Small</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground">Alignment</span>
          <div className="flex gap-2">
            <Select
              value={lawChaos}
              onChange={(e) =>
                setLawChaosAlignment(e.target.value as "L" | "N" | "C")
              }
              className="h-7 min-w-0 flex-1 px-2 text-xs"
              aria-label="Lawful, neutral, or chaotic alignment"
            >
              <option value="C">Chaotic</option>
              <option value="N">Neutral</option>
              <option value="L">Lawful</option>
            </Select>
            <Select
              value={goodEvil}
              onChange={(e) =>
                setGoodEvilAlignment(e.target.value as "G" | "N" | "E")
              }
              className="h-7 min-w-0 flex-1 px-2 text-xs"
              aria-label="Good, neutral, or evil alignment"
            >
              <option value="E">Evil</option>
              <option value="N">Neutral</option>
              <option value="G">Good</option>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {multiclassEnabled ? "Total Level" : "Level"}
          </span>
          <NumberStepper
            value={character.level}
            min={1}
            max={20}
            onChange={setLevel}
            ariaLabel="Level"
            disabled={multiclassEnabled}
          />
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="multiclass-toggle"
              checked={multiclassEnabled}
              onCheckedChange={(checked) =>
                setMulticlassEnabled(checked === true)
              }
              className="h-3.5 w-3.5"
              aria-label="Activate multiclass"
            />
            <Label
              htmlFor="multiclass-toggle"
              className="cursor-pointer text-[10px] font-normal text-muted-foreground"
            >
              Multiclass
            </Label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={ICON_BUTTON_CLASS}
            onClick={() => {
              clearHighlight();
              resetBuild();
            }}
            title="Reset character"
            aria-label="Reset character"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={ICON_BUTTON_CLASS}
            disabled={!canRandomize || isRandomizing}
            onClick={() => {
              clearHighlight();
              void randomize();
            }}
            title="Randomize character"
            aria-label="Randomize character"
          >
            <Dices
              className={cn("h-3 w-3", isRandomizing && "animate-spin")}
              aria-hidden
            />
          </Button>
        </div>
        <MulticlassPanel />
      </div>

      <AbilityScoresSection compact />
    </BuilderPanel>
  );
}
