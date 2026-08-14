/**
 * Foundry core icon paths used as Plutonium-style fallbacks when 5etools fluff
 * art is missing (School Default Image Fallback / type-based item icons).
 * Named gear (gauntlets, helms, boots) prefers core `icons/...` over fluff;
 * mh-icons remain for hunter weapons and other Amellwind-specific items.
 */

/** Spell school → Foundry core icon (dnd5e school fallback style). */
const SPELL_SCHOOL_ICONS: Record<string, string> = {
  A: "icons/magic/defensive/shield-barrier-flaming-diamond-blue.webp",
  abj: "icons/magic/defensive/shield-barrier-flaming-diamond-blue.webp",
  abjuration: "icons/magic/defensive/shield-barrier-flaming-diamond-blue.webp",
  C: "icons/magic/symbols/runes-star-magenta.webp",
  con: "icons/magic/symbols/runes-star-magenta.webp",
  conjuration: "icons/magic/symbols/runes-star-magenta.webp",
  D: "icons/magic/perception/eye-ringed-green.webp",
  div: "icons/magic/perception/eye-ringed-green.webp",
  divination: "icons/magic/perception/eye-ringed-green.webp",
  E: "icons/magic/control/hypnosis-mesmerism-eye.webp",
  enc: "icons/magic/control/hypnosis-mesmerism-eye.webp",
  enchantment: "icons/magic/control/hypnosis-mesmerism-eye.webp",
  I: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
  ill: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
  illusion: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
  V: "icons/magic/fire/beam-jet-stream-yellow.webp",
  evo: "icons/magic/fire/beam-jet-stream-yellow.webp",
  evocation: "icons/magic/fire/beam-jet-stream-yellow.webp",
  N: "icons/magic/death/skull-horned-worn-fire-blue.webp",
  nec: "icons/magic/death/skull-horned-worn-fire-blue.webp",
  necromancy: "icons/magic/death/skull-horned-worn-fire-blue.webp",
  T: "icons/magic/symbols/circle-ouroboros.webp",
  trs: "icons/magic/symbols/circle-ouroboros.webp",
  transmutation: "icons/magic/symbols/circle-ouroboros.webp",
};

const DEFAULT_SPELL_ICON = "icons/magic/symbols/runes-star-blue.webp";

export const FOUNDRY_ITEM_ICONS = {
  weaponMelee: "icons/weapons/swords/sword-broad-red.webp",
  weaponRanged: "icons/weapons/bows/shortbow-recurve.webp",
  armor: "icons/equipment/chest/breastplate-banded-steel.webp",
  shield: "icons/equipment/shield/heater-steel-boss-red.webp",
  gauntlet: "icons/equipment/hand/gauntlet-tooled-leather-brown.webp",
  helm: "icons/equipment/head/helm-barbute-engraved-steel.webp",
  boots: "icons/equipment/feet/boots-leather-simple-brown.webp",
  trinket: "icons/commodities/treasure/token-gold-gem-purple.webp",
  loot: "icons/containers/bags/pack-leather-brown.webp",
  tool: "icons/tools/hand/hammer-and-nail.webp",
  clothing: "icons/equipment/chest/shirt-collared-brown.webp",
  potion: "icons/consumables/potions/potion-tube-corked-red.webp",
  consumable: "icons/consumables/plants/herb-tied-bundle-green.webp",
  ammunition: "icons/weapons/ammunition/arrows-bodkin-yellow-red.webp",
  bolts: "icons/weapons/ammunition/arrows-broadhead-white.webp",
  quiver: "icons/containers/ammunition/arrows-quiver-brown.webp",
  gaming: "icons/sundries/gaming/dice-runed-brown.webp",
  pack: "icons/containers/bags/pack-canvas-white-brown.webp",
  feat: "icons/sundries/books/book-red-exclamation.webp",
  classFeature: "icons/skills/melee/weapons-crossed-swords-yellow.webp",
  subclassFeature: "icons/skills/melee/weapons-crossed-swords-purple.webp",
  raceFeature: "icons/environment/people/group.webp",
  backgroundFeature: "icons/environment/people/commoner.webp",
} as const;

