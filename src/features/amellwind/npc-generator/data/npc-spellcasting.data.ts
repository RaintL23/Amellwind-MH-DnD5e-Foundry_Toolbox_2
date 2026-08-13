import type { AbilityKey } from "@/shared/types";

export interface NpcSpellcastingDefinition {
  /** Spellcasting ability for DC and attack bonus. */
  ability: AbilityKey;
  /** Where the block appears in the stat block. */
  displayAs: "action" | "trait";
  /** Spells castable at will. */
  will?: string[];
  /**
   * Spells available N/day. Key is "1" (1/day), "2", "3", etc.
   * "1e" / "2e" means N/day each (multiple spells share the limit).
   */
  daily?: Record<string, string[]>;
  /**
   * Leveled spell slots.  Key is spell level (1–9).
   * Value: slot count + spell list.  A missing slots value means at-will for that level.
   */
  spells?: Record<
    number,
    { slots?: number; spells: string[] }
  >;
}

/**
 * Base spellcasting definitions per template ID.
 * DC and attack modifier are computed dynamically from the NPC's stats.
 * Lists are structured like 5etools bestiary entries.
 */
export const NPC_SPELLCASTING_BY_TEMPLATE: Record<
  string,
  NpcSpellcastingDefinition
> = {
  "wyverian-arcanist": {
    ability: "int",
    displayAs: "action",
    spells: {
      0: { spells: ["{@spell fire bolt}", "{@spell light}", "{@spell mage hand}", "{@spell prestidigitation}"] },
      1: { slots: 4, spells: ["{@spell detect magic}", "{@spell mage armor}", "{@spell magic missile}", "{@spell shield}"] },
      2: { slots: 3, spells: ["{@spell misty step}", "{@spell suggestion}"] },
      3: { slots: 3, spells: ["{@spell counterspell}", "{@spell fireball}", "{@spell fly}"] },
      4: { slots: 3, spells: ["{@spell greater invisibility}", "{@spell ice storm}"] },
      5: { slots: 1, spells: ["{@spell cone of cold}"] },
    },
  },

  evoker: {
    ability: "int",
    displayAs: "action",
    will: ["{@spell fire bolt}", "{@spell light}", "{@spell mage hand}"],
    daily: {
      "2": ["{@spell fireball}", "{@spell magic missile}"],
      "1": ["{@spell shield}"],
    },
  },

  "wycademy-acolyte": {
    ability: "wis",
    displayAs: "action",
    spells: {
      0: { spells: ["{@spell light}", "{@spell sacred flame}", "{@spell thaumaturgy}"] },
      1: { slots: 3, spells: ["{@spell bless}", "{@spell cure wounds}", "{@spell sanctuary}"] },
    },
  },

  warden: {
    ability: "wis",
    displayAs: "action",
    will: ["{@spell druidcraft}", "{@spell produce flame}"],
    daily: {
      "3": ["{@spell entangle}", "{@spell thunderwave}"],
      "1": ["{@spell barkskin}"],
    },
  },

  "war-chanter": {
    ability: "wis",
    displayAs: "action",
    will: ["{@spell thaumaturgy}", "{@spell vicious mockery}"],
    daily: {
      "3": ["{@spell bless}", "{@spell cure wounds}"],
      "1": ["{@spell guiding bolt}"],
    },
  },

  hexer: {
    ability: "cha",
    displayAs: "action",
    will: ["{@spell eldritch blast}", "{@spell minor illusion}"],
    daily: {
      "2": ["{@spell hex}", "{@spell hold person}"],
      "1": ["{@spell ray of enfeeblement}"],
    },
  },
};
