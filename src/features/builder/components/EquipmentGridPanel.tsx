import {
  Gem,
  GraduationCap,
  ScrollText,
  Shield,
  Shirt,
  Sword,
  Users,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  formatArmorSlotDetail,
  isClothingArmor,
} from "../data/armor.placeholder";
import { GridEquipmentSlot } from "./GridEquipmentSlot";
import { EquippedWeapon, EquippedArmor, EquippedTrinket } from "@/shared/types";
import type { OffHandBlockReason } from "@/features/weapons/utils/weapon-hands.utils";
import type { PaperDollSelection } from "../hooks/usePaperDollSelection";

interface EquipmentGridPanelProps {
  mainHand: EquippedWeapon | null;
  offHand: EquippedWeapon | null;
  armor: EquippedArmor | null;
  trinket1: EquippedTrinket | null;
  trinket2: EquippedTrinket | null;
  species: { name: string } | null;
  background: { name: string } | null;
  hasIntegratedShield: boolean;
  integratedShieldAcBonus: number;
  isOffHandBlocked: boolean;
  offHandBlockReason: OffHandBlockReason | null;
  selectedSlot: PaperDollSelection;
  onSelectSlot: (slot: PaperDollSelection) => void;
}

export function EquipmentGridPanel({
  mainHand,
  offHand,
  armor,
  trinket1,
  trinket2,
  species,
  background,
  hasIntegratedShield,
  integratedShieldAcBonus,
  isOffHandBlocked,
  offHandBlockReason,
  selectedSlot,
  onSelectSlot,
}: EquipmentGridPanelProps) {
  function handleWeaponSlot(clicked: "mainHand" | "offHand") {
    onSelectSlot(!mainHand ? "mainHand" : clicked);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1.5">
        <GridEquipmentSlot
          label="Specie"
          icon={<Users className="h-5 w-5 text-sky-400" />}
          equipped={species ? { name: species.name } : null}
          onClickEquip={() => onSelectSlot("species")}
          onClickDetails={() => onSelectSlot("species")}
          isSelected={selectedSlot === "species"}
        />
        <GridEquipmentSlot
          label="Background"
          icon={<ScrollText className="h-5 w-5 text-violet-400" />}
          equipped={background ? { name: background.name } : null}
          onClickEquip={() => onSelectSlot("background")}
          onClickDetails={() => onSelectSlot("background")}
          isSelected={selectedSlot === "background"}
        />
        <GridEquipmentSlot
          label="Class"
          icon={<GraduationCap className="h-5 w-5" />}
          equipped={null}
          onClickEquip={() => {}}
          onClickDetails={() => {}}
          isSelected={false}
          disabled
          disabledHint="Próximamente"
        />
        <GridEquipmentSlot
          label="Trinket"
          icon={<Gem className="h-5 w-5 text-amber-400/80" />}
          equipped={trinket1 ? { name: trinket1.name } : null}
          onClickEquip={() => onSelectSlot("trinket1")}
          onClickDetails={() => onSelectSlot("trinket1")}
          isSelected={selectedSlot === "trinket1"}
        />
        <GridEquipmentSlot
          label="Trinket"
          icon={<Gem className="h-5 w-5 text-amber-400/80" />}
          equipped={trinket2 ? { name: trinket2.name } : null}
          onClickEquip={() => onSelectSlot("trinket2")}
          onClickDetails={() => onSelectSlot("trinket2")}
          isSelected={selectedSlot === "trinket2"}
        />
        <GridEquipmentSlot
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
          isSelected={selectedSlot === "armor"}
        />

        <GridEquipmentSlot
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
          <GridEquipmentSlot
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
          <GridEquipmentSlot
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
            isSelected={selectedSlot === "offHand"}
          />
        )}
        <GridEquipmentSlot
          label="—"
          icon={<span className="text-muted-foreground/40">·</span>}
          equipped={null}
          onClickEquip={() => {}}
          onClickDetails={() => {}}
          isSelected={false}
          disabled
        />
        <GridEquipmentSlot
          label="—"
          icon={<span className="text-muted-foreground/40">·</span>}
          equipped={null}
          onClickEquip={() => {}}
          onClickDetails={() => {}}
          isSelected={false}
          disabled
        />
      </div>
    </div>
  );
}
