import type { FoundryActiveEffect, FoundryItem } from "@/shared/foundry";
import {
  buildEffect,
  buildFoundryItemFilename,
  defaultMidiProperties,
  FOUNDRY_EXPORT_TARGET,
  foundryIdFromSeed,
  wrapItem,
  itemMacroFlagBundle,
} from "@/shared/foundry";
import { slugifyIdentifier } from "@/shared/foundry/weapons/activity-payload";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { getAssignedFeaturesForRow } from "../utils/weapon-forge-features.utils";
import { DUAL_REPEATERS_MAGAZINES_ITEM_MACRO } from "./dual-repeaters-magazines.macro";

export interface MagazineConsumableDef {
  name: string;
  /** Short key stored on flags.world.dualRepeaters.magazineKey */
  magazineKey: string;
  img: string;
  bodyHtml: string;
  chatHtml: string;
  /**
   * Damage type while this magazine is loaded.
   * `"piercing"` = Normal (weapon base). Specialty magazines replace piercing.
   */
  damageType: string;
  /** Charges granted when this magazine is expended. */
  chargesPerMagazine: number;
  /** Shop price in gp (matches raintdm-items magazines catalog). */
  priceGp: number;
  /**
   * Optional on-hit / while-loaded rider (Rare Upgrade I magazines, Dawnstar, …).
   * `bonusDamage` is stamped on the Loaded AE; other kinds run from ItemMacro on hit.
   */
  rider?: {
    kind:
      | "bonusDamage"
      | "onHitSpeed"
      | "onHitNoReactions"
      | "onHitAdvantage"
      | "onHitUndead"
      | "onHitNoHeal";
    damageFormula?: string;
    damageType?: string;
    speedPenalty?: number;
    description?: string;
  };
}

const LOAD_BLURB =
  "<p><em>Load Magazine</em> (Bonus Action): expend this magazine to fill the Dual Repeaters with <strong>6 Charges</strong> (shown on the weapon sheet). Each Dual Repeaters attack spends 1 Charge. Magazines do not regenerate.</p>";

