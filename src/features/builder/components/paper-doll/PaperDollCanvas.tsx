import { Sword, Shield, Shirt, Gem } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  formatArmorSlotDetail,
  isClothingArmor,
} from "../../data/armor.placeholder";
import { EquipmentSlot } from "../EquipmentSlot";
import { DollSlotAnchor } from "./DollSlotAnchor";
import { DollSilhouette } from "./DollSilhouette";
import { OffHandSlot } from "./OffHandSlot";
import {
  EquippedWeapon,
  EquippedArmor,
  EquippedTrinket,
} from "@/shared/types";
import type { OffHandBlockReason } from "@/features/weapons/utils/weapon-hands.utils";
import type { PaperDollSelection } from "../../hooks/usePaperDollSelection";

const DOLL_W = 320;
const DOLL_H = 400;

interface PaperDollCanvasProps {
  mainHand: EquippedWeapon | null;
  offHand: EquippedWeapon | null;
  armor: EquippedArmor | null;
  trinket1: EquippedTrinket | null;
  trinket2: EquippedTrinket | null;
  hasIntegratedShield: boolean;
  integratedShieldAcBonus: number;
  isOffHandBlocked: boolean;
  offHandBlockReason: OffHandBlockReason | null;
  selectedSlot: PaperDollSelection;
  onEquip: (slot: "mainHand" | "offHand" | "armor") => void;
  onSelect: (slot: PaperDollSelection) => void;
  onTrinketSlot: (slot: "trinket1" | "trinket2") => void;
}

export function PaperDollCanvas({
  mainHand,
  offHand,
  armor,
  trinket1,
  trinket2,
  hasIntegratedShield,
  integratedShieldAcBonus,
  isOffHandBlocked,
  offHandBlockReason,
  selectedSlot,
  onEquip,
  onSelect,
  onTrinketSlot,
}: PaperDollCanvasProps) {
  return (
    <div
      className="relative shrink-0"
      style={{
        width: DOLL_W,
        height: DOLL_H,
        minWidth: DOLL_W,
        minHeight: DOLL_H,
      }}
    >
      <DollSilhouette />

      <DollSlotAnchor className="top-[2%] left-0">
        <EquipmentSlot
          label="Trinket 2"
          icon={<Gem className="h-4 w-4" />}
          equipped={trinket2 ? { name: trinket2.name } : null}
          onClickEquip={() => onTrinketSlot("trinket2")}
          onClickDetails={() => onTrinketSlot("trinket2")}
          isSelected={selectedSlot === "trinket2"}
        />
      </DollSlotAnchor>

      <DollSlotAnchor className="top-[2%] right-0">
        <EquipmentSlot
          label="Trinket 1"
          icon={<Gem className="h-4 w-4" />}
          equipped={trinket1 ? { name: trinket1.name } : null}
          onClickEquip={() => onTrinketSlot("trinket1")}
          onClickDetails={() => onTrinketSlot("trinket1")}
          isSelected={selectedSlot === "trinket1"}
        />
      </DollSlotAnchor>

      <DollSlotAnchor className="top-[34%] left-1/2 -translate-x-1/2">
        <EquipmentSlot
          label="Armor"
          icon={
            armor && isClothingArmor(armor.armor) ? (
              <Shirt className="h-4 w-4 text-violet-400" />
            ) : (
              <Shield className={cn("h-4 w-4", armor && "text-teal-400")} />
            )
          }
          equipped={
            armor
              ? {
                  name: armor.armor.name,
                  detail: `${formatArmorSlotDetail(armor.armor)} • ${armor.rarity}`,
                }
              : null
          }
          onClickEquip={() => onEquip("armor")}
          onClickDetails={() => onSelect("armor")}
          isSelected={selectedSlot === "armor"}
        />
      </DollSlotAnchor>

      <DollSlotAnchor className="top-[34%] left-0">
        <OffHandSlot
          offHand={offHand}
          hasIntegratedShield={hasIntegratedShield}
          integratedShieldAcBonus={integratedShieldAcBonus}
          isOffHandBlocked={isOffHandBlocked}
          offHandBlockReason={offHandBlockReason}
          isSelected={selectedSlot === "offHand"}
          onEquip={() => onEquip("offHand")}
          onSelect={() => onSelect("offHand")}
        />
      </DollSlotAnchor>

      <DollSlotAnchor className="top-[34%] right-0">
        <EquipmentSlot
          label="Main Hand"
          icon={<Sword className={cn("h-4 w-4", mainHand && "text-red-400")} />}
          equipped={
            mainHand
              ? {
                  name: mainHand.weapon.name,
                  detail:
                    mainHand.useVersatile && mainHand.weapon.dmg2
                      ? mainHand.weapon.dmg2
                      : mainHand.weapon.dmg1,
                }
              : null
          }
          onClickEquip={() => onEquip("mainHand")}
          onClickDetails={() => onSelect("mainHand")}
          isSelected={selectedSlot === "mainHand"}
        />
      </DollSlotAnchor>
    </div>
  );
}
