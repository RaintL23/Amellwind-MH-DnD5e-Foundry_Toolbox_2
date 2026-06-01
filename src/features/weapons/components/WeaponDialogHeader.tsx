import { Weapon, DMG_TYPE_LABELS } from "@/shared/types";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Swords } from "lucide-react";

interface WeaponDialogHeaderProps {
  weapon: Weapon;
}

export function WeaponDialogHeader({ weapon }: WeaponDialogHeaderProps) {
  const dmgLabel = DMG_TYPE_LABELS[weapon.dmgType] ?? weapon.dmgType;
  const damageDisplay = weapon.dmg2
    ? `${weapon.dmg1} / ${weapon.dmg2}`
    : weapon.dmg1;

  return (
    <DialogHeader>
      <div className="flex items-center gap-3 pr-8">
        <div className="rounded-md border border-border/60 bg-card p-2 shrink-0">
          <Swords className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0">
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
        </div>
      </div>
    </DialogHeader>
  );
}
