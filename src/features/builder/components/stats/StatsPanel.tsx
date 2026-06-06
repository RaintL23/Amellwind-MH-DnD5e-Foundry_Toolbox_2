import { User } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { AbilityScoresSection } from "./AbilityScoresSection";
import { BuilderPanel } from "../shared/BuilderPanel";
import { NumberStepper } from "../shared/NumberStepper";

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
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Level</span>
        <NumberStepper
          value={character.level}
          min={1}
          max={20}
          onChange={setLevel}
          ariaLabel="Level"
        />
      </div>

      <AbilityScoresSection compact />
    </BuilderPanel>
  );
}
