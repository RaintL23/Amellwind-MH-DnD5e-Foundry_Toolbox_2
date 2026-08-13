/**
 * Amellwind (AGMH) background rule: every background grants one D&D 2024
 * Origin Feat of the player's choice. Owned here so catalogs do not import
 * Builder internals.
 */
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";

export const AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT: Extract<
  OriginFeatGrant,
  { kind: "choose" }
> = {
  kind: "choose",
  categories: ["O"],
  count: 1,
  summary: "Origin Feat of your choice",
};