/** Common PHB/XPHB base weapons → recognizable Foundry core icons. */
const BASE_WEAPON_ICONS: Record<string, string> = {
  club: "icons/weapons/clubs/club-simple-barbed.webp",
  dagger: "icons/weapons/daggers/dagger-straight-blue.webp",
  greatclub: "icons/weapons/maces/mace-spiked-banded-wood.webp",
  handaxe: "icons/weapons/axes/shortaxe-simple-black.webp",
  javelin: "icons/weapons/polearms/javelin.webp",
  "light hammer": "icons/weapons/hammers/hammer-war-spiked-simple.webp",
  mace: "icons/weapons/maces/mace-round-spiked-grey.webp",
  quarterstaff: "icons/weapons/staves/staff-simple.webp",
  sickle: "icons/weapons/sickles/sickle-simple-grey.webp",
  spear: "icons/weapons/polearms/spear-flared-green.webp",
  "wooden staff": "icons/weapons/staves/staff-simple.webp",
  battleaxe: "icons/weapons/axes/axe-battle-worn.webp",
  flail: "icons/weapons/maces/flail-spiked-grey.webp",
  glaive: "icons/weapons/polearms/glaive-simple.webp",
  greataxe: "icons/weapons/axes/axe-double-short-orange.webp",
  greatsword: "icons/weapons/swords/greatsword-guard.webp",
  halberd: "icons/weapons/polearms/halberd-crescent-steel.webp",
  lance: "icons/weapons/polearms/spear-hooked-brown.webp",
  longsword: "icons/weapons/swords/sword-guard.webp",
  maul: "icons/weapons/hammers/hammer-double-bronze.webp",
  morningstar: "icons/weapons/maces/mace-round-spiked-grey.webp",
  pike: "icons/weapons/polearms/pike-flared-brown.webp",
  rapier: "icons/weapons/swords/sword-guard-gold-red.webp",
  scimitar: "icons/weapons/swords/scimitar-guard.webp",
  shortsword: "icons/weapons/swords/shortsword-broad.webp",
  trident: "icons/weapons/polearms/trident-fork-white.webp",
  "war pick": "icons/weapons/axes/pickaxe-stone-simple.webp",
  warhammer: "icons/weapons/hammers/hammer-war-spiked.webp",
  whip: "icons/weapons/misc/whip-red-yellow.webp",
  dart: "icons/weapons/thrown/dagger-ringed-steel.webp",
  "light crossbow": "icons/weapons/crossbows/crossbow-simple-brown.webp",
  "hand crossbow": "icons/weapons/crossbows/handcrossbow-black.webp",
  "heavy crossbow": "icons/weapons/crossbows/crossbow-heavy-black.webp",
  shortbow: "icons/weapons/bows/shortbow-recurve.webp",
  longbow: "icons/weapons/bows/longbow-recurve-brown.webp",
  sling: "icons/weapons/slings/slingshot-wood.webp",
  blowgun: "icons/weapons/thrown/dart-feathered.webp",
  net: "icons/tools/fishing/net-simple-brown.webp",
};

function normalizeIconName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    // "Bolts (20)" / "Arrows (×20)" → strip quantity suffix for matching
    .replace(/\s*[(\u00d7×]\s*\d+\s*\)?\s*$/i, "")
    .replace(/\s+/g, " ");
}

/**
 * Foundry core icon for wearable gear named after a slot (gauntlets, helm, …).
 * Prefer these over mh-icons / book fluff — they thumbnail cleanly on the VTT.
 */
export function resolveNamedGearIcon(name: string): string | undefined {
  const lower = normalizeIconName(name);
  if (!lower) return undefined;

  if (/\b(gauntlet|glove|bracer|vambrace)s?\b/.test(lower)) {
    return FOUNDRY_ITEM_ICONS.gauntlet;
  }
  if (/\b(helm|helmet|circlet|crown)\b/.test(lower)) {
    return FOUNDRY_ITEM_ICONS.helm;
  }
  if (/\b(boot|shoe|greave)s?\b/.test(lower)) {
    return FOUNDRY_ITEM_ICONS.boots;
  }
  if (/\b(cloak|cape|mantle|robe)\b/.test(lower)) {
    return FOUNDRY_ITEM_ICONS.clothing;
  }
  if (/\bring\b/.test(lower) && !/\bring mail\b/.test(lower)) {
    return FOUNDRY_ITEM_ICONS.trinket;
  }
  if (/\b(amulet|necklace|pendant|periapt|talisman)\b/.test(lower)) {
    return FOUNDRY_ITEM_ICONS.trinket;
  }
  return undefined;
}

/** Default Foundry icon for a feat/feature subtype. */
export function resolveFeatureIcon(
  subtype: string | undefined,
  fluffImg?: string | null,
): string {
  if (fluffImg?.trim()) return fluffImg.trim();
  switch (subtype) {
    case "class":
      return FOUNDRY_ITEM_ICONS.classFeature;
    case "subclass":
      return FOUNDRY_ITEM_ICONS.subclassFeature;
    case "race":
      return FOUNDRY_ITEM_ICONS.raceFeature;
    case "background":
      return FOUNDRY_ITEM_ICONS.backgroundFeature;
    case "feat":
      return FOUNDRY_ITEM_ICONS.feat;
    default:
      return FOUNDRY_ITEM_ICONS.feat;
  }
}

