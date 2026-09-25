/**
 * Builds the read-only `provenance` block of a Builder JSON export: a
 * human-readable account of why the character has each class feature, feat,
 * optional feature, proficiency, defense, spell and equipped item. Pure — only
 * reads the live builder state; never used to restore a build.
 */
import type {
  AbilityKey,
  AbilityScores,
  BuilderFeatSelection,
  BuilderFeatSource,
  BuilderSpellSelection,
  DamageType,
  SkillKey,
} from "@/shared/types";
import type { ProficiencySource } from "@/shared/types/proficiency.types";
import { ABILITY_ABBREVIATIONS, SKILL_LABELS } from "@/shared/constants/dnd";
import { subclassesForClassVariant } from "@/features/dnd/classes/utils/class-subclass.utils";
import type { CharacterBuilderContextValue } from "../context/character-builder.types";
import { getFeatSlotLevels, getFeaturesUpToLevel } from "../utils/builder-class.utils";
import {
  buildClassLevelEntries,
  getFeatSlotLevelsForBuild,
} from "../utils/multiclass.utils";
import { resolveOptionalFeatureProgressions } from "../utils/class-optional-features.utils";
import {
  BONUS_CANTRIP_POOL_BASE,
  BONUS_FEAT_SPELL_POOL_BASE,
  type CantripPoolDefinition,
} from "../utils/cantrip-pools.utils";
import { PACT_SPELL_POOL_LEVEL } from "../utils/pact-magic.utils";
import { isSpeciesLineageSpell } from "../utils/species-spell-grants.utils";
import type { SubclassSpellGrant } from "../utils/subclass-spells.utils";
import type {
  BuilderCharacterProvenance,
  ProvenanceClassEntry,
  ProvenanceEquipment,
  ProvenanceFeat,
  ProvenanceGrant,
  ProvenanceSpell,
} from "./builder-character.types";

export interface BuildCharacterProvenanceInput {
  builder: CharacterBuilderContextValue;
  effectiveAbilities: AbilityScores;
  bonusSpellPools: CantripPoolDefinition[];
  optionalFeatureSpellGrants: SubclassSpellGrant[];
}

const FEAT_SOURCE_LABELS: Record<BuilderFeatSource, string> = {
  asi: "Ability Score Improvement",
  amellwind: "Amellwind",
  dnd2014: "D&D 2014",
  dnd2024: "D&D 2024",
};

const SOURCE_TYPE_LABELS: Record<ProficiencySource["type"], string> = {
  species: "Species",
  background: "Background",
  class: "Class",
  subclass: "Subclass",
  feat: "Feat",
  feature: "Feature",
};

function formatSource(source: ProficiencySource): string {
  return `${SOURCE_TYPE_LABELS[source.type] ?? source.type}: ${source.name}`;
}

function abbr(ability: AbilityKey): string {
  return ABILITY_ABBREVIATIONS[ability] ?? ability.toUpperCase();
}

function describeFeatAbilityChoices(feat: BuilderFeatSelection): string[] {
  const out: string[] = [];
  const asi = feat.asiChoices;
  if (asi?.mode === "plus2" && asi.plus2) out.push(`${abbr(asi.plus2)} +2`);
  if (asi?.mode === "plus1plus1") {
    for (const ability of [asi.plus1a, asi.plus1b]) {
      if (ability) out.push(`${abbr(ability)} +1`);
    }
  }
  for (const choice of feat.abilityIncreaseChoices ?? []) {
    if (choice.ability) out.push(`${abbr(choice.ability)} +${choice.amount}`);
  }
  return out;
}

function toProvenanceFeat(feat: BuilderFeatSelection, grantedBy: string): ProvenanceFeat {
  return {
    name: feat.name,
    source: FEAT_SOURCE_LABELS[feat.source] ?? feat.source,
    grantedBy,
    abilityChoices: describeFeatAbilityChoices(feat),
    spellList: feat.spellListClassChoice ?? null,
  };
}

function namedGrants(
  items: string[],
  sources: Partial<Record<string, ProficiencySource[]>>,
): ProvenanceGrant[] {
  return items.map((name) => ({
    name,
    grantedBy: (sources[name.toLowerCase()] ?? []).map(formatSource),
  }));
}

function describeSpellPool(
  poolLevel: number,
  selection: BuilderSpellSelection,
  pools: CantripPoolDefinition[],
  lineageLabel: string,
): string {
  if (isSpeciesLineageSpell(selection)) return lineageLabel;
  if (poolLevel === PACT_SPELL_POOL_LEVEL) return "Pact Magic";
  if (poolLevel <= BONUS_CANTRIP_POOL_BASE) {
    const pool = pools.find((p) => p.selectionLevel === poolLevel);
    if (pool) return pool.label;
    return poolLevel <= BONUS_FEAT_SPELL_POOL_BASE
      ? "Feat-granted spell"
      : "Bonus cantrip";
  }
  return poolLevel === 0 ? "Class cantrip" : `Class spell (level ${poolLevel} pick)`;
}

