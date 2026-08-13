import type { AbilityScores } from "@/shared/types";
import type { BuilderChoiceSnapshot } from "../foundry-export/builder-snapshot";

/** A weapon item extracted from a Foundry actor JSON. */
export interface ParsedFoundryWeapon {
  name: string;
  equipped: boolean;
  /** dnd5e weapon property keys (e.g. "fin", "ver", "mgc"), preserved as tags. */
  properties: string[];
  /** dnd5e rarity key (e.g. "uncommon"), or "" when mundane. */
  rarity: string;
  /** Weapon mastery key (e.g. "sap"), or "" when none. */
  mastery: string;
}

/** An armor/shield equipment item extracted from a Foundry actor JSON. */
export interface ParsedFoundryArmor {
  name: string;
  equipped: boolean;
  isShield: boolean;
  /** dnd5e equipment property keys (e.g. "mgc", "stealthDisadvantage"). */
  properties: string[];
  /** dnd5e rarity key (e.g. "rare"), or "" when mundane. */
  rarity: string;
}

/** A spell item extracted from a Foundry actor JSON. */
export interface ParsedFoundrySpell {
  name: string;
  level: number;
}

/** A generic inventory (loot) entry extracted from a Foundry actor JSON. */
export interface ParsedFoundryLoot {
  name: string;
  quantity: number;
}

/**
 * Normalized, builder-agnostic view of a Foundry VTT v12 (dnd5e) character actor.
 * Produced by {@link parseFoundryActor} and consumed by the import hook.
 */
export interface ParsedFoundryActor {
  name: string;
  size: "M" | "S";
  /** Raw alignment label, e.g. "Lawful Good" / "True Neutral". */
  alignment: string;
  level: number;
  abilities: Partial<AbilityScores>;
  /** Plain-text biography (HTML tags stripped). */
  biography: string;
  className: string | null;
  subclassName: string | null;
  raceName: string | null;
  backgroundName: string | null;
  /** Standalone feat names (Foundry feat items whose subtype is "feat"). */
  featNames: string[];
  spells: ParsedFoundrySpell[];
  weapons: ParsedFoundryWeapon[];
  armors: ParsedFoundryArmor[];
  trinkets: string[];
  loot: ParsedFoundryLoot[];
  /** Base64 data URL for the portrait, or null when only a built-in icon is set. */
  portraitImage: string | null;
  /** Base64 data URL for the token texture, or null when only a built-in icon is set. */
  tokenImage: string | null;
  /**
   * Lossless builder-choice snapshot recovered from the actor's module flag,
   * when the JSON was produced by this app. Null for Foundry-authored actors.
   */
  builderSnapshot: BuilderChoiceSnapshot | null;
}

/** Summary of what the import was (or was not) able to map back into the Builder. */
export interface FoundryImportSummary {
  matched: string[];
  unmatched: string[];
}
