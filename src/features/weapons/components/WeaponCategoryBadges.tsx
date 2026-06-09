import {
  getWeaponCategoryBadges,
  getWeaponProficiencyRule,
} from "../data/weapon-proficiencies.data";
import { cn } from "@/shared/utils/cn";

interface WeaponCategoryBadgesProps {
  weaponName: string;
  size?: "xs" | "sm";
  className?: string;
}

const SIZE_CLASSES = {
  xs: "px-1 py-px text-[9px]",
  sm: "px-1.5 py-0.5 text-[10px]",
};

export function WeaponCategoryBadges({
  weaponName,
  size = "sm",
  className,
}: WeaponCategoryBadgesProps) {
  const rule = getWeaponProficiencyRule(weaponName);
  if (!rule) return null;

  const badges = getWeaponCategoryBadges(rule);

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {badges.map((badge) => (
        <span
          key={badge}
          className={cn(
            "inline-flex items-center rounded border border-amber-700/40 bg-amber-950/30 font-medium text-amber-200/90",
            SIZE_CLASSES[size],
          )}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}
