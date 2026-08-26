import type {
  BuilderFeatSelection,
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  BuilderSpellSelection,
  BuilderSpellSelections,
  Class,
  DndFeat,
  DndOptionalFeature,
  OptionalFeatureProgression,
  Subclass,
  SubclassSpellBlock,
  SubclassSpellEntry,
} from "@/shared/types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { parseCantripGrantsFromEntries } from "@/shared/utils/text-spell-grants.parser";
import {
  getFeatSpellListOptions,
  parseQualifierFromDisplayName,
  resolveFeatSpellBlock,
} from "./feat-spell-list.utils";
import { isSpeciesLineageSpell } from "./species-spell-grants.utils";

/** Cantrips chosen for the class list in slot 0 (excludes species lineage grants). */
export function countClassCantripSelections(
  selections: BuilderSpellSelection[] | undefined,
): number {
  return (selections ?? []).filter(
    (selection) => selection.level === 0 && !isSpeciesLineageSpell(selection),
  ).length;
}

/** Internal keys in BuilderSpellSelections for bonus cantrip pools (-100, -101, …). */
export const BONUS_CANTRIP_POOL_BASE = -100;

/** Internal keys for feat-granted leveled spell pools (-200, -201, …). */
export const BONUS_FEAT_SPELL_POOL_BASE = -200;

export type BuilderBonusCantripSlot = `spell-cantrip-${string}`;

export type BuilderBonusFeatSpellSlot = `spell-feat-${string}`;

export interface CantripPoolDefinition {
  poolId: string;
  slot: BuilderBonusCantripSlot | BuilderBonusFeatSpellSlot;
  selectionLevel: number;
  label: string;
  maxCount: number;
  spellListClassName: string;
  spellLevel: number;
  /** When the feat offers multiple spell lists (e.g. Magic Initiate). */
  spellListClassOptions?: string[];
  needsSpellListChoice?: boolean;
}

export function toBonusCantripSlot(poolId: string): BuilderBonusCantripSlot {
  return `spell-cantrip-${poolId}`;
}

export function toBonusFeatSpellSlot(poolId: string): BuilderBonusFeatSpellSlot {
  return `spell-feat-${poolId}`;
}

export function isBonusCantripSlot(
  slot: string,
): slot is BuilderBonusCantripSlot {
  return slot.startsWith("spell-cantrip-");
}

export function isBonusFeatSpellSlot(
  slot: string,
): slot is BuilderBonusFeatSpellSlot {
  return slot.startsWith("spell-feat-");
}

export function isBonusSpellPoolSlot(
  slot: string,
): slot is BuilderBonusCantripSlot | BuilderBonusFeatSpellSlot {
  return isBonusCantripSlot(slot) || isBonusFeatSpellSlot(slot);
}

export function parseBonusCantripPoolId(slot: BuilderBonusCantripSlot): string {
  return slot.slice("spell-cantrip-".length);
}

export function parseBonusFeatSpellPoolId(slot: BuilderBonusFeatSpellSlot): string {
  return slot.slice("spell-feat-".length);
}

function slugifyPoolId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSelectionName(value: string): string {
  return value.trim().toLowerCase();
}

