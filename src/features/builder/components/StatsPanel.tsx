import { User } from "lucide-react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { AbilityScoresSection } from "./AbilityScoresSection";
import { BuilderPanel } from "./BuilderPanel";

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
          <input
            type="number"
            min={1}
            max={20}
            value={character.level}
            onChange={(e) => setLevel(parseInt(e.target.value, 10) || 1)}
            className="w-full rounded-md border border-border bg-muted/30 px-2 py-1 text-center text-base font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <AbilityScoresSection compact />
    </BuilderPanel>
  );
}
