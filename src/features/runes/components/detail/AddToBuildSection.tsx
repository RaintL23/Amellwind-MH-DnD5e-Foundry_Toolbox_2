import { useState } from "react";
import { AlertTriangle, Check, Gem, ShieldCheck, Sword } from "lucide-react";
import { MaterialEffectSlot, Rune } from "@/shared/types";
import { MATERIAL_EFFECT_SLOT_LABELS } from "@/shared/types/material-effect.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    if (!placed) flash("No slots available at this rarity.");
    else flash("Rune added to build!");
  }

  // A trinket holds a single material effect, so the user must pick which one.
  const trinketKinds: MaterialEffectSlot[] = [
    ...(rune.weaponEffect ? (["weapon"] as const) : []),
    ...(rune.armorEffect ? (["armor"] as const) : []),
  ];

  function handleAddTrinket(
    slotType: "trinket1" | "trinket2",
    kind: MaterialEffectSlot,
  ) {
    addRune(rune, slotType, undefined, kind);
    const slotLabel = slotType === "trinket1" ? "Trinket 1" : "Trinket 2";
    flash(
      `Added to ${slotLabel} (${MATERIAL_EFFECT_SLOT_LABELS[kind]} effect)`,
    );
  }

  function renderTrinketButton(
    slotType: "trinket1" | "trinket2",
    inTrinket: boolean,
    label: string,
  ) {
    const baseClass = cn(
      "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
      inTrinket
        ? "bg-green-900/30 border-green-700/50 text-green-400"
        : "border-purple-700/40 text-purple-300 hover:bg-purple-900/20",
    );

    if (inTrinket) {
      return (
        <button onClick={() => removeRune(slotType)} className={baseClass}>
          <Gem className="h-3.5 w-3.5" />
          <Check className="h-3 w-3" /> {label}
        </button>
      );
    }

    if (trinketKinds.length <= 1) {
      const kind = trinketKinds[0] ?? "weapon";
      return (
        <button
          onClick={() => handleAddTrinket(slotType, kind)}
          className={baseClass}
        >
          <Gem className="h-3.5 w-3.5" />
          {`→ ${label}`}
        </button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger className={baseClass}>
          <Gem className="h-3.5 w-3.5" />
          {`→ ${label}`}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel>Which effect?</DropdownMenuLabel>
          {trinketKinds.map((kind) => (
            <DropdownMenuItem
              key={kind}
              onSelect={() => handleAddTrinket(slotType, kind)}
              className="gap-1.5"
            >
              {kind === "weapon" ? (
                <Sword className="h-3.5 w-3.5 text-orange-400" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              )}
              {MATERIAL_EFFECT_SLOT_LABELS[kind]} effect
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
        Add to Rune Planner
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
                      Collides with:{" "}
                      {weaponViolation.offenders.slice(1).join(", ")}
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
                  <Check className="h-3 w-3" /> Weapon
                </>
              ) : weaponFull ? (
                "Weapon full"
              ) : (
                "→ Weapon"
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
                      Collides with:{" "}
                      {armorViolation.offenders.slice(1).join(", ")}
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
        {renderTrinketButton("trinket1", inTrinket1, "Trinket 1")}
        {renderTrinketButton("trinket2", inTrinket2, "Trinket 2")}
      </div>

      {feedback && (
        <p className="text-xs text-center text-amber-400/80 italic animate-pulse">
          {feedback}
        </p>
      )}
    </div>
  );
}
