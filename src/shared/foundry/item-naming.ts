import { kebab } from "./mappings";

/** Foundry VTT convention for downloaded Item document filenames. */
export const FOUNDRY_ITEM_FILE_PREFIX = "fvtt-Item-";

const ACTOR_DOCUMENT_TYPES = new Set(["character", "npc", "vehicle", "group"]);

const WEAPON_RARITY_SUFFIX_RE =
  /\s*\((Base|Common|Uncommon|Rare|Very Rare|Legendary|Standard)\)\s*$/i;

/** True when `data` looks like a Foundry Item document (not an Actor). */
export function isFoundryItemDocument(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const type = (data as { type?: unknown }).type;
  return typeof type === "string" && type.length > 0 && !ACTOR_DOCUMENT_TYPES.has(type);
}

/**
 * Ensures `fvtt-Item-{slug}.json` (case-normalized prefix). Idempotent if the
 * prefix is already present.
 */
export function ensureFoundryItemFilename(filename: string): string {
  const trimmed = filename.trim() || "item.json";
  const withExt = /\.json$/i.test(trimmed) ? trimmed : `${trimmed}.json`;
  const stem = withExt.replace(/\.json$/i, "");
  const withoutPrefix = stem.replace(/^fvtt-item-/i, "");
  const slug = kebab(withoutPrefix) || "item";
  return `${FOUNDRY_ITEM_FILE_PREFIX}${slug}.json`;
}

/** Join human labels into `fvtt-Item-part-a-part-b.json`. */
export function buildFoundryItemFilename(
  ...parts: Array<string | null | undefined>
): string {
  const slug = parts
    .map((part) => (part?.trim() ? kebab(part) : ""))
    .filter(Boolean)
    .join("-");
  return ensureFoundryItemFilename(`${slug || "item"}.json`);
}

/** Strip a trailing `(Rarity)` already present on a weapon display name. */
export function stripFoundryWeaponRaritySuffix(name: string): string {
  return name.replace(WEAPON_RARITY_SUFFIX_RE, "").trim();
}

/**
 * Canonical Foundry weapon Item name: `"Great Sword (Rare)"`.
 * Omits the suffix when rarity is empty; does not double-append.
 */
export function formatWeaponFoundryItemName(
  weaponName: string,
  rarity?: string | null,
): string {
  const stem = stripFoundryWeaponRaritySuffix(weaponName.trim());
  const rarityLabel = rarity?.trim();
  if (!stem) return rarityLabel ? `(${rarityLabel})` : "";
  if (!rarityLabel) return stem;
  if (WEAPON_RARITY_SUFFIX_RE.test(weaponName.trim())) {
    // Re-apply with the requested rarity (authoritative).
    return `${stem} (${rarityLabel})`;
  }
  return `${stem} (${rarityLabel})`;
}
