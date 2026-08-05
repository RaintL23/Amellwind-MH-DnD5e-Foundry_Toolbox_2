import type {
  Class,
  ClassFeatureEntry,
  ClassLevelRow,
  ClassTableGroup,
  Subclass,
} from "@/shared/types";
import {
  parseSaveProficiencies,
  parseSkillProficiencyBlocks,
} from "@/shared/utils/skill-proficiency.parser";
import { parseNamedProficiencyBlocks } from "@/shared/utils/named-proficiency.parser";
import { parseClassStartingEquipment } from "@/shared/utils/starting-equipment.parser";
import { mergeOptionalFeatureProgressions } from "../utils/optional-feature-progression.utils";
import {
  extractClassFeatureChoiceProgressions,
  mergeFeatureChoiceProgressions,
} from "../utils/feature-choice-progression.utils";
import type { RawClassDefinition } from "../utils/class-raw.types";
import type { ProcessedSubclass } from "../utils/class-raw.types";
import {
  buildProficiencyBonusTableGroup,
  buildTableCellsForLevel,
  classId,
  extractSpellsKnownFixed,
  formatAbility,
  mapProgression,
  mapTableGroup,
  proficiencyBonusAtLevel,
} from "@/features/classes/mappers/class-table.mapper";
import {
  mapStartingEquipment,
  mapStartingProficiencies,
} from "@/features/classes/mappers/class-proficiency.mapper";
import {
  mapMulticlassing,
  mapMulticlassProficiencyGrants,
  mapMulticlassRequirements,
} from "@/features/classes/mappers/class-multiclass.mapper";
import { mapSubclass } from "@/features/classes/mappers/class-subclass.mapper";
import { buildWeaponMasteryProgression } from "@/features/classes/mappers/class-weapon-mastery.mapper";

export { classId, proficiencyBonusAtLevel } from "@/features/classes/mappers/class-table.mapper";

const CASTER_LABELS: Record<string, string> = {
  full: "Full caster",
  "1/2": "Half caster",
  "1/3": "Third caster",
  artificer: "Artificer",
  pact: "Pact Magic",
  none: "None",
};

function formatHitDie(raw: RawClassDefinition): string {
  if (raw.hd?.faces) return `d${raw.hd.faces}`;
  if (raw.isSidekick) return "Sidekick";
  return "—";
}

/**
 * Class resource/spell columns + subclass spell columns, with Proficiency Bonus
 * prepended (5etools omits PB from JSON and injects it at render time).
 */
export function mergeClassTableGroups(
  classGroups: ClassTableGroup[],
  subclass: Subclass | null,
): ClassTableGroup[] {
  const subclassGroups = subclass?.spellProgression ?? [];
  return [buildProficiencyBonusTableGroup(), ...classGroups, ...subclassGroups];
}

