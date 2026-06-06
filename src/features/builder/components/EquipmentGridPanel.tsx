import { Gem, Shield, Shirt, Sword } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  formatArmorSlotDetail,
  isClothingArmor,
} from "../data/armor.placeholder";
import { GridElementSlot } from "./GridElementSlot";
import { EquippedWeapon, EquippedArmor, EquippedTrinket } from "@/shared/types";
import type { OffHandBlockReason } from "@/features/weapons/utils/weapon-hands.utils";
import type { PaperDollSelection } from "../hooks/usePaperDollSelection";

interface EquipmentGridPanelProps {
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
  onSelectSlot: (slot: PaperDollSelection) => void;
  onUnequipSlot: (slot: PaperDollSelection) => void;
}

export function EquipmentGridPanel({
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
  onSelectSlot,
  onUnequipSlot,
}: EquipmentGridPanelProps) {
  function handleWeaponSlot(clicked: "mainHand" | "offHand") {
    onSelectSlot(!mainHand ? "mainHand" : clicked);
  }

  return (
    <div className="grid grid-cols-5 gap-1.5">
      <GridElementSlot
        label="Trinket"
        icon={<Gem className="h-5 w-5 text-amber-400/80" />}
        equipped={trinket1 ? { name: trinket1.name } : null}
        onClickEquip={() => onSelectSlot("trinket1")}
        onClickDetails={() => onSelectSlot("trinket1")}
        onUnequip={trinket1 ? () => onUnequipSlot("trinket1") : undefined}
        isSelected={selectedSlot === "trinket1"}
      />
      <GridElementSlot
        label="Trinket"
        icon={<Gem className="h-5 w-5 text-amber-400/80" />}
        equipped={trinket2 ? { name: trinket2.name } : null}
        onClickEquip={() => onSelectSlot("trinket2")}
        onClickDetails={() => onSelectSlot("trinket2")}
        onUnequip={trinket2 ? () => onUnequipSlot("trinket2") : undefined}
        isSelected={selectedSlot === "trinket2"}
      />
      <GridElementSlot
        label="Armor"
        accent="armor"
        icon={
          armor && isClothingArmor(armor.armor) ? (
            <Shirt className="h-5 w-5 text-violet-400" />
          ) : (
            <Shield className={cn("h-5 w-5", armor && "text-sky-400")} />
          )
        }
        equipped={
          armor
            ? {
                name: armor.armor.name,
                detail: formatArmorSlotDetail(armor.armor),
              }
            : null
        }
        onClickEquip={() => onSelectSlot("armor")}
        onClickDetails={() => onSelectSlot("armor")}
        onUnequip={armor ? () => onUnequipSlot("armor") : undefined}
        isSelected={selectedSlot === "armor"}
      />
      <GridElementSlot
        label="Weapon"
        accent="weapon"
        icon={
          <Sword className={cn("h-5 w-5", mainHand && "text-violet-400")} />
        }
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
        onClickEquip={() => handleWeaponSlot("mainHand")}
        onClickDetails={() => onSelectSlot("mainHand")}
        onUnequip={mainHand ? () => onUnequipSlot("mainHand") : undefined}
        isSelected={selectedSlot === "mainHand"}
      />
      {hasIntegratedShield ? (
        <div className="flex min-h-[72px] flex-col items-center justify-center gap-0.5 rounded-md border border-solid border-teal-700/40 bg-teal-950/20 p-2 text-center">
          <Shield className="h-5 w-5 text-teal-400" />
          <span className="text-[11px] font-medium text-foreground">
            Escudo
          </span>
          <span className="text-[10px] text-teal-300">
            +{integratedShieldAcBonus} CA
          </span>
        </div>
      ) : isOffHandBlocked ? (
        <GridElementSlot
          label="Weapon"
          icon={<Sword className="h-5 w-5" />}
          equipped={null}
          onClickEquip={() => {}}
          onClickDetails={() => {}}
          isSelected={false}
          disabled
          disabledHint={
            offHandBlockReason === "dual-blades"
              ? "Dual Blades"
              : "Arma a 2 manos"
          }
        />
      ) : (
        <GridElementSlot
          label="Weapon"
          accent="weapon"
          icon={
            <Sword className={cn("h-5 w-5", offHand && "text-violet-400")} />
          }
          equipped={
            offHand
              ? { name: offHand.weapon.name, detail: offHand.weapon.dmg1 }
              : null
          }
          onClickEquip={() => handleWeaponSlot("offHand")}
          onClickDetails={() => onSelectSlot("offHand")}
          onUnequip={offHand ? () => onUnequipSlot("offHand") : undefined}
          isSelected={selectedSlot === "offHand"}
        />
      )}
    </div>
  );
}
