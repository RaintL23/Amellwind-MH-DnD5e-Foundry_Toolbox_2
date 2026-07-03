import { Weapon, PROPERTY_LABELS, DMG_TYPE_LABELS, DMG_TYPE_COLOR } from "@/shared/types";
import {
  formatWeaponCategory,
  formatWeaponProficiencyHint,
  getWeaponProficiencyRule,
} from "../data/weapon-proficiencies.data";
import { WeaponCategoryBadges } from "./WeaponCategoryBadges";
import { formatWeaponValue } from "../services/weapon.service";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HintTooltip } from "@/shared/components/HintTooltip";
import { Swords, Weight, Coins, GraduationCap } from "lucide-react";

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
  const borderHover = DMG_TYPE_COLOR[weapon.dmgType] ?? "hover:border-primary/50";
  const proficiencyRule = getWeaponProficiencyRule(weapon.name);
  const proficiencyHint = proficiencyRule
    ? formatWeaponProficiencyHint(proficiencyRule)
    : undefined;
  const categoryLabel = proficiencyRule
    ? formatWeaponCategory(proficiencyRule)
    : undefined;

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
        <div className={cn("rounded-md p-2 shrink-0", iconBg)}>
          <Swords className={cn("h-5 w-5", accentText)} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground leading-tight truncate">{weapon.name}</h3>
          {weapon.range && (
            <p className="text-xs text-muted-foreground mt-0.5">Rango: {weapon.range}</p>
          )}
          <WeaponCategoryBadges weaponName={weapon.name} size="xs" className="mt-1" />
          {proficiencyHint && (
            <HintTooltip
              content={`${categoryLabel ?? ""}${categoryLabel ? " · " : ""}Compatible proficiency: ${proficiencyHint}`}
            >
              <p className="flex items-start gap-1 text-[10px] text-muted-foreground/90 mt-1 leading-snug line-clamp-2 cursor-help">
                <GraduationCap className="h-3 w-3 shrink-0 mt-px opacity-70" aria-hidden />
                <span>{proficiencyHint}</span>
              </p>
            </HintTooltip>
          )}
        </div>
      </div>

      {/* Daño */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className={cn("text-2xl font-bold tabular-nums", accentText)}>{damageDisplay}</span>
        <span className="text-sm text-muted-foreground">{dmgLabel}</span>
        {weapon.dmg2 && (
          <span className="text-xs text-muted-foreground/60">(versatile)</span>
        )}
      </div>

      {/* Properties badges */}
      {(weapon.properties.length > 0 || weapon.isFocus) && (
        <div className="flex flex-wrap gap-1 mb-3">
          {weapon.properties.map((prop) => (
            <Badge
              key={prop}
              variant="outline"
              className="rounded border-border/50 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {PROPERTY_LABELS[prop] ?? prop}
            </Badge>
          ))}
          {weapon.isFocus && (
            <Badge
              variant="outline"
              className="rounded border-violet-700/50 bg-violet-950/40 px-1.5 py-0.5 text-[10px] font-medium text-violet-300"
            >
              Focus
            </Badge>
          )}
        </div>
      )}

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
