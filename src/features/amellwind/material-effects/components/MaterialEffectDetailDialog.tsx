import type { MaterialEffect } from "@/shared/types";
import {
  MATERIAL_EFFECT_SLOT_LABELS,
  RESOURCE_RARITY_STYLES,
} from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { Link2 } from "lucide-react";

interface MaterialEffectDetailDialogProps {
  effect: MaterialEffect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialEffectDetailDialog({
  effect,
  open,
  onOpenChange,
}: MaterialEffectDetailDialogProps) {
  if (!effect) return null;

  const style = RESOURCE_RARITY_STYLES[effect.rarity];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-amber-400 text-xl">
            {effect.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={cn("text-xs font-semibold", style.badge)}
              >
                {effect.rarity}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  effect.slot === "weapon"
                    ? "bg-orange-950/40 text-orange-300 border-orange-800/50"
                    : "bg-blue-950/40 text-blue-300 border-blue-800/50",
                )}
              >
                {MATERIAL_EFFECT_SLOT_LABELS[effect.slot]}
              </Badge>
              {effect.isReference && (
                <Badge
                  variant="outline"
                  className="text-xs bg-violet-950/40 text-violet-300 border-violet-800/50"
                >
                  <Link2 className="h-3 w-3 mr-1" />
                  Monster material reference
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
            Material Effect
          </h3>
          <div
            className={cn(
              "rounded-lg border p-4 bg-gradient-to-br",
              style.bg,
              style.border,
            )}
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              {effect.effect}
            </p>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
