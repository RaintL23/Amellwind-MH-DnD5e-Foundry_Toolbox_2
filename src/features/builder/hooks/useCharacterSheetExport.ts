import { useCallback, useState } from "react";
import { formatModifier } from "@/shared/utils/cr.utils";
import { SKILL_ORDER, SKILL_LABELS } from "../utils/check-modifiers.utils";
import type { AbilityKey, SkillKey } from "@/shared/types";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { useCharacterArmorClass } from "./useCharacterArmorClass";
import { useCharacterHitPoints } from "./useCharacterHitPoints";
import { useCharacterSpeed } from "./useCharacterSpeed";
import { useSpellcasting } from "./useSpellcasting";
import { useSelectedClass, useSelectedSubclass } from "./useBuilderSelections";
import { useOptionalFeatureSpellGrants } from "./useOptionalFeatureSpellGrants";
import { useCantripPools } from "./useCantripPools";
import { useSpellCatalog } from "./useSpellCatalog";
import { getAttunementInfo } from "../utils/attunement.utils";
import {
  downloadPdf,
  exportCharacterSheetPdf,
} from "../services/character-sheet-export.service";
import type { CharacterSheetExportData } from "../utils/character-sheet-export.types";
import {
  buildEquipmentExport,
  buildWeaponsAndCantripsExport,
  formatGoldPiecesForPdf,
  getAlignmentCheckboxField,
  getClassFeaturesExport,
  getSpeciesTraitsExport,
  getSpellSlotTotals,
  hasShieldEquipped,
  sumInventoryGoldGp,
} from "../utils/character-sheet-export.utils";
import { BACKGROUND_FACTION_LABELS } from "@/shared/types";

/** Minimum XP to reach each character level (D&D 2024). */
const XP_BY_LEVEL: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

