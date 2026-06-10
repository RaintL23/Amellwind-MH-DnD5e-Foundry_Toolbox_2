import type { AbilityKey, AbilityScores } from "@/shared/types";
import type { NpcAttributeArray, NpcHitDie } from "@/shared/types/npc.types";
import {
  STANDARD_ARRAY,
  rollSixAbilityScores,
  ABILITY_KEYS,
} from "@/features/builder/utils/ability-scores";
import type { Species } from "@/shared/types";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function rollAttributeArray(kind: NpcAttributeArray): number[] {
  if (kind === "standard") return [...STANDARD_ARRAY];
  if (kind === "heroic") return rollSixAbilityScores(true);
  return rollSixAbilityScores(false);
}

export function assignAbilitiesFromArray(
  priority: AbilityKey[],
  scores: number[],
  species: Species,
  hitDie?: NpcHitDie,
): AbilityScores {
  const orderedKeys = [
    ...priority,
    ...ABILITY_KEYS.filter((k) => !priority.includes(k)),
  ];
  const pool = shuffle(scores);
  const base: AbilityScores = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  orderedKeys.forEach((key, i) => {
    if (i < pool.length) base[key] = pool[i];
  });

  const withBonuses = applySpeciesBonuses(base, species);

  // Large creatures (d10 hit die) should have above-average CON. Swap CON with
  // the third-highest assigned value (after the primary and secondary stats) so
  // it sits at least at the 3rd slot of the priority order.
  if (hitDie === 10) {
    const primaryKey = orderedKeys[0];
    const secondaryKey = orderedKeys[1];
    const conKey = "con";

    if (conKey !== primaryKey && conKey !== secondaryKey) {
      // Find the index of CON in the ordered assignment
      const conIndex = orderedKeys.indexOf(conKey);
      // Swap CON with whichever of slots 2 or 3 gives the better value
      const swapIndex = conIndex > 2 ? 2 : conIndex;
      if (swapIndex < conIndex) {
        const swapKey = orderedKeys[swapIndex];
        const temp = withBonuses[conKey];
        withBonuses[conKey] = withBonuses[swapKey];
        withBonuses[swapKey] = temp;
      }
    }
  }

  return withBonuses;
}

function applySpeciesBonuses(
  abilities: AbilityScores,
  species: Species,
): AbilityScores {
  const result = { ...abilities };

  for (const bonus of species.abilityBonuses) {
    if (bonus.kind === "fixed") {
      for (const [key, value] of Object.entries(bonus.bonuses)) {
        const k = key as AbilityKey;
        result[k] = Math.min(30, result[k] + (value ?? 0));
      }
    } else if (bonus.kind === "choose") {
      const count = bonus.count ?? 1;
      const picks = bonus.from.slice(0, count);
      for (const key of picks) {
        result[key] = Math.min(30, result[key] + bonus.amount);
      }
    }
  }

  return result;
}
