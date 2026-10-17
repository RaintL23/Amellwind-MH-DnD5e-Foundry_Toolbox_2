import { formatModifier, getAbilityModifier } from "@/shared/utils/cr.utils";
import { ABILITY_LABELS } from "@/shared/types";
import { ShieldCheck } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useEffectiveAbilityScores } from "../../hooks/useEffectiveAbilityScores";
import { useArmorRarityBonuses } from "../../hooks/useArmorRarityBonuses";
import { ABILITY_ORDER, ABILITY_NAMES } from "@/shared/constants/dnd";
import { BuilderPanel } from "../shared/BuilderPanel";
import { BuilderStatRow } from "./BuilderStatRow";

export function BuilderSavingThrowsPanel() {
  const { character, saveProficiencyAbilities, class: classRef } =
    useCharacterBuilder();
  const effectiveScores = useEffectiveAbilityScores();
  const proficiencyBonus = character.getProficiencyBonus();
  const armorBonuses = useArmorRarityBonuses();

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
          const abilityMod = getAbilityModifier(effectiveScores[ability]);
          const armorBonus = armorBonuses.saves[ability] ?? 0;
          const saveMod =
            (proficient ? abilityMod + proficiencyBonus : abilityMod) +
            armorBonus;
          const saveSources = proficient
            ? [
                {
                  type: "class" as const,
                  name: classRef?.name ?? "Class",
                },
              ]
            : undefined;
          const tooltip =
            [
              proficient ? `${ABILITY_NAMES[ability]} save` : null,
              armorBonus ? `Armor rarity property: +${armorBonus}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || undefined;
          return (
            <BuilderStatRow
              key={ability}
              label={ABILITY_LABELS[ability]}
              value={formatModifier(saveMod)}
              proficient={proficient}
              proficiencySources={saveSources}
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
