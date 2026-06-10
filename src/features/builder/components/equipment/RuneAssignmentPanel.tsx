import { useState, useEffect } from "react";
import { X, Gem, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useRuneBuild } from "@/features/runes/context/RuneBuildContext";
import { EquipmentSlotType, Rune } from "@/shared/types";
import { RuleViolation } from "@/features/runes/utils/build.validation";
import {
  useEquippedSlot,
  collectAssignedRuneKeys,
} from "../../hooks/useEquippedSlot";
import { getAllRunes } from "@/features/runes/services/rune.service";
import { useRuneCompatibilityContext } from "../../hooks/useRuneCompatibilityContext";
import { getRuneMaterialEffectText } from "@/features/runes/utils/rune-compatibility.utils";
import { RunePickerPanel } from "./RunePickerPanel";
import { RuneEffectText } from "@/features/runes/components/shared/RuneEffectText";

interface RuneAssignmentPanelProps {
  slot: EquipmentSlotType;
  onClose: () => void;
}

export function RuneAssignmentPanel({ slot, onClose }: RuneAssignmentPanelProps) {
  const {
    mainHand,
    offHand,
    armor,
    trinket1,
    trinket2,
    assignWeaponRune,
    removeWeaponRune,
    assignArmorRune,
    removeArmorRune,
    assignTrinketRune,
    removeTrinketRune,
  } = useCharacterBuilder();
  const { allBuildRunes: availableRunes } = useRuneBuild();
  const equipped = useEquippedSlot(slot);
  const [violation, setViolation] = useState<RuleViolation | null>(null);
  const [assigningIndex, setAssigningIndex] = useState<number | null>(null);
  const [catalogRunes, setCatalogRunes] = useState<Rune[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const compatibilityCtx = useRuneCompatibilityContext(equipped);

  const useCatalog = assigningIndex !== null && availableRunes.length === 0;

  useEffect(() => {
    if (!useCatalog || catalogRunes.length > 0) return;
    setCatalogLoading(true);
    getAllRunes()
      .then(setCatalogRunes)
      .finally(() => setCatalogLoading(false));
  }, [useCatalog, catalogRunes.length]);

  if (equipped.kind === "empty") {
    return (
      <div className="w-full rounded-lg border border-border bg-card/50 p-3 text-center text-sm text-muted-foreground">
        No item equipped in this slot.
        <button
          onClick={onClose}
          className="ml-2 text-primary hover:underline text-xs"
        >
          Close
        </button>
      </div>
    );
  }

  const { runes, name } = equipped;
  const isWeapon = equipped.kind === "weapon";
  const isArmor = equipped.kind === "armor";
  const isTrinket = equipped.kind === "trinket";

  function handleAssignRune(
    rune: Rune,
    index: number,
    materialEffectKind?: "weapon" | "armor",
  ) {
    setViolation(null);
    let result: RuleViolation | null = null;

    if (isWeapon) {
      result = assignWeaponRune(slot as "mainHand" | "offHand", index, rune);
    } else if (isArmor) {
      result = assignArmorRune(index, rune);
    } else if (isTrinket) {
      assignTrinketRune(
        slot as "trinket1" | "trinket2",
        rune,
        materialEffectKind,
      );
    }

    if (result) {
      setViolation(result);
    } else {
      setAssigningIndex(null);
    }
  }

  function handleRemoveRune(index: number) {
    setViolation(null);
    if (isWeapon) removeWeaponRune(slot as "mainHand" | "offHand", index);
    else if (isArmor) removeArmorRune(index);
    else if (isTrinket) removeTrinketRune(slot as "trinket1" | "trinket2");
  }

  const assignedKeys = collectAssignedRuneKeys(
    mainHand,
    offHand,
    armor,
    trinket1,
    trinket2,
  );

  function filterBySlot(source: Rune[]): Rune[] {
    return source.filter((r) => {
      if (assignedKeys.has(`${r.name}||${r.monsterName}`)) return false;
      if (isWeapon) return r.slots.includes("W");
      if (isArmor) return r.slots.includes("A");
      return true;
    });
  }

  const filteredRunes = filterBySlot(availableRunes);
  const filteredCatalogRunes = filterBySlot(catalogRunes);

  return (
    <div className="w-full min-w-0 max-w-full rounded-lg border border-border bg-card/50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Runes — {name}</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {violation && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive">
            <p className="font-medium">{violation.rule}</p>
            <p className="text-destructive/80">
              Conflicting: {violation.offenders.join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {runes.map((rune, i) => (
          <div
            key={i}
            className={cn(
              "w-16 h-16 rounded-md border flex flex-col items-center justify-center gap-0.5 relative group",
              rune
                ? "border-primary/50 bg-primary/5"
                : "border-dashed border-border hover:border-primary/30 cursor-pointer",
            )}
            onClick={() => !rune && setAssigningIndex(i)}
          >
            {rune ? (
              <>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1.5 text-[10px] leading-relaxed text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <p className="font-medium text-foreground break-words">{rune.name}</p>
                  <div className="text-muted-foreground break-words whitespace-normal">
                    <RuneEffectText
                      text={
                        isWeapon
                          ? (rune.weaponEffect ?? "")
                          : isArmor
                            ? (rune.armorEffect ?? "")
                            : getRuneMaterialEffectText(
                                rune,
                                equipped.item.runeMaterialEffect ?? "armor",
                              )
                      }
                    />
                  </div>
                </div>
                <Gem className="h-3.5 w-3.5 text-primary" />
                <span className="text-[8px] text-foreground text-center leading-tight px-0.5 truncate w-full">
                  {rune.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveRune(i);
                  }}
                  className="absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5 text-destructive-foreground" />
                </button>
              </>
            ) : (
              <>
                <Gem className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-[8px] text-muted-foreground">Empty</span>
              </>
            )}
          </div>
        ))}
      </div>

      {assigningIndex !== null && (
        <>
          {catalogLoading ? (
            <div className="border-t border-border pt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground py-4">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading runes…
            </div>
          ) : (
            <RunePickerPanel
              runes={useCatalog ? filteredCatalogRunes : filteredRunes}
              mode={useCatalog ? "catalog" : "build"}
              slotLabel={`Select rune for slot ${assigningIndex + 1}`}
              slotKind={equipped.kind === "weapon" ? "weapon" : equipped.kind === "armor" ? "armor" : "trinket"}
              compatibilityCtx={compatibilityCtx}
              onSelect={(rune, materialEffectKind) =>
                handleAssignRune(rune, assigningIndex, materialEffectKind)
              }
              onCancel={() => setAssigningIndex(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
