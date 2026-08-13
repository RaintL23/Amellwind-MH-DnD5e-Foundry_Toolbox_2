import type { FoundryItem } from "@/shared/foundry";
import {
  foundryId,
  wrapItem,
  defaultMidiProperties,
  formatWeaponFoundryItemName,
  mapAmmunitionType,
  mapDamageType,
  mapRarity,
  mapWeaponProperty,
  mapWeaponTypeValue,
  parseWeaponRange,
  slugify,
  resolveWeaponItemIcon,
  stripFoundryWeaponRaritySuffix,
  toFoundryDescription,
} from "@/shared/foundry";
import type { Weapon, EquippedWeapon } from "@/shared/types";
import {
  buildWeaponMasteryDescriptionBlock,
  getWeaponMasteryKeyByWeaponName,
} from "../../data/weapon-mastery.data";
import { sourceBlock, parseDice, parseMagicBonus } from "./item-shared";

// ─── Weapon items ────────────────────────────────────────────────────────────

export interface WeaponItemOptions {
  equipped: boolean;
  /** Attack ability override (str/dex/""); "" lets Foundry auto-pick. */
  attackAbility?: string;
  /** Full item description (`system.description.value`). */
  description?: string;
  /** Condensed chat card text (`system.description.chat`). */
  chatDescription?: string;
  /** Foundry `img` (5etools fluff URL or core icon path). */
  img?: string;
}

function isRangedWeapon(weapon: Weapon): boolean {
  if (weapon.properties.some((p) => p.split("|")[0] === "A")) return true;
  if (weapon.ammoType) return true;
  return false;
}

/**
 * Description for Foundry export: Amellwind keeps its dedicated text; D&D 5e
 * base weapons append the Mastery rule (XPHB) when the catalog entry is empty.
 */
function resolveWeaponExportDescription(
  weapon: Weapon,
  override?: string,
): string {
  const base = (override ?? weapon.description ?? "").trim();
  if (weapon.contentSource !== "dnd") return base;

  const masteryKey =
    weapon.mastery?.trim() ||
    getWeaponMasteryKeyByWeaponName(weapon.baseName ?? weapon.name);
  const masteryBlock = buildWeaponMasteryDescriptionBlock(masteryKey);
  if (!masteryBlock) return base;
  if (/\bmastery\s*:/i.test(base)) return base;
  return base ? `${base}\n\n${masteryBlock}` : masteryBlock;
}

function resolveWeaponFoundryDisplayName(equipped: EquippedWeapon): {
  magicBonus: number;
  clean: string;
  displayName: string;
} {
  const weapon = equipped.weapon;
  const { bonus: magicBonus, clean } = parseMagicBonus(weapon.name);
  const stem = stripFoundryWeaponRaritySuffix(
    (weapon.baseName?.trim() || clean).trim(),
  );
  const rarityCandidate =
    equipped.rarity?.trim() || weapon.itemRarityLabel?.trim() || "";
  const rarityLabel =
    rarityCandidate && rarityCandidate.toLowerCase() !== "standard"
      ? rarityCandidate
      : undefined;
  return {
    magicBonus,
    clean: stem || clean,
    displayName: formatWeaponFoundryItemName(stem || clean, rarityLabel),
  };
}

