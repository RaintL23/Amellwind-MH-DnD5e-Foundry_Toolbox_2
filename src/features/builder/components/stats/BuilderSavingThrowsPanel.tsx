import { formatModifier } from "@/shared/utils/cr.utils";
import { ABILITY_LABELS } from "@/shared/types";
import { ShieldCheck } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { ABILITY_ORDER } from "../../utils/check-modifiers.utils";
import { BuilderPanel } from "../shared/BuilderPanel";
import { BuilderStatRow } from "./BuilderStatRow";

export function BuilderSavingThrowsPanel() {
  const { character } = useCharacterBuilder();

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
          return (
            <BuilderStatRow
              key={ability}
              label={ABILITY_LABELS[ability]}
              value={formatModifier(character.getSavingThrowModifier(ability))}
              proficient={proficient}
            />
          );
        })}
      </div>
    </BuilderPanel>
  );
}
