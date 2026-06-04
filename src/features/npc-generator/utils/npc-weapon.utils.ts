import type { AbilityKey, Entry } from "@/shared/types";
import type {
  OptionalFeature,
  RarityTier,
  Weapon,
} from "@/shared/types";
import { DMG_TYPE_LABELS, RARITY_ORDER } from "@/shared/types";
import type { NpcAttackDefinition } from "@/shared/types/npc.types";
import { resolveWeaponBaseFeatures } from "@/features/weapons/services/optionalfeature.service";
import {
  buildColumnChains,
  getBaseFeatureName,
} from "@/features/weapons/utils/weapon-feature-chains.utils";
import { getRaritySlideStatEntries } from "@/features/weapons/utils/rarity-slide.utils";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { NPC_WEAPON_META_FEATURE, isVariantPrimaryWeapon } from "../data/npc-ammo-attacks.data";

const DMG_TYPE_TO_NPC: Record<string, string> = {
  S: "slashing",
  P: "piercing",
  B: "bludgeoning",
};

export interface NpcWeaponContext {
  weapons: Weapon[];
  featuresMap: Map<string, OptionalFeature>;
}

export function findWeaponByName(
  weapons: Weapon[],
  name: string,
): Weapon | undefined {
  const lower = name.toLowerCase();
  return weapons.find((w) => w.name.toLowerCase() === lower);
}

/** Maps NPC hit dice + template tier to a weapon rarity index (0–4). */
export function getWeaponRarityIndex(
  hitDiceCount: number,
  tier: number,
): number {
  const score = hitDiceCount + tier * 2;
  if (score <= 4) return 0;
  if (score <= 8) return 1;
  if (score <= 12) return 2;
  if (score <= 16) return 3;
  return 4;
}

export function getRarityTierAtIndex(index: number): RarityTier {
  return RARITY_ORDER[Math.min(RARITY_ORDER.length - 1, Math.max(0, index))];
}

function parseFlatBonus(bonus?: string): number {
  if (!bonus) return 0;
  const match = bonus.match(/[+-]?\d+/);
  return match ? Number(match[0]) : 0;
}

export function resolveNpcAttackFromWeapon(
  attack: NpcAttackDefinition,
  weapon: Weapon,
  rarityIndex: number,
): NpcAttackDefinition {
  const row =
    weapon.rarityRows[rarityIndex] ??
    weapon.rarityRows[weapon.rarityRows.length - 1];
  const { bonus } = getRaritySlideStatEntries(row);
  const flatFromRarity = parseFlatBonus(bonus);
  const isRanged = Boolean(weapon.range?.trim());
  const ability: AbilityKey =
    weapon.properties.includes("F") && !weapon.properties.includes("2H")
      ? "dex"
      : attack.ability;

  return {
    ...attack,
    name: weapon.name,
    kind: isRanged ? "rw" : attack.kind,
    ability,
    reachOrRange: weapon.range?.trim() || attack.reachOrRange,
    damageDice: weapon.dmg1 || attack.damageDice,
    flatDamageBonus:
      flatFromRarity !== 0 ? flatFromRarity : attack.flatDamageBonus,
    damageType:
      DMG_TYPE_TO_NPC[weapon.dmgType] ??
      DMG_TYPE_LABELS[weapon.dmgType]?.toLowerCase() ??
      attack.damageType,
  };
}

function featureAllowedAtRarity(
  feat: OptionalFeature,
  rarityIndex: number,
): boolean {
  if (!feat.prerequisiteRarity) return true;
  const reqIdx = RARITY_ORDER.indexOf(feat.prerequisiteRarity as RarityTier);
  return reqIdx >= 0 && reqIdx <= rarityIndex;
}

function collectFeatureNamesAtRarity(
  weapon: Weapon,
  rarityIndex: number,
): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  const add = (name: string) => {
    const key = getBaseFeatureName(name).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(name);
  };

  for (const col of buildColumnChains(weapon.rarityRows)) {
    for (const chain of col.chains) {
      const eligible = chain.features.filter((f) => f.rarityIndex <= rarityIndex);
      if (eligible.length > 0) {
        add(eligible[eligible.length - 1].name);
      }
    }
  }

  return names;
}

function maxFeaturesForRarity(rarityIndex: number): number {
  if (rarityIndex <= 0) return 1;
  if (rarityIndex <= 2) return 2;
  return 3;
}

