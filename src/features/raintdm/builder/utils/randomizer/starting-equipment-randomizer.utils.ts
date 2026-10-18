import type { CartEntry } from "@/shared/types";
import type {
  StartingEquipmentGroup,
  StartingEquipmentItem,
  StartingEquipmentOffers,
  StartingEquipmentOption,
  StartingEquipmentSource,
} from "@/shared/types";
import { hasStartingEquipmentOffers } from "@/shared/utils/starting-equipment.parser";
import { pickRandom } from "./character-randomizer.utils";

function scopedItemId(source: StartingEquipmentSource, itemId: string): string {
  return `${source.type}:${source.id}:${itemId}`;
}

function itemToCartEntry(
  item: StartingEquipmentItem,
  source: StartingEquipmentSource,
): CartEntry {
  return {
    name: item.name,
    cost: item.cost ?? "—",
    weight: item.weight ?? "—",
    source: item.source,
    shopName: `Starting equipment (${source.name})`,
    quantity: item.quantity,
    startingEquipmentId: scopedItemId(source, item.id),
  };
}

/** Higher is better; ties are broken at random. */
export type StartingEquipmentOptionScorer = (
  option: StartingEquipmentOption,
) => number;

/** Best-scoring package; every package ties without a scorer. */
export function pickStartingEquipmentOption(
  options: StartingEquipmentOption[],
  scoreOption?: StartingEquipmentOptionScorer,
): StartingEquipmentOption | null {
  if (!scoreOption) return pickRandom(options);
  const scored = options.map((option) => ({ option, score: scoreOption(option) }));
  const best = Math.max(...scored.map((entry) => entry.score));
  return pickRandom(
    scored.filter((entry) => entry.score === best).map((entry) => entry.option),
  );
}

function pickGroupItems(
  group: StartingEquipmentGroup,
  source: StartingEquipmentSource,
  scoreOption?: StartingEquipmentOptionScorer,
): CartEntry[] {
  const entries: CartEntry[] = [];

  for (const item of group.guaranteed ?? []) {
    entries.push(itemToCartEntry(item, source));
  }

  if (group.options?.length) {
    const option = pickStartingEquipmentOption(group.options, scoreOption);
    if (option) {
      for (const item of option.items) {
        entries.push(itemToCartEntry(item, source));
      }
    }
  }

  return entries;
}

export function buildRandomStartingEquipmentEntries(
  offers: StartingEquipmentOffers | undefined,
  source: StartingEquipmentSource,
  scoreOption?: StartingEquipmentOptionScorer,
): CartEntry[] {
  if (!offers || !hasStartingEquipmentOffers(offers)) return [];
  return offers.groups.flatMap((group) =>
    pickGroupItems(group, source, scoreOption),
  );
}
