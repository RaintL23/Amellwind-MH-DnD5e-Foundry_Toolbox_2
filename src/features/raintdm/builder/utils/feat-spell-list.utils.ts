import type { BuilderFeatSelection, DndFeat, SubclassSpellBlock } from "@/shared/types";

function titleCaseClassName(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeSelectionName(value: string): string {
  return value.trim().toLowerCase();
}

function parseClassFromBlockName(name?: string): string | null {
  if (!name) return null;
  const match = name.match(/^(\w+)\s+Spells$/i);
  return match ? titleCaseClassName(match[1]) : null;
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

function parseClassFromBlock(block: SubclassSpellBlock): string | null {
  const fromName = parseClassFromBlockName(block.name);
  if (fromName) return fromName;

  const known = block.known;
  if (!known) return null;
  for (const entries of Object.values(known)) {
    for (const entry of entries) {
      if (typeof entry !== "object" || entry === null) continue;
      const choose = entry.choose;
      if (typeof choose !== "string") continue;
      const parsed = parseChooseFilter(choose);
      if (parsed?.className) return parsed.className;
    }
  }
  return null;
}

/** Spell list classes available on a feat (e.g. Cleric / Druid / Wizard for Magic Initiate). */
export function getFeatSpellListOptions(feat: DndFeat): string[] {
  const blocks = feat.additionalSpells;
  if (!blocks?.length) return [];

  const classes = blocks
    .map((block) => parseClassFromBlock(block))
    .filter((value): value is string => !!value);

  return [...new Set(classes)];
}

export function featRequiresSpellListChoice(feat: DndFeat): boolean {
  return getFeatSpellListOptions(feat).length > 1;
}

export function resolveFeatSpellListClass(
  feat: DndFeat,
  selection: Pick<BuilderFeatSelection, "spellListClassChoice" | "name">,
): string | null {
  const options = getFeatSpellListOptions(feat);
  if (options.length === 0) return null;
  if (options.length === 1) return options[0];

  if (selection.spellListClassChoice) {
    const normalized = normalizeSelectionName(selection.spellListClassChoice);
    const match = options.find(
      (option) => normalizeSelectionName(option) === normalized,
    );
    if (match) return match;
  }

  const qualifier = parseQualifierFromDisplayName(selection.name);
  if (qualifier) {
    const normalized = normalizeSelectionName(qualifier);
    const match = options.find(
      (option) => normalizeSelectionName(option) === normalized,
    );
    if (match) return match;
  }

  return null;
}

export function resolveFeatSpellBlock(
  feat: DndFeat,
  options: {
    qualifier?: string | null;
    spellListClassChoice?: string | null;
  } = {},
): SubclassSpellBlock | null {
  const blocks = feat.additionalSpells;
  if (!blocks?.length) return null;
  if (blocks.length === 1) return blocks[0] ?? null;

  const effectiveChoice =
    options.spellListClassChoice ??
    (options.qualifier ? parseQualifierFromDisplayName(options.qualifier) : null);

  if (!effectiveChoice) return null;

  const normalized = normalizeSelectionName(effectiveChoice);
  const match = blocks.find((block) => {
    const className = parseClassFromBlock(block);
    if (className && normalizeSelectionName(className) === normalized) {
      return true;
    }
    const blockName = block.name;
    return (
      typeof blockName === "string" &&
      normalizeSelectionName(blockName).includes(normalized)
    );
  });

  return match ?? null;
}

export function parseQualifierFromDisplayName(name: string): string | null {
  const match = name.match(/\(([^)]+)\)\s*$/);
  return match?.[1]?.trim() ?? null;
}

export type FeatSpellListOwner =
  | { kind: "species-origin" }
  | { kind: "background-origin" }
  | { kind: "feat-slot"; index: number };

export function resolveFeatOwnerFromPoolId(
  poolId: string,
): FeatSpellListOwner | null {
  const baseId = poolId.replace(/-level-\d+$/, "");
  if (baseId === "origin-feat-species") return { kind: "species-origin" };
  if (baseId === "origin-feat-background") return { kind: "background-origin" };
  const featMatch = baseId.match(/^feat-slot-(\d+)$/);
  if (featMatch) {
    return { kind: "feat-slot", index: Number(featMatch[1]) };
  }
  return null;
}

export function applyFeatSpellListChoice(
  owner: FeatSpellListOwner,
  className: string,
  context: {
    speciesOriginFeat: BuilderFeatSelection | null;
    backgroundOriginFeat: BuilderFeatSelection | null;
    featSelections: (BuilderFeatSelection | null)[];
  },
): BuilderFeatSelection | null {
  switch (owner.kind) {
    case "species-origin":
      return context.speciesOriginFeat
        ? { ...context.speciesOriginFeat, spellListClassChoice: className }
        : null;
    case "background-origin":
      return context.backgroundOriginFeat
        ? { ...context.backgroundOriginFeat, spellListClassChoice: className }
        : null;
    case "feat-slot": {
      const feat = context.featSelections[owner.index] ?? null;
      return feat ? { ...feat, spellListClassChoice: className } : null;
    }
  }
}
