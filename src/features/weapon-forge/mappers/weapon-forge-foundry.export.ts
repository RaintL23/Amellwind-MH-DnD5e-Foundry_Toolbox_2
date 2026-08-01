import type { Weapon } from "@/shared/types";
import { isBaseRarity, isWeaponFeatureColumn } from "@/shared/types";
import { makeWeaponSlot } from "@/features/builder/utils/equipment.factory";
import { buildWeaponItem } from "@/features/builder/foundry-export/item.builders";
import type { FoundryItem } from "@/features/builder/foundry-export/foundry.types";
import {
  resolveCatalogIconForWeaponName,
  toFoundryImgPath,
} from "@/features/weapons/utils/weapon-icon.utils";
import type { CustomWeapon } from "../types/weapon-forge.types";
import {
  getTypedBonusValue,
  resolveFeatureDef,
} from "../utils/weapon-forge-features.utils";

const DEFAULT_FOUNDRY_WEAPON_IMG =
  "icons/weapons/swords/sword-broad-steel.webp";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseBonusNumber(raw: string): number {
  const match = raw.trim().match(/([+-]?\d+)/);
  if (!match) return 0;
  return Math.abs(Number.parseInt(match[1], 10)) || 0;
}

function resolveMagicalBonus(
  weapon: CustomWeapon,
  rarityIndex: number,
): number {
  const row = weapon.rarityRows[rarityIndex];
  if (!row || isBaseRarity(row.rarity)) return 0;
  const toHit = parseBonusNumber(getTypedBonusValue(row, "toHit"));
  const damage = parseBonusNumber(getTypedBonusValue(row, "damage"));
  return Math.max(toHit, damage);
}

function columnTokens(val: string | string[] | undefined): string[] {
  if (val == null) return [];
  if (Array.isArray(val)) {
    return val.map(String).filter((n) => n && n !== "--" && n !== "-");
  }
  const s = String(val).trim();
  if (!s || s === "--" || s === "-") return [];
  return s
    .split(/,\s*/)
    .map((n) => n.trim())
    .filter(Boolean);
}

function collectUnlockedFeatureTokens(
  weapon: CustomWeapon,
  rarityIndex: number,
): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (let i = 0; i <= rarityIndex; i++) {
    const row = weapon.rarityRows[i];
    if (!row) continue;
    for (const [label, val] of Object.entries(row.columns)) {
      if (!isWeaponFeatureColumn(label)) continue;
      for (const token of columnTokens(val)) {
        const key = token.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        tokens.push(token);
      }
    }
  }

  return tokens;
}

function buildFoundryDescriptionHtml(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  const parts: string[] = [];
  if (weapon.description.trim()) {
    parts.push(`<p>${escapeHtml(weapon.description.trim())}</p>`);
  }
  for (const note of weapon.supplementaryNotes) {
    if (note.trim()) {
      parts.push(`<p>${escapeHtml(note.trim())}</p>`);
    }
  }

  const features = weapon.customFeatures ?? [];
  const unlocked = collectUnlockedFeatureTokens(weapon, rarityIndex);
  if (unlocked.length > 0) {
    parts.push("<h3>Features</h3>");
    for (const token of unlocked) {
      const def = resolveFeatureDef(features, token);
      const name = def?.name ?? token;
      const desc = def?.description?.trim();
      parts.push(`<p><strong>${escapeHtml(name)}</strong></p>`);
      if (desc) {
        for (const para of desc.split(/\n\s*\n/)) {
          const trimmed = para.trim();
          if (!trimmed) continue;
          parts.push(
            `<p>${escapeHtml(trimmed).replace(/\n/g, "<br/>")}</p>`,
          );
        }
      }
    }
  }

  return parts.join("");
}

function resolveWeaponImg(weapon: CustomWeapon): string {
  const explicit = weapon.img?.trim();
  if (explicit) {
    return toFoundryImgPath(explicit) ?? DEFAULT_FOUNDRY_WEAPON_IMG;
  }
  const catalog = resolveCatalogIconForWeaponName(weapon.name);
  if (catalog) {
    return toFoundryImgPath(catalog) ?? DEFAULT_FOUNDRY_WEAPON_IMG;
  }
  return DEFAULT_FOUNDRY_WEAPON_IMG;
}

/**
 * Builds a standalone Foundry dnd5e Item (`type: "weapon"`) for the selected rarity.
 */
export function buildWeaponFoundryItem(
  weapon: CustomWeapon,
  rarityIndex: number,
): FoundryItem {
  const clamped = Math.max(
    0,
    Math.min(rarityIndex, Math.max(0, weapon.rarityRows.length - 1)),
  );
  const row = weapon.rarityRows[clamped];
  const rarityLabel = row?.rarity ?? "Common";
  const magicalBonus = resolveMagicalBonus(weapon, clamped);

  const weaponCategory: Weapon["weaponCategory"] =
    weapon.proficiency?.tier === "simple"
      ? "simple"
      : weapon.proficiency?.tier === "martial" ||
          weapon.proficiency?.tier === "martial-or-simple"
        ? "martial"
        : "martial";

  const exportWeapon: Weapon = {
    ...weapon,
    weaponCategory,
    baseName: weapon.name,
    itemRarityLabel: isBaseRarity(rarityLabel) ? undefined : rarityLabel,
    name:
      magicalBonus > 0 && !/^\+\d+\s/.test(weapon.name)
        ? `+${magicalBonus} ${weapon.name}`
        : weapon.name,
  };

  const equipped = makeWeaponSlot(exportWeapon, rarityLabel);
  const item = buildWeaponItem(equipped, {
    equipped: false,
    description: buildFoundryDescriptionHtml(weapon, clamped),
  });

  item.img = resolveWeaponImg(weapon);

  if (row && !isBaseRarity(row.rarity)) {
    const system = item.system as Record<string, unknown>;
    system.rarity = mapRarityLabel(row.rarity);
    if (magicalBonus > 0) {
      system.magicalBonus = magicalBonus;
      const props = Array.isArray(system.properties)
        ? [...(system.properties as string[])]
        : [];
      if (!props.includes("mgc")) props.push("mgc");
      system.properties = props;
    }
  }

  return item;
}

function mapRarityLabel(label: string): string {
  switch (label.trim().toLowerCase()) {
    case "common":
      return "common";
    case "uncommon":
      return "uncommon";
    case "rare":
      return "rare";
    case "very rare":
      return "veryRare";
    case "legendary":
      return "legendary";
    default:
      return "";
  }
}

export function foundryItemFilename(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  const rarity =
    weapon.rarityRows[rarityIndex]?.rarity ?? "item";
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `fvtt-Item-${slug(weapon.name) || "weapon"}-${slug(rarity) || "item"}.json`;
}
