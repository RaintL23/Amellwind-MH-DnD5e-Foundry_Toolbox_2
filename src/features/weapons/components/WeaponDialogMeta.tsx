import { Weapon } from "@/shared/types";
import { WeaponProficiencyInfo } from "./WeaponProficiencyInfo";
import { Shield } from "lucide-react";
import { DndRichText } from "@/shared/components/DndRichText";

interface WeaponDialogMetaProps {
  weapon: Weapon;
}

export function WeaponDialogMeta({ weapon }: WeaponDialogMetaProps) {
  return (
    <>
      {weapon.description && (
        <p className="text-sm text-muted-foreground italic mb-3 leading-relaxed">
          <DndRichText text={weapon.description} />
        </p>
      )}

      <WeaponProficiencyInfo weaponName={weapon.name} className="mb-4" />

      {weapon.includesShield && (
        <div className="flex items-start gap-2 rounded-md border border-teal-800/40 bg-teal-950/20 px-3 py-2.5 mb-4">
          <Shield className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-100/90 leading-relaxed space-y-1">
            <p className="font-medium text-teal-200">
              Includes an integrated shield (+{weapon.acBonus ?? 2} AC base).
            </p>
            <p>
              The shield occupies your off-hand and cannot be swapped separately.
              Extra AC from the rarity table applies while the shield is equipped.
            </p>
          </div>
        </div>
      )}

      {weapon.supplementaryNotes.length > 0 && (
        <div className="space-y-2 mb-5">
          {weapon.supplementaryNotes.map((note, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">
              {note}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
