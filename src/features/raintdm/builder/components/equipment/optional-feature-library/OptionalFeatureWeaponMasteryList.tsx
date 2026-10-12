import { useState } from "react";
import { Check, ChevronDown, Swords } from "lucide-react";
import type { FeatureChoiceOption } from "@/shared/types";
import type {
  WeaponMasteryGroup,
  WeaponMasteryProperty,
} from "@/shared/data/weapon-mastery.data";
import { getWeaponMasteryAvailability } from "@/features/raintdm/builder/utils/weapon-mastery-availability.utils";
import { getWeaponMasteryWeapon } from "@/shared/data/weapon-mastery.data";
import {
  featureChoiceToCatalogItem,
  type OptionalFeatureCatalogItem,
} from "@/features/dnd/classes/utils/optional-feature-catalog.utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/shared/utils/cn";

interface OptionalFeatureWeaponMasteryListProps {
  groups: WeaponMasteryGroup[];
  weaponMasteryOptionById: Map<string, FeatureChoiceOption>;
  weaponProficiencies: string[];
  meleeOnlyWeaponMastery: boolean;
  atCapacity: boolean;
  /** Non-empty search: open every matching property so results are visible. */
  isSearching: boolean;
  isPicked: (item: OptionalFeatureCatalogItem) => boolean;
  canAdd: (item: OptionalFeatureCatalogItem) => boolean;
  onToggle: (item: OptionalFeatureCatalogItem) => void;
}

/**
 * Pick a mastery property first, then one of its weapons. Each weapon has a
 * fixed property (XPHB), so the saved pick is still the weapon.
 */
export function OptionalFeatureWeaponMasteryList({
  groups,
  weaponMasteryOptionById,
  weaponProficiencies,
  meleeOnlyWeaponMastery,
  atCapacity,
  isSearching,
  isPicked,
  canAdd,
  onToggle,
}: OptionalFeatureWeaponMasteryListProps) {
  const [openMasteries, setOpenMasteries] = useState<
    ReadonlySet<WeaponMasteryProperty>
  >(new Set());

  if (groups.length === 0) {
    return (
      <p className="py-4 text-center text-xs italic text-muted-foreground">
        No mastery properties match your search.
      </p>
    );
  }

  function setOpen(mastery: WeaponMasteryProperty, open: boolean) {
    setOpenMasteries((prev) => {
      const next = new Set(prev);
      if (open) next.add(mastery);
      else next.delete(mastery);
      return next;
    });
  }

  return (
    <ul className="space-y-2">
      {groups.map((group) => {
        const weapons = group.weapons.flatMap((weapon) => {
          const option = weaponMasteryOptionById.get(weapon.id);
          if (!option) return [];
          const item = featureChoiceToCatalogItem(option);
          const selected = isPicked(item);
          const weaponEntry = getWeaponMasteryWeapon(weapon.id);
          const availability = weaponEntry
            ? getWeaponMasteryAvailability(weaponEntry, weaponProficiencies, {
                meleeOnly: meleeOnlyWeaponMastery,
              })
            : { allowed: false, reason: "Unknown weapon." };
          const disabled = !selected && (!canAdd(item) || !availability.allowed);
          return [{ weapon, item, selected, availability, disabled }];
        });

        const pickedCount = weapons.filter((entry) => entry.selected).length;
        const hasChoice = weapons.some((entry) => !entry.disabled);
        const open =
          isSearching || openMasteries.has(group.mastery) || pickedCount > 0;
        const panelId = `weapon-mastery-${group.mastery}`;

        return (
          <li
            key={group.mastery}
            className={cn(
              "rounded-md border px-2 py-2 transition-colors",
              pickedCount > 0
                ? "border-violet-400/40 bg-violet-400/5"
                : "border-border/60",
            )}
          >
            <Collapsible
              open={open}
              onOpenChange={(next) => setOpen(group.mastery, next)}
            >
              <CollapsibleTrigger
                aria-controls={panelId}
                // A property with a pick stays open so the choice is visible.
                disabled={pickedCount > 0 || isSearching}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded-sm text-left text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  pickedCount > 0 || isSearching
                    ? "cursor-default"
                    : "cursor-pointer",
                  !hasChoice && pickedCount === 0 && "opacity-60",
                )}
              >
                <Swords className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                <span>{group.mastery}</span>
                {pickedCount > 0 && (
                  <Check
                    className="h-3 w-3 shrink-0 text-emerald-400"
                    aria-label="Selected"
                  />
                )}
                <span className="ml-auto flex items-center gap-1 text-[10px] font-normal text-muted-foreground">
                  {!hasChoice && pickedCount === 0
                    ? "No weapon available"
                    : open
                      ? "Choose a weapon"
                      : `${weapons.length} weapons`}
                  {pickedCount === 0 && !isSearching && (
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        open && "rotate-180",
                      )}
                      aria-hidden
                    />
                  )}
                </span>
              </CollapsibleTrigger>
              <p
                className={cn(
                  "mt-1 pl-5 text-[10px] leading-relaxed text-muted-foreground",
                  // Collapsed groups preview the rule; opening shows it in full.
                  !open && "line-clamp-2",
                )}
              >
                {group.description}
              </p>
              <CollapsibleContent id={panelId}>
                <div className="mt-1.5 flex flex-wrap gap-1 pl-5">
                  {weapons.map(
                    ({ weapon, item, selected, availability, disabled }) => (
                      <button
                        key={weapon.id}
                        type="button"
                        onClick={() => onToggle(item)}
                        disabled={disabled}
                        title={
                          disabled
                            ? !availability.allowed
                              ? availability.reason
                              : atCapacity
                                ? "Maximum weapon selections reached"
                                : "Not available"
                            : selected
                              ? `Remove ${weapon.name}`
                              : `Select ${weapon.name}`
                        }
                        className={cn(
                          "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors coarse:px-3 coarse:py-1.5 coarse:text-xs",
                          selected
                            ? "border-violet-400/50 bg-violet-400/10 text-violet-100"
                            : "border-border/50 bg-muted/40 text-muted-foreground hover:border-orange-500/40 hover:bg-orange-950/20 hover:text-orange-100",
                          disabled && "cursor-not-allowed opacity-40",
                        )}
                      >
                        {weapon.name}
                        {selected && (
                          <Check className="h-2.5 w-2.5 shrink-0 text-emerald-400" />
                        )}
                      </button>
                    ),
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </li>
        );
      })}
    </ul>
  );
}