/** Hand-tuned Dual Repeaters Magazines as Foundry consumable resources. */
export const DUAL_REPEATERS_MAGAZINE_DEFS: Record<string, MagazineConsumableDef> =
  {
    "normal magazine": {
      name: "Normal Magazine",
      magazineKey: "normal",
      img: "mh-icons/bowgun-ammo.webp",
      bodyHtml:
        `<p><strong>Normal Magazine</strong> (Dual Repeaters magazine)</p><p>Deals the weapon's normal piercing damage.</p>${LOAD_BLURB}`,
      chatHtml:
        "<p><strong>Normal Magazine</strong></p><p>Normal piercing damage (fills 6 weapon Charges).</p>",
      damageType: "piercing",
      chargesPerMagazine: 6,
      priceGp: 2,
    },
    "blaze magazine": {
      name: "Blaze Magazine",
      magazineKey: "blaze",
      img: "mh-icons/bowgun-ammo.webp",
      bodyHtml:
        `<p><strong>Blaze Magazine</strong> (Dual Repeaters specialty magazine)</p><p>Your attacks with this ammo deal fire damage instead of piercing.</p>${LOAD_BLURB}`,
      chatHtml:
        "<p><strong>Blaze Magazine</strong></p><p>Fire damage instead of piercing (fills 6 weapon Charges).</p>",
      damageType: "fire",
      chargesPerMagazine: 6,
      priceGp: 5,
    },
    "cryo magazine": {
      name: "Cryo Magazine",
      magazineKey: "cryo",
      img: "mh-icons/bowgun-ammo.webp",
      bodyHtml:
        `<p><strong>Cryo Magazine</strong> (Dual Repeaters specialty magazine)</p><p>Your attacks with this ammo deal cold damage instead of piercing.</p>${LOAD_BLURB}`,
      chatHtml:
        "<p><strong>Cryo Magazine</strong></p><p>Cold damage instead of piercing (fills 6 weapon Charges).</p>",
      damageType: "cold",
      chargesPerMagazine: 6,
      priceGp: 5,
    },
    "storm magazine": {
      name: "Storm Magazine",
      magazineKey: "storm",
      img: "mh-icons/bowgun-ammo.webp",
      bodyHtml:
        `<p><strong>Storm Magazine</strong> (Dual Repeaters specialty magazine)</p><p>Your attacks with this ammo deal lightning damage instead of piercing.</p>${LOAD_BLURB}`,
      chatHtml:
        "<p><strong>Storm Magazine</strong></p><p>Lightning damage instead of piercing (fills 6 weapon Charges).</p>",
      damageType: "lightning",
      chargesPerMagazine: 6,
      priceGp: 5,
    },
    "slime magazine": {
      name: "Slime Magazine",
      magazineKey: "slime",
      img: "mh-icons/bowgun-ammo.webp",
      bodyHtml:
        `<p><strong>Slime Magazine</strong> (Dual Repeaters specialty magazine)</p><p>Your attacks with this ammo deal acid damage instead of piercing.</p>${LOAD_BLURB}`,
      chatHtml:
        "<p><strong>Slime Magazine</strong></p><p>Acid damage instead of piercing (fills 6 weapon Charges).</p>",
      damageType: "acid",
      chargesPerMagazine: 6,
      priceGp: 5,
    },
    "blaze magazine upgrade i": {
      name: "Blaze Magazine Upgrade I",
      magazineKey: "blaze-i",
      img: "mh-icons/bowgun-ammo.webp",
      bodyHtml:
        `<p><strong>Blaze Magazine Upgrade I</strong> (Dual Repeaters specialty magazine)</p><p>Your attacks with this ammo deal fire damage instead of piercing. The target takes an extra [[/r 1d6]] fire damage.</p>${LOAD_BLURB}`,
      chatHtml:
        "<p><strong>Blaze Magazine Upgrade I</strong></p><p>Fire damage + extra 1d6 fire (fills 6 weapon Charges).</p>",
      damageType: "fire",
      chargesPerMagazine: 6,
      priceGp: 15,
      rider: {
        kind: "bonusDamage",
        damageFormula: "1d6",
        damageType: "fire",
        description: "Extra 1d6 fire on hit.",
      },
    },
    "cryo magazine upgrade i": {
      name: "Cryo Magazine Upgrade I",
      magazineKey: "cryo-i",
      img: "mh-icons/bowgun-ammo.webp",
      bodyHtml:
        `<p><strong>Cryo Magazine Upgrade I</strong> (Dual Repeaters specialty magazine)</p><p>Your attacks with this ammo deal cold damage instead of piercing. The target's Speed is reduced by 10 feet until the start of your next turn (does not stack).</p>${LOAD_BLURB}`,
      chatHtml:
        "<p><strong>Cryo Magazine Upgrade I</strong></p><p>Cold damage; −10 ft Speed until start of your next turn (fills 6 weapon Charges).</p>",
      damageType: "cold",
      chargesPerMagazine: 6,
      priceGp: 15,
      rider: {
        kind: "onHitSpeed",
        speedPenalty: 10,
        description: "Speed −10 ft until start of your next turn (does not stack).",
      },
    },
    "storm magazine upgrade i": {
      name: "Storm Magazine Upgrade I",
      magazineKey: "storm-i",
      img: "mh-icons/bowgun-ammo.webp",
      bodyHtml:
        `<p><strong>Storm Magazine Upgrade I</strong> (Dual Repeaters specialty magazine)</p><p>Your attacks with this ammo deal lightning damage instead of piercing. The target cannot take Reactions until the start of your next turn.</p>${LOAD_BLURB}`,
      chatHtml:
        "<p><strong>Storm Magazine Upgrade I</strong></p><p>Lightning damage; no Reactions until start of your next turn (fills 6 weapon Charges).</p>",
      damageType: "lightning",
      chargesPerMagazine: 6,
      priceGp: 15,
      rider: {
        kind: "onHitNoReactions",
        description: "No Reactions until start of your next turn.",
      },
    },
    "slime magazine upgrade i": {
      name: "Slime Magazine Upgrade I",
      magazineKey: "slime-i",
      img: "mh-icons/bowgun-ammo.webp",
      bodyHtml:
        `<p><strong>Slime Magazine Upgrade I</strong> (Dual Repeaters specialty magazine)</p><p>Your attacks with this ammo deal acid damage instead of piercing. The next attack roll made against the target before the end of your next turn has Advantage.</p>${LOAD_BLURB}`,
      chatHtml:
        "<p><strong>Slime Magazine Upgrade I</strong></p><p>Acid damage; next attack vs target has Advantage (fills 6 weapon Charges).</p>",
      damageType: "acid",
      chargesPerMagazine: 6,
      priceGp: 15,
      rider: {
        kind: "onHitAdvantage",
        description:
          "Next attack roll against the target before end of your next turn has Advantage.",
      },
    },
    "dawnstar magazine": {
      name: "Dawnstar Magazine",
      magazineKey: "dawnstar",
      img: "mh-icons/bowgun-ammo.webp",
      bodyHtml:
        `<p><strong>Dawnstar Magazine</strong> (Dual Repeaters specialty magazine)</p><p>Undead take an extra [[/r 1d6]] damage. Invisible creatures hit by this ammo lose their invisibility until the end of your next turn.</p>${LOAD_BLURB}`,
      chatHtml:
        "<p><strong>Dawnstar Magazine</strong></p><p>+1d6 vs Undead; ends invisibility on a hit (fills 6 weapon Charges).</p>",
      damageType: "piercing",
      chargesPerMagazine: 6,
      priceGp: 20,
      rider: {
        kind: "onHitUndead",
        damageFormula: "1d6",
        description:
          "+1d6 vs Undead; invisible creatures lose invisibility until end of your next turn.",
      },
    },
    "twilight magazine": {
      name: "Twilight Magazine",
      magazineKey: "twilight",
      img: "mh-icons/bowgun-ammo.webp",
      bodyHtml:
        `<p><strong>Twilight Magazine</strong> (Dual Repeaters specialty magazine)</p><p>A creature hit by this ammo cannot regain hit points until the start of your next turn.</p>${LOAD_BLURB}`,
      chatHtml:
        "<p><strong>Twilight Magazine</strong></p><p>No healing until start of your next turn (fills 6 weapon Charges).</p>",
      damageType: "piercing",
      chargesPerMagazine: 6,
      priceGp: 20,
      rider: {
        kind: "onHitNoHeal",
        description: "Cannot regain hit points until start of your next turn.",
      },
    },
  };

