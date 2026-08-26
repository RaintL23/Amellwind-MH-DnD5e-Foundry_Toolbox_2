import { useEffect, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { AddToBuildSection } from "./AddToBuildSection";
import { EffectSection } from "./EffectSection";
import { TierBadge } from "../shared/TierBadge";
import type { MaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import type { RuneListEffectFilters } from "../../utils/rune-compatibility.utils";
import {
  hasActiveRuneEffectListFilters,
  runeEffectMatchesListFilters,
} from "../../utils/rune-compatibility.utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RuneDetailDialogProps {
  rune: Rune | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialEffectIndex?: MaterialEffectNameIndex | null;
  /** Active effect-scoped list filters (slot / tags / material-effect tier). */
  effectFilters?: RuneListEffectFilters;
  /** Full filtered list for prev/next navigation. */
  filteredRunes?: Rune[];
  /** Called when the user navigates to a different rune. */
  onNavigate?: (rune: Rune) => void;
  /** When false, hides Rune Builder add/remove controls (read-only preview). */
  showAddToBuild?: boolean;
}

const EMPTY_EFFECT_FILTERS: RuneListEffectFilters = {
  slot: "",
  tag: [],
  materialEffectTier: [],
};

export function RuneDetailDialog({
  rune,
  open,
  onOpenChange,
  materialEffectIndex,
  effectFilters = EMPTY_EFFECT_FILTERS,
  filteredRunes,
  onNavigate,
  showAddToBuild = true,
}: RuneDetailDialogProps) {
  const currentIndex = filteredRunes && rune
    ? filteredRunes.findIndex(
        (r) => r.name === rune.name && r.monsterName === rune.monsterName,
      )
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext =
    filteredRunes != null && currentIndex < filteredRunes.length - 1;
  const showNav = !!filteredRunes && filteredRunes.length > 1;

  const goTo = useCallback(
    (delta: -1 | 1) => {
      if (!filteredRunes || !onNavigate) return;
      const next = filteredRunes[currentIndex + delta];
      if (next) onNavigate(next);
    },
    [filteredRunes, currentIndex, onNavigate],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrev) goTo(-1);
      if (e.key === "ArrowRight" && hasNext) goTo(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, hasPrev, hasNext, goTo]);

  if (!rune) return null;

  const filtersActive = hasActiveRuneEffectListFilters(effectFilters);
  const armorMatches =
    !rune.armorEffect ||
    !filtersActive ||
    runeEffectMatchesListFilters(
      rune,
      "armor",
      effectFilters,
      materialEffectIndex,
    );
  const weaponMatches =
    !rune.weaponEffect ||
    !filtersActive ||
    runeEffectMatchesListFilters(
      rune,
      "weapon",
      effectFilters,
      materialEffectIndex,
    );

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
                {rune.monsterCr && (
                  <span className="ml-1 text-muted-foreground/60">
                    (CR {rune.monsterCr})
                  </span>
                )}
              </span>
              <TierBadge tier={rune.tier} variant="full" />
              {rune.slots.includes("A") && <Badge variant="blue">Armor</Badge>}
              {rune.slots.includes("W") && (
                <Badge variant="orange">Weapon</Badge>
              )}
              {rune.otherEffect && !rune.slots.length && (
                <Badge variant="secondary">Other</Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-md p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Carve (d20)
              </p>
              <p className="text-lg font-semibold text-foreground">
                {rune.carveChance === "-" ? (
                  <span className="text-muted-foreground text-sm">
                    No carveable
                  </span>
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
                  <span className="text-muted-foreground text-sm">
                    No capturable
                  </span>
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

          {rune.armorEffect && (
            <EffectSection
              label="Armor Effect"
              text={rune.armorEffect}
              slot="armor"
              tags={rune.armorTags}
              materialEffectIndex={materialEffectIndex}
              dimmed={filtersActive && !armorMatches}
            />
          )}
          {rune.weaponEffect && (
            <EffectSection
              label="Weapon Effect"
              text={rune.weaponEffect}
              slot="weapon"
              tags={rune.weaponTags}
              materialEffectIndex={materialEffectIndex}
              dimmed={filtersActive && !weaponMatches}
            />
          )}
          {rune.otherEffect && (
            <EffectSection label="Other" text={rune.otherEffect} />
          )}

          {showAddToBuild && (
            <>
              <Separator className="my-4" />
              <AddToBuildSection
                rune={rune}
                weaponAllowed={!filtersActive || weaponMatches}
                armorAllowed={!filtersActive || armorMatches}
              />
            </>
          )}
        </DialogBody>

        {/* Navigation footer — sits below all content, never overlaps */}
        {showNav && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goTo(-1)}
              disabled={!hasPrev}
              aria-label="Previous rune"
              className="gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground/60 tabular-nums">
              {currentIndex + 1} / {filteredRunes.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goTo(1)}
              disabled={!hasNext}
              aria-label="Next rune"
              className="gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
