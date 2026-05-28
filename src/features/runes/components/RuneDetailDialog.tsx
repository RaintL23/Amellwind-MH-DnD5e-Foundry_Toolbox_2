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

interface RuneDetailDialogProps {
  rune: Rune | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RuneDetailDialog({ rune, open, onOpenChange }: RuneDetailDialogProps) {
  if (!rune) return null;

  const classTags = rune.tags.filter((t) => t.startsWith("class:"));
  const weaponTags = rune.tags.filter((t) => t.startsWith("weapon-type:"));
  const mechanicTags = rune.tags.filter((t) => t.startsWith("mechanic:"));

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
                      <span className="text-xs text-muted-foreground w-20">Class:</span>
                      {classTags.map((t) => (
                        <Badge key={t} variant="blue">
                          {formatTag(t)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {weaponTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-muted-foreground w-20">Weapon:</span>
                      {weaponTags.map((t) => (
                        <Badge key={t} variant="orange">
                          {formatTag(t)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {mechanicTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-muted-foreground w-20">Mechanic:</span>
                      {mechanicTags.map((t) => (
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
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
