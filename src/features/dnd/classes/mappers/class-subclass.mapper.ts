import type { Subclass, SubclassSpellBlock } from "@/shared/types";
import { mergeOptionalFeatureProgressions } from "../utils/optional-feature-progression.utils";
import {
  extractSubclassFeatureChoiceProgressions,
  mergeFeatureChoiceProgressions,
} from "../utils/feature-choice-progression.utils";
import { DEFAULT_CLASS_SOURCE } from "../utils/class-raw.types";
import type {
  ProcessedSubclass,
  RawClassFeature,
  SubclassSpellBlockRaw,
} from "../utils/class-raw.types";
import {
  classId,
  extractSpellsKnownFromTableGroups,
  formatAbility,
  mapProgression,
  mapTableGroup,
} from "@/features/dnd/classes/mappers/class-table.mapper";

function mapAdditionalSpells(
  blocks?: SubclassSpellBlockRaw[],
): SubclassSpellBlock[] | undefined {
  if (!blocks?.length) return undefined;
  return blocks.map((block) => ({
    prepared: block.prepared,
    known: block.known,
    expanded: block.expanded,
  }));
}

export function mapSubclass(
  sc: ProcessedSubclass,
  allClassFeatures: RawClassFeature[],
  allSubclassFeatures: import("../utils/class-raw.types").RawSubclassFeature[],
): Subclass {
  const tableGroups = (sc.subclassTableGroups ?? []).map(mapTableGroup);
  const baseProgressions = mergeOptionalFeatureProgressions(
    sc.optionalfeatureProgression,
    sc.featProgression,
    "subclass",
    sc.name,
    sc.source,
  );
  const optionalProgressionNames = [
    ...(sc.optionalfeatureProgression ?? []).map((p) => p.name ?? ""),
    ...(sc.featProgression ?? []).map((p) => p.name ?? ""),
  ];
  const featureChoices = extractSubclassFeatureChoiceProgressions(
    sc.name,
    sc.source,
    sc.className,
    sc.classSource || DEFAULT_CLASS_SOURCE,
    sc.shortName,
    allClassFeatures,
    allSubclassFeatures,
    optionalProgressionNames,
  );

  return {
    id: classId(sc.name, sc.source),
    name: sc.name,
    shortName: sc.shortName,
    source: sc.source,
    classSource: sc.classSource || DEFAULT_CLASS_SOURCE,
    edition: sc.edition,
    page: sc.page,
    progression: mapProgression(sc.subclassFeaturesByLevel, tableGroups),
    casterProgression: sc.casterProgression,
    spellcastingAbility: sc.spellcastingAbility
      ? formatAbility(sc.spellcastingAbility)
      : undefined,
    cantripProgression: sc.cantripProgression,
    preparedSpells: sc.preparedSpells,
    preparedSpellsProgression: sc.preparedSpellsProgression,
    spellsKnownProgressionFixed:
      sc.spellsKnownProgression ??
      extractSpellsKnownFromTableGroups(sc.subclassTableGroups),
    spellProgression: tableGroups.length ? tableGroups : undefined,
    additionalSpells: mapAdditionalSpells(sc.additionalSpells),
    optionalFeatureProgressions: mergeFeatureChoiceProgressions(
      baseProgressions,
      featureChoices,
    ),
  };
}
