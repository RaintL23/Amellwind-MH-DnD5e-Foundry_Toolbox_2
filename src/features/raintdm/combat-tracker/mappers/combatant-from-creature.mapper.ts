import type { Actor } from "@/shared/types/actor.types";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import type { Monster } from "@/shared/types/monster.types";
import { getBaseCr } from "@/shared/utils/cr.utils";
import {
  createCombatantId,
  EMPTY_DEATH_SAVES,
  type Combatant,
  type CombatantSourceRef,
} from "../utils/combat-tracker.types";
import { rollInitiative } from "../utils/initiative.utils";

type CreatureLike = Actor & {
  name: string;
  source: string;
  cr: string;
};

function getAc(creature: Actor): number {
  const first = creature.armorClass?.[0];
  return first?.ac ?? 10;
}

function getHpMax(creature: Actor): number {
  return creature.hp?.average ?? creature.hp?.current ?? 1;
}

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function uniqueCombatantName(
  baseName: string,
  existingNames: string[],
): string {
  const taken = new Set(existingNames.map((n) => n.toLowerCase()));
  if (!taken.has(baseName.toLowerCase())) return baseName;

  let n = 1;
  while (taken.has(`${baseName} ${n}`.toLowerCase())) n += 1;
  return `${baseName} ${n}`;
}

export function combatantFromCreature(
  creature: CreatureLike,
  origin: CombatantSourceRef["origin"],
  options: {
    existingNames?: string[];
    rollInit?: boolean;
  } = {},
): Combatant {
  const dex = creature.abilities?.dex ?? 10;
  const initiativeMod =
    typeof creature.initiative === "number"
      ? creature.initiative
      : abilityMod(dex);
  const name = uniqueCombatantName(
    creature.name,
    options.existingNames ?? [],
  );
  const rollInit = options.rollInit !== false;

  return {
    id: createCombatantId(),
    kind: "npc",
    name,
    hp: {
      current: getHpMax(creature),
      max: getHpMax(creature),
      temp: creature.hp?.temp ?? 0,
    },
    ac: getAc(creature),
    levelOrCr: getBaseCr(creature.cr),
    initiative: rollInit ? rollInitiative(initiativeMod, dex) : null,
    initiativeMod,
    dexScore: dex,
    deathSaves: { ...EMPTY_DEATH_SAVES },
    sourceRef: {
      origin,
      name: creature.name,
      source: creature.source,
    },
  };
}

export function combatantFromBestiary(
  creature: BestiaryCreature,
  existingNames: string[] = [],
): Combatant {
  return combatantFromCreature(creature, "dnd-bestiary", { existingNames });
}

export function combatantFromAmellwindMonster(
  monster: Monster,
  existingNames: string[] = [],
): Combatant {
  return combatantFromCreature(monster, "amellwind", { existingNames });
}

export function createManualCombatant(input: {
  kind: "pc" | "npc";
  name: string;
  playerName?: string;
  hpMax: number;
  hpCurrent?: number;
  tempHp?: number;
  ac: number;
  levelOrCr: string;
  initiative: number | null;
  initiativeMod?: number;
  dexScore?: number | null;
}): Combatant {
  const playerName = input.playerName?.trim();
  return {
    id: createCombatantId(),
    kind: input.kind,
    name: input.name.trim() || (input.kind === "pc" ? "PC" : "NPC"),
    ...(playerName ? { playerName } : {}),
    hp: {
      current: input.hpCurrent ?? input.hpMax,
      max: Math.max(1, input.hpMax),
      temp: Math.max(0, input.tempHp ?? 0),
    },
    ac: input.ac,
    levelOrCr: input.levelOrCr,
    initiative: input.initiative,
    initiativeMod: input.initiativeMod ?? 0,
    dexScore: input.dexScore ?? null,
    deathSaves: { ...EMPTY_DEATH_SAVES },
  };
}
