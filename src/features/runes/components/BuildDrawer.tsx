import { useState } from "react";
import { Layers } from "lucide-react";
import { useRuneBuild } from "../context/RuneBuildContext";
import {
  getArmorViolations,
  getWeaponViolations,
} from "../utils/build.validation";
import { BuildDrawerContent } from "./BuildDrawerContent";
import { BuildDrawerFooter } from "./BuildDrawerFooter";
import { BuildDrawerHeader } from "./BuildDrawerHeader";
import { cn } from "@/shared/utils/cn";

export function BuildDrawer() {
  const [open, setOpen] = useState(false);
  const {
    weaponRarity,
    armorRarity,
    weaponRunes,
    armorRunes,
    trinket1Rune,
    trinket2Rune,
    setWeaponRarity,
    setArmorRarity,
    clearBuild,
    totalRunes,
  } = useRuneBuild();

  const weaponViolations = getWeaponViolations(weaponRunes);
  const armorViolations = getArmorViolations(armorRunes);
  const totalViolations = weaponViolations.length + armorViolations.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-amber-600 px-4 py-3 text-white shadow-lg hover:bg-amber-500 transition-colors"
        aria-label="Abrir Build Planner"
      >
        <Layers className="h-5 w-5" />
        {totalRunes > 0 && (
          <span className="text-sm font-semibold">{totalRunes}</span>
        )}
        {totalViolations > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-400 text-[10px] font-bold text-white">
            !
          </span>
        )}
      </button>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <BuildDrawerHeader
          totalRunes={totalRunes}
          totalViolations={totalViolations}
          onClear={clearBuild}
          onClose={() => setOpen(false)}
        />

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <BuildDrawerContent
            totalRunes={totalRunes}
            weaponRarity={weaponRarity}
            armorRarity={armorRarity}
            weaponRunes={weaponRunes}
            armorRunes={armorRunes}
            trinket1Rune={trinket1Rune}
            trinket2Rune={trinket2Rune}
            weaponViolations={weaponViolations}
            armorViolations={armorViolations}
            onWeaponRarityChange={setWeaponRarity}
            onArmorRarityChange={setArmorRarity}
          />
        </div>

        <BuildDrawerFooter
          totalRunes={totalRunes}
          totalViolations={totalViolations}
        />
      </div>
    </>
  );
}