function buildLoadActivity(def: MagazineConsumableDef): Record<string, unknown> {
  const id = foundryIdFromSeed(`act-load-magazine-${def.magazineKey}`);
  return {
    _id: id,
    type: "utility",
    sort: 0,
    name: "Load Magazine",
    img: def.img,
    activation: {
      type: "bonus",
      value: 1,
      condition: "",
      override: false,
    },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      // Quantity spend is handled by ItemMacro (supports stacked magazines).
      targets: [],
    },
    description: {
      chatFlavor: `Load ${def.name} (${def.chargesPerMagazine} Charges)`,
    },
    duration: {
      value: "",
      units: "inst",
      concentration: false,
      override: false,
    },
    effects: [],
    range: {
      units: "self",
      special: "",
      override: false,
    },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "",
        type: "self",
        choice: false,
        special: "",
      },
      prompt: false,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: defaultMidiProperties({
      identifier: "load-magazine",
      displayActivityName: true,
    }),
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "false",
    otherActivityId: "none",
  };
}

function buildLoadedTemplateEffect(
  def: MagazineConsumableDef,
): FoundryActiveEffect {
  const typeNote =
    def.damageType !== "piercing"
      ? ` Attacks deal ${def.damageType} instead of piercing.`
      : "";
  const riderNote = def.rider?.description
    ? ` ${def.rider.description}`
    : "";
  const changes =
    def.rider?.kind === "bonusDamage" &&
    def.rider.damageFormula &&
    def.rider.damageType
      ? [
          {
            key: "system.bonuses.rwak.damage",
            mode: 2,
            value: `${def.rider.damageFormula}[${def.rider.damageType}]`,
            priority: 20,
          },
        ]
      : [];
  const effect = buildEffect({
    name: `${def.name} (Loaded)`,
    img: def.img,
    transfer: false,
    disabled: true,
    changes,
    description: `<p>${def.name} loaded.${typeNote}${riderNote} Charge count is tracked on the Dual Repeaters weapon sheet (Charges).</p>`,
    flags: {
      dae: {
        enableCondition: "",
        selfTarget: true,
        selfTargetAlways: true,
        stackable: "noneName",
        showIcon: true,
        durationExpression: "",
        specialDuration: ["shortRest", "longRest"],
        disableIncapacitated: false,
        dontApply: false,
      },
      world: {
        dualRepeaters: {
          isMagazineTemplate: true,
          isMagazineActive: true,
          magazineKey: def.magazineKey,
          damageType: def.damageType,
          chargesMax: def.chargesPerMagazine,
          riderKind: def.rider?.kind ?? null,
          rider: def.rider ?? null,
        },
      },
    },
  });
  effect._id = foundryIdFromSeed(`eff-magazine-loaded-${def.magazineKey}`);
  return effect;
}

