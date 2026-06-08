import { formatModifier } from "@/shared/utils/cr.utils";
import { ABILITY_LABELS } from "@/shared/types";
import { ShieldCheck } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { ABILITY_ORDER } from "../../utils/check-modifiers.utils";
import { BuilderPanel } from "../shared/BuilderPanel";
import { BuilderStatRow } from "./BuilderStatRow";

const ABILITY_FULL: Record<string, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export function BuilderSavingThrowsPanel() {
  const { character, saveProficiencyAbilities } = useCharacterBuilder();

  return (
    <BuilderPanel
      title={
        <>
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Saving Throws
        </>
      }
    >
      <div className="space-y-0">
        {ABILITY_ORDER.map((ability) => {
          const proficient = character.isSavingThrowProficient(ability);
          const tooltip = proficient
            ? `Proficient (${ABILITY_FULL[ability]})`
            : undefined;
          return (
            <BuilderStatRow
              key={ability}
              label={ABILITY_LABELS[ability]}
              value={formatModifier(character.getSavingThrowModifier(ability))}
              proficient={proficient}
              sourcesTooltip={tooltip}
            />
          );
        })}
      </div>
      {saveProficiencyAbilities.length === 0 && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Select a class to see proficiencies.
        </p>
      )}
    </BuilderPanel>
  );
}
