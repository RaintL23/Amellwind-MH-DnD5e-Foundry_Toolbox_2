import { useCallback, useState } from "react";
import { formatModifier } from "@/shared/utils/cr.utils";
import { SKILL_ORDER } from "../utils/check-modifiers.utils";
import type { AbilityKey } from "@/shared/types";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useCharacterArmorClass } from "./useCharacterArmorClass";
import { useCharacterHitPoints } from "./useCharacterHitPoints";
import { useCharacterSpeed } from "./useCharacterSpeed";
import { useSpellcasting } from "./useSpellcasting";
import { useSelectedClass } from "./useSelectedClass";
import { useSelectedSubclass } from "./useSelectedSubclass";
import { useOptionalFeatureSpellGrants } from "./useOptionalFeatureSpellGrants";
import { useSpellCatalog } from "./useSpellCatalog";
import { getXpForLevel } from "../utils/xp-by-level.utils";
import { getAttunementInfo } from "../utils/attunement.utils";
import {
  downloadPdf,
  exportCharacterSheetPdf,
} from "../services/character-sheet-export.service";
import type { CharacterSheetExportData } from "../utils/character-sheet-export.types";
import { BACKGROUND_FACTION_LABELS } from "@/shared/types";

function formatAbilityExport(
  character: ReturnType<typeof useCharacterBuilder>["character"],
  key: AbilityKey,
) {
  return {
    score: character.abilities[key],
    mod: formatModifier(character.getModifier(key)),
  };
}

export function useCharacterSheetExport() {
  const builder = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const subclassData = useSelectedSubclass();
  const hitPoints = useCharacterHitPoints();
  const armorClass = useCharacterArmorClass();
  const speed = useCharacterSpeed();
  const { allSpells } = useSpellCatalog();
  const optionalFeatureSpellGrants = useOptionalFeatureSpellGrants(
    builder.optionalFeatureSelections ?? {},
    builder.character.level,
  );
  const spellcasting = useSpellcasting(
    classData,
    subclassData,
    builder.character.level,
    builder.character.abilities,
    builder.spellSelections ?? {},
    builder.optionalFeatureSelections ?? {},
    optionalFeatureSpellGrants,
    builder.faction,
  );
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildExportData = useCallback((): CharacterSheetExportData => {
    const { character } = builder;
    const attunement = getAttunementInfo(builder.class?.name, character.level);

    const weapons = [];
    if (builder.mainHand) {
      const combat = builder.combat?.mainHand;
      weapons.push({
        name: builder.mainHand.weapon.name,
        attackBonus: combat ? formatModifier(combat.attackBonus) : "",
        damage: combat?.diceExpression ?? "",
      });
    }

    const spellList = Object.values(builder.spellSelections ?? {})
      .flat()
      .map((selection) => {
        const spell = allSpells.find((s) => s.id === selection.id);
        return {
          name: selection.name,
          level: selection.level,
          range: spell?.range,
          castingTime: spell?.castingTime,
          notes: [
            spell?.isConcentration ? "C" : null,
            spell?.isRitual ? "R" : null,
          ]
            .filter(Boolean)
            .join(", "),
        };
      });

    const feats = [
      builder.speciesOriginFeat?.name,
      builder.backgroundOriginFeat?.name,
      ...builder.featSelections.map((f) => f?.name).filter(Boolean),
    ].filter(Boolean) as string[];

    const equipmentLines = [
      builder.mainHand?.weapon.name,
      builder.offHand?.weapon.name,
      builder.armor?.armor.name,
      builder.trinket1?.name,
      builder.trinket2?.name,
    ].filter(Boolean);

    const abilityNameMap: Record<string, AbilityKey> = {
      strength: "str",
      dexterity: "dex",
      constitution: "con",
      intelligence: "int",
      wisdom: "wis",
      charisma: "cha",
    };
    const spellKey = spellcasting.spellcastingAbility
      ? abilityNameMap[spellcasting.spellcastingAbility.toLowerCase()] ?? null
      : null;
    const spellMod = spellKey ? character.getModifier(spellKey) : 0;
    const prof = character.getProficiencyBonus();

    const savingThrows: Record<string, string> = {};
    for (const key of ["str", "dex", "con", "int", "wis", "cha"] as const) {
      savingThrows[key.toUpperCase()] = formatModifier(
        character.getSavingThrowModifier(key),
      );
    }

    const skills: Record<string, string> = {};
    for (const skill of SKILL_ORDER) {
      skills[skill] = formatModifier(character.getSkillModifier(skill));
    }

    return {
      name: character.name,
      species: builder.species?.name ?? "",
      background: [
        builder.background?.name,
        builder.faction ? BACKGROUND_FACTION_LABELS[builder.faction] : null,
      ]
        .filter(Boolean)
        .join(" · "),
      className: builder.class?.name ?? "",
      subclass: builder.subclass?.name ?? "",
      level: character.level,
      xp: getXpForLevel(character.level),
      size: character.size === "S" ? "S" : "M",
      speed: speed.display,
      initiative: formatModifier(character.getModifier("dex")),
      passivePerception: character.getPassiveScore("prc"),
      proficiencyBonus: prof,
      armorClass: armorClass.total,
      maxHp: hitPoints?.max ?? 0,
      hitDice: hitPoints?.hitDice ?? "",
      abilities: {
        str: formatAbilityExport(character, "str"),
        dex: formatAbilityExport(character, "dex"),
        con: formatAbilityExport(character, "con"),
        int: formatAbilityExport(character, "int"),
        wis: formatAbilityExport(character, "wis"),
        cha: formatAbilityExport(character, "cha"),
      },
      savingThrows,
      skills,
      languages: builder.resolvedLanguageItems.join(", "),
      weaponProficiencies: builder.resolvedWeaponItems.join(", "),
      armorProficiencies: builder.resolvedArmorItems.join(", "),
      toolProficiencies: builder.resolvedToolItems.join(", "),
      feats: feats.join("\n"),
      classFeatures: classData?.name ?? "",
      speciesTraits: builder.speciesData?.name ?? "",
      equipment: equipmentLines.join("\n"),
      attunementSlots: Array.from(
        { length: attunement.attunementSlots },
        (_, i) => `Slot ${i + 1}`,
      ),
      weapons,
      spells: spellList,
      spellcastingAbility: spellcasting.spellcastingAbility ?? undefined,
      spellSaveDc:
        spellKey !== null ? String(8 + prof + spellMod) : undefined,
      spellAttackBonus:
        spellKey !== null ? formatModifier(prof + spellMod) : undefined,
      personality: {
        ...builder.personality,
        notes: builder.backstoryNotes,
      },
    };
  }, [
    allSpells,
    armorClass.total,
    builder,
    classData?.name,
    hitPoints,
    speed.display,
    spellcasting.spellcastingAbility,
  ]);

  const exportSheet = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const data = buildExportData();
      const bytes = await exportCharacterSheetPdf(data);
      const safeName = data.name.trim() || "character";
      downloadPdf(bytes, `${safeName}-sheet.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [buildExportData]);

  return { exportSheet, exporting, error };
}
