import type { NpcHitDie } from "@/shared/types/npc.types";
import type { Species } from "@/shared/types";

/** Hit dice playable in the NPC Generator (Small–Large). */
export const PLAYABLE_HIT_DIES: NpcHitDie[] = [6, 8, 10];

export const HIT_DIE_TO_SIZE: Record<number, string> = {
  6: "Small",
  8: "Medium",
  10: "Large",
};

/**
 * Derive the creature size from the chosen hit die, clamped to the species'
 * allowed sizes when the species only supports a subset.
 */
export function resolveNpcSize(hitDie: NpcHitDie, species?: Species): string {
  const fromDie = HIT_DIE_TO_SIZE[hitDie] ?? "Medium";

  if (!species || species.sizes.length === 0) return fromDie;

  if (species.sizes.includes(fromDie as never)) return fromDie;

  const ORDER = ["Small", "Medium", "Large"];
  const dieIndex = ORDER.indexOf(fromDie);

  // Find the closest allowed size to the one implied by the hit die.
  let best = species.sizes[0] as string;
  let bestDist = Math.abs(ORDER.indexOf(best) - dieIndex);

  for (const s of species.sizes) {
    const dist = Math.abs(ORDER.indexOf(s as string) - dieIndex);
    if (dist < bestDist) {
      bestDist = dist;
      best = s as string;
    }
  }

  return best;
}
