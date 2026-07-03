import { Weapon, PROPERTY_LABELS, DMG_TYPE_LABELS } from "@/shared/types";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { formatWeaponValue } from "../services/weapon.service";
import { getWeaponShieldAcBonusAtIndex } from "../utils/shield.utils";
import { WeaponIcon } from "./WeaponIcon";
import { Shield } from "lucide-react";

interface WeaponDialogHeaderProps {
  weapon: Weapon;
  currentRarityIndex: number;
}

export function WeaponDialogHeader({
  weapon,
  currentRarityIndex,
}: WeaponDialogHeaderProps) {
  const dmgLabel = DMG_TYPE_LABELS[weapon.dmgType] ?? weapon.dmgType;
  const damageDisplay = weapon.dmg2
    ? `${weapon.dmg1} / ${weapon.dmg2}`
    : weapon.dmg1;

  return (
    <DialogHeader>
      <div className="flex items-start gap-3 pr-8">
        <div className="rounded-md border border-border/60 bg-card p-2 shrink-0 flex items-center justify-center">
          <WeaponIcon
            weaponName={weapon.name}
            className="h-20 w-20"
            fallbackClassName="h-6 w-6 text-primary"
          />
        </div>
        <div className="min-w-0 flex-1">
          <DialogTitle>{weapon.name}</DialogTitle>
          <DialogDescription className="mt-0.5">
            <span className="font-semibold text-foreground/80">
              {damageDisplay}
            </span>{" "}
            <span>{dmgLabel}</span>
            {weapon.dmg2 && (
              <span className="text-muted-foreground/70"> (versatile)</span>
            )}
          </DialogDescription>

          {(weapon.properties.length > 0 || weapon.isFocus) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {weapon.properties.map((prop) => (
                <Badge
                  key={prop}
                  variant="outline"
                  className="rounded border-border/50 bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {PROPERTY_LABELS[prop] ?? prop}
                </Badge>
              ))}
              {weapon.isFocus && (
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded px-2 py-0.5 text-xs font-medium",
                    "border-violet-700/50 bg-violet-950/40 text-violet-300",
                  )}
                >
                  Focus
                </Badge>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
            <span>
              <span className="text-foreground font-medium">
                {weapon.weight}
              </span>{" "}
              lb
            </span>

            <span className="text-foreground font-medium">
              {formatWeaponValue(weapon.valueCp)}
            </span>

            {weapon.range && (
              <span>
                Range:{" "}
                <span className="text-foreground font-medium">
                  {weapon.range}
                </span>
              </span>
            )}
            {weapon.includesShield && weapon.acBonus !== undefined && (
              <span className="flex items-center gap-1 text-teal-400">
                <Shield className="h-3.5 w-3.5" />
                <span className="font-semibold">
                  +{getWeaponShieldAcBonusAtIndex(weapon, currentRarityIndex)}{" "}
                  AC (integrated shield)
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </DialogHeader>
  );
}
