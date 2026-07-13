import { cn } from "@/shared/utils/cn";
import type { ProficiencySource } from "@/shared/types/proficiency.types";

// ─── Shared grant shapes ─────────────────────────────────────────────────────
// The builder's proficiency pickers (skills, languages, tools, damage defenses)
// all take the same two grant shapes. Defining them once avoids the verbatim
// copies that previously lived in each picker.

/** Choose `count` items from a fixed `from` list. */
export interface ChooseGrant<T extends string = string> {
  kind: "choose";
  from: T[];
  count: number;
  source: ProficiencySource;
}

/** `count` free picks, optionally constrained to `options` and hinted by `label`. */
export interface AnyGrant {
  kind: "any";
  count: number;
  label?: string;
  options?: string[];
  source: ProficiencySource;
}

export type PickerGrant<T extends string = string> = ChooseGrant<T> | AnyGrant;

// ─── Shared quota math ───────────────────────────────────────────────────────

/**
 * Common slot bookkeeping shared by every picker: how many picks the grants
 * require, how many remain, and the originating source name for the header.
 * `effectiveChosenCount` should exclude picks already covered by a
 * higher-priority source so those never eat into this picker's quota.
 */
export function pickerQuota(
  grants: ReadonlyArray<{ count: number; source: ProficiencySource }>,
  effectiveChosenCount: number,
) {
  const totalCount = grants.reduce((acc, g) => acc + g.count, 0);
  const remainingPicks = Math.max(0, totalCount - effectiveChosenCount);
  return {
    totalCount,
    remainingPicks,
    canPickMore: remainingPicks > 0,
    grantSourceName: grants[0]?.source.name ?? "",
  };
}

// ─── Shared pill styling ─────────────────────────────────────────────────────

/** Container wrapping a picker's header + option pills. */
export const PICKER_CONTAINER_CLASS =
  "mt-2 rounded-md border border-border/50 bg-muted/30 p-2";

const PICKER_PILL_BASE =
  "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors";

/**
 * Styling for a selectable option pill, shared across the pickers.
 * - `badgeColor` (when set) colours a chosen / already-granted pill and
 *   suppresses the default border + hover treatment.
 * - `cursorDefault` marks non-interactive pills already covered by a higher
 *   source.
 */
export function pickerPillClassName({
  badgeColor,
  isDisabled,
  cursorDefault = false,
}: {
  badgeColor?: string;
  isDisabled: boolean;
  cursorDefault?: boolean;
}): string {
  return cn(
    PICKER_PILL_BASE,
    badgeColor,
    cursorDefault && "cursor-default",
    !badgeColor &&
      !isDisabled &&
      "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50 hover:text-foreground",
    !badgeColor &&
      isDisabled &&
      "cursor-not-allowed border-border/40 text-muted-foreground/40",
  );
}