export function buildWeaponItem(
  equipped: EquippedWeapon,
  options: WeaponItemOptions,
): FoundryItem {
  const weapon = equipped.weapon;
  const { magicBonus, clean, displayName } =
    resolveWeaponFoundryDisplayName(equipped);
  const ranged = isRangedWeapon(weapon);
  const masteryKey =
    weapon.mastery?.trim() ||
    (weapon.contentSource === "dnd"
      ? getWeaponMasteryKeyByWeaponName(weapon.baseName ?? weapon.name)
      : undefined) ||
    "";

  const properties = [
    ...new Set(
      weapon.properties
        .map(mapWeaponProperty)
        .filter((p): p is string => p !== null),
    ),
  ];
  if (magicBonus > 0 && !properties.includes("mgc")) properties.push("mgc");

  const dmgType = mapDamageType(weapon.dmgType);
  const baseDice = parseDice(weapon.dmg1) ?? { number: 1, denomination: 4 };
  const versatileDice = weapon.dmg2 ? parseDice(weapon.dmg2) : null;
  const rangeInfo = parseWeaponRange(weapon.range);
  const hasRange = rangeInfo.value !== null;
  // dnd5e prepares null reach as 5 ft (10 with rch); write it explicitly so
  // exported JSON matches the DETAILS sheet.
  const hasReachProp = properties.includes("rch");
  const meleeReach = ranged ? null : hasReachProp ? 10 : 5;
  const description = resolveWeaponExportDescription(
    weapon,
    options.description,
  );

  const activityId = foundryId();
  const system: Record<string, unknown> = {
    source: sourceBlock(weapon.source),
    description: toFoundryDescription(description, {
      chat: options.chatDescription ?? "",
    }),
    identifier: slugify(clean),
    quantity: 1,
    weight: { value: weapon.weight ?? 0, units: "lb" },
    price: { value: (weapon.valueCp ?? 0) / 100, denomination: "gp" },
    attuned: false,
    attunement: "",
    equipped: options.equipped,
    rarity: mapRarity(weapon.itemRarityLabel),
    identified: true,
    type: {
      value: mapWeaponTypeValue(weapon.weaponCategory, ranged),
      baseItem: slugify(weapon.baseName ?? clean),
    },
    damage: {
      base: {
        number: baseDice.number,
        denomination: baseDice.denomination,
        types: dmgType ? [dmgType] : [],
        custom: { enabled: false },
        scaling: { number: 1, mode: "" },
        bonus: "",
      },
      versatile: versatileDice
        ? {
            number: versatileDice.number,
            denomination: versatileDice.denomination,
            types: dmgType ? [dmgType] : [],
            custom: { enabled: false },
            scaling: { number: 1 },
            bonus: "",
          }
        : {
            number: null,
            denomination: null,
            types: [],
            custom: { enabled: false },
            scaling: { number: 1 },
          },
    },
    magicalBonus: magicBonus || null,
    properties,
    proficient: null,
    range: {
      value: rangeInfo.value,
      long: rangeInfo.long,
      reach: meleeReach,
      units: hasRange || ranged || meleeReach != null ? "ft" : "",
    },
    mastery: masteryKey,
    ammunition: { type: mapAmmunitionType(weapon.ammoType) },
    armor: { value: null },
    uses: { spent: 0, max: "", recovery: [] },
    activities: {
      [activityId]: {
        _id: activityId,
        type: "attack",
        sort: 0,
        name: "",
        activation: { type: "action", value: 1, override: false },
        consumption: { scaling: { allowed: false }, spellSlot: true, targets: [] },
        description: {},
        duration: { units: "inst", concentration: false, override: false },
        effects: [],
        range: { units: "self", override: false },
        target: {
          template: { contiguous: false, units: "ft" },
          affects: { choice: false },
          override: false,
          prompt: true,
        },
        uses: { spent: 0, recovery: [] },
        useConditionText: "",
        effectConditionText: "false",
        attack: {
          ability: options.attackAbility ?? "",
          type: {
            value: ranged ? "ranged" : "melee",
            classification: "weapon",
          },
          critical: { threshold: null },
          flat: false,
          bonus: "",
        },
        damage: { critical: { bonus: "" }, includeBase: true, parts: [] },
        midiProperties: defaultMidiProperties({
          magicDamage: magicBonus > 0,
          magicEffect: magicBonus > 0,
          // Midi-QOL convention for the primary weapon attack activity.
          identifier: "attack",
        }),
      },
    },
    container: null,
    cover: null,
    crewed: false,
    unidentified: { description: "" },
  };

  return wrapItem({
    name: displayName,
    type: "weapon",
    img: resolveWeaponItemIcon(weapon.baseName ?? clean, ranged, options.img),
    system,
  });
}

