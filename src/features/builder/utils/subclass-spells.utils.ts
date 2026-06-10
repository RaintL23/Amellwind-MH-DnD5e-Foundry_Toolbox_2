import type { Subclass, SubclassSpellBlock } from "@/shared/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubclassSpellGrantType = "always-prepared" | "bonus-known";

export interface SubclassSpellGrant {
  name: string;
  grantType: SubclassSpellGrantType;
  /** Character level at which this grant unlocks. */
  unlockedAtLevel: number;
}

/** Parsed filter from 5etools `expanded` entries like `{ all: "level=1|class=Wizard" }`. */
export interface ExpandedSpellFilter {
  spellLevels: number[];
  classNames: string[];
  sources: string[];
  unlockedAtCharacterLevel?: number;
  /** Keys like "s6" — unlock when the character has spell slots of this level. */
  unlockedAtSpellSlotLevel?: number;
  /** Plain spell name when expanded entry is a string ref. */
  explicitSpellName?: string;
}

export interface ResolvedSubclassSpells {
  alwaysPrepared: SubclassSpellGrant[];
  bonusKnown: SubclassSpellGrant[];
  expandedFilters: ExpandedSpellFilter[];
}

// ─── Spell ref parsing ────────────────────────────────────────────────────────

/** Normalizes a 5etools spell ref to a display/lookup name. */
export function normalizeSpellRef(ref: string): string {
  let name = ref.trim();
  // Strip cantrip marker suffix (e.g. "prestidigitation#c")
  if (name.includes("#")) {
    name = name.split("#")[0]!;
  }
  // Strip book suffix (e.g. "bless|xphb", "cure wounds|phb")
  if (name.includes("|")) {
    name = name.split("|")[0]!.trim();
  }
  // Parse {@spell name|display} markup
  const spellMatch = name.match(/\{@spell\s+([^}|]+)/i);
  if (spellMatch) {
    name = spellMatch[1]!.trim();
  }
  // Title-case each word for matching against spell.name
  return name
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function normalizeSpellNameForCompare(name: string): string {
  return normalizeSpellRef(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function spellNamesMatch(a: string, b: string): boolean {
  return normalizeSpellNameForCompare(a) === normalizeSpellNameForCompare(b);
}

// ─── Unlock key parsing ───────────────────────────────────────────────────────

function parseUnlockKey(key: string): {
  characterLevel?: number;
  spellSlotLevel?: number;
} {
  if (/^s(\d+)$/i.test(key)) {
    return { spellSlotLevel: parseInt(key.slice(1), 10) };
  }
  const n = parseInt(key, 10);
  if (!isNaN(n)) return { characterLevel: n };
  return {};
}

function isFilterUnlocked(
  filter: ExpandedSpellFilter,
  characterLevel: number,
  availableSpellSlotLevels: number[],
): boolean {
  if (
    filter.unlockedAtCharacterLevel !== undefined &&
    characterLevel >= filter.unlockedAtCharacterLevel
  ) {
    return true;
  }
  if (
    filter.unlockedAtSpellSlotLevel !== undefined &&
    availableSpellSlotLevels.includes(filter.unlockedAtSpellSlotLevel)
  ) {
    return true;
  }
  return false;
}

// ─── Expanded filter parsing ──────────────────────────────────────────────────

function parseExpandedFilterEntry(
  entry: unknown,
  unlockKey: string,
): ExpandedSpellFilter | null {
  if (typeof entry === "string") {
    // Plain spell name in expanded list — treat as explicit addition at unlock level
    const unlock = parseUnlockKey(unlockKey);
    return {
      spellLevels: [],
      classNames: [],
      sources: [],
      explicitSpellName: normalizeSpellRef(entry),
      unlockedAtCharacterLevel: unlock.characterLevel,
      unlockedAtSpellSlotLevel: unlock.spellSlotLevel,
    };
  }

  if (typeof entry !== "object" || entry === null) return null;
  const obj = entry as Record<string, unknown>;
  const all = typeof obj.all === "string" ? obj.all : null;
  if (!all) return null;

  const unlock = parseUnlockKey(unlockKey);
  const filter: ExpandedSpellFilter = {
    spellLevels: [],
    classNames: [],
    sources: [],
    unlockedAtCharacterLevel: unlock.characterLevel,
    unlockedAtSpellSlotLevel: unlock.spellSlotLevel,
  };

  for (const part of all.split("|")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim().toLowerCase();
    const value = part.slice(eq + 1).trim();

    if (key === "level") {
      filter.spellLevels = value
        .split(";")
        .map((v) => parseInt(v, 10))
        .filter((n) => !isNaN(n));
    } else if (key === "class") {
      filter.classNames = value.split(";").map((c) => c.trim()).filter(Boolean);
    } else if (key === "source") {
      filter.sources = value.split(";").map((s) => s.trim()).filter(Boolean);
    }
  }

  return filter;
}

function collectNameGrants(
  map: Record<string, string[]> | undefined,
  grantType: SubclassSpellGrantType,
  characterLevel: number,
): SubclassSpellGrant[] {
  if (!map) return [];
  const grants: SubclassSpellGrant[] = [];
  const seen = new Set<string>();

  for (const [key, spells] of Object.entries(map)) {
    const unlock = parseUnlockKey(key);
    if (unlock.characterLevel !== undefined && characterLevel < unlock.characterLevel) {
      continue;
    }
    // Spell-slot keys (s6, etc.) don't apply to prepared/known name lists
    if (unlock.spellSlotLevel !== undefined) continue;

    for (const ref of spells) {
      const name = normalizeSpellRef(ref);
      const dedupeKey = `${grantType}:${name.toLowerCase()}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      grants.push({
        name,
        grantType,
        unlockedAtLevel: unlock.characterLevel ?? 1,
      });
    }
  }

  return grants;
}

function collectExpandedFilters(
  map: Record<string, unknown[]> | undefined,
): ExpandedSpellFilter[] {
  if (!map) return [];
  const filters: ExpandedSpellFilter[] = [];

  for (const [key, entries] of Object.entries(map)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const parsed = parseExpandedFilterEntry(entry, key);
      if (parsed) filters.push(parsed);
    }
  }

  return filters;
}

// ─── Main resolver ────────────────────────────────────────────────────────────

export function resolveSubclassSpells(
  subclass: Subclass | null,
  characterLevel: number,
): ResolvedSubclassSpells {
  const empty: ResolvedSubclassSpells = {
    alwaysPrepared: [],
    bonusKnown: [],
    expandedFilters: [],
  };

  if (!subclass?.additionalSpells?.length) return empty;

  const alwaysPrepared: SubclassSpellGrant[] = [];
  const bonusKnown: SubclassSpellGrant[] = [];
  const expandedFilters: ExpandedSpellFilter[] = [];

  for (const block of subclass.additionalSpells) {
    alwaysPrepared.push(
      ...collectNameGrants(block.prepared, "always-prepared", characterLevel),
    );
    bonusKnown.push(
      ...collectNameGrants(block.known, "bonus-known", characterLevel),
    );
    expandedFilters.push(...collectExpandedFilters(block.expanded));
  }

  return {
    alwaysPrepared: dedupeGrants(alwaysPrepared),
    bonusKnown: dedupeGrants(bonusKnown),
    expandedFilters,
  };
}

function dedupeGrants(grants: SubclassSpellGrant[]): SubclassSpellGrant[] {
  const seen = new Set<string>();
  return grants.filter((g) => {
    const key = `${g.grantType}:${g.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function resolveGrantSpellLevel(
  grantName: string,
  spellLevelByName: Map<string, number>,
  spellsByName?: Array<{ name: string; level: number }>,
): number | undefined {
  const direct = spellLevelByName.get(grantName.toLowerCase());
  if (direct !== undefined) return direct;

  if (spellsByName) {
    const match = spellsByName.find((s) => spellNamesMatch(s.name, grantName));
    if (match) return match.level;
  }

  return undefined;
}

/** Returns grants whose spell level matches the given slot level. */
export function grantsForSpellLevel(
  grants: SubclassSpellGrant[],
  spellLevel: number,
  spellLevelByName: Map<string, number>,
  spellsByName?: Array<{ name: string; level: number }>,
): SubclassSpellGrant[] {
  return grants.filter((g) => {
    const level = resolveGrantSpellLevel(g.name, spellLevelByName, spellsByName);
    return level === spellLevel;
  });
}

export function spellMatchesExpandedFilter(
  spell: { level: number; classNames: string[]; source: string; name: string },
  filter: ExpandedSpellFilter,
  characterLevel: number,
  availableSpellSlotLevels: number[],
  selectedSpellLevel: number,
): boolean {
  if (!isFilterUnlocked(filter, characterLevel, availableSpellSlotLevels)) {
    return false;
  }

  if (filter.explicitSpellName) {
    return (
      spell.level === selectedSpellLevel &&
      spellNamesMatch(spell.name, filter.explicitSpellName)
    );
  }

  if (filter.spellLevels.length > 0 && !filter.spellLevels.includes(spell.level)) {
    return false;
  }

  if (spell.level !== selectedSpellLevel) return false;

  if (
    filter.classNames.length > 0 &&
    !filter.classNames.some((cn) =>
      spell.classNames.some((sc) => sc.toLowerCase() === cn.toLowerCase()),
    )
  ) {
    return false;
  }

  if (
    filter.sources.length > 0 &&
    !filter.sources.some((s) => spell.source.toLowerCase() === s.toLowerCase())
  ) {
    return false;
  }

  return (
    filter.classNames.length > 0 ||
    filter.sources.length > 0 ||
    filter.spellLevels.length > 0
  );
}

export function getUnlockedExpandedFilters(
  filters: ExpandedSpellFilter[],
  characterLevel: number,
  availableSpellSlotLevels: number[],
): ExpandedSpellFilter[] {
  return filters.filter((f) =>
    isFilterUnlocked(f, characterLevel, availableSpellSlotLevels),
  );
}
