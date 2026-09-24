import {
  PROPERTY_LABELS,
  DMG_TYPE_LABELS,
  DMG_TYPE_COLOR,
} from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Pencil,
  Trash2,
  Weight,
  Coins,
} from "lucide-react";
import { formatWeaponValue } from "@/features/amellwind/weapons/services/weapon.service";
import { WeaponIcon } from "@/features/amellwind/weapons/components/WeaponIcon";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { WeaponForgeExportMenu } from "./WeaponForgeExportMenu";

const BADGE_SIZE_XS = "rounded px-1 py-px text-[9px] font-medium";

/** Keep cards compact: only a few property chips; rest as +N. */
const MAX_PROPERTY_BADGES = 2;

interface WeaponForgeCardProps {
  weapon: CustomWeapon;
  onClick: () => void;
  compareMode?: boolean;
  selectedForCompare?: boolean;
  onToggleCompare?: () => void;
  onEdit?: () => void;
  onClone?: () => void;
  onDelete?: () => void;
}

export function WeaponForgeCard({
  weapon,
  onClick,
  compareMode = false,
  selectedForCompare = false,
  onToggleCompare,
  onEdit,
  onClone,
  onDelete,
}: WeaponForgeCardProps) {
  const dmgLabel = DMG_TYPE_LABELS[weapon.dmgType] ?? weapon.dmgType;
  const borderHover =
    DMG_TYPE_COLOR[weapon.dmgType] ?? "hover:border-primary/50";
  const damageDisplay = weapon.dmg2
    ? `${weapon.dmg1} / ${weapon.dmg2}`
    : weapon.dmg1;

  const visibleProperties = weapon.properties.slice(0, MAX_PROPERTY_BADGES);
  const hiddenPropertyCount =
    weapon.properties.length - visibleProperties.length;

  return (
    <Card
      className={cn(
        "relative w-full p-3 sm:p-4 transition-all duration-200 hover:bg-card/80 hover:shadow-lg",
        borderHover,
        selectedForCompare && "ring-2 ring-primary",
      )}
    >
      {compareMode && (
        <div className="absolute top-3 right-3 z-10">
          <Checkbox
            checked={selectedForCompare}
            onCheckedChange={() => onToggleCompare?.()}
            aria-label={`Select ${weapon.name} for compare`}
          />
        </div>
      )}

      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="flex items-start gap-2.5 sm:gap-3 mb-2">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
            <WeaponIcon
              weaponName={weapon.name}
              img={weapon.img}
              className="h-5 w-5 sm:h-6 sm:w-6"
              fallbackClassName="h-4 w-4 text-muted-foreground"
            />
          </div>
          <h3 className="font-semibold text-foreground leading-tight truncate pr-6 pt-0.5 sm:pt-1 text-sm sm:text-base">
            {weapon.name}
          </h3>
        </div>

        <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
          <Badge
            variant="outline"
            className={cn(
              BADGE_SIZE_XS,
              weapon.isCustom
                ? "border-amber-700/50 bg-amber-950/40 text-amber-200"
                : "border-teal-700/50 bg-teal-950/40 text-teal-200",
            )}
          >
            {weapon.isCustom ? "Custom" : "Curated"}
          </Badge>
          {weapon.author && weapon.isCustom && (
            <Badge
              variant="outline"
              className={cn(
                BADGE_SIZE_XS,
                "hidden md:inline-flex text-muted-foreground",
              )}
            >
              {weapon.author}
            </Badge>
          )}
          <Badge variant="outline" className={BADGE_SIZE_XS}>
            {damageDisplay} {dmgLabel}
          </Badge>
          {visibleProperties.map((p) => (
            <Badge
              key={p}
              variant="outline"
              className={cn(
                BADGE_SIZE_XS,
                "border-border/50 bg-muted/40 text-muted-foreground xl:hidden",
              )}
            >
              {PROPERTY_LABELS[p] ?? p}
            </Badge>
          ))}
          {hiddenPropertyCount > 0 && (
            <Badge
              variant="outline"
              title={weapon.properties
                .slice(MAX_PROPERTY_BADGES)
                .map((p) => PROPERTY_LABELS[p] ?? p)
                .join(", ")}
              className={cn(
                BADGE_SIZE_XS,
                "border-border/50 bg-muted/40 text-muted-foreground xl:hidden",
              )}
            >
              +{hiddenPropertyCount}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Weight className="h-3 w-3" />
            {weapon.weight} lb
          </span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {formatWeaponValue(weapon.valueCp)}
          </span>
          <span className="hidden md:inline">
            {weapon.rarityRows.length} rarities
          </span>
        </div>
      </button>

      {!compareMode && (
        <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1 border-t border-border/60 pt-2">
          <WeaponForgeExportMenu weapon={weapon} />
          {onClone && !weapon.isCustom && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              title="Clone to My Weapons"
              onClick={(e) => {
                e.stopPropagation();
                onClone();
              }}
            >
              <Copy className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Clone</span>
            </Button>
          )}
          {onEdit && weapon.isCustom && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              title="Edit weapon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          {onDelete && weapon.isCustom && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-destructive hover:text-destructive"
              title="Delete weapon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
