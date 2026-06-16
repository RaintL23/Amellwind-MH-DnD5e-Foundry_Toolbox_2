import type { CartEntry } from "@/shared/types";
import type {
  StartingEquipmentGroup,
  StartingEquipmentItem,
  StartingEquipmentOffers,
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

function pickGroupItems(
  group: StartingEquipmentGroup,
  source: StartingEquipmentSource,
): CartEntry[] {
  const entries: CartEntry[] = [];

  for (const item of group.guaranteed ?? []) {
    entries.push(itemToCartEntry(item, source));
  }

  if (group.options?.length) {
    const option = pickRandom(group.options);
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
): CartEntry[] {
  if (!offers || !hasStartingEquipmentOffers(offers)) return [];
  return offers.groups.flatMap((group) => pickGroupItems(group, source));
}