export function mapClass(
  raw: RawClassDefinition,
  allClassFeatures: import("../utils/class-raw.types").RawClassFeature[] = [],
  allSubclassFeatures: import("../utils/class-raw.types").RawSubclassFeature[] = [],
): Class {
  const spellProgression = (raw.classTableGroups ?? []).map(mapTableGroup);
  const proficiencies = (raw.proficiency ?? []).map(formatAbility);
  const hitDie = formatHitDie(raw);

  const progression = mapProgression(raw.classFeaturesByLevel, spellProgression);

  const subclasses = (raw.subclasses ?? []).map((sc) =>
    mapSubclass(sc as ProcessedSubclass, allClassFeatures, allSubclassFeatures),
  );

  const baseClassProgressions = mergeOptionalFeatureProgressions(
    raw.optionalfeatureProgression,
    raw.featProgression,
    "class",
    raw.name,
    raw.source,
  );
  const weaponMasteryProgression = buildWeaponMasteryProgression(
    raw.name,
    raw.source,
    raw.classTableGroups,
    allClassFeatures,
  );
  const classOptionalProgressionNames = [
    ...(raw.optionalfeatureProgression ?? []).map((p) => p.name ?? ""),
    ...(raw.featProgression ?? []).map((p) => p.name ?? ""),
    // Prevent the plain "Weapon Mastery" class feature from being processed
    // as a feature-choice — it is handled by the dedicated progression above.
    ...(weaponMasteryProgression ? ["Weapon Mastery"] : []),
  ];
  const classFeatureChoices = extractClassFeatureChoiceProgressions(
    raw.name,
    raw.source,
    allClassFeatures,
    allSubclassFeatures,
    classOptionalProgressionNames,
  );

  const casterLabel = raw.casterProgression
    ? (CASTER_LABELS[raw.casterProgression] ?? raw.casterProgression)
    : "None";

  const summaryParts = [
    raw.name,
    hitDie,
    casterLabel,
    ...subclasses.map((s) => s.name),
  ];

  const classSource: import("@/shared/types/proficiency.types").ProficiencySource = {
    type: "class",
    name: raw.name,
  };
  const saveProfGrant = parseSaveProficiencies(raw.proficiency ?? [], classSource);
  const skillChoiceGrants = parseSkillProficiencyBlocks(
    raw.startingProficiencies?.skills ?? [],
    classSource,
  );
  const toolBlocks = [
    ...(raw.startingProficiencies?.toolProficiencies ?? []),
    ...(raw.startingProficiencies?.tools ?? []),
  ];
  const toolGrants = parseNamedProficiencyBlocks(toolBlocks, classSource);
  const armorGrants = parseNamedProficiencyBlocks(
    raw.startingProficiencies?.armor ?? [],
    classSource,
  );
  const weaponGrants = parseNamedProficiencyBlocks(
    raw.startingProficiencies?.weapons ?? [],
    classSource,
  );
  const languageGrants = parseNamedProficiencyBlocks(
    raw.startingProficiencies?.languages ?? [],
    classSource,
  );

  return {
    id: classId(raw.name, raw.source),
    name: raw.name,
    source: raw.source,
    page: raw.page,
    edition: raw.edition,
    isSidekick: raw.isSidekick,
    hitDie,
    proficiencies,
    casterProgression: raw.casterProgression,
    spellcastingAbility: raw.spellcastingAbility
      ? formatAbility(raw.spellcastingAbility)
      : undefined,
    cantripProgression: raw.cantripProgression,
    preparedSpells: raw.preparedSpells,
    preparedSpellsProgression: raw.preparedSpellsProgression,
    spellsKnownProgressionFixed: extractSpellsKnownFixed(raw),
    spellProgression,
    progression,
    subclasses,
    startingProficiencies: mapStartingProficiencies(raw.startingProficiencies),
    startingEquipment: mapStartingEquipment(raw.startingEquipment),
    startingEquipmentOffers: parseClassStartingEquipment(raw.startingEquipment),
    multiclassing: mapMulticlassing(raw.multiclassing),
    multiclassRequirements: mapMulticlassRequirements(raw.multiclassing),
    multiclassProficiencies: mapMulticlassProficiencyGrants(
      raw.multiclassing,
      classSource,
    ),
    subclassTitle: raw.subclassTitle,
    summary: summaryParts.join(" "),
    saveProficiencies: saveProfGrant?.abilities ?? [],
    skillChoiceGrants,
    toolGrants,
    armorGrants,
    weaponGrants,
    languageGrants,
    optionalFeatureProgressions: mergeFeatureChoiceProgressions(
      mergeFeatureChoiceProgressions(baseClassProgressions, classFeatureChoices),
      weaponMasteryProgression ? [weaponMasteryProgression] : [],
    ),
  };
}

export function getCasterLabel(casterProgression?: string): string {
  if (!casterProgression) return "None";
  return CASTER_LABELS[casterProgression] ?? casterProgression;
}

/** Merge class and subclass features + table columns for the level table display */
export function mergeProgressionWithSubclass(
  classProgression: ClassLevelRow[],
  subclass: Subclass | null,
  tableGroups?: ClassTableGroup[],
): ClassLevelRow[] {
  return classProgression.map((row, i) => {
    const subclassFeatures = subclass
      ? (subclass.progression[i]?.features ?? []).map((f) => ({
          ...f,
          isSubclassFeature: true,
        }))
      : [];

    const classFeatures = row.features.filter((f) => !f.gainSubclassFeature);
    const placeholders = row.features.filter((f) => f.gainSubclassFeature);

    const mergedFeatures: ClassFeatureEntry[] = subclass
      ? [
          ...classFeatures,
          ...subclassFeatures,
          ...placeholders.map((f) => ({
            ...f,
            displayName: subclass.name,
          })),
        ]
      : row.features;

    const tableCells = tableGroups
      ? buildTableCellsForLevel(tableGroups, i)
      : subclass
        ? [
            `+${proficiencyBonusAtLevel(row.level)}`,
            ...row.tableCells,
            ...(subclass.progression[i]?.tableCells ?? []),
          ]
        : [`+${proficiencyBonusAtLevel(row.level)}`, ...row.tableCells];

    return {
      ...row,
      features: mergedFeatures,
      tableCells,
    };
  });
}
