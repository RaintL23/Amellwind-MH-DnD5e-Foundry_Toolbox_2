import {
  Weapon,
  PROPERTY_LABELS,
  DMG_TYPE_LABELS,
  DMG_TYPE_COLOR,
} from "@/shared/types";
import {
  formatWeaponCategory,
  formatWeaponProficiencyHint,
  getWeaponProficiencyRule,
} from "../data/weapon-proficiencies.data";
import { WeaponCategoryBadges } from "./WeaponCategoryBadges";
import { WeaponIcon } from "./WeaponIcon";
import { formatWeaponValue } from "../services/weapon.service";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HintTooltip } from "@/shared/components/HintTooltip";
import { Weight, Coins } from "lucide-react";

const BADGE_SIZE_XS =
  "rounded px-1 py-px text-[9px] font-medium";

const PROFICIENCY_BADGE_CLASSES = cn(
  BADGE_SIZE_XS,
  "border-sky-700/40 bg-sky-950/30 text-sky-200/90",
);

const PROPERTY_BADGE_CLASSES = cn(
  BADGE_SIZE_XS,
  "border-border/50 bg-muted/40 text-muted-foreground",
);

const DMG_TYPE_ACCENT: Record<string, string> = {
  S: "text-red-400",
  P: "text-blue-400",
  B: "text-orange-400",
};

const DMG_TYPE_ICON_BG: Record<string, string> = {
  S: "bg-red-950/60",
  P: "bg-blue-950/60",
  B: "bg-orange-950/60",
};

interface WeaponCardProps {
  weapon: Weapon;
  onClick: () => void;
}

export function WeaponCard({ weapon, onClick }: WeaponCardProps) {
  const dmgLabel = DMG_TYPE_LABELS[weapon.dmgType] ?? weapon.dmgType;
  const accentText = DMG_TYPE_ACCENT[weapon.dmgType] ?? "text-primary";
  const iconBg = DMG_TYPE_ICON_BG[weapon.dmgType] ?? "bg-primary/10";
  const borderHover =
    DMG_TYPE_COLOR[weapon.dmgType] ?? "hover:border-primary/50";
  const proficiencyRule = getWeaponProficiencyRule(weapon.name);
  const categoryLabel = proficiencyRule
    ? formatWeaponCategory(proficiencyRule)
    : undefined;
  const proficiencyTooltip = proficiencyRule
    ? `${categoryLabel ?? ""}${categoryLabel ? " · " : ""}Compatible proficiency: ${formatWeaponProficiencyHint(proficiencyRule)}`
    : undefined;

  const showBadgeRow =
    proficiencyRule != null ||
    weapon.properties.length > 0 ||
    weapon.isFocus;

  const damageDisplay = weapon.dmg2
    ? `${weapon.dmg1} / ${weapon.dmg2}`
    : weapon.dmg1;

  return (
    <Card
      asChild
      className={cn(
        "w-full text-left p-4 transition-all duration-200 hover:bg-card/80 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        borderHover,
      )}
    >
      <button type="button" onClick={onClick}>
        {/* Header: icono + nombre */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={cn(
              "rounded-md p-2 shrink-0 flex items-center justify-center",
              iconBg,
            )}
          >
            <WeaponIcon
              weaponName={weapon.name}
              fallbackClassName={accentText}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground leading-tight truncate">
              {weapon.name}
            </h3>
            {weapon.range && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Range: {weapon.range}
              </p>
            )}
            {showBadgeRow && (
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <WeaponCategoryBadges
                  weaponName={weapon.name}
                  size="xs"
                  inline
                />
                {proficiencyRule?.requiresShield && proficiencyTooltip && (
                  <HintTooltip content={proficiencyTooltip}>
                    <Badge variant="outline" className={PROFICIENCY_BADGE_CLASSES}>
                      Shield
                    </Badge>
                  </HintTooltip>
                )}
                {proficiencyRule?.compatible.map((proficiency) => (
                  <HintTooltip
                    key={proficiency}
                    content={proficiencyTooltip ?? proficiency}
                  >
                    <Badge variant="outline" className={PROFICIENCY_BADGE_CLASSES}>
                      {proficiency}
                    </Badge>
                  </HintTooltip>
                ))}
                {weapon.properties.map((prop) => (
                  <Badge
                    key={prop}
                    variant="outline"
                    className={PROPERTY_BADGE_CLASSES}
                  >
                    {PROPERTY_LABELS[prop] ?? prop}
                  </Badge>
                ))}
                {weapon.isFocus && (
                  <Badge
                    variant="outline"
                    className={cn(
                      BADGE_SIZE_XS,
                      "border-violet-700/50 bg-violet-950/40 text-violet-300",
                    )}
                  >
                    Focus
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Daño */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className={cn("text-2xl font-bold tabular-nums", accentText)}>
            {damageDisplay}
          </span>
          <span className="text-sm text-muted-foreground">{dmgLabel}</span>
          {weapon.dmg2 && (
            <span className="text-xs text-muted-foreground/60">
              (versatile)
            </span>
          )}
        </div>

        {/* Footer: peso + valor */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-2.5 mt-2">
          <span className="flex items-center gap-1">
            <Weight className="h-3 w-3" />
            {weapon.weight} lb
          </span>
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {formatWeaponValue(weapon.valueCp)}
          </span>
          {weapon.includesShield && weapon.acBonus !== undefined && (
            <span className="ml-auto text-teal-400 font-medium">
              +{weapon.acBonus} AC (shield)
            </span>
          )}
        </div>
      </button>
    </Card>
  );
}
