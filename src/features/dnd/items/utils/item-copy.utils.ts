import type { CopyRef } from "./item-raw.types";
import {
  resolveByAbbreviationSource,
  resolveByNameSource,
  resolveEntityCopies,
} from "@/shared/utils/entity-copy.utils";

export type { CopyRef };

export { resolveEntityCopies };

export function resolveItemsByNameSource<T extends { name: string; source: string }>(
  entities: T[],
): T[] {
  return resolveByNameSource(entities);
}

export function resolveItemTypesByAbbreviation<
  T extends { abbreviation: string; source: string },
>(entities: T[]): T[] {
  return resolveByAbbreviationSource(entities);
}
