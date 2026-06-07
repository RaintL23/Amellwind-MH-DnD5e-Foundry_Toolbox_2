import { Dices, RotateCcw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { AbilityScoresSection } from "./AbilityScoresSection";
import { BuilderPanel } from "../shared/BuilderPanel";
import { NumberStepper } from "../shared/NumberStepper";

const ICON_BUTTON_CLASS = "h-6 w-6 shrink-0";

export function StatsPanel() {
  const { character, setLevel, resetBuild } = useCharacterBuilder();

  return (
    <BuilderPanel
      title={
        <>
          <User className="h-3.5 w-3.5" aria-hidden /> Character
        </>
      }
    >
      <div className="mb-3 flex items-center gap-2">
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
      </div>

      <AbilityScoresSection compact />
    </BuilderPanel>
  );
}
