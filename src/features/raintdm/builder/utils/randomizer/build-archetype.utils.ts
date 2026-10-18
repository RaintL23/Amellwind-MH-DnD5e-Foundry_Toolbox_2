/**
 * Build archetype: the combat plan the randomizer picks right after
 * class + subclass. Ability priority, Fighting Style, feats, weapon loadout,
 * Weapon Mastery and class feature choices (Divine Order, …) all follow it.
 */
import type { AbilityKey, Class, Subclass } from "@/shared/types";
import { pickWeighted } from "./character-randomizer.utils";

export type BuildArchetype =
  | "great-weapon"
  | "sword-board"
  | "dex-melee"
  | "dex-ranged"
  | "dual-wield"
  | "caster"
  | "gish";

export interface ArchetypeProfile {
  archetype: BuildArchetype;
  /** Leading ability order; the class default fills in the rest. */
  abilityPriority?: readonly AbilityKey[];
}

interface ArchetypeOption extends ArchetypeProfile {
  weight: number;
}

const STR_MARTIAL: readonly AbilityKey[] = ["str", "con", "dex"];
const DEX_MARTIAL: readonly AbilityKey[] = ["dex", "con", "wis"];

const CLASS_ARCHETYPE_OPTIONS: Readonly<Record<string, readonly ArchetypeOption[]>> = {
  artificer: [
    { archetype: "caster", weight: 60 },
    { archetype: "sword-board", weight: 40 },
  ],
  barbarian: [
    { archetype: "great-weapon", weight: 70 },
    { archetype: "sword-board", weight: 15 },
    { archetype: "dual-wield", weight: 15 },
  ],
  bard: [{ archetype: "caster", weight: 100 }],
  cleric: [
    { archetype: "caster", weight: 50 },
    { archetype: "sword-board", weight: 50, abilityPriority: ["wis", "con", "str"] },
  ],
  druid: [
    { archetype: "caster", weight: 85 },
    { archetype: "sword-board", weight: 15 },
  ],
  fighter: [
    { archetype: "great-weapon", weight: 35, abilityPriority: STR_MARTIAL },
    { archetype: "sword-board", weight: 20, abilityPriority: STR_MARTIAL },
    { archetype: "dex-ranged", weight: 25, abilityPriority: DEX_MARTIAL },
    { archetype: "dex-melee", weight: 10, abilityPriority: DEX_MARTIAL },
    { archetype: "dual-wield", weight: 10, abilityPriority: DEX_MARTIAL },
  ],
  monk: [{ archetype: "dex-melee", weight: 100 }],
  paladin: [
    { archetype: "great-weapon", weight: 50 },
    { archetype: "sword-board", weight: 50 },
  ],
  ranger: [
    { archetype: "dex-ranged", weight: 50 },
    { archetype: "dual-wield", weight: 25 },
    { archetype: "dex-melee", weight: 25 },
  ],
  rogue: [
    { archetype: "dex-melee", weight: 50 },
    { archetype: "dex-ranged", weight: 25 },
    { archetype: "dual-wield", weight: 25 },
  ],
  sorcerer: [{ archetype: "caster", weight: 100 }],
  warlock: [
    { archetype: "caster", weight: 65 },
    { archetype: "gish", weight: 35, abilityPriority: ["cha", "con", "dex"] },
  ],
  wizard: [{ archetype: "caster", weight: 100 }],
};

/** Subclasses whose identity fixes the archetype. */
const SUBCLASS_ARCHETYPE_OVERRIDES: ReadonlyArray<{
  pattern: RegExp;
  profile: ArchetypeProfile;
}> = [
  { pattern: /bladesing/i, profile: { archetype: "gish", abilityPriority: ["int", "dex", "con"] } },
  { pattern: /college of (valor|swords)/i, profile: { archetype: "gish", abilityPriority: ["cha", "dex", "con"] } },
  { pattern: /war domain/i, profile: { archetype: "sword-board", abilityPriority: ["wis", "con", "str"] } },
  { pattern: /battle smith|armorer/i, profile: { archetype: "sword-board" } },
];

