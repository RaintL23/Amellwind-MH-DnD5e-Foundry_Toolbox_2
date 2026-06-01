import { Weapon, PROPERTY_LABELS } from "@/shared/types";
import { formatWeaponValue } from "../services/weapon.service";
import { getWeaponShieldAcBonusAtIndex } from "../utils/shield.utils";
import { Shield } from "lucide-react";

interface WeaponDialogMetaProps {
  weapon: Weapon;
  currentRarityIndex: number;
}

export function WeaponDialogMeta({
  weapon,
  currentRarityIndex,
}: WeaponDialogMetaProps) {
  return (
    <>
      {(weapon.properties.length > 0 || weapon.isFocus) && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {weapon.properties.map((prop) => (
            <span
              key={prop}
              className="inline-flex items-center rounded border border-border/50 bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {PROPERTY_LABELS[prop] ?? prop}
            </span>
          ))}
          {weapon.isFocus && (
            <span className="inline-flex items-center rounded border border-violet-700/50 bg-violet-950/40 px-2 py-0.5 text-xs font-medium text-violet-300">
              Focus
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
        <span>
          <span className="text-foreground font-medium">{weapon.weight}</span>{" "}
          lb
        </span>
        <span>
          <span className="text-foreground font-medium">
            {formatWeaponValue(weapon.valueCp)}
          </span>
        </span>
        {weapon.range && (
          <span>
            Range:{" "}
            <span className="text-foreground font-medium">{weapon.range}</span>
          </span>
        )}
        {weapon.includesShield && weapon.acBonus !== undefined && (
          <span className="flex items-center gap-1 text-teal-400">
            <Shield className="h-3.5 w-3.5" />
            <span className="font-semibold">
              +{getWeaponShieldAcBonusAtIndex(weapon, currentRarityIndex)} AC
              (integrated shield)
            </span>
          </span>
        )}
      </div>

      {weapon.description && (
        <p className="text-sm text-muted-foreground italic mb-3 leading-relaxed">
          {weapon.description}
        </p>
      )}

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
