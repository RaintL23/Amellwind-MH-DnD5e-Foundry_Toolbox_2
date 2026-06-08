import { useState } from "react";
import { AlertTriangle, Check, Gem, ShieldCheck, Sword } from "lucide-react";
import { Rune } from "@/shared/types";
import { useRuneBuild } from "../../context/RuneBuildContext";
import { wouldViolateRule } from "../../utils/build.validation";
import { cn } from "@/shared/utils/cn";

interface AddToBuildSectionProps {
  rune: Rune;
}

export function AddToBuildSection({ rune }: AddToBuildSectionProps) {
  const {
    addRune,
    removeRune,
    weaponRunes,
    armorRunes,
    trinket1Rune,
    trinket2Rune,
  } = useRuneBuild();

  const inWeapon = weaponRunes.some(
    (r) => r?.name === rune.name && r?.monsterName === rune.monsterName,
  );
  const inArmor = armorRunes.some(
    (r) => r?.name === rune.name && r?.monsterName === rune.monsterName,
  );
  const inTrinket1 =
    trinket1Rune?.name === rune.name &&
    trinket1Rune?.monsterName === rune.monsterName;
  const inTrinket2 =
    trinket2Rune?.name === rune.name &&
    trinket2Rune?.monsterName === rune.monsterName;

  const weaponFull = weaponRunes.every((s) => s !== null);
  const armorFull = armorRunes.every((s) => s !== null);
  const weaponViolation = wouldViolateRule(rune, weaponRunes, "weapon");
  const armorViolation = wouldViolateRule(rune, armorRunes, "armor");

  const [feedback, setFeedback] = useState<string | null>(null);

  function flash(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  }

  function handleAdd(slotType: "weapon" | "armor" | "trinket1" | "trinket2") {
    const placed = addRune(rune, slotType);
    if (!placed) flash("No hay slots disponibles en esta rareza.");
    else flash("¡Runa agregada al build!");
  }

  return (
    <div className="space-y-2 mt-4">
      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
        Agregar al Build Planner
      </h4>

      <div className="flex flex-wrap gap-2">
        {rune.slots.includes("W") && (
          <div className="flex-1 min-w-[120px]">
            {weaponViolation && !inWeapon && (
              <div className="mb-1 flex gap-1 items-start rounded bg-orange-900/20 border border-orange-700/30 px-2 py-1">
                <AlertTriangle className="h-3 w-3 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-tight space-y-0.5">
                  <p className="text-orange-400/80">
                    {weaponViolation.rule.split("(")[0].trim()}
                  </p>
                  {weaponViolation.offenders.slice(1).length > 0 && (
                    <p className="text-orange-400/60">
                      Choca con: {weaponViolation.offenders.slice(1).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={() =>
                inWeapon
                  ? removeRune(
                      "weapon",
                      weaponRunes.findIndex(
                        (r) =>
                          r?.name === rune.name &&
                          r?.monsterName === rune.monsterName,
                      ),
                    )
                  : handleAdd("weapon")
              }
              disabled={!inWeapon && weaponFull}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                inWeapon
                  ? "bg-green-900/30 border-green-700/50 text-green-400"
                  : weaponFull
                    ? "border-border text-muted-foreground/40 cursor-not-allowed"
                    : weaponViolation
                      ? "border-orange-700/50 text-orange-300 hover:bg-orange-900/20"
                      : "border-orange-600/50 text-orange-300 hover:bg-orange-900/20",
              )}
            >
              <Sword className="h-3.5 w-3.5" />
              {inWeapon ? (
                <>
                  <Check className="h-3 w-3" /> En Arma
                </>
              ) : weaponFull ? (
                "Arma llena"
              ) : (
                "→ Arma"
              )}
            </button>
          </div>
        )}

        {rune.slots.includes("A") && (
          <div className="flex-1 min-w-[120px]">
            {armorViolation && !inArmor && (
              <div className="mb-1 flex gap-1 items-start rounded bg-orange-900/20 border border-orange-700/30 px-2 py-1">
                <AlertTriangle className="h-3 w-3 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-tight space-y-0.5">
                  <p className="text-orange-400/80">
                    {armorViolation.rule.split("(")[0].trim()}
                  </p>
                  {armorViolation.offenders.slice(1).length > 0 && (
                    <p className="text-orange-400/60">
                      Choca con: {armorViolation.offenders.slice(1).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={() =>
                inArmor
                  ? removeRune(
                      "armor",
                      armorRunes.findIndex(
                        (r) =>
                          r?.name === rune.name &&
                          r?.monsterName === rune.monsterName,
                      ),
                    )
                  : handleAdd("armor")
              }
              disabled={!inArmor && armorFull}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                inArmor
                  ? "bg-green-900/30 border-green-700/50 text-green-400"
                  : armorFull
                    ? "border-border text-muted-foreground/40 cursor-not-allowed"
                    : armorViolation
                      ? "border-orange-700/50 text-blue-300 hover:bg-blue-900/20"
                      : "border-blue-600/50 text-blue-300 hover:bg-blue-900/20",
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {inArmor ? (
                <>
                  <Check className="h-3 w-3" /> Armor
                </>
              ) : armorFull ? (
                "Armor full"
              ) : (
                "→ Armor"
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() =>
            inTrinket1 ? removeRune("trinket1") : handleAdd("trinket1")
          }
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
            inTrinket1
              ? "bg-green-900/30 border-green-700/50 text-green-400"
              : "border-purple-700/40 text-purple-300 hover:bg-purple-900/20",
          )}
        >
          <Gem className="h-3.5 w-3.5" />
          {inTrinket1 ? (
            <>
              <Check className="h-3 w-3" /> Trinket 1
            </>
          ) : (
            "→ Trinket 1"
          )}
        </button>
        <button
          onClick={() =>
            inTrinket2 ? removeRune("trinket2") : handleAdd("trinket2")
          }
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
            inTrinket2
              ? "bg-green-900/30 border-green-700/50 text-green-400"
              : "border-purple-700/40 text-purple-300 hover:bg-purple-900/20",
          )}
        >
          <Gem className="h-3.5 w-3.5" />
          {inTrinket2 ? (
            <>
              <Check className="h-3 w-3" /> Trinket 2
            </>
          ) : (
            "→ Trinket 2"
          )}
        </button>
      </div>

      {feedback && (
        <p className="text-xs text-center text-amber-400/80 italic animate-pulse">
          {feedback}
        </p>
      )}
    </div>
  );
}
