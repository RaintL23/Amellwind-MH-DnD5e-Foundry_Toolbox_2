import type { Spell } from "@/shared/types";
import type {
  ListFilterSectionConfig,
  ListFilterValues,
} from "@/shared/components/list-filters";
import {
  labelAbilitySave,
  labelSpellMiscTag,
  optionsFromPresent,
  SPELL_AREA_LABELS,
  SPELL_ATTACK_LABELS,
  SPELL_CAST_TIME_LABELS,
  SPELL_DAMAGE_TYPES,
  SPELL_DURATION_BUCKETS,
  SPELL_MISC_TAG_LABELS,
  SPELL_RANGE_BUCKETS,
  SPELL_SAVE_ABILITIES,
} from "./spell-filter.constants";

export const SPELL_LEVEL_FILTER_OPTIONS = [
  { value: "0", label: "Cantrip" },
  ...Array.from({ length: 9 }, (_, i) => ({
    value: String(i + 1),
    label: `Level ${i + 1}`,
  })),
];

export const SPELL_SCHOOL_FILTER_OPTIONS = [
  { value: "A", label: "Abjuration" },
  { value: "C", label: "Conjuration" },
  { value: "D", label: "Divination" },
  { value: "E", label: "Enchantment" },
  { value: "V", label: "Evocation" },
  { value: "I", label: "Illusion" },
  { value: "N", label: "Necromancy" },
  { value: "T", label: "Transmutation" },
];

/** Facet multi-keys used by the full /spells list (includes level + class). */
export const SPELL_LIST_MULTI_KEYS = [
  "lvl",
  "school",
  "class",
  "misc",
  "dmg",
  "cond",
  "atk",
  "save",
  "time",
  "dur",
  "rng",
  "area",
  "src",
] as const;

export type SpellListMultiKey = (typeof SPELL_LIST_MULTI_KEYS)[number];

/** Facet keys for builder library (slot already constrains level + class). */
export const SPELL_LIBRARY_FACET_KEYS = [
  "school",
  "misc",
  "dmg",
  "cond",
  "atk",
  "save",
  "time",
  "dur",
  "rng",
  "area",
  "src",
] as const;

export type SpellLibraryFacetKey = (typeof SPELL_LIBRARY_FACET_KEYS)[number];

export interface SpellPresentFacets {
  misc: Set<string>;
  dmg: Set<string>;
  cond: Set<string>;
  atk: Set<string>;
  save: Set<string>;
  time: Set<string>;
  dur: Set<string>;
  rng: Set<string>;
  area: Set<string>;
}

export function collectSpellPresentFacets(
  spells: Spell[],
): SpellPresentFacets {
  const misc = new Set<string>();
  const dmg = new Set<string>();
  const cond = new Set<string>();
  const atk = new Set<string>();
  const save = new Set<string>();
  const time = new Set<string>();
  const dur = new Set<string>();
  const rng = new Set<string>();
  const area = new Set<string>();
  for (const spell of spells) {
    for (const t of spell.filterTags) misc.add(t);
    for (const t of spell.damageTypes) dmg.add(t);
    for (const t of spell.conditions) cond.add(t);
    for (const t of spell.spellAttack) atk.add(t);
    for (const t of spell.savingThrows) save.add(t);
    for (const t of spell.castTimeUnits) time.add(t);
    dur.add(spell.durationBucket);
    rng.add(spell.rangeBucket);
    for (const t of spell.areaStyles) area.add(t);
  }
  return { misc, dmg, cond, atk, save, time, dur, rng, area };
}

function matchesAny(selected: string[], values: string[]): boolean {
  if (selected.length === 0) return true;
  return values.some((v) => selected.includes(v));
}

function asStringArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}

