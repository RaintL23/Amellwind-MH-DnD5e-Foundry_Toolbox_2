import type { MaterialEffectSlot, ResourceRarity } from "@/shared/types";

/**
 * Rarity assignments for named MHMM rune effects that are not in the GTMH
 * catalog. Key = `${slot}:${normalized name}` (lowercase, no trailing period).
 */
const DISCOVERED_EFFECT_RARITY_BY_KEY: Record<string, ResourceRarity> = {
  "armor:flexible leathercraft": "Common",
  /** Always-on DoT cleanse at start of turn (Khezu / Gigginox / Red Khezu). */
  "armor:recovery level": "Rare",
  /** Strong Winds immunity (Legiana / Kut-Ku). */
  "armor:wind resist": "Common",
  /** Long-rest exhaustion recovery (Chaotic Gore Magala). */
  "armor:stamina recovery": "Very Rare",
  /** Psychoserum duration extension (Bloodbath Diablos). */
  "armor:psychic": "Uncommon",
  /** Mineral gather advantage + double yield (Crystalbeard Uragaan). */
  "armor:crystallography": "Rare",
  /** Herb die upgrade to hit die (Dreadqueen Rathian). */
  "armor:pro herbology": "Common",
  /** Save DC +2 and area consumable share (Dreadqueen Mantle). */
  "armor:dreadqueen": "Rare",
  /** Hunting Horn miss-trigger notes (Dalamadur). */
  "weapon:jingle": "Uncommon",
  /** Barbarian haste bloodrage (Bloodbath Diablos). */
  "weapon:slugger": "Uncommon",
  "armor:trap master": "Uncommon",
  "armor:trap master+": "Rare",

  /** Max-HP sacrifice for turn-limited damage boost (Gaismagorm Qurio). */
  "weapon:dereliction": "Rare",

  /** Stacks Rajang Apoplexy + Hardclaw (Furious Rajang). */
  "weapon:rajang will": "Rare",

  "weapon:fastcharge": "Uncommon",
  "weapon:fastcharge+": "Rare",
  "weapon:fastcharge+2": "Rare",

  /** Dodge-action AC-for-save once per long rest (Juvenile Uragaan). */
  "armor:uragaan minor protection": "Uncommon",

  /** Bonus-action off-hand double attack (Lala Barina). */
  "weapon:blade dancer": "Rare",

  /** Crit move without OAs (Lala Barina). */
  "weapon:graceful strike": "Common",

  /** Hidden / flanking save disadvantage (Lucent Nargacuga). */
  "weapon:sneak attack": "Uncommon",

  /** Reaction position swap (Lunagaron). */
  "armor:redirection": "Rare",
  "armor:redirection+": "Very Rare",

  /** Full-HP damage-die reroll on melee attacks. */
  "weapon:peak performance": "Uncommon",

  /** HH melody duration + cord length (Elderfrost Gammoth / Dreadqueen). */
  "weapon:horn maestro+2": "Uncommon",

  "armor:divine blessing": "Rare",
  "armor:divine blessing+": "Rare",
  "armor:divine blessing+2": "Very Rare",
  "armor:divine blessing+3": "Very Rare",
  "armor:divine blessing+4": "Legendary",
};

function overlayKey(slot: MaterialEffectSlot, name: string): string {
  return `${slot}:${name.replace(/\.$/, "").trim().toLowerCase()}`;
}

/** Assigned rarity for a discovered named effect, or null if still unclassified. */
export function lookupDiscoveredEffectRarity(
  name: string,
  slot: MaterialEffectSlot,
): ResourceRarity | null {
  return DISCOVERED_EFFECT_RARITY_BY_KEY[overlayKey(slot, name)] ?? null;
}
