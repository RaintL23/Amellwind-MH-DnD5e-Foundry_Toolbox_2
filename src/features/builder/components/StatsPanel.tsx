import { User } from "lucide-react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { AbilityScoresSection } from "./AbilityScoresSection";
import { BuilderPanel } from "./BuilderPanel";
import { NumberStepper } from "./NumberStepper";

export function StatsPanel() {
  const { character, setLevel } = useCharacterBuilder();

  return (
    <BuilderPanel
      title={
        <>
          <User className="h-3.5 w-3.5" aria-hidden /> Character
        </>
      }
    >
      <div className="mb-3 flex gap-1.5">
        <div className="flex-1">
          <label className="mb-0.5 block text-[10px] text-muted-foreground">
            Level
          </label>
          <NumberStepper
            value={character.level}
            min={1}
            max={20}
            onChange={setLevel}
            ariaLabel="Level"
            className="justify-center"
          />
        </div>
      </div>

      <AbilityScoresSection compact />
    </BuilderPanel>
  );
}
