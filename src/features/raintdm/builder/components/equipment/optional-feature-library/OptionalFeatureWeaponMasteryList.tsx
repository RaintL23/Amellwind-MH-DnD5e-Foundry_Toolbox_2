import { Check, Swords } from "lucide-react";
import type { FeatureChoiceOption } from "@/shared/types";
import type { WeaponMasteryGroup } from "@/features/raintdm/builder/data/weapon-mastery.data";
import {
  getWeaponMasteryAvailability,
  getWeaponMasteryWeapon,
} from "@/features/raintdm/builder/data/weapon-mastery.data";
import {
  featureChoiceToCatalogItem,
  type OptionalFeatureCatalogItem,
} from "@/features/raintdm/builder/utils/class-optional-features.utils";
import { cn } from "@/shared/utils/cn";

interface OptionalFeatureWeaponMasteryListProps {
  groups: WeaponMasteryGroup[];
  weaponMasteryOptionById: Map<string, FeatureChoiceOption>;
  weaponProficiencies: string[];
  meleeOnlyWeaponMastery: boolean;
  atCapacity: boolean;
  isPicked: (item: OptionalFeatureCatalogItem) => boolean;
  canAdd: (item: OptionalFeatureCatalogItem) => boolean;
  onToggle: (item: OptionalFeatureCatalogItem) => void;
}

export function OptionalFeatureWeaponMasteryList({
  groups,
  weaponMasteryOptionById,
  weaponProficiencies,
  meleeOnlyWeaponMastery,
  atCapacity,
  isPicked,
  canAdd,
  onToggle,
}: OptionalFeatureWeaponMasteryListProps) {
  if (groups.length === 0) {
    return (
      <p className="py-4 text-center text-xs italic text-muted-foreground">
        No mastery properties match your search.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {groups.map((group) => (
        <li
          key={group.mastery}
          className="rounded-md border border-border/60 px-2 py-2"
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Swords className="h-3.5 w-3.5 shrink-0 text-orange-400" />
            <span>{group.mastery}</span>
          </div>
          <p className="mt-1 pl-5 text-[10px] leading-relaxed text-muted-foreground">
            {group.description}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1 pl-5">
            {group.weapons.map((weapon) => {
              const option = weaponMasteryOptionById.get(weapon.id);
              if (!option) return null;
              const item = featureChoiceToCatalogItem(option);
              const selected = isPicked(item);
              const addable = canAdd(item);
              const weaponEntry = getWeaponMasteryWeapon(weapon.id);
              const availability = weaponEntry
                ? getWeaponMasteryAvailability(
                    weaponEntry,
                    weaponProficiencies,
                    { meleeOnly: meleeOnlyWeaponMastery },
                  )
                : { allowed: false, reason: "Unknown weapon." };
              const disabled =
                !selected && (!addable || !availability.allowed);

              return (
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
                    "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
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
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}