function getXpForLevel(level: number): number {
  return XP_BY_LEVEL[Math.max(1, Math.min(20, level))] ?? 0;
}

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
  const inventory = useBuilderInventory();
  const { classData } = useSelectedClass();
  const subclassData = useSelectedSubclass();
  const hitPoints = useCharacterHitPoints();
  const armorClass = useCharacterArmorClass();
  const speed = useCharacterSpeed();
  const { allSpells } = useSpellCatalog();
  const optionalFeatureSpellGrants = useOptionalFeatureSpellGrants(
    builder.optionalFeatureSelections ?? {},
    builder.character.level,
    classData,
    subclassData,
  );
  const { bonusPools: bonusCantripPools } = useCantripPools(
    builder.optionalFeatureSelections ?? {},
    classData,
    subclassData,
    builder.character.level,
    {
      speciesOriginFeat: builder.speciesOriginFeat,
      backgroundOriginFeat: builder.backgroundOriginFeat,
      speciesOriginFeatGrant: builder.speciesOriginFeatGrant,
      backgroundOriginFeatGrant: builder.backgroundOriginFeatGrant,
      featSelections: builder.featSelections,
    },
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
    builder.character.level,
    undefined,
    bonusCantripPools,
  );
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildExportData = useCallback((): CharacterSheetExportData => {
    const { character } = builder;
    const attunement = getAttunementInfo(builder.class?.name, character.level);

    const abilityNameMap: Record<string, AbilityKey> = {
      strength: "str",
      dexterity: "dex",
      constitution: "con",
      intelligence: "int",
      wisdom: "wis",
      charisma: "cha",
    };
    const spellKey = spellcasting.spellcastingAbility
      ? (abilityNameMap[spellcasting.spellcastingAbility.toLowerCase()] ?? null)
      : null;
    const spellMod = spellKey ? character.getModifier(spellKey) : 0;
    const prof = character.getProficiencyBonus();
    const spellSaveDc =
      spellKey !== null ? String(8 + prof + spellMod) : undefined;
    const spellAttackBonus =
      spellKey !== null ? formatModifier(prof + spellMod) : undefined;

    const combatMainHand = builder.combat?.mainHand;
    const unarmedWeaponSource = combatMainHand?.sources.find(
      (source) => source.type === "weapon",
    );

    const weapons = buildWeaponsAndCantripsExport({
      character,
      mainHand: builder.mainHand,
      offHand: builder.offHand,
      inventoryWeapons: inventory.weapons,
      spellSelections: builder.spellSelections ?? {},
      spellcasting,
      allSpells,
      spellSaveDc,
      spellAttackBonus,
      useAmellwindHomebrew: builder.useAmellwindHomebrew,
      useUnarmedStrike: builder.useUnarmedStrike,
      combatMainHandLabel: unarmedWeaponSource?.source,
      combatMainHandBreakdown: builder.useUnarmedStrike ? combatMainHand : null,
    });

    const spellList = Object.values(builder.spellSelections ?? {})
      .flat()
      .map((selection) => {
        const spell = allSpells.find((s) => s.id === selection.id);
        const material = spell?.components.m ?? null;
        const hasCostlyMaterial =
          material !== null && /\d+\s*(?:gp|sp|cp|pp)/i.test(material);
        return {
          name: selection.name,
          level: selection.level,
          range: spell?.range,
          castingTime: spell?.castingTime,
          isConcentration: spell?.isConcentration ?? false,
          isRitual: spell?.isRitual ?? false,
          hasMaterial: material !== null,
          materialNotes: hasCostlyMaterial ? material : undefined,
        };
      });

    function formatSkillChoices(keys: SkillKey[]): string {
      return keys.map((k) => SKILL_LABELS[k] ?? k).join(", ");
    }

    const featLines: string[] = [];

    const originSkillText =
      builder.originFeatSkillChoices.length > 0
        ? `: ${formatSkillChoices(builder.originFeatSkillChoices)}`
        : "";

    if (builder.speciesOriginFeat) {
      featLines.push(
        `${builder.speciesOriginFeat.name} [Origin Feat]${originSkillText}`,
      );
    }
    if (builder.backgroundOriginFeat) {
      // If species already claimed the origin skill choices, don't repeat them
      const bgSkills = builder.speciesOriginFeat ? "" : originSkillText;
      featLines.push(
        `${builder.backgroundOriginFeat.name} [Origin Feat]${bgSkills}`,
      );
    }
    builder.optionalFeatureOriginFeats.forEach((feat, idx) => {
      if (!feat) return;
      const choices = builder.optionalFeatureOriginFeatSkillChoices[idx] ?? [];
      const skillsText =
        choices.length > 0 ? `: ${formatSkillChoices(choices)}` : "";
      featLines.push(`${feat.name} [Origin Feat]${skillsText}`);
    });
    builder.featSelections.forEach((feat, idx) => {
      if (!feat) return;
      const choices = builder.featSkillChoices[idx] ?? [];
      if (choices.length > 0) {
        featLines.push(`${feat.name}: ${formatSkillChoices(choices)}`);
      } else {
        featLines.push(feat.name);
      }
    });

    // Skill / save proficiency flags for PDF checkboxes
    const skillProficiencies: Partial<Record<SkillKey, boolean>> = {};
    for (const key of SKILL_ORDER) {
      if (
        (builder.skillSources[key]?.length ?? 0) > 0 ||
        builder.expertiseSources[key] !== undefined
      ) {
        skillProficiencies[key] = true;
      }
    }
    const saveProficiencies: Partial<Record<AbilityKey, boolean>> = {};
    for (const abilityKey of builder.saveProficiencyAbilities) {
      saveProficiencies[abilityKey] = true;
    }

    const classFeatures = getClassFeaturesExport(
      classData,
      subclassData,
      character.level,
    );

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
      feats: featLines.join("\n"),
      classFeatures: classFeatures.line1,
      classFeatures2: classFeatures.line2,
      speciesTraits: getSpeciesTraitsExport(builder.speciesData),
      equipment: buildEquipmentExport({
        items: inventory.items,
        mainHandName: builder.mainHand?.weapon.name,
        offHandName: builder.offHand?.weapon.name,
        armorName: builder.armor?.armor.name,
        shieldName: builder.equippedShield?.name,
        trinket1Name: builder.trinket1?.name,
        trinket2Name: builder.trinket2?.name,
      }),
      attunementSlots: Array.from(
        { length: attunement.attunementSlots },
        (_, i) => `Slot ${i + 1}`,
      ),
      weapons,
      spells: spellList,
      spellcastingAbility: spellcasting.spellcastingAbility ?? undefined,
      spellcastingMod: spellKey !== null ? formatModifier(spellMod) : undefined,
      spellSaveDc,
      spellAttackBonus,
      spellSlotTotals: getSpellSlotTotals(
        classData,
        subclassData,
        character.level,
        spellcasting,
      ),
      hasShield: hasShieldEquipped({
        equippedShield: builder.equippedShield,
        mainHand: builder.mainHand,
      }),
      alignmentCheckbox: getAlignmentCheckboxField(character.alignment),
      goldPieces: formatGoldPiecesForPdf(sumInventoryGoldGp(inventory.items)),
      personality: {
        ...builder.personality,
        notes: builder.backstoryNotes,
      },
      skillProficiencies,
      saveProficiencies,
    };
  }, [
    allSpells,
    armorClass.total,
    builder,
    classData,
    hitPoints,
    inventory.items,
    inventory.weapons,
    spellcasting,
    subclassData,
    speed.display,
  ]);

  const exportSheet = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const data = buildExportData();
      const bytes = await exportCharacterSheetPdf(data);
      const sanitize = (s: string) =>
        s
          .trim()
          .replace(/[\s/\\:*?"<>|]+/g, "_")
          .replace(/^_+|_+$/g, "");
      const filenameParts = [
        sanitize(data.name) || "Character",
        sanitize(data.species ?? ""),
        sanitize(data.className ?? ""),
        sanitize(data.subclass ?? ""),
        `Level${data.level}`,
      ].filter(Boolean);
      downloadPdf(bytes, `${filenameParts.join("_")}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [buildExportData]);

  return { exportSheet, exporting, error };
}