function classKey(classData: Pick<Class, "name">): string {
  return classData.name.trim().toLowerCase();
}

export function pickBuildArchetype(
  classData: Pick<Class, "name" | "casterProgression">,
  subclass: Pick<Subclass, "name"> | null,
): ArchetypeProfile {
  if (subclass) {
    const override = SUBCLASS_ARCHETYPE_OVERRIDES.find(({ pattern }) =>
      pattern.test(subclass.name),
    );
    if (override) return override.profile;
  }

  const options = CLASS_ARCHETYPE_OPTIONS[classKey(classData)];
  const picked = options ? pickWeighted(options, (option) => option.weight) : null;
  if (picked) {
    return picked.abilityPriority
      ? { archetype: picked.archetype, abilityPriority: picked.abilityPriority }
      : { archetype: picked.archetype };
  }

  const isCaster =
    !!classData.casterProgression && classData.casterProgression !== "none";
  return { archetype: isCaster ? "caster" : "great-weapon" };
}

/** Archetype lead abilities first, then the class default order. */
export function applyArchetypeAbilityPriority(
  basePriority: readonly AbilityKey[],
  profile: ArchetypeProfile,
): AbilityKey[] {
  const lead = profile.abilityPriority ?? [];
  if (lead.length === 0) return [...basePriority];
  return [...new Set([...lead, ...basePriority])];
}

export function isRangedArchetype(archetype: BuildArchetype): boolean {
  return archetype === "dex-ranged";
}

/** Barbarian / Monk get AC without armor (the loadout compares both). */
export function hasUnarmoredDefense(className: string): "barbarian" | "monk" | null {
  const key = className.trim().toLowerCase();
  if (key === "barbarian") return "barbarian";
  if (key === "monk") return "monk";
  return null;
}

// ─── Fighting Styles ─────────────────────────────────────────────────────────

export const ARCHETYPE_FIGHTING_STYLES: Readonly<
  Record<BuildArchetype, { preferred: readonly string[]; blocked: readonly string[] }>
> = {
  "great-weapon": {
    preferred: ["Great Weapon Fighting", "Defense"],
    blocked: ["Archery", "Dueling", "Two-Weapon Fighting", "Protection", "Unarmed Fighting", "Thrown Weapon Fighting"],
  },
  "sword-board": {
    preferred: ["Defense", "Dueling"],
    blocked: ["Archery", "Great Weapon Fighting", "Two-Weapon Fighting", "Unarmed Fighting"],
  },
  "dex-melee": {
    preferred: ["Dueling", "Defense"],
    blocked: ["Archery", "Great Weapon Fighting", "Two-Weapon Fighting", "Protection", "Unarmed Fighting"],
  },
  "dex-ranged": {
    preferred: ["Archery"],
    blocked: ["Great Weapon Fighting", "Dueling", "Two-Weapon Fighting", "Protection", "Interception", "Unarmed Fighting"],
  },
  "dual-wield": {
    preferred: ["Two-Weapon Fighting"],
    blocked: ["Archery", "Great Weapon Fighting", "Dueling", "Protection", "Unarmed Fighting"],
  },
  gish: {
    preferred: ["Dueling", "Defense"],
    blocked: ["Archery", "Great Weapon Fighting", "Two-Weapon Fighting", "Unarmed Fighting"],
  },
  caster: {
    preferred: ["Defense"],
    blocked: ["Great Weapon Fighting", "Two-Weapon Fighting", "Unarmed Fighting"],
  },
};

// ─── Feats ───────────────────────────────────────────────────────────────────

/** Feats worth taking early for the archetype (in preference order). */
export const ARCHETYPE_SIGNATURE_FEATS: Readonly<Record<BuildArchetype, readonly string[]>> = {
  "great-weapon": ["Great Weapon Master", "Polearm Master"],
  "sword-board": ["Shield Master", "Sentinel", "Heavy Armor Master"],
  "dex-melee": ["Sentinel"],
  "dex-ranged": ["Sharpshooter", "Crossbow Expert"],
  "dual-wield": ["Dual Wielder"],
  caster: ["War Caster", "Resilient"],
  gish: ["War Caster"],
};