export function buildCharacterProvenance({
  builder,
  effectiveAbilities,
  bonusSpellPools,
  optionalFeatureSpellGrants,
}: BuildCharacterProvenanceInput): BuilderCharacterProvenance {
  const totalLevel = builder.character.level;
  const classLevelEntries = buildClassLevelEntries(
    builder.class,
    builder.classData,
    builder.primaryClassLevel,
    builder.subclass,
    builder.multiclassEnabled ? builder.multiclassEntries : [],
    builder.multiclassEnabled ? builder.multiclassClassData : [],
  );

  // ── Classes, class features and optional-feature progressions ──
  const progressionLabels = new Map<string, string>();
  const classes: ProvenanceClassEntry[] = [];
  for (const entry of classLevelEntries) {
    if (!entry.classRef) continue;
    const className = entry.classRef.name;
    const subclassName = entry.subclass?.name ?? null;
    const subclassData =
      entry.classData && entry.subclass
        ? (subclassesForClassVariant(entry.classData).find(
            (sc) => sc.id === entry.subclass!.id,
          ) ?? null)
        : null;

    const features = entry.classData
      ? getFeaturesUpToLevel(entry.classData, subclassData, entry.level).map((f) => ({
          level: f.level,
          name: f.displayName || f.name,
          from: f.isSubclassFeature && subclassName ? subclassName : className,
        }))
      : [];

    for (const { progression } of resolveOptionalFeatureProgressions(
      entry.classData,
      subclassData,
      entry.level,
    )) {
      const owner =
        progression.scope === "subclass" && subclassName ? subclassName : className;
      progressionLabels.set(progression.id, `${owner}: ${progression.name}`);
    }

    classes.push({
      name: className,
      subclass: subclassName,
      level: entry.level,
      primary: entry.isPrimary,
      features,
    });
  }

  // ── Feats (level slots, origin feats, optional-feature origin feats) ──
  const featSlotLevels = builder.multiclassEnabled
    ? getFeatSlotLevelsForBuild(classLevelEntries, totalLevel)
    : getFeatSlotLevels(builder.class?.name ?? "", totalLevel);
  const speciesName = builder.speciesData?.name ?? builder.species?.name ?? null;
  const backgroundName = builder.background?.name ?? null;

  const feats: ProvenanceFeat[] = [];
  builder.featSelections.forEach((feat, index) => {
    if (!feat) return;
    const slotLevel = featSlotLevels[index];
    feats.push(
      toProvenanceFeat(
        feat,
        slotLevel
          ? `Level ${slotLevel} Ability Score Improvement / feat slot`
          : `Feat slot ${index + 1}`,
      ),
    );
  });
  if (builder.speciesOriginFeat) {
    feats.push(
      toProvenanceFeat(
        builder.speciesOriginFeat,
        `Origin feat from species${speciesName ? ` (${speciesName})` : ""}`,
      ),
    );
  }
  if (builder.backgroundOriginFeat) {
    feats.push(
      toProvenanceFeat(
        builder.backgroundOriginFeat,
        `Origin feat from background${backgroundName ? ` (${backgroundName})` : ""}`,
      ),
    );
  }
  builder.optionalFeatureOriginFeats.forEach((feat, index) => {
    if (!feat) return;
    const slot = builder.optionalFeatureOriginFeatSlots[index];
    feats.push(
      toProvenanceFeat(
        feat,
        `Origin feat granted by ${slot?.sourceFeatureName ?? "an optional feature"}`,
      ),
    );
  });

  // ── Optional features (fighting styles, invocations, maneuvers, …) ──
  const optionalFeatures: ProvenanceGrant[] = [];
  for (const [progressionId, picks] of Object.entries(
    builder.optionalFeatureSelections ?? {},
  )) {
    for (const pick of picks) {
      if (!pick) continue;
      optionalFeatures.push({
        name: pick.name,
        grantedBy: [progressionLabels.get(progressionId) ?? progressionId],
      });
    }
  }

  // ── Ability score origin bonuses ──
  const originBonuses: string[] = [];
  if (builder.useTashaOrigin) {
    if (builder.tashaPlus2) originBonuses.push(`Species (Tasha's): ${abbr(builder.tashaPlus2)} +2`);
    if (builder.tashaPlus1) originBonuses.push(`Species (Tasha's): ${abbr(builder.tashaPlus1)} +1`);
  }
  for (const ability of builder.speciesAbilityChoices) {
    if (ability) originBonuses.push(`Species choice: ${abbr(ability)}`);
  }
  if (builder.backgroundAsiMode === "plus2plus1") {
    if (builder.backgroundAsiPlus2) {
      originBonuses.push(`Background: ${abbr(builder.backgroundAsiPlus2)} +2`);
    }
    if (builder.backgroundAsiPlus1) {
      originBonuses.push(`Background: ${abbr(builder.backgroundAsiPlus1)} +1`);
    }
  } else if (builder.backgroundAsiMode === "plus1each") {
    originBonuses.push("Background: +1 to each listed ability");
  }

  // ── Skills (proficiency + expertise with their sources) ──
  const skillKeys = new Set<SkillKey>([
    ...(Object.keys(builder.skillSources) as SkillKey[]),
    ...(Object.keys(builder.expertiseSources) as SkillKey[]),
  ]);
  const skills = [...skillKeys].sort().map((skill) => {
    const expertise = builder.expertiseSources[skill];
    return {
      skill,
      name: SKILL_LABELS[skill] ?? skill,
      grantedBy: (builder.skillSources[skill] ?? []).map(formatSource),
      expertise: expertise ? formatSource(expertise) : null,
    };
  });

  // ── Defenses ──
  const defenses: BuilderCharacterProvenance["defenses"] = [];
  for (const [damageType, entries] of Object.entries(builder.defenseSources)) {
    const byKind = new Map<string, string[]>();
    for (const { source, defenseKind } of entries ?? []) {
      const list = byKind.get(defenseKind) ?? [];
      list.push(formatSource(source));
      byKind.set(defenseKind, list);
    }
    for (const [kind, grantedBy] of byKind) {
      defenses.push({
        name: damageType,
        damageType: damageType as DamageType,
        kind,
        grantedBy,
      });
    }
  }

  // ── Spells ──
  const lineageLabel = `Species: ${speciesName ?? "Species"}${
    builder.speciesSpellGroupChoice ? ` (${builder.speciesSpellGroupChoice})` : ""
  }`;
  const spells: ProvenanceSpell[] = [];
  for (const [key, selections] of Object.entries(builder.spellSelections ?? {})) {
    const poolLevel = Number(key);
    for (const selection of selections ?? []) {
      spells.push({
        name: selection.name,
        level: selection.level,
        source: selection.source,
        grantedBy: describeSpellPool(poolLevel, selection, bonusSpellPools, lineageLabel),
      });
    }
  }
  const grantedSpells = optionalFeatureSpellGrants
    .filter((grant) => grant.unlockedAtLevel <= totalLevel)
    .map((grant) => ({
      name: grant.name,
      grantedBy:
        grant.grantType === "always-prepared"
          ? "Always prepared (class/subclass feature)"
          : "Bonus known spell (class/subclass feature)",
      unlockedAtLevel: grant.unlockedAtLevel,
    }));

  // ── Equipment ──
  const equipment: ProvenanceEquipment[] = [];
  const runeNames = (runes: ({ name: string } | null)[] | undefined) =>
    (runes ?? []).filter((r): r is { name: string } => r !== null).map((r) => r.name);
  if (builder.mainHand) {
    equipment.push({
      slot: "Main hand",
      name: builder.mainHand.weapon.name,
      rarity: builder.mainHand.rarity,
      runes: runeNames(builder.mainHand.runes),
    });
  }
  if (builder.offHand) {
    equipment.push({
      slot: "Off hand",
      name: builder.offHand.weapon.name,
      rarity: builder.offHand.rarity,
      runes: runeNames(builder.offHand.runes),
    });
  }
  if (builder.armor) {
    equipment.push({
      slot: "Armor",
      name: builder.armor.armor.name,
      rarity: builder.armor.rarity,
      runes: runeNames(builder.armor.runes),
    });
  }
  if (builder.equippedShield) {
    equipment.push({
      slot: "Shield",
      name: builder.equippedShield.name,
      rarity: builder.equippedShield.rarity,
      runes: [],
    });
  }
  for (const [slot, trinket] of [
    ["Trinket 1", builder.trinket1],
    ["Trinket 2", builder.trinket2],
  ] as const) {
    if (!trinket) continue;
    equipment.push({
      slot,
      name: trinket.name,
      rarity: null,
      runes: trinket.rune ? [trinket.rune.name] : [],
    });
  }

  const classSummary = classes
    .map((c) => `${c.name} ${c.level}${c.subclass ? ` (${c.subclass})` : ""}`)
    .join(" / ");

  return {
    summary: [speciesName, classSummary, backgroundName].filter(Boolean).join(" · "),
    totalLevel,
    classes,
    species: speciesName
      ? {
          name: speciesName,
          traits: (builder.speciesData?.traits ?? []).map((t) => t.name),
          spellGroupChoice: builder.speciesSpellGroupChoice,
        }
      : null,
    background: backgroundName
      ? { name: backgroundName, faction: builder.faction }
      : null,
    abilityScores: {
      method: builder.abilityScoreMethod,
      base: builder.character.abilities,
      final: effectiveAbilities,
      originBonuses,
    },
    feats,
    optionalFeatures,
    savingThrows: builder.saveProficiencyAbilities,
    skills,
    tools: namedGrants(builder.resolvedToolItems, builder.toolSources),
    languages: namedGrants(builder.resolvedLanguageItems, builder.languageSources),
    armor: namedGrants(builder.resolvedArmorItems, builder.armorSources),
    weapons: namedGrants(builder.resolvedWeaponItems, builder.weaponSources),
    defenses,
    spells,
    grantedSpells,
    equipment,
  };
}
