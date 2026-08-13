import type {
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  DndOptionalFeature,
  OptionalFeatureProgression,
} from "@/shared/types";
import {
  extractFixedSpellNamesFromEntries,
} from "@/shared/utils/text-spell-grants.parser";
import {
  normalizeSpellRef,
  type SubclassSpellGrant,
} from "./subclass-spells.utils";

function normalizeSelectionName(value: string): string {
  return value.trim().toLowerCase();
}

function resolveFeatureChoiceEntries(
  pick: BuilderOptionalFeatureSelection,
  progression: OptionalFeatureProgression,
): string[] {
  const option = progression.choiceOptions?.find(
    (candidate) =>
      candidate.id === pick.id ||
      normalizeSelectionName(candidate.name) === normalizeSelectionName(pick.name),
  );
  return option?.entries ?? [];
}

function resolveOptionalFeatureEntries(
  pick: BuilderOptionalFeatureSelection,
  catalog: DndOptionalFeature[],
): string[] {
  const feature = catalog.find(
    (candidate) =>
      candidate.id === pick.id ||
      (normalizeSelectionName(candidate.name) === normalizeSelectionName(pick.name) &&
        normalizeSelectionName(candidate.source) === normalizeSelectionName(pick.source)),
  );
  return feature?.entries ?? [];
}

function resolveSelectionEntriesForSpells(
  pick: BuilderOptionalFeatureSelection,
  progression: OptionalFeatureProgression,
  optionalCatalog: DndOptionalFeature[],
): string[] {
  if (progression.catalog === "feature-choice") {
    return resolveFeatureChoiceEntries(pick, progression);
  }
  return resolveOptionalFeatureEntries(pick, optionalCatalog);
}

export function resolveFeatureChoiceSpellGrants(
  optionalFeatureSelections: BuilderOptionalFeatureSelections,
  progressions: OptionalFeatureProgression[],
  optionalCatalog: DndOptionalFeature[] = [],
  characterLevel: number,
): SubclassSpellGrant[] {
  const grants: SubclassSpellGrant[] = [];
  const seen = new Set<string>();

  for (const progression of progressions) {
    const picks = optionalFeatureSelections[progression.id] ?? [];

    for (const pick of picks) {
      if (!pick) continue;

      const entries = resolveSelectionEntriesForSpells(
        pick,
        progression,
        optionalCatalog,
      );
      if (!entries.length) continue;

      const sourceName = `${progression.name}: ${pick.name}`;
      const spellNames = [
        ...extractSpellsFromEntries(entries),
        ...extractFixedSpellNamesFromEntries(entries),
      ];

      for (const spellName of spellNames) {
        const name = normalizeSpellRef(spellName);
        const dedupeKey = `always-prepared:${name.toLowerCase()}:${sourceName}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        grants.push({
          name,
          grantType: "always-prepared",
          unlockedAtLevel: characterLevel,
        });
      }
    }
  }

  return grants;
}

export function resolveOptionalFeatureSpells(
  features: DndOptionalFeature[],
  selections: BuilderOptionalFeatureSelection[],
  characterLevel: number,
): SubclassSpellGrant[] {
  const selectedIds = new Set(selections.map((s) => s.id));
  const grants: SubclassSpellGrant[] = [];
  const seen = new Set<string>();

  for (const feature of features) {
    if (!selectedIds.has(feature.id)) continue;

    if (feature.additionalSpells?.length) {
      for (const block of feature.additionalSpells) {
        collectFromBlock(block, feature.name, characterLevel, grants, seen);
      }
    }

    for (const spellName of extractSpellsFromEntries(feature.entries)) {
      const dedupeKey = `always-prepared:${spellName.toLowerCase()}:${feature.name}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      grants.push({
        name: spellName,
        grantType: "always-prepared",
        unlockedAtLevel: 1,
      });
    }
  }

  return grants;
}

const SPELL_TAG = /\{@spell\s+([^}|#]+)/gi;

export function extractSpellsFromEntries(entries: string[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const line of entries) {
    for (const match of line.matchAll(SPELL_TAG)) {
      const raw = match[1]?.trim();
      if (!raw) continue;
      const name = normalizeSpellRef(raw);
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(name);
    }
  }

  return names;
}

function collectFromBlock(
  block: {
    prepared?: Record<string, unknown[]>;
    known?: Record<string, unknown[]>;
    expanded?: Record<string, unknown[]>;
  },
  sourceName: string,
  characterLevel: number,
  grants: SubclassSpellGrant[],
  seen: Set<string>,
): void {
  const maps: Array<{
    data: Record<string, unknown[]> | undefined;
    grantType: SubclassSpellGrant["grantType"];
  }> = [
    { data: block.prepared, grantType: "always-prepared" },
    { data: block.known, grantType: "bonus-known" },
  ];

  for (const { data, grantType } of maps) {
    if (!data) continue;
    for (const [unlockKey, spellRefs] of Object.entries(data)) {
      const unlockLevel = parseUnlockLevel(unlockKey, characterLevel);
      if (unlockLevel > characterLevel) continue;

      for (const ref of spellRefs) {
        if (typeof ref !== "string") continue;
        const name = normalizeSpellRef(ref);
        const dedupeKey = `${grantType}:${name.toLowerCase()}:${sourceName}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        grants.push({
          name,
          grantType,
          unlockedAtLevel: unlockLevel,
        });
      }
    }
  }
}

function parseUnlockLevel(key: string, fallback: number): number {
  if (/^s(\d+)$/i.test(key)) return fallback;
  const n = parseInt(key, 10);
  return Number.isNaN(n) ? 1 : n;
}
