import type { FoundryItem } from "@/shared/foundry";
import {
  escapeHtml,
  foundryDividerHtml,
  foundryRarityTitleHtml,
  toFoundryDescriptionHtml,
  buildEffect,
  EFFECT_MODE,
} from "@/shared/foundry";
import {
  buildColumnChains,
  type ColumnChains,
  type FeatureUpgradeLink,
} from "@/features/weapons/utils/weapon-feature-chains.utils";
import {
  isPrimaryFeaturesColumn,
  type CustomWeapon,
} from "../types/weapon-forge.types";
import {
  getTypedBonusValue,
  resolveFeatureDef,
} from "../utils/weapon-forge-features.utils";
import {
  parseBonusNumber,
  DEFAULT_FOUNDRY_WEAPON_IMG,
} from "./weapon-forge-foundry.helpers";
import {
  resolveCatalogIconForWeaponName,
  toFoundryImgPath,
} from "@/features/weapons/utils/weapon-icon.utils";

export function appendFeatureDescription(
  parts: string[],
  name: string,
  description: string | undefined,
  nested: boolean,
  rarityLabel: string | undefined,
): void {
  if (nested) parts.push("<blockquote>");
  parts.push(`<p>${foundryRarityTitleHtml(name, rarityLabel)}</p>`);
  if (description?.trim()) {
    const enriched = toFoundryDescriptionHtml(description, { wrapHtml: false });
    for (const para of enriched.split(/\n\s*\n/)) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("<")) {
        parts.push(trimmed);
      } else {
        parts.push(`<p>${trimmed.replace(/\n/g, "<br/>")}</p>`);
      }
    }
  }
  if (nested) parts.push("</blockquote>");
}

export function resolveVisibleColumnChains(
  weapon: CustomWeapon,
  rarityIndex: number,
): ColumnChains[] {
  const features = weapon.customFeatures ?? [];
  const upgradeLinks: FeatureUpgradeLink[] = features.map((f) => ({
    id: f.id,
    name: f.name,
    upgradesFromId: f.upgradesFromId,
  }));

  const columnChains = buildColumnChains(weapon.rarityRows, {
    upgradeLinks: upgradeLinks.length > 0 ? upgradeLinks : undefined,
  });

  return columnChains
    .map(({ label, chains }) => ({
      label,
      chains: chains
        .filter((c) => c.introducedAtIndex <= rarityIndex)
        .map((chain) => ({
          ...chain,
          features: chain.features.filter((f) => f.rarityIndex <= rarityIndex),
        }))
        .filter((c) => c.features.length > 0),
    }))
    .filter(({ chains }) => chains.length > 0);
}

export function appendWeaponIntroHtml(
  parts: string[],
  weapon: CustomWeapon,
  options: { includeFiveToolsLink: boolean },
): void {
  if (weapon.description.trim()) {
    parts.push(
      toFoundryDescriptionHtml(weapon.description.trim(), {
        fiveToolsItemName: options.includeFiveToolsLink
          ? weapon.name
          : undefined,
        fiveToolsLinkLabel: options.includeFiveToolsLink
          ? `Open ${weapon.name} filters on 5e.tools`
          : undefined,
      }),
    );
  }
  for (const note of weapon.supplementaryNotes) {
    if (note.trim()) {
      parts.push(toFoundryDescriptionHtml(note.trim()));
    }
  }
}

export function buildFoundryDescriptionHtml(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  const parts: string[] = [];
  appendWeaponIntroHtml(parts, weapon, { includeFiveToolsLink: true });

  const features = weapon.customFeatures ?? [];
  const visibleCols = resolveVisibleColumnChains(weapon, rarityIndex);
  if (visibleCols.length === 0) return parts.join("");

  if (parts.length > 0) {
    parts.push(foundryDividerHtml());
  }

  let featureBlockIndex = 0;
  for (const { label, chains } of visibleCols) {
    parts.push(`<h3>${escapeHtml(label)}</h3>`);
    for (const chain of chains) {
      if (featureBlockIndex > 0) {
        parts.push(foundryDividerHtml());
      }
      featureBlockIndex += 1;
      chain.features.forEach((feat, fi) => {
        const def = resolveFeatureDef(features, feat.name);
        const displayName = def?.name ?? feat.name;
        const rarityLabel = weapon.rarityRows[feat.rarityIndex]?.rarity;
        appendFeatureDescription(
          parts,
          displayName,
          def?.description,
          fi > 0,
          rarityLabel,
        );
      });
    }
  }

  return parts.join("");
}

/**
 * Condensed Foundry chat card: base weapon text + combat feature names
 * (with upgrades). Resource columns (Phials, Coatings, …) are omitted.
 */
export function buildFoundryChatDescriptionHtml(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  const parts: string[] = [];
  appendWeaponIntroHtml(parts, weapon, { includeFiveToolsLink: false });

  const features = weapon.customFeatures ?? [];
  const featureCols = resolveVisibleColumnChains(weapon, rarityIndex).filter(
    ({ label }) => isPrimaryFeaturesColumn(label),
  );
  if (featureCols.length === 0) return parts.join("");

  if (parts.length > 0) {
    parts.push(foundryDividerHtml());
  }

  let featureBlockIndex = 0;
  for (const { chains } of featureCols) {
    for (const chain of chains) {
      if (featureBlockIndex > 0) {
        parts.push(foundryDividerHtml());
      }
      featureBlockIndex += 1;
      chain.features.forEach((feat, fi) => {
        const def = resolveFeatureDef(features, feat.name);
        const displayName = def?.name ?? feat.name;
        const rarityLabel = weapon.rarityRows[feat.rarityIndex]?.rarity;
        const title = foundryRarityTitleHtml(displayName, rarityLabel);
        if (fi === 0) {
          parts.push(`<p>${title}</p>`);
        } else {
          parts.push(`<blockquote><p>${title}</p></blockquote>`);
        }
      });
    }
  }

  return parts.join("");
}

/** Passive AE for typed AC bonuses on the selected rarity row. */
export function buildRarityPassiveEffects(
  weapon: CustomWeapon,
  rarityIndex: number,
): FoundryItem["effects"] {
  const row = weapon.rarityRows[rarityIndex];
  if (!row) return [];
  const acBonus = parseBonusNumber(getTypedBonusValue(row, "ac"));
  if (acBonus <= 0) return [];
  return [
    buildEffect({
      name: `${weapon.name} AC`,
      transfer: true,
      changes: [
        {
          key: "system.attributes.ac.bonus",
          mode: EFFECT_MODE.ADD,
          value: String(acBonus),
          priority: 20,
        },
      ],
    }),
  ];
}

export function resolveWeaponImg(weapon: CustomWeapon): string {
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


