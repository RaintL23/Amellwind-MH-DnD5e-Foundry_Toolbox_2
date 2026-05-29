import { useState } from "react";
import { Rune } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { Sword, ShieldCheck, Gem, Check, AlertTriangle } from "lucide-react";
import { useRuneBuild } from "../context/RuneBuildContext";
import { wouldViolateRule } from "../utils/build.validation";
import { cn } from "@/shared/utils/cn";

function formatTag(tag: string): string {
  return tag.replace(/^(class:|weapon-type:|mechanic:)/, "");
}

interface EffectSectionProps {
  label: string;
  text: string;
}

function EffectSection({ label, text }: EffectSectionProps) {
  return (
    <div className="mt-4">
      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
        {label}
      </h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {parseFiveToolsMarkup(text)}
      </p>
    </div>
  );
}

interface AddToBuildSectionProps {
  rune: Rune;
}

function AddToBuildSection({ rune }: AddToBuildSectionProps) {
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
    trinket1Rune?.name === rune.name && trinket1Rune?.monsterName === rune.monsterName;
  const inTrinket2 =
    trinket2Rune?.name === rune.name && trinket2Rune?.monsterName === rune.monsterName;

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
        {/* Weapon button */}
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
                          r?.name === rune.name && r?.monsterName === rune.monsterName,
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

        {/* Armor button */}
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
                          r?.name === rune.name && r?.monsterName === rune.monsterName,
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
                  <Check className="h-3 w-3" /> En Armadura
                </>
              ) : armorFull ? (
                "Armadura llena"
              ) : (
                "→ Armadura"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Trinket buttons */}
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
          {inTrinket1 ? <><Check className="h-3 w-3" /> Trinket 1</> : "→ Trinket 1"}
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
          {inTrinket2 ? <><Check className="h-3 w-3" /> Trinket 2</> : "→ Trinket 2"}
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

interface RuneDetailDialogProps {
  rune: Rune | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RuneDetailDialog({ rune, open, onOpenChange }: RuneDetailDialogProps) {
  if (!rune) return null;

  const classTags = rune.tags.filter((t) => t.startsWith("class:"));
  const weaponTypeTags = rune.tags.filter((t) => t.startsWith("weapon-type:"));
  const weaponMechanicTags = rune.weaponTags.filter((t) => t.startsWith("mechanic:"));
  const armorMechanicTags = rune.armorTags.filter((t) => t.startsWith("mechanic:"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-amber-400">{rune.name}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-sm text-muted-foreground">
                From{" "}
                <strong className="text-foreground">{rune.monsterName}</strong>
              </span>
              {rune.slots.includes("A") && (
                <Badge variant="blue">Armor</Badge>
              )}
              {rune.slots.includes("W") && (
                <Badge variant="orange">Weapon</Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {/* Obtención */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-md p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Carve (d20)
              </p>
              <p className="text-lg font-semibold text-foreground">
                {rune.carveChance === "-" ? (
                  <span className="text-muted-foreground text-sm">No carveable</span>
                ) : (
                  rune.carveChance
                )}
              </p>
            </div>
            <div className="bg-muted/30 rounded-md p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Capture (d20)
              </p>
              <p className="text-lg font-semibold text-foreground">
                {rune.captureChance === "-" ? (
                  <span className="text-muted-foreground text-sm">No capturable</span>
                ) : (
                  rune.captureChance
                )}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {rune.rolls} roll{rune.rolls !== 1 ? "s" : ""} on the material table
          </p>

          <Separator className="my-4" />

          {/* Efectos */}
          {rune.armorEffect && (
            <EffectSection label="Armor Effect" text={rune.armorEffect} />
          )}
          {rune.weaponEffect && (
            <EffectSection label="Weapon Effect" text={rune.weaponEffect} />
          )}

          {/* Tags */}
          {rune.tags.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                  Tags
                </h4>
                <div className="space-y-2">
                  {classTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-muted-foreground w-24">Class:</span>
                      {classTags.map((t) => (
                        <Badge key={t} variant="blue">
                          {formatTag(t)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {weaponTypeTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-muted-foreground w-24">Weapon type:</span>
                      {weaponTypeTags.map((t) => (
                        <Badge key={t} variant="orange">
                          {formatTag(t)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {weaponMechanicTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-muted-foreground w-24">
                        <Sword className="inline h-3 w-3 mr-0.5" />
                        Mechanic:
                      </span>
                      {weaponMechanicTags.map((t) => (
                        <Badge key={t} variant="green">
                          {formatTag(t)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {armorMechanicTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-muted-foreground w-24">
                        <ShieldCheck className="inline h-3 w-3 mr-0.5" />
                        Mechanic:
                      </span>
                      {armorMechanicTags.map((t) => (
                        <Badge key={t} variant="green">
                          {formatTag(t)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Add to Build */}
          <Separator className="my-4" />
          <AddToBuildSection rune={rune} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
