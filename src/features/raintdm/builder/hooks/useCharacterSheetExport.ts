import { useCallback, useState } from "react";
import { formatModifier, getAbilityModifier } from "@/shared/utils/cr.utils";
import { SKILL_ORDER, SKILL_LABELS, SKILL_ABILITY, ABILITY_KEYS } from "@/shared/constants/dnd";
import type { AbilityKey, AbilityScores, SkillKey } from "@/shared/types";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { useCharacterArmorClass } from "./useCharacterArmorClass";
import { useCharacterHitPoints } from "./useCharacterHitPoints";
import { useCharacterSpeed } from "./useCharacterSpeed";
import { useEffectiveAbilityScores } from "./useEffectiveAbilityScores";
import { useSpellcastingContext } from "../context/SpellcastingContext";
import { useSelectedClass, useSelectedSubclass } from "./useBuilderSelections";
import { useSpellCatalog } from "./useSpellCatalog";
import { computeSpellcastingAttackStats } from "../utils/spellcasting-stats.utils";
import {
  downloadPdf,
  exportCharacterSheetPdf,
} from "../services/character-sheet-export.service";
import type { CharacterSheetExportData } from "../utils/character-sheet-export.types";
import {
  buildFeatExportDescLookup,
  buildEquipmentExport,
  buildSpellListExport,
  buildWeaponsAndCantripsExport,
  formatFeatExportSection,
  formatGoldPiecesForPdf,
  getArmorTrainingProficiencies,
  getClassFeaturesExport,
  getSpeciesTraitsExport,
  getSpellSlotTotals,
  getXpForLevel,
  hasShieldEquipped,
  loadFeatExportLookups,
  sumInventoryGoldGp,
  type ExportTextSection,
  type OptionalFeatureDescMap,
} from "../utils/character-sheet-export.utils";
import { BACKGROUND_FACTION_LABELS } from "@/shared/types";
import { downloadCharacterImages } from "../utils/image-download.utils";
import { formatAlignmentLabel, parseAlignmentAxes } from "../utils/alignment.utils";

/** Generated sheet bytes plus the base name used for the PDF and images. */
export interface CharacterSheetPdfFile {
  bytes: Uint8Array;
  filenameBase: string;
}