const RANGED_STYLE_FEATS = ["Sharpshooter", "Crossbow Expert"];
const HEAVY_WEAPON_FEATS = ["Great Weapon Master", "Polearm Master"];
const MARTIAL_STYLE_FEATS = [
  ...RANGED_STYLE_FEATS,
  ...HEAVY_WEAPON_FEATS,
  "Dual Wielder",
  "Shield Master",
  "Charger",
  "Mounted Combatant",
  "Weapon Master",
];

/** Feats that do not fit the archetype's weapons or armor. */
export const ARCHETYPE_BLOCKED_FEATS: Readonly<Record<BuildArchetype, readonly string[]>> = {
  "great-weapon": [...RANGED_STYLE_FEATS, "Dual Wielder", "Shield Master"],
  "sword-board": [...RANGED_STYLE_FEATS, ...HEAVY_WEAPON_FEATS, "Dual Wielder"],
  "dex-melee": [...RANGED_STYLE_FEATS, ...HEAVY_WEAPON_FEATS, "Heavy Armor Master", "Shield Master"],
  "dex-ranged": [...HEAVY_WEAPON_FEATS, "Dual Wielder", "Shield Master", "Heavy Armor Master", "Charger"],
  "dual-wield": [...RANGED_STYLE_FEATS, ...HEAVY_WEAPON_FEATS, "Shield Master"],
  caster: MARTIAL_STYLE_FEATS,
  gish: [...RANGED_STYLE_FEATS, ...HEAVY_WEAPON_FEATS, "Dual Wielder"],
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function isFeatBlockedForArchetype(
  featName: string,
  archetype: BuildArchetype,
): boolean {
  const name = normalizeName(featName);
  return ARCHETYPE_BLOCKED_FEATS[archetype].some(
    (blocked) => normalizeName(blocked) === name,
  );
}

export function signatureFeatRank(
  featName: string,
  archetype: BuildArchetype,
): number {
  const name = normalizeName(featName);
  return ARCHETYPE_SIGNATURE_FEATS[archetype].findIndex(
    (signature) => normalizeName(signature) === name,
  );
}

// ─── Origin feats ────────────────────────────────────────────────────────────

/** Origin feats tried first (RPGBOT then decides among them). */
export function preferredOriginFeatNames(archetype: BuildArchetype): readonly string[] {
  if (archetype === "caster") return ["Magic Initiate", "Alert", "Lucky", "Skilled"];
  if (archetype === "gish") return ["Magic Initiate", "Alert", "Tough", "Lucky"];
  return ["Alert", "Tough", "Savage Attacker", "Lucky"];
}

// ─── Class feature choices (Divine Order, Primal Order, …) ───────────────────

const FRONTLINE_FEATURE_CHOICES = ["Protector", "Warden"];
const CASTER_FEATURE_CHOICES = ["Thaumaturge", "Magician"];

/** Option names to prefer on feature-choice progressions for this archetype. */
export function preferredFeatureChoiceNames(
  archetype: BuildArchetype,
): readonly string[] {
  return archetype === "caster" ? CASTER_FEATURE_CHOICES : FRONTLINE_FEATURE_CHOICES;
}

/** Stable sort: names listed in `preferred` first, in that order. */
export function sortByPreferredNames<T>(
  items: readonly T[],
  nameOf: (item: T) => string,
  preferred: readonly string[],
): T[] {
  const rank = (item: T) => {
    const index = preferred.findIndex(
      (name) => normalizeName(name) === normalizeName(nameOf(item)),
    );
    return index === -1 ? preferred.length : index;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

export function matchesAnyName(name: string, names: readonly string[]): boolean {
  const key = normalizeName(name);
  return names.some((candidate) => normalizeName(candidate) === key);
}