export function buildSpellFacetFilterSections(
  presentFacets: SpellPresentFacets,
  options?: {
    includeLevel?: boolean;
    classOptions?: Array<{ value: string; label: string }>;
    sourceSection?: ListFilterSectionConfig;
  },
): ListFilterSectionConfig[] {
  const miscOrder = Object.keys(SPELL_MISC_TAG_LABELS);
  const sections: ListFilterSectionConfig[] = [];

  if (options?.includeLevel) {
    sections.push({
      id: "lvl",
      title: "Level",
      mode: "multi",
      options: SPELL_LEVEL_FILTER_OPTIONS,
    });
  }

  if (options?.classOptions) {
    sections.push({
      id: "class",
      title: "Class",
      mode: "multi",
      options: options.classOptions,
    });
  }

  sections.push(
    {
      id: "school",
      title: "School",
      mode: "multi",
      options: SPELL_SCHOOL_FILTER_OPTIONS,
    },
    {
      id: "misc",
      title: "Components & Miscellaneous",
      mode: "multi",
      options: optionsFromPresent(
        presentFacets.misc,
        Object.fromEntries(
          [...presentFacets.misc].map((t) => [t, labelSpellMiscTag(t)]),
        ),
        miscOrder,
      ),
    },
    {
      id: "dmg",
      title: "Damage Type",
      mode: "multi",
      options: optionsFromPresent(
        presentFacets.dmg,
        Object.fromEntries(
          [...presentFacets.dmg].map((t) => [
            t,
            t.charAt(0).toUpperCase() + t.slice(1),
          ]),
        ),
        SPELL_DAMAGE_TYPES,
      ),
    },
    {
      id: "cond",
      title: "Conditions Inflicted",
      mode: "multi",
      options: [...presentFacets.cond]
        .sort()
        .map((value) => ({
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1),
        })),
    },
    {
      id: "atk",
      title: "Spell Attack",
      mode: "multi",
      options: optionsFromPresent(presentFacets.atk, SPELL_ATTACK_LABELS, [
        "M",
        "R",
        "O",
      ]),
    },
    {
      id: "save",
      title: "Saving Throw",
      mode: "multi",
      options: optionsFromPresent(
        presentFacets.save,
        Object.fromEntries(
          SPELL_SAVE_ABILITIES.map((a) => [a, labelAbilitySave(a)]),
        ),
        SPELL_SAVE_ABILITIES,
      ),
    },
    {
      id: "time",
      title: "Cast Time",
      mode: "multi",
      options: optionsFromPresent(
        presentFacets.time,
        SPELL_CAST_TIME_LABELS,
        Object.keys(SPELL_CAST_TIME_LABELS),
      ),
    },
    {
      id: "dur",
      title: "Duration",
      mode: "multi",
      options: optionsFromPresent(
        presentFacets.dur,
        Object.fromEntries(SPELL_DURATION_BUCKETS.map((b) => [b, b])),
        SPELL_DURATION_BUCKETS,
      ),
    },
    {
      id: "rng",
      title: "Range",
      mode: "multi",
      options: optionsFromPresent(
        presentFacets.rng,
        Object.fromEntries(SPELL_RANGE_BUCKETS.map((b) => [b, b])),
        SPELL_RANGE_BUCKETS,
      ),
    },
    {
      id: "area",
      title: "Area Style",
      mode: "multi",
      options: optionsFromPresent(
        presentFacets.area,
        SPELL_AREA_LABELS,
        Object.keys(SPELL_AREA_LABELS),
      ),
    },
  );

  if (options?.sourceSection) {
    sections.push(options.sourceSection);
  }

  return sections;
}

/**
 * Match a spell against facet filter values (school, misc, damage, …).
 * Level / class / source are optional — omit keys or leave empty to skip.
 */
export function spellMatchesFacetFilters(
  spell: Spell,
  values: ListFilterValues,
  options?: {
    sourceMatcher?: (spell: Spell, selected: string[]) => boolean;
  },
): boolean {
  const lvl = asStringArray(values.lvl);
  if (lvl.length > 0 && !lvl.includes(String(spell.level))) return false;

  const school = asStringArray(values.school);
  if (school.length > 0 && !school.includes(spell.school)) return false;

  const classNames = asStringArray(values.class);
  if (
    classNames.length > 0 &&
    !spell.classNames.some((c) => classNames.includes(c))
  ) {
    return false;
  }

  const misc = asStringArray(values.misc);
  if (!matchesAny(misc, spell.filterTags)) return false;

  const dmg = asStringArray(values.dmg);
  if (!matchesAny(dmg, spell.damageTypes)) return false;

  const cond = asStringArray(values.cond);
  if (!matchesAny(cond, spell.conditions)) return false;

  const atk = asStringArray(values.atk);
  if (!matchesAny(atk, spell.spellAttack)) return false;

  const save = asStringArray(values.save);
  if (!matchesAny(save, spell.savingThrows)) return false;

  const time = asStringArray(values.time);
  if (!matchesAny(time, spell.castTimeUnits)) return false;

  const dur = asStringArray(values.dur);
  if (dur.length > 0 && !dur.includes(spell.durationBucket)) return false;

  const rng = asStringArray(values.rng);
  if (rng.length > 0 && !rng.includes(spell.rangeBucket)) return false;

  const area = asStringArray(values.area);
  if (!matchesAny(area, spell.areaStyles)) return false;

  const src = asStringArray(values.src);
  if (src.length > 0 && options?.sourceMatcher) {
    if (!options.sourceMatcher(spell, src)) return false;
  }

  return true;
}
