import type { FoundryActiveEffect, FoundryEffectChange } from "./foundry.types";
import { buildStats, foundryId } from "./foundry-id.utils";

const DEFAULT_ICON = "systems/dnd5e/icons/svg/items/equipment.svg";

interface BuildEffectOptions {
  name: string;
  changes: FoundryEffectChange[];
  img?: string;
  description?: string;
  transfer?: boolean;
  disabled?: boolean;
  statuses?: string[];
}

/** Builds a Foundry v12 ActiveEffect document (dnd5e 4.x shape). */
export function buildEffect(opts: BuildEffectOptions): FoundryActiveEffect {
  return {
    _id: foundryId(),
    name: opts.name,
    img: opts.img ?? DEFAULT_ICON,
    description: opts.description ?? "",
    changes: opts.changes,
    disabled: opts.disabled ?? false,
    duration: {
      startTime: null,
      seconds: null,
      combat: null,
      rounds: null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    origin: null,
    transfer: opts.transfer ?? true,
    statuses: opts.statuses ?? [],
    type: "base",
    system: {},
    tint: "#ffffff",
    sort: 0,
    flags: {},
    _stats: buildStats(),
  };
}

const ADD = 2;
const OVERRIDE = 5;

/** AC calculation override (e.g. Unarmored Defense → "unarmoredMonk"). */
export function acCalcEffect(name: string, calc: string): FoundryActiveEffect {
  return buildEffect({
    name,
    changes: [
      { key: "system.attributes.ac.calc", mode: OVERRIDE, value: calc, priority: 20 },
    ],
  });
}

/**
 * Known magic items whose mechanical bonuses can be reconstructed as Active
 * Effects from the item name alone (the builder only stores names for inventory
 * magic items). Keyed by normalized lowercase name.
 */
const KNOWN_ITEM_EFFECTS: Record<
  string,
  (img: string) => FoundryActiveEffect[]
> = {
  "cloak of protection": (img) => [
    buildEffect({
      name: "Bonus AC",
      img,
      changes: [
        { key: "system.attributes.ac.bonus", mode: ADD, value: "+1", priority: 20 },
      ],
    }),
    buildEffect({
      name: "Saving Throw Bonus",
      img,
      changes: [
        { key: "system.bonuses.abilities.save", mode: ADD, value: "+1", priority: 20 },
      ],
    }),
  ],
  "ring of protection": (img) => [
    buildEffect({
      name: "Bonus AC",
      img,
      changes: [
        { key: "system.attributes.ac.bonus", mode: ADD, value: "+1", priority: 20 },
      ],
    }),
    buildEffect({
      name: "Saving Throw Bonus",
      img,
      changes: [
        { key: "system.bonuses.abilities.save", mode: ADD, value: "+1", priority: 20 },
      ],
    }),
  ],
  "bracers of defense": (img) => [
    buildEffect({
      name: "Bonus AC",
      img,
      changes: [
        { key: "system.attributes.ac.bonus", mode: ADD, value: "+2", priority: 20 },
      ],
    }),
  ],
  "amulet of health": (img) => [
    buildEffect({
      name: "Constitution 19",
      img,
      changes: [
        { key: "system.abilities.con.value", mode: OVERRIDE, value: "19", priority: 20 },
      ],
    }),
  ],
  "headband of intellect": (img) => [
    buildEffect({
      name: "Intelligence 19",
      img,
      changes: [
        { key: "system.abilities.int.value", mode: OVERRIDE, value: "19", priority: 20 },
      ],
    }),
  ],
  "gauntlets of ogre power": (img) => [
    buildEffect({
      name: "Strength 19",
      img,
      changes: [
        { key: "system.abilities.str.value", mode: OVERRIDE, value: "19", priority: 20 },
      ],
    }),
  ],
  "belt of giant strength (hill)": (img) => [
    buildEffect({
      name: "Strength 21",
      img,
      changes: [
        { key: "system.abilities.str.value", mode: OVERRIDE, value: "21", priority: 20 },
      ],
    }),
  ],
};

/** Returns reconstructed Active Effects for a known magic item, by name. */
export function knownItemEffects(
  itemName: string,
  img: string,
): FoundryActiveEffect[] {
  const fn = KNOWN_ITEM_EFFECTS[itemName.trim().toLowerCase()];
  return fn ? fn(img) : [];
}