function formatAbilityExport(scores: AbilityScores, key: AbilityKey) {
  return {
    score: scores[key],
    mod: formatModifier(getAbilityModifier(scores[key])),
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
  const { spellcasting } = useSpellcastingContext();
  const effectiveScores = useEffectiveAbilityScores();
  const [exporting, setExporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<CharacterSheetPdfFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildExportData = useCallback(
    (
      optDescMap: OptionalFeatureDescMap,
      featDescLookup: ReturnType<typeof buildFeatExportDescLookup>,
    ): CharacterSheetExportData => {
    const { character } = builder;
    const exportCharacter = character.withUpdates({ abilities: effectiveScores });

    const prof = character.getProficiencyBonus();
    const {
      spellSaveDc,
      spellAttackBonus,
      spellcastingMod,
    } = computeSpellcastingAttackStats(
      spellcasting.spellcastingAbility,
      prof,
      (key) => getAbilityModifier(effectiveScores[key]),
    );

    const combatMainHand = builder.combat?.mainHand;
    const unarmedWeaponSource = combatMainHand?.sources.find(
      (source) => source.type === "weapon",
    );

    const weapons = buildWeaponsAndCantripsExport({
      character: exportCharacter,
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

    const spellList = buildSpellListExport({
      spellSelections: builder.spellSelections ?? {},
      spellcasting,
      allSpells,
      characterLevel: character.level,
    });

    function formatSkillChoices(keys: SkillKey[]): string {
      return keys.map((k) => SKILL_LABELS[k] ?? k).join(", ");
    }

    const featLines: ExportTextSection[] = [];

    const originSkillText =
      builder.originFeatSkillChoices.length > 0
        ? `: ${formatSkillChoices(builder.originFeatSkillChoices)}`
        : "";

    function formatFeatLine(
      featName: string,
      featId: string,
      suffix: string,
    ): ExportTextSection {
      return formatFeatExportSection(featName, featId, suffix, featDescLookup);
    }

    if (builder.speciesOriginFeat) {
      const f = builder.speciesOriginFeat;
      featLines.push(formatFeatLine(f.name, f.id, ` [Origin Feat]${originSkillText}`));
    }
    if (builder.backgroundOriginFeat) {
      const f = builder.backgroundOriginFeat;
      const bgSkills = builder.speciesOriginFeat ? "" : originSkillText;
      featLines.push(formatFeatLine(f.name, f.id, ` [Origin Feat]${bgSkills}`));
    }
    builder.optionalFeatureOriginFeats.forEach((feat, idx) => {
      if (!feat) return;
      const choices = builder.optionalFeatureOriginFeatSkillChoices[idx] ?? [];
      const skillsText =
        choices.length > 0 ? `: ${formatSkillChoices(choices)}` : "";
      featLines.push(formatFeatLine(feat.name, feat.id, ` [Origin Feat]${skillsText}`));
    });
    builder.featSelections.forEach((feat, idx) => {
      if (!feat) return;
      const choices = builder.featSkillChoices[idx] ?? [];
      const suffix =
        choices.length > 0 ? `: ${formatSkillChoices(choices)}` : "";
      featLines.push(formatFeatLine(feat.name, feat.id, suffix));
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
      builder.optionalFeatureSelections ?? {},
      optDescMap,
    );

    const savingThrows: Record<string, string> = {};
    for (const key of ABILITY_KEYS) {
      const abilityMod = getAbilityModifier(effectiveScores[key]);
      const saveMod = character.isSavingThrowProficient(key)
        ? abilityMod + prof
        : abilityMod;
      savingThrows[key.toUpperCase()] = formatModifier(saveMod);
    }

    const skills: Record<string, string> = {};
    for (const skill of SKILL_ORDER) {
      const level = character.getSkillProficiencyLevel(skill);
      const skillMod =
        getAbilityModifier(effectiveScores[SKILL_ABILITY[skill]]) +
        level * prof;
      skills[skill] = formatModifier(skillMod);
    }

    const perceptionLevel = character.getSkillProficiencyLevel("prc");
    const perceptionMod =
      getAbilityModifier(effectiveScores[SKILL_ABILITY.prc]) +
      perceptionLevel * prof;

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
      initiative: formatModifier(getAbilityModifier(effectiveScores.dex)),
      passivePerception: 10 + perceptionMod,
      proficiencyBonus: prof,
      armorClass: armorClass.total,
      maxHp: hitPoints?.max ?? 0,
      hitDice: hitPoints?.hitDice ?? "",
      abilities: {
        str: formatAbilityExport(effectiveScores, "str"),
        dex: formatAbilityExport(effectiveScores, "dex"),
        con: formatAbilityExport(effectiveScores, "con"),
        int: formatAbilityExport(effectiveScores, "int"),
        wis: formatAbilityExport(effectiveScores, "wis"),
        cha: formatAbilityExport(effectiveScores, "cha"),
      },
      savingThrows,
      skills,
      languages: builder.resolvedLanguageItems.join(", "),
      weaponProficiencies: builder.resolvedWeaponItems.join(", "),
      armorTrainingProficiencies: getArmorTrainingProficiencies(
        builder.resolvedArmorItems,
      ),
      toolProficiencies: builder.resolvedToolItems.join(", "),
      feats: featLines,
      classFeatures,
      speciesTraits: getSpeciesTraitsExport(
        builder.speciesData,
        builder.speciesTraitChoices ?? {},
      ),
      equipment: buildEquipmentExport({
        items: inventory.items,
        mainHandName: builder.mainHand?.weapon.name,
        offHandName: builder.offHand?.weapon.name,
        armorName: builder.armor?.armor.name,
        shieldName: builder.equippedShield?.name,
        trinket1Name: builder.trinket1?.name,
        trinket2Name: builder.trinket2?.name,
      }),
      weapons,
      spells: spellList,
      spellcastingAbility: spellcasting.spellcastingAbility ?? undefined,
      spellcastingMod,
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
      alignment: (() => {
        const axes = parseAlignmentAxes(character.alignment);
        return formatAlignmentLabel(axes.lawChaos, axes.goodEvil);
      })(),
      goldPieces: formatGoldPiecesForPdf(sumInventoryGoldGp(inventory.items)),
      personality: {
        ...builder.personality,
        notes: builder.backstoryNotes,
      },
      skillProficiencies,
      saveProficiencies,
      portraitImage: builder.portraitImage,
    };
  }, [
    allSpells,
    armorClass.total,
    builder,
    classData,
    effectiveScores,
    hitPoints,
    inventory.items,
    inventory.weapons,
    spellcasting,
    subclassData,
    speed.display,
  ]);

  const generatePdf = useCallback(async (): Promise<CharacterSheetPdfFile> => {
    // Load catalogs needed to enrich descriptions in the PDF.
    const { optDescMap, featDescLookup } = await loadFeatExportLookups();

    const data = buildExportData(optDescMap, featDescLookup);
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
    return { bytes, filenameBase: filenameParts.join("_") };
  }, [buildExportData]);

  const downloadFile = useCallback(
    (file: CharacterSheetPdfFile) => {
      downloadPdf(file.bytes, `${file.filenameBase}.pdf`);
      downloadCharacterImages(file.filenameBase, builder.portraitImage, builder.tokenImage);
    },
    [builder.portraitImage, builder.tokenImage],
  );

  const exportSheet = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      downloadFile(await generatePdf());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [downloadFile, generatePdf]);

  /**
   * Generates the same PDF as `exportSheet` and keeps it for the preview
   * dialog. Resolves to false when generation failed (error is set).
   */
  const previewSheet = useCallback(async (): Promise<boolean> => {
    setPreviewing(true);
    setError(null);
    try {
      setPreview(await generatePdf());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
      return false;
    } finally {
      setPreviewing(false);
    }
  }, [generatePdf]);

  /** Downloads the previewed file as-is (no regeneration). */
  const downloadPreview = useCallback(() => {
    if (preview) downloadFile(preview);
  }, [downloadFile, preview]);

  const closePreview = useCallback(() => setPreview(null), []);

  return {
    exportSheet,
    exporting,
    previewSheet,
    previewing,
    preview,
    downloadPreview,
    closePreview,
    error,
  };
}
