import { Lock, Shield, Sword } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { EquippedWeapon } from "@/shared/types";
import type { OffHandBlockReason } from "@/features/weapons/utils/weapon-hands.utils";
import { EquipmentSlot } from "../EquipmentSlot";

interface OffHandSlotProps {
  offHand: EquippedWeapon | null;
  hasIntegratedShield: boolean;
  integratedShieldAcBonus: number;
  isOffHandBlocked: boolean;
  offHandBlockReason: OffHandBlockReason | null;
  isSelected: boolean;
  onEquip: () => void;
  onSelect: () => void;
}

export function OffHandSlot({
  offHand,
  hasIntegratedShield,
  integratedShieldAcBonus,
  isOffHandBlocked,
  offHandBlockReason,
  isSelected,
  onEquip,
  onSelect,
}: OffHandSlotProps) {
  if (hasIntegratedShield) {
    return (
      <div
        title="Integrated shield — cannot be changed separately"
        className="relative w-20 h-20 rounded-lg border-2 border-teal-700/50 bg-teal-950/20 flex flex-col items-center justify-center gap-0.5 p-1"
      >
        <Lock className="absolute top-1 right-1 h-3 w-3 text-muted-foreground/80" />
        <Shield className="h-4 w-4 text-teal-400" />
        <span className="text-[9px] font-semibold text-foreground leading-tight text-center">
          Shield
        </span>
        <span className="text-[9px] text-teal-300">+{integratedShieldAcBonus} AC</span>
        <span className="text-[8px] text-muted-foreground/70 text-center leading-tight">
          (included)
        </span>
      </div>
    );
  }

  if (isOffHandBlocked) {
    return (
      <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 opacity-50">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground text-center">Blocked</span>
        <span className="text-[8px] text-muted-foreground/70">
          {offHandBlockReason === "dual-blades" ? "(Dual Blades)" : "(2H weapon)"}
        </span>
      </div>
    );
  }

  return (
    <EquipmentSlot
      label="Add Weapon"
      emptyTitle="Add weapon"
      icon={<Sword className={cn("h-4 w-4", offHand && "text-blue-400")} />}
      equipped={offHand ? { name: offHand.weapon.name, detail: offHand.weapon.dmg1 } : null}
      onClickEquip={onEquip}
      onClickDetails={onSelect}
      isSelected={isSelected}
    />
  );
}