function magazineItemFlags(def: MagazineConsumableDef): Record<string, unknown> {
  return {
    "amellwind-toolbox": {
      exportKind: "weapon-resource",
      resourceKind: "magazine",
      baseWeaponName: "Dual Repeaters",
    },
    world: {
      dualRepeaters: {
        isMagazine: true,
        magazineKey: def.magazineKey,
        chargesPerMagazine: def.chargesPerMagazine,
        damageType: def.damageType,
        riderKind: def.rider?.kind ?? null,
        rider: def.rider ?? null,
      },
    },
    ...itemMacroFlagBundle({
      name: def.name,
      command: DUAL_REPEATERS_MAGAZINES_ITEM_MACRO,
      passes: ["preTargeting", "postActiveEffects"],
    }),
    exportSource: {
      world: "amellwind-toolbox",
      system: FOUNDRY_EXPORT_TARGET.systemId,
      coreVersion: FOUNDRY_EXPORT_TARGET.coreVersion,
      systemVersion: FOUNDRY_EXPORT_TARGET.systemVersion,
    },
  };
}

export function buildMagazineConsumableItem(
  def: MagazineConsumableDef,
): FoundryItem {
  const load = buildLoadActivity(def);
  const template = buildLoadedTemplateEffect(def);

  const system: Record<string, unknown> = {
    description: { value: def.bodyHtml, chat: def.chatHtml },
    source: {
      custom: "",
      book: "RAINTDM",
      page: "",
      license: "",
      rules: FOUNDRY_EXPORT_TARGET.rules,
      revision: 1,
    },
    identifier: slugifyIdentifier(def.name),
    quantity: 1,
    weight: { value: 0.5, units: "lb" },
    price: { value: def.priceGp, denomination: "gp" },
    rarity: "",
    identified: true,
    unidentified: {
      description: "",
      name: "Mysterious Magazine",
    },
    container: null,
    attunement: "",
    attuned: false,
    equipped: false,
    type: { value: "ammo", subtype: "" },
    damage: {
      base: {
        number: null,
        denomination: null,
        types: [],
        custom: { enabled: false, formula: "" },
        scaling: { mode: "", number: null },
        bonus: "",
      },
      replace: false,
    },
    magicalBonus: null,
    properties: [],
    uses: {
      spent: 0,
      max: "",
      recovery: [],
      autoDestroy: false,
    },
    activities: { [String(load._id)]: load },
  };

  return wrapItem({
    name: def.name,
    type: "consumable",
    img: def.img,
    system,
    effects: [template],
    flags: magazineItemFlags(def),
  });
}

/**
 * Build Magazine consumable items unlocked under the Magazines column up to
 * this rarity. Only Magazines with a catalogued Foundry definition are emitted.
 */
export function buildWeaponMagazineConsumableItems(
  weapon: CustomWeapon,
  rarityIndex: number,
): FoundryItem[] {
  const out: FoundryItem[] = [];
  const seen = new Set<string>();
  const end = Math.min(rarityIndex, weapon.rarityRows.length - 1);

  for (let i = 0; i <= end; i++) {
    const row = weapon.rarityRows[i];
    if (!row) continue;
    for (const ref of getAssignedFeaturesForRow(row, weapon.customFeatures)) {
      const col = ref.resourceColumn?.trim() ?? "";
      if (!/^magazines?$/i.test(col)) continue;

      const key = ref.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      // Skip Magazines Upgrade I/II/III feature rows (not consumable ammo).
      if (/^magazines?\s+upgrade\b/i.test(key)) continue;
      const def = DUAL_REPEATERS_MAGAZINE_DEFS[key];
      if (!def) continue;
      seen.add(key);
      out.push(buildMagazineConsumableItem(def));
    }
  }

  return out;
}

/** Unlocked magazine keys through this rarity (for weapon overlay flags). */
export function listUnlockedMagazineKeys(
  weapon: CustomWeapon,
  rarityIndex: number,
): string[] {
  return buildWeaponMagazineConsumableItems(weapon, rarityIndex).map((item) => {
    const key = (item.flags as { world?: { dualRepeaters?: { magazineKey?: string } } })
      ?.world?.dualRepeaters?.magazineKey;
    return String(key ?? "").toLowerCase();
  }).filter(Boolean);
}

export function magazineConsumableFilename(item: FoundryItem): string {
  return buildFoundryItemFilename(item.name || "magazine");
}
