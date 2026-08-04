import type { FoundryItem } from "./types";
import { buildStats, DEFAULT_OWNERSHIP, foundryId } from "./id";

let itemSort = 0;

/** Monotonic sort keys for items assembled in one export session. */
export function nextFoundryItemSort(): number {
  itemSort += 100000;
  return itemSort;
}

/** Reset sort counter (tests / multi-export sessions). */
export function resetFoundryItemSort(): void {
  itemSort = 0;
}

/** Wraps a partial item into a full Foundry Item document. */
export function wrapItem(
  partial: Pick<FoundryItem, "name" | "type" | "system"> &
    Partial<Pick<FoundryItem, "img" | "effects" | "_id" | "flags" | "sort">>,
): FoundryItem {
  return {
    _id: partial._id ?? foundryId(),
    name: partial.name,
    type: partial.type,
    img: partial.img ?? "icons/svg/item-bag.svg",
    system: partial.system,
    effects: partial.effects ?? [],
    folder: null,
    sort: partial.sort ?? nextFoundryItemSort(),
    ownership: { ...DEFAULT_OWNERSHIP },
    flags: partial.flags ?? {},
    _stats: buildStats(),
  };
}