function titleCaseClassName(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function parseChooseFilter(
  filter: string,
): { spellLevel: number; className: string | null } | null {
  const levelMatch = filter.match(/level=(\d+)/i);
  const classMatch = filter.match(/class=([^;|]+)/i);
  if (!levelMatch) return null;
  return {
    spellLevel: Number(levelMatch[1]),
    className: classMatch?.[1]
      ? titleCaseClassName(classMatch[1].trim())
      : null,
  };
}

function parseCantripChooseFromEntry(
  entry: SubclassSpellEntry,
): { count: number; className: string | null } | null {
  if (typeof entry !== "object" || entry === null) return null;
  const choose = entry.choose;
  if (typeof choose !== "string") return null;
  const parsed = parseChooseFilter(choose);
  if (!parsed || parsed.spellLevel !== 0) return null;
  const count =
    typeof (entry as { count?: number }).count === "number"
      ? Math.max(1, (entry as { count: number }).count)
      : 1;
  return { count, className: parsed.className };
}

function parseCantripChooseFromBlock(
  block: SubclassSpellBlock,
): { count: number; className: string | null } | null {
  const known = block.known;
  if (!known) return null;
  for (const entries of Object.values(known)) {
    for (const entry of entries) {
      const parsed = parseCantripChooseFromEntry(entry);
      if (parsed) return parsed;
    }
  }
  return null;
}

function parseLeveledChooseFromEntry(
  entry: SubclassSpellEntry,
  minSpellLevel: number,
): { count: number; className: string | null; spellLevel: number } | null {
  if (typeof entry !== "object" || entry === null) return null;
  const choose = entry.choose;
  if (typeof choose !== "string") return null;
  const parsed = parseChooseFilter(choose);
  if (!parsed || parsed.spellLevel < minSpellLevel) return null;
  const count =
    typeof (entry as { count?: number }).count === "number"
      ? Math.max(1, (entry as { count: number }).count)
      : 1;
  return { count, className: parsed.className, spellLevel: parsed.spellLevel };
}

function parseInnateChooseFromBlock(
  block: SubclassSpellBlock,
): { count: number; className: string | null; spellLevel: number } | null {
  const innate = block.innate;
  if (!innate || typeof innate !== "object") return null;

  for (const blockValue of Object.values(innate)) {
    if (!blockValue || typeof blockValue !== "object") continue;
    const daily = (blockValue as { daily?: Record<string, SubclassSpellEntry[]> })
      .daily;
    if (!daily) continue;

    for (const entries of Object.values(daily)) {
      if (!Array.isArray(entries)) continue;
      for (const entry of entries) {
        const parsed = parseLeveledChooseFromEntry(entry, 1);
        if (parsed) return parsed;
      }
    }
  }

  return null;
}

function resolveCantripCountFromFeat(feat: DndFeat): number {
  const block = feat.additionalSpells?.[0];
  const structured = block ? parseCantripChooseFromBlock(block) : null;
  return structured?.count ?? 1;
}

function pushPoolsFromFeat(
  pools: CantripPoolDefinition[],
  seen: Set<string>,
  feat: DndFeat,
  label: string,
  poolId: string,
  qualifier: string | null | undefined,
  fallbackClassName: string,
  spellListClassChoice?: string | null,
): void {
  const spellListOptions = getFeatSpellListOptions(feat);
  const resolvedClass =
    spellListClassChoice ??
    (qualifier ? parseQualifierFromDisplayName(qualifier) : null);

  if (spellListOptions.length > 1 && !resolvedClass) {
    pushPool(pools, seen, {
      poolId,
      label,
      maxCount: resolveCantripCountFromFeat(feat),
      spellListClassName: "Spell list",
      spellListClassOptions: spellListOptions,
      needsSpellListChoice: true,
      spellLevel: 0,
    });
    return;
  }

  const block = resolveFeatSpellBlock(feat, {
    qualifier,
    spellListClassChoice: resolvedClass,
  });
  const structured = block ? parseCantripChooseFromBlock(block) : null;
  if (structured?.className) {
    pushPool(pools, seen, {
      poolId,
      label,
      maxCount: structured.count,
      spellListClassName: structured.className,
      spellLevel: 0,
    });

    const innateStructured = block ? parseInnateChooseFromBlock(block) : null;
    if (innateStructured?.className) {
      pushPool(pools, seen, {
        poolId: `${poolId}-level-${innateStructured.spellLevel}`,
        label: `${label} — Level ${innateStructured.spellLevel} spell`,
        maxCount: innateStructured.count,
        spellListClassName: innateStructured.className,
        spellLevel: innateStructured.spellLevel,
      });
    }
    return;
  }

  const textParts = [
    ...feat.paragraphs,
    ...feat.sections.flatMap((section) => [
      section.name ?? "",
      ...section.paragraphs,
    ]),
  ];
  pushPoolsFromText(pools, seen, textParts, label, poolId, fallbackClassName);
}

function pushPool(
  pools: CantripPoolDefinition[],
  seen: Set<string>,
  params: {
    poolId: string;
    label: string;
    maxCount: number;
    spellListClassName: string;
    spellLevel?: number;
    spellListClassOptions?: string[];
    needsSpellListChoice?: boolean;
  },
): void {
  if (params.maxCount <= 0) return;
  const labelKey = normalizeSelectionName(params.label);
  if (seen.has(params.poolId) || seen.has(`label:${labelKey}`)) return;
  seen.add(params.poolId);
  seen.add(`label:${labelKey}`);

  const spellLevel = params.spellLevel ?? 0;
  const cantripIndex = pools.filter((pool) => pool.spellLevel === 0).length;
  const leveledIndex = pools.filter((pool) => pool.spellLevel > 0).length;
  const selectionLevel =
    spellLevel === 0
      ? BONUS_CANTRIP_POOL_BASE - cantripIndex
      : BONUS_FEAT_SPELL_POOL_BASE - leveledIndex;
  const slot =
    spellLevel === 0
      ? toBonusCantripSlot(params.poolId)
      : toBonusFeatSpellSlot(params.poolId);

  pools.push({
    poolId: params.poolId,
    slot,
    selectionLevel,
    label: params.label,
    maxCount: params.maxCount,
    spellListClassName: params.spellListClassName,
    spellLevel,
    spellListClassOptions: params.spellListClassOptions,
    needsSpellListChoice: params.needsSpellListChoice,
  });
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

function resolveFeatEntries(
  pick: BuilderOptionalFeatureSelection,
  catalog: DndFeat[],
): string[] {
  const feat = catalog.find(
    (candidate) =>
      candidate.id === pick.id ||
      normalizeSelectionName(candidate.name) === normalizeSelectionName(pick.name),
  );
  return feat?.paragraphs ?? [];
}

function resolveSelectionEntries(
  pick: BuilderOptionalFeatureSelection,
  progression: OptionalFeatureProgression,
  optionalCatalog: DndOptionalFeature[],
  featCatalog: DndFeat[],
): string[] {
  if (progression.catalog === "feature-choice") {
    return resolveFeatureChoiceEntries(pick, progression);
  }
  if (progression.catalog === "feat") {
    return resolveFeatEntries(pick, featCatalog);
  }
  return resolveOptionalFeatureEntries(pick, optionalCatalog);
}

function pushPoolsFromText(
  pools: CantripPoolDefinition[],
  seen: Set<string>,
  entries: string[],
  label: string,
  poolId: string,
  fallbackClassName: string,
): void {
  const grants = parseCantripGrantsFromEntries(entries, fallbackClassName);
  for (const grant of grants) {
    if (!grant.spellListClassName) continue;
    pushPool(pools, seen, {
      poolId,
      label,
      maxCount: grant.count,
      spellListClassName: grant.spellListClassName,
      spellLevel: 0,
    });
  }
}

function pushPoolsFromOriginFeat(
  pools: CantripPoolDefinition[],
  seen: Set<string>,
  selection: BuilderFeatSelection | null,
  grant: OriginFeatGrant | null,
  sourceKey: "species" | "background",
  featCatalog: DndFeat[],
  fallbackClassName: string,
): void {
  if (!selection) return;

  const feat =
    featCatalog.find((candidate) => candidate.id === selection.id) ??
    featCatalog.find(
      (candidate) =>
        normalizeSelectionName(candidate.name) ===
        normalizeSelectionName(selection.name),
    );
  if (!feat) return;

  const qualifier =
    grant?.kind === "fixed"
      ? grant.featRefs.find((ref) => ref.id === selection.id)?.qualifier ??
        grant.featRefs[0]?.qualifier
      : parseQualifierFromDisplayName(selection.name);

  const label = selection.name.includes("(")
    ? selection.name
    : qualifier
      ? `${feat.name} (${qualifier})`
      : feat.name;

  pushPoolsFromFeat(
    pools,
    seen,
    feat,
    label,
    `origin-feat-${sourceKey}`,
    qualifier,
    fallbackClassName,
    selection.spellListClassChoice,
  );
}

export function resolveBonusCantripPools(params: {
  optionalFeatureSelections: BuilderOptionalFeatureSelections;
  progressions: OptionalFeatureProgression[];
  optionalCatalog: DndOptionalFeature[];
  featCatalog: DndFeat[];
  classData: Class | null;
  subclass: Subclass | null;
  level: number;
  speciesOriginFeat?: BuilderFeatSelection | null;
  backgroundOriginFeat?: BuilderFeatSelection | null;
  speciesOriginFeatGrant?: OriginFeatGrant | null;
  backgroundOriginFeatGrant?: OriginFeatGrant | null;
  featSelections?: (BuilderFeatSelection | null)[];
}): CantripPoolDefinition[] {
  const {
    optionalFeatureSelections,
    progressions,
    optionalCatalog,
    featCatalog,
    classData,
    speciesOriginFeat,
    backgroundOriginFeat,
    speciesOriginFeatGrant,
    backgroundOriginFeatGrant,
    featSelections = [],
  } = params;

  const fallbackClassName = classData?.name ?? "Wizard";
  const pools: CantripPoolDefinition[] = [];
  const seen = new Set<string>();

  for (const progression of progressions) {
    const picks = optionalFeatureSelections[progression.id] ?? [];
    for (const pick of picks) {
      if (!pick) continue;

      const entries = resolveSelectionEntries(
        pick,
        progression,
        optionalCatalog,
        featCatalog,
      );
      if (!entries.length) continue;

      const label = `${progression.name}: ${pick.name}`;
      const poolId = slugifyPoolId(`${progression.id}-${pick.id || pick.name}`);

      if (progression.catalog === "feat") {
        const feat = featCatalog.find(
          (candidate) =>
            candidate.id === pick.id ||
            normalizeSelectionName(candidate.name) ===
              normalizeSelectionName(pick.name),
        );
        if (feat) {
          pushPoolsFromFeat(
            pools,
            seen,
            feat,
            label,
            poolId,
            null,
            fallbackClassName,
          );
        }
        continue;
      }

      pushPoolsFromText(pools, seen, entries, label, poolId, fallbackClassName);
    }
  }

  pushPoolsFromOriginFeat(
    pools,
    seen,
    speciesOriginFeat ?? null,
    speciesOriginFeatGrant ?? null,
    "species",
    featCatalog,
    fallbackClassName,
  );
  pushPoolsFromOriginFeat(
    pools,
    seen,
    backgroundOriginFeat ?? null,
    backgroundOriginFeatGrant ?? null,
    "background",
    featCatalog,
    fallbackClassName,
  );

  for (const [index, selection] of featSelections.entries()) {
    if (!selection) continue;
    const feat = featCatalog.find((candidate) => candidate.id === selection.id);
    if (!feat) continue;
    pushPoolsFromFeat(
      pools,
      seen,
      feat,
      `Feat: ${selection.name}`,
      `feat-slot-${index}`,
      parseQualifierFromDisplayName(selection.name),
      fallbackClassName,
      selection.spellListClassChoice,
    );
  }

  return pools;
}

export function findCantripPoolBySlot(
  pools: CantripPoolDefinition[],
  slot: BuilderBonusCantripSlot | BuilderBonusFeatSpellSlot,
): CantripPoolDefinition | undefined {
  return pools.find((pool) => pool.slot === slot);
}

export function countSelectedCantrips(
  spellSelections: BuilderSpellSelections,
  classCantripCount: number,
  bonusPools: CantripPoolDefinition[],
): {
  classSelected: number;
  bonusSelected: number;
  totalSelected: number;
  totalRequired: number;
} {
  const classSelected = countClassCantripSelections(spellSelections[0]);
  const bonusSelected = bonusPools.reduce(
    (sum, pool) => sum + (spellSelections[pool.selectionLevel] ?? []).length,
    0,
  );
  const totalRequired =
    classCantripCount + bonusPools.reduce((sum, pool) => sum + pool.maxCount, 0);
  return {
    classSelected,
    bonusSelected,
    totalSelected: classSelected + bonusSelected,
    totalRequired,
  };
}

export function sumBonusCantripPoolCounts(
  pools: CantripPoolDefinition[],
): number {
  return pools.reduce((sum, pool) => sum + pool.maxCount, 0);
}
