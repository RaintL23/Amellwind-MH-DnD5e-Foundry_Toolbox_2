import { Dices, FileDown, FileJson, RotateCcw, User } from "lucide-react";
import { useCharacterSheetExport } from "../../hooks/useCharacterSheetExport";
import { useBuildCompleteness } from "../../context/BuildCompletenessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useCharacterRandomizer } from "../../hooks/useCharacterRandomizer";
import { parseAlignmentAxes } from "../../utils/alignment.utils";
import { AbilityScoresSection } from "./ability-scores/AbilityScoresSection";
import { BuilderPanel } from "../shared/BuilderPanel";
import { CompletenessHighlightBanner } from "../shared/CompletenessHighlightBanner";
import { MulticlassPanel } from "./MulticlassPanel";
import { NumberStepper } from "../shared/NumberStepper";

const ICON_BUTTON_CLASS = "h-6 w-6 shrink-0";

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
    useAmellwindHomebrew,
  } = useCharacterBuilder();
  const { randomize, isRandomizing, canRandomize } = useCharacterRandomizer();
  const { exportSheet, exporting, error: exportError } =
    useCharacterSheetExport();
  const { evaluate, activateHighlight, clearHighlight, highlightActive, issues } =
    useBuildCompleteness();
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto min-w-0 flex-1 gap-1.5 px-2 py-1.5 text-[10px] leading-tight"
            disabled
            title="Foundry VTT export (coming soon)"
            aria-label="Download Foundry VTT JSON (coming soon)"
          >
            <FileJson className="h-3 w-3 shrink-0" aria-hidden />
            Foundry VTT JSON
          </Button>
        </div>
        {highlightActive && issues.length > 0 && (
          <CompletenessHighlightBanner issues={issues} />
        )}
        {exportError && (
          <p className="text-[10px] text-destructive">{exportError}</p>
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
          <label className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground">
            <input
              type="checkbox"
              checked={multiclassEnabled}
              onChange={(e) => setMulticlassEnabled(e.target.checked)}
              className="h-3 w-3 rounded border-border"
              aria-label="Activar multiclase"
            />
            Multiclase
          </label>
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
            title={
              useAmellwindHomebrew
                ? "Random only available in D&D mode"
                : "Randomize character"
            }
            aria-label={
              useAmellwindHomebrew
                ? "Random only available in D&D mode"
                : "Randomize character"
            }
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