export function buildWeaponFeatureActions(
  weapon: Weapon,
  rarityIndex: number,
  featuresMap: Map<string, OptionalFeature>,
): Entry[] {
  const maxFeatures = maxFeaturesForRarity(rarityIndex);
  const actions: Entry[] = [];
  const seen = new Set<string>();

  const addFeature = (feat: OptionalFeature | undefined) => {
    if (!feat || actions.length >= maxFeatures) return;
    const key = feat.name.toLowerCase();
    if (seen.has(key)) return;
    if (NPC_WEAPON_META_FEATURE.test(feat.name)) return;
    if (!featureAllowedAtRarity(feat, rarityIndex)) return;
    seen.add(key);
    actions.push({
      name: feat.name,
      entries: feat.paragraphs.map((p) => parseFiveToolsMarkup(p)),
    });
  };

  for (const feat of resolveWeaponBaseFeatures(weapon, featuresMap)) {
    addFeature(feat);
  }

  for (const name of collectFeatureNamesAtRarity(weapon, rarityIndex)) {
    addFeature(findFeatureByName(featuresMap, name));
    if (actions.length >= maxFeatures) break;
  }

  return actions;
}

function findFeatureByName(
  featuresMap: Map<string, OptionalFeature>,
  name: string,
): OptionalFeature | undefined {
  const lower = name.toLowerCase();
  const direct = featuresMap.get(lower);
  if (direct) return direct;

  const base = getBaseFeatureName(name).toLowerCase();
  for (const feat of featuresMap.values()) {
    if (feat.name.toLowerCase() === lower) return feat;
    if (getBaseFeatureName(feat.name).toLowerCase() === base) return feat;
  }
  return undefined;
}

export function hasRapidFireFeature(
  weapon: Weapon,
  featuresMap: Map<string, OptionalFeature>,
): boolean {
  return resolveWeaponBaseFeatures(weapon, featuresMap).some((f) =>
    /rapid fire/i.test(f.name),
  );
}

export function getPrimaryMhAttack(
  attacks: NpcAttackDefinition[],
): NpcAttackDefinition | undefined {
  return attacks.find((a) => a.mhWeaponName);
}

export function resolveAttacksWithWeapons(
  attacks: NpcAttackDefinition[],
  weaponContext: NpcWeaponContext | null,
  rarityIndex: number,
): NpcAttackDefinition[] {
  if (!weaponContext) return attacks;

  const primaryWeaponName = attacks[0]?.mhWeaponName;

  return attacks.map((attack, index) => {
    if (index !== 0 || !primaryWeaponName) return attack;
    const weapon = findWeaponByName(weaponContext.weapons, primaryWeaponName);
    if (!weapon) return attack;
    return resolveNpcAttackFromWeapon(attack, weapon, rarityIndex);
  });
}

export function collectPrimaryWeaponFeatureActions(
  attacks: NpcAttackDefinition[],
  weaponContext: NpcWeaponContext | null,
  rarityIndex: number,
): Entry[] {
  if (!weaponContext) return [];

  const primary = getPrimaryMhAttack(attacks);
  if (!primary?.mhWeaponName) return [];

  const weapon = findWeaponByName(weaponContext.weapons, primary.mhWeaponName);
  if (!weapon) return [];

  if (isVariantPrimaryWeapon(weapon.name)) return [];

  return buildWeaponFeatureActions(weapon, rarityIndex, weaponContext.featuresMap);
}

/** @deprecated Use collectPrimaryWeaponFeatureActions */
export function collectWeaponFeatureActionsForAttacks(
  attacks: NpcAttackDefinition[],
  weaponContext: NpcWeaponContext | null,
  rarityIndex: number,
): Entry[] {
  return collectPrimaryWeaponFeatureActions(attacks, weaponContext, rarityIndex);
}

export function getPrimaryShieldAcBonus(
  attacks: NpcAttackDefinition[],
  weaponContext: NpcWeaponContext | null,
  rarityIndex: number,
): number | undefined {
  if (!weaponContext) return undefined;

  const primary = getPrimaryMhAttack(attacks);
  if (!primary?.mhWeaponName) return undefined;

  const weapon = findWeaponByName(weaponContext.weapons, primary.mhWeaponName);
  if (!weapon?.includesShield || weapon.acBonus == null) return undefined;

  const row = weapon.rarityRows[rarityIndex] ?? weapon.rarityRows[weapon.rarityRows.length - 1];
  if (!row) return weapon.acBonus;
  const acEntry = Object.entries(row.columns).find(([label]) =>
    /ac bonus/i.test(label),
  );
  if (acEntry) {
    const parsed = parseFlatBonus(
      Array.isArray(acEntry[1]) ? acEntry[1][0] : acEntry[1],
    );
    return parsed || weapon.acBonus;
  }
  return weapon.acBonus;
}
