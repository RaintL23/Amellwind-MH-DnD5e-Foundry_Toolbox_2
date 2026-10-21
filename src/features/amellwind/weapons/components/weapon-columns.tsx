import { ColumnDef } from "@tanstack/react-table";
import { Weapon, PROPERTY_LABELS, DMG_TYPE_LABELS } from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { formatWeaponValue } from "../services/weapon.service";
import { WeaponCategoryBadges } from "./WeaponCategoryBadges";
import { WeaponIcon } from "./WeaponIcon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";

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

const BADGE_SIZE_XS = "rounded px-1 py-px text-[9px] font-medium";

export function getWeaponDamageDisplay(weapon: Weapon): string {
  return weapon.dmg2 ? `${weapon.dmg1} / ${weapon.dmg2}` : weapon.dmg1;
}

export function getWeaponRowId(weapon: Weapon): string {
  return weapon.id ?? weapon.name;
}

export const weaponColumns: ColumnDef<Weapon>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const weapon = row.original;
      return (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-md p-1.5",
              DMG_TYPE_ICON_BG[weapon.dmgType] ?? "bg-primary/10",
            )}
          >
            <WeaponIcon
              weaponName={weapon.name}
              fallbackClassName={DMG_TYPE_ACCENT[weapon.dmgType] ?? "text-primary"}
            />
          </div>
          <div className="min-w-0">
            <span className="font-medium text-foreground">{weapon.name}</span>
            {weapon.range && (
              <p className="text-xs text-muted-foreground">
                Range: {weapon.range}
              </p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "damage",
    header: "Damage",
    enableSorting: false,
    cell: ({ row }) => {
      const weapon = row.original;
      return (
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span
            className={cn(
              "font-bold tabular-nums",
              DMG_TYPE_ACCENT[weapon.dmgType] ?? "text-primary",
            )}
          >
            {getWeaponDamageDisplay(weapon)}
          </span>
          <span className="text-xs text-muted-foreground">
            {DMG_TYPE_LABELS[weapon.dmgType] ?? weapon.dmgType}
          </span>
        </div>
      );
    },
  },
  {
    id: "properties",
    header: "Properties",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => {
      const weapon = row.original;
      return (
        <div className="flex flex-wrap items-center gap-1">
          <WeaponCategoryBadges weapon={weapon} size="xs" inline />
          {weapon.properties.map((prop) => (
            <Badge
              key={prop}
              variant="outline"
              className={cn(
                BADGE_SIZE_XS,
                "border-border/50 bg-muted/40 text-muted-foreground",
              )}
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
          {weapon.includesShield && weapon.acBonus !== undefined && (
            <span className="text-xs font-medium text-teal-400">
              +{weapon.acBonus} AC (shield)
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "weight",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Weight" />
    ),
    meta: { hideBelowMd: true },
    sortingFn: "basic",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {row.original.weight} lb
      </span>
    ),
  },
  {
    accessorKey: "valueCp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Value" />
    ),
    meta: { hideBelowMd: true },
    sortingFn: "basic",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {formatWeaponValue(row.original.valueCp)}
      </span>
    ),
  },
];
