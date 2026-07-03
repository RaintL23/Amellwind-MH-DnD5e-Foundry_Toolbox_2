import { Actor, Entry } from "./actor.types";
import type { SpellcastingBlock } from "./bestiary-creature.types";
import type { StatBlockContent } from "./statblock-content.types";

export interface MonsterLoot {
  rolls: number;
}

export interface Monster extends Actor {
  group?: string[];
  source: string;
  page?: number;
  cr: string;
  environment?: string[];
  legendaryActions?: Entry[];
  loot?: MonsterLoot;
  /** Plain-text lore summary (string paragraphs from fluff). */
  fluff?: string;
  /** Structured biography / lore sections from fluff (excludes loot inset). */
  bio?: StatBlockContent[];
  /** Challenge rating while in lair, when defined separately from base CR. */
  lairCr?: string;
  spellcasting?: SpellcastingBlock[];
}
