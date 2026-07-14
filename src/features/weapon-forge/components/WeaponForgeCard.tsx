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
  Download,
  Pencil,
  Trash2,
  Weight,
  Coins,
} from "lucide-react";
import { formatWeaponValue } from "@/features/weapons/services/weapon.service";
import type { CustomWeapon } from "../types/weapon-forge.types";

const BADGE_SIZE_XS = "rounded px-1 py-px text-[9px] font-medium";

interface WeaponForgeCardProps {
  weapon: CustomWeapon;
  onClick: () => void;
  compareMode?: boolean;
  selectedForCompare?: boolean;
  onToggleCompare?: () => void;
  onEdit?: () => void;
  onClone?: () => void;
  onExport?: () => void;
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
  onExport,
  onDelete,
}: WeaponForgeCardProps) {
  const dmgLabel = DMG_TYPE_LABELS[weapon.dmgType] ?? weapon.dmgType;
  const borderHover =
    DMG_TYPE_COLOR[weapon.dmgType] ?? "hover:border-primary/50";
  const damageDisplay = weapon.dmg2
    ? `${weapon.dmg1} / ${weapon.dmg2}`
    : weapon.dmg1;

  return (
    <Card
      className={cn(
        "relative w-full p-4 transition-all duration-200 hover:bg-card/80 hover:shadow-lg",
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
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground leading-tight truncate pr-6">
            {weapon.name}
          </h3>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
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
          <Badge variant="outline" className={BADGE_SIZE_XS}>
            {damageDisplay} {dmgLabel}
          </Badge>
          {weapon.properties.map((p) => (
            <Badge
              key={p}
              variant="outline"
              className={cn(
                BADGE_SIZE_XS,
                "border-border/50 bg-muted/40 text-muted-foreground",
              )}
            >
              {PROPERTY_LABELS[p] ?? p}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Weight className="h-3 w-3" />
            {weapon.weight} lb
          </span>
          <span className="inline-flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {formatWeaponValue(weapon.valueCp)}
          </span>
          <span>{weapon.rarityRows.length} rarities</span>
        </div>
      </button>

      {!compareMode && (onEdit || onClone || onExport || onDelete) && (
        <div className="mt-3 flex gap-1 border-t border-border/60 pt-2">
          {onExport && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              JSON
            </Button>
          )}
          {onClone && !weapon.isCustom && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onClone();
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Clone
            </Button>
          )}
          {onEdit && weapon.isCustom && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && weapon.isCustom && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
