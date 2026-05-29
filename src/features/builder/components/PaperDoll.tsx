import { useState } from "react";
import { Sword, Shield, Gem, Lock } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { EquipmentSlot } from "./EquipmentSlot";
import { ItemPickerDialog } from "./ItemPickerDialog";
import { RuneAssignmentPanel } from "./RuneAssignmentPanel";
import { EquipmentSlotType, RARITY_ORDER } from "@/shared/types";

export function PaperDoll() {
  const {
    mainHand, offHand, armor, trinket1, trinket2,
    isOffHandBlocked,
    setWeaponRarity, setVersatileMode,
    equipTrinket,
  } = useCharacterBuilder();
  const [pickerSlot, setPickerSlot] = useState<EquipmentSlotType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null);

  // Auto-equip trinket placeholders on first interaction
  function handleTrinketSlot(slot: "trinket1" | "trinket2") {
    const trinket = slot === "trinket1" ? trinket1 : trinket2;
    if (!trinket) {
      equipTrinket(slot, `Trinket ${slot === "trinket1" ? "1" : "2"}`);
    }
    setSelectedSlot(slot);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col items-center gap-4">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide self-start">
        Equipment
      </h2>

      {/* Paper Doll Grid */}
      <div className="relative w-full max-w-[320px] aspect-[3/4] flex items-center justify-center">
        {/* Central figure silhouette */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <svg viewBox="0 0 100 140" className="h-full w-auto">
            <ellipse cx="50" cy="20" rx="12" ry="14" fill="currentColor" />
            <rect x="35" y="34" width="30" height="50" rx="5" fill="currentColor" />
            <rect x="25" y="36" width="10" height="40" rx="4" fill="currentColor" />
            <rect x="65" y="36" width="10" height="40" rx="4" fill="currentColor" />
            <rect x="37" y="84" width="12" height="45" rx="4" fill="currentColor" />
            <rect x="51" y="84" width="12" height="45" rx="4" fill="currentColor" />
          </svg>
        </div>

        {/* Slots positioned around the figure */}
        <div className="absolute grid grid-cols-3 grid-rows-3 gap-3 w-full h-full p-4">
          {/* Top row: Trinket 2 (left) - Armor (center/chest) - Trinket 1 (right) */}
          <div className="flex items-start justify-start">
            <EquipmentSlot
              label="Trinket 2"
              icon={<Gem className="h-4 w-4" />}
              equipped={trinket2 ? { name: trinket2.name } : null}
              onClickEquip={() => handleTrinketSlot("trinket2")}
              onClickDetails={() => handleTrinketSlot("trinket2")}
              isSelected={selectedSlot === "trinket2"}
            />
          </div>
          <div className="flex items-end justify-center">
            <EquipmentSlot
              label="Armor"
              icon={<Shield className={cn("h-4 w-4", armor && "text-teal-400")} />}
              equipped={armor ? { name: armor.armor.name, detail: `AC ${armor.armor.baseAC}` } : null}
              onClickEquip={() => setPickerSlot("armor")}
              onClickDetails={() => setSelectedSlot("armor")}
              isSelected={selectedSlot === "armor"}
            />
          </div>
          <div className="flex items-start justify-end">
            <EquipmentSlot
              label="Trinket 1"
              icon={<Gem className="h-4 w-4" />}
              equipped={trinket1 ? { name: trinket1.name } : null}
              onClickEquip={() => handleTrinketSlot("trinket1")}
              onClickDetails={() => handleTrinketSlot("trinket1")}
              isSelected={selectedSlot === "trinket1"}
            />
          </div>

          {/* Middle row: Off Hand (left) - empty - Main Hand (right) */}
          <div className="flex items-center justify-start">
            {isOffHandBlocked ? (
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 opacity-50">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground text-center">Blocked</span>
                <span className="text-[8px] text-muted-foreground/70">(2H weapon)</span>
              </div>
            ) : (
              <EquipmentSlot
                label="Off Hand"
                icon={<Sword className={cn("h-4 w-4", offHand && "text-blue-400")} />}
                equipped={offHand ? { name: offHand.weapon.name, detail: offHand.weapon.dmg1 } : null}
                onClickEquip={() => setPickerSlot("offHand")}
                onClickDetails={() => setSelectedSlot("offHand")}
                isSelected={selectedSlot === "offHand"}
              />
            )}
          </div>
          <div /> {/* center empty */}
          <div className="flex items-center justify-end">
            <EquipmentSlot
              label="Main Hand"
              icon={<Sword className={cn("h-4 w-4", mainHand && "text-red-400")} />}
              equipped={mainHand ? { name: mainHand.weapon.name, detail: mainHand.useVersatile && mainHand.weapon.dmg2 ? mainHand.weapon.dmg2 : mainHand.weapon.dmg1 } : null}
              onClickEquip={() => setPickerSlot("mainHand")}
              onClickDetails={() => setSelectedSlot("mainHand")}
              isSelected={selectedSlot === "mainHand"}
            />
          </div>

          {/* Bottom row: empty */}
          <div />
          <div />
          <div />
        </div>
      </div>

      {/* Weapon controls (rarity + versatile) */}
      {selectedSlot && (selectedSlot === "mainHand" || selectedSlot === "offHand") && (
        (() => {
          const equipped = selectedSlot === "mainHand" ? mainHand : offHand;
          if (!equipped) return null;
          const isVersatile = equipped.weapon.properties.includes("V");
          return (
            <div className="w-full rounded-md border border-border bg-background/50 p-3 space-y-2">
              {/* Rarity selector */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium uppercase">Rarity</span>
                <div className="flex gap-1 flex-wrap">
                  {RARITY_ORDER.map((r) => (
                    <button
                      key={r}
                      onClick={() => setWeaponRarity(selectedSlot, r)}
                      className={cn(
                        "px-2 py-0.5 text-xs rounded border transition-colors",
                        equipped.rarity === r
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {/* Versatile toggle */}
              {isVersatile && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">Grip</span>
                  <button
                    onClick={() => setVersatileMode(selectedSlot, false)}
                    className={cn(
                      "px-2 py-0.5 text-xs rounded border transition-colors",
                      !equipped.useVersatile
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    One-hand ({equipped.weapon.dmg1})
                  </button>
                  <button
                    onClick={() => setVersatileMode(selectedSlot, true)}
                    className={cn(
                      "px-2 py-0.5 text-xs rounded border transition-colors",
                      equipped.useVersatile
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Two-hand ({equipped.weapon.dmg2})
                  </button>
                </div>
              )}
            </div>
          );
        })()
      )}

      {/* Rune Assignment Panel (below paper doll) */}
      {selectedSlot && (
        <RuneAssignmentPanel
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      {/* Item Picker Dialog */}
      <ItemPickerDialog
        open={pickerSlot !== null}
        slot={pickerSlot}
        onClose={() => setPickerSlot(null)}
      />
    </div>
  );
}
