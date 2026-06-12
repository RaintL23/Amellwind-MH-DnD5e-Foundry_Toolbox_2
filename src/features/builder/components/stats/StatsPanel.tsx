import { Dices, FileDown, RotateCcw, User } from "lucide-react";
import { useCharacterSheetExport } from "../../hooks/useCharacterSheetExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { parseAlignmentAxes } from "../../utils/alignment.utils";
import { AbilityScoresSection } from "./AbilityScoresSection";
import { BuilderPanel } from "../shared/BuilderPanel";
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
  } = useCharacterBuilder();
  const { exportSheet, exporting, error: exportError } =
    useCharacterSheetExport();
  const { lawChaos, goodEvil } = parseAlignmentAxes(character.alignment);

  return (
    <BuilderPanel
      title={
        <>
          <User className="h-3.5 w-3.5" aria-hidden /> Character
        </>
      }
    >
      <div className="mb-3 space-y-2">
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
          <span className="text-[10px] text-muted-foreground">Level</span>
          <NumberStepper
            value={character.level}
            min={1}
            max={20}
            onChange={setLevel}
            ariaLabel="Level"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={ICON_BUTTON_CLASS}
            onClick={resetBuild}
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
            disabled
            title="Generate random (coming soon)"
            aria-label="Generate random (coming soon)"
          >
            <Dices className="h-3 w-3" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={ICON_BUTTON_CLASS}
            onClick={() => void exportSheet()}
            disabled={exporting}
            title="Export D&D 2024 character sheet (PDF)"
            aria-label="Export D&D 2024 character sheet"
          >
            <FileDown className="h-3 w-3" aria-hidden />
          </Button>
        </div>
        {exportError && (
          <p className="text-[10px] text-destructive">{exportError}</p>
        )}
      </div>

      <AbilityScoresSection compact />
    </BuilderPanel>
  );
}
