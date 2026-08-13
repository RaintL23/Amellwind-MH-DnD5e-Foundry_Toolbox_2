import type { FoundryItem } from "@/shared/foundry";
import { wrapItem } from "@/shared/foundry";
import { sourceBlock, htmlDesc } from "./item-shared";

// ─── Identity items: class / subclass / race / background ─────────────────────

export interface ClassItemInput {
  name: string;
  identifier: string;
  source?: string;
  levels: number;
  hitDie: string;
  spellcastingProgression: string;
  spellcastingAbility: string;
  primaryAbilities: string[];
  description?: string;
  img?: string;
  advancement: unknown[];
  id?: string;
}

export function buildClassItem(input: ClassItemInput): FoundryItem {
  const system: Record<string, unknown> = {
    identifier: input.identifier,
    description: htmlDesc(input.description),
    source: sourceBlock(input.source),
    levels: input.levels,
    hd: { denomination: input.hitDie, spent: 0, additional: "" },
    spellcasting: {
      progression: input.spellcastingProgression,
      ability: input.spellcastingAbility,
      preparation: { formula: "" },
    },
    primaryAbility: {
      value: input.primaryAbilities,
      all: input.primaryAbilities.length > 1,
    },
    wealth: "",
    advancement: input.advancement,
    startingEquipment: [],
  };
  return wrapItem({
    _id: input.id,
    name: input.name,
    type: "class",
    img: input.img ?? "icons/skills/melee/weapons-crossed-swords-yellow.webp",
    system,
  });
}

export interface SubclassItemInput {
  name: string;
  identifier: string;
  classIdentifier: string;
  source?: string;
  spellcastingProgression: string;
  spellcastingAbility: string;
  description?: string;
  img?: string;
  advancement: unknown[];
  id?: string;
}

export function buildSubclassItem(input: SubclassItemInput): FoundryItem {
  const system: Record<string, unknown> = {
    identifier: input.identifier,
    classIdentifier: input.classIdentifier,
    description: htmlDesc(input.description),
    source: sourceBlock(input.source),
    spellcasting: {
      progression: input.spellcastingProgression,
      ability: input.spellcastingAbility,
      preparation: { formula: "" },
    },
    advancement: input.advancement,
  };
  return wrapItem({
    _id: input.id,
    name: input.name,
    type: "subclass",
    img: input.img ?? "icons/skills/melee/weapons-crossed-swords-purple.webp",
    system,
  });
}

export interface RaceItemInput {
  name: string;
  identifier: string;
  source?: string;
  walkSpeed: number;
  creatureType: string;
  subtype?: string;
  size: string;
  senses?: { darkvision?: number | null };
  description?: string;
  img?: string;
  advancement: unknown[];
  id?: string;
}

export function buildRaceItem(input: RaceItemInput): FoundryItem {
  const system: Record<string, unknown> = {
    description: htmlDesc(input.description),
    source: sourceBlock(input.source),
    identifier: input.identifier,
    movement: {
      burrow: null,
      climb: null,
      fly: null,
      swim: null,
      walk: input.walkSpeed,
      units: "ft",
      hover: false,
    },
    type: { value: input.creatureType, subtype: input.subtype ?? "", custom: "" },
    senses: {
      darkvision: input.senses?.darkvision ?? null,
      blindsight: null,
      truesight: null,
      tremorsense: null,
      units: "ft",
      special: "",
    },
    advancement: input.advancement,
  };
  return wrapItem({
    _id: input.id,
    name: input.name,
    type: "race",
    img: input.img ?? "icons/environment/people/group.webp",
    system,
  });
}

export interface BackgroundItemInput {
  name: string;
  identifier: string;
  source?: string;
  description?: string;
  img?: string;
  advancement: unknown[];
  id?: string;
}

export function buildBackgroundItem(input: BackgroundItemInput): FoundryItem {
  const system: Record<string, unknown> = {
    description: htmlDesc(input.description),
    source: sourceBlock(input.source),
    identifier: input.identifier,
    advancement: input.advancement,
    startingEquipment: [],
    wealth: "",
  };
  return wrapItem({
    _id: input.id,
    name: input.name,
    type: "background",
    img: input.img ?? "icons/environment/people/commoner.webp",
    system,
  });
}