/** Resolves a spell icon: fluff art URL when present, else school fallback. */
export function resolveSpellIcon(
  school: string | undefined,
  fluffImg?: string | null,
): string {
  if (fluffImg?.trim()) return fluffImg.trim();
  if (!school) return DEFAULT_SPELL_ICON;
  return SPELL_SCHOOL_ICONS[school] ?? SPELL_SCHOOL_ICONS[school.toLowerCase()] ?? DEFAULT_SPELL_ICON;
}

/** Prefer fluff art; otherwise a Foundry core path. */
export function resolveItemIcon(
  fallback: string,
  fluffImg?: string | null,
): string {
  if (fluffImg?.trim()) return fluffImg.trim();
  return fallback;
}

/**
 * Armor / shield icon: slot-named Foundry gear first (gauntlets, helm, boots),
 * then fluff, then category fallback. mh-icons stay for hunter weapons only.
 */
export function resolveArmorItemIcon(
  armorName: string,
  category: "light" | "medium" | "heavy" | "shield" | "clothing" | undefined,
  fluffImg?: string | null,
): string {
  const named = resolveNamedGearIcon(armorName);
  if (named) return named;
  if (fluffImg?.trim()) return fluffImg.trim();
  if (category === "shield") return FOUNDRY_ITEM_ICONS.shield;
  if (category === "clothing") return FOUNDRY_ITEM_ICONS.clothing;
  return FOUNDRY_ITEM_ICONS.armor;
}

/**
 * Weapon icon: prefer a recognizable Foundry base-weapon path, then fluff art,
 * then melee/ranged type fallback. Book fluff often crops poorly as VTT thumbnails.
 */
export function resolveWeaponItemIcon(
  weaponName: string,
  ranged: boolean,
  fluffImg?: string | null,
): string {
  const keyed = BASE_WEAPON_ICONS[normalizeIconName(weaponName)];
  if (keyed) return keyed;
  if (fluffImg?.trim()) return fluffImg.trim();
  return ranged ? FOUNDRY_ITEM_ICONS.weaponRanged : FOUNDRY_ITEM_ICONS.weaponMelee;
}

/**
 * Inventory / loot icon when fluff art is missing: match by 5etools type abbrev
 * and common adventuring-gear names so ammo/quivers/gaming sets are not the bag.
 */
export function resolveInventoryItemIcon(
  name: string,
  typeCode: string | undefined,
  fluffImg?: string | null,
): string {
  const named = resolveNamedGearIcon(name);
  if (named) return named;
  if (fluffImg?.trim()) return fluffImg.trim();

  const abbrev = (typeCode ?? "").split("|")[0].trim().toUpperCase();
  const lower = normalizeIconName(name);

  if (
    abbrev === "A" ||
    /\b(arrow|arrows|bolt|bolts|needle|needles|bullet|bullets)\b/.test(lower)
  ) {
    if (/\bbolt/.test(lower)) return FOUNDRY_ITEM_ICONS.bolts;
    return FOUNDRY_ITEM_ICONS.ammunition;
  }

  if (/\bquiver\b/.test(lower) || /\bcrossbow bolt case\b/.test(lower)) {
    return FOUNDRY_ITEM_ICONS.quiver;
  }

  if (
    abbrev === "GS" ||
    /\bgaming set\b/.test(lower) ||
    lower === "setgaming" ||
    /\b(dice set|playing card|dragonchess|three-dragon ante)\b/.test(lower)
  ) {
    return FOUNDRY_ITEM_ICONS.gaming;
  }

  if (abbrev === "INS" || abbrev === "AT" || abbrev === "T") {
    return FOUNDRY_ITEM_ICONS.tool;
  }

  if (abbrev === "P") return FOUNDRY_ITEM_ICONS.potion;
  if (abbrev === "SC" || abbrev === "EXP" || abbrev === "FD") {
    return FOUNDRY_ITEM_ICONS.consumable;
  }

  if (/\bpack\b/.test(lower) || /\bpouch\b/.test(lower)) {
    return FOUNDRY_ITEM_ICONS.pack;
  }

  if (
    /\b(clothes|clothing|costume|robe|outfit|gown|vestments|uniform)\b/.test(
      lower,
    )
  ) {
    return FOUNDRY_ITEM_ICONS.clothing;
  }

  return FOUNDRY_ITEM_ICONS.loot;
}
