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
import { AddToBuildSection } from "./AddToBuildSection";
import { EffectSection } from "./EffectSection";
import { TierBadge } from "../shared/TierBadge";
import type { MaterialEffectNameIndex } from "@/features/material-effects/services/material-effect.service";

interface RuneDetailDialogProps {
  rune: Rune | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialEffectIndex?: MaterialEffectNameIndex | null;
}

export function RuneDetailDialog({
  rune,
  open,
  onOpenChange,
  materialEffectIndex,
}: RuneDetailDialogProps) {
  if (!rune) return null;

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
            />
          )}
          {rune.weaponEffect && (
            <EffectSection
              label="Weapon Effect"
              text={rune.weaponEffect}
              slot="weapon"
              tags={rune.weaponTags}
              materialEffectIndex={materialEffectIndex}
            />
          )}

          <Separator className="my-4" />
          <AddToBuildSection rune={rune} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
