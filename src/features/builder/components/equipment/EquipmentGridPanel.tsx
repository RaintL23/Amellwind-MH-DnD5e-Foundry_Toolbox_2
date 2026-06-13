import { Gem, Shield, Shirt, Sword } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { formatArmorSlotDetail, isClothingArmor } from "../../data/armor.data";
import { BuilderSlotGrid } from "../shared/BuilderSlotGrid";
import { GridElementSlot } from "../shared/GridElementSlot";
import type { StandaloneShieldItem } from "../../data/shield.data";
import { EquippedWeapon, EquippedArmor, EquippedTrinket } from "@/shared/types";
import type { OffHandBlockReason } from "@/features/weapons/utils/weapon-hands.utils";
import {
  getActiveWeaponDamage,
  getActiveWeaponDamageLabel,
} from "@/features/weapons/utils/weapon-mode.utils";
import type { BuilderSlotSelection } from "../../hooks/useBuilderSlotSelection";

function formatWeaponSlotDetail(
  equipped: EquippedWeapon,
  options?: { offHand?: boolean },
): string {
  const damage = getActiveWeaponDamage(equipped);
  const modeLabel = getActiveWeaponDamageLabel(equipped);
  const base = modeLabel === "Damage" ? damage : `${modeLabel} · ${damage}`;
  return options?.offHand ? `${base} · bonus` : base;
}

function getWeaponSlotLabel(
  slot: "mainHand" | "offHand",
  useAmellwindHomebrew: boolean,
): string {
  if (useAmellwindHomebrew) return "Weapon";
  return slot === "mainHand" ? "Main Hand" : "Off Hand";
}

interface EquipmentGridPanelProps {
  showTrinkets?: boolean;
  useAmellwindHomebrew?: boolean;
  mainHand: EquippedWeapon | null;
  offHand: EquippedWeapon | null;
  armor: EquippedArmor | null;
  trinket1: EquippedTrinket | null;
  trinket2: EquippedTrinket | null;
  hasIntegratedShield: boolean;
  integratedShieldAcBonus: number;
  equippedShield: StandaloneShieldItem | null;
  standaloneShieldAcBonus: number;
  isOffHandBlocked: boolean;
  offHandBlockReason: OffHandBlockReason | null;
  selectedSlot: BuilderSlotSelection;
  onSelectSlot: (slot: BuilderSlotSelection) => void;
  onUnequipSlot: (slot: BuilderSlotSelection) => void;
}

export function EquipmentGridPanel({
  showTrinkets = true,
  useAmellwindHomebrew = true,
  mainHand,
  offHand,
  armor,
  trinket1,
  trinket2,
  hasIntegratedShield,
  integratedShieldAcBonus,
  equippedShield,
  standaloneShieldAcBonus,
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
    <BuilderSlotGrid>
      {showTrinkets && (
        <>
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
        </>
      )}
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
        label={getWeaponSlotLabel("mainHand", useAmellwindHomebrew)}
        accent="weapon"
        icon={
          <Sword className={cn("h-5 w-5", mainHand && "text-violet-400")} />
        }
        equipped={
          mainHand
            ? {
                name: mainHand.weapon.name,
                detail: formatWeaponSlotDetail(mainHand),
              }
            : null
        }
        onClickEquip={() => handleWeaponSlot("mainHand")}
        onClickDetails={() => onSelectSlot("mainHand")}
        onUnequip={mainHand ? () => onUnequipSlot("mainHand") : undefined}
        isSelected={selectedSlot === "mainHand"}
      />
      {hasIntegratedShield ? (
        <div className="flex min-h-[72px] w-full flex-col items-center justify-center gap-0.5 rounded-md border border-solid border-teal-700/40 bg-teal-950/20 p-2 text-center">
          <Shield className="h-5 w-5 text-teal-400" />
          <span className="text-[11px] font-medium text-foreground">
            Shield
          </span>
          <span className="text-[10px] text-teal-300">
            +{integratedShieldAcBonus} AC
          </span>
        </div>
      ) : equippedShield ? (
        <GridElementSlot
          label="Shield"
          accent="armor"
          icon={<Shield className="h-5 w-5 text-sky-400" />}
          equipped={{
            name: equippedShield.name,
            detail: `+${standaloneShieldAcBonus} CA`,
          }}
          onClickEquip={() => handleWeaponSlot("offHand")}
          onClickDetails={() => onSelectSlot("offHand")}
          onUnequip={() => onUnequipSlot("offHand")}
          isSelected={selectedSlot === "offHand"}
        />
      ) : isOffHandBlocked ? (
        <GridElementSlot
          label={getWeaponSlotLabel("offHand", useAmellwindHomebrew)}
          icon={<Sword className="h-5 w-5" />}
          equipped={null}
          onClickEquip={() => {}}
          onClickDetails={() => {}}
          isSelected={false}
          disabled={true}
          disabledHint={
            offHandBlockReason === "both-grip"
              ? (mainHand?.weapon.name ?? "Both hands occupied")
              : "Two-handed weapon"
          }
        />
      ) : (
        <GridElementSlot
          label={getWeaponSlotLabel("offHand", useAmellwindHomebrew)}
          accent="weapon"
          icon={
            <Sword className={cn("h-5 w-5", offHand && "text-violet-400")} />
          }
          equipped={
            offHand
              ? {
                  name: offHand.weapon.name,
                  detail: formatWeaponSlotDetail(offHand, { offHand: true }),
                }
              : null
          }
          onClickEquip={() => handleWeaponSlot("offHand")}
          disabled={useAmellwindHomebrew}
          onClickDetails={() => onSelectSlot("offHand")}
          onUnequip={offHand ? () => onUnequipSlot("offHand") : undefined}
          isSelected={selectedSlot === "offHand"}
        />
      )}
    </BuilderSlotGrid>
  );
}
