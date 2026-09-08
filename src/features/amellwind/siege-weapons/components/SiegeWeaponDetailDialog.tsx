import type { SiegeWeapon } from "@/shared/types";
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
import { DescriptionLines } from "@/shared/components/DescriptionLines";

interface SiegeWeaponDetailDialogProps {
  weapon: SiegeWeapon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SiegeWeaponDetailDialog({
  weapon,
  open,
  onOpenChange,
}: SiegeWeaponDetailDialogProps) {
  if (!weapon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-orange-400 text-2xl">
            {weapon.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                {weapon.objectTypeLabel} · {weapon.source}
              </Badge>
              <Badge variant="outline">{weapon.sizeLabel}</Badge>
              {weapon.page !== undefined && (
                <span className="text-xs text-muted-foreground">
                  p.{weapon.page}
                </span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Armor Class</p>
              <p className="text-sm font-semibold text-foreground">
                {weapon.acLabel}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Hit Points</p>
              <p className="text-sm font-semibold text-foreground">
                {weapon.hpLabel}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 col-span-2 sm:col-span-1">
              <p className="text-xs text-muted-foreground mb-0.5">Size</p>
              <p className="text-sm font-semibold text-foreground">
                {weapon.sizeLabel}
              </p>
            </div>
          </div>

          {weapon.immunities.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
                Damage Immunities
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {weapon.immunities.map((immunity) => (
                  <span
                    key={immunity}
                    className="rounded-md border border-orange-800/50 bg-orange-950/40 px-2.5 py-1 text-xs font-medium text-orange-300"
                  >
                    {immunity}
                  </span>
                ))}
              </div>
              <Separator className="my-4" />
            </>
          )}

          {weapon.paragraphs.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">
                Description
              </h3>
              <DescriptionLines
                lines={weapon.paragraphs}
                insetAccent="amber"
              />
            </>
          )}

          {weapon.actions.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">
                Actions
              </h3>
              <div className="space-y-4">
                {weapon.actions.map((action) => (
                  <div key={action.name}>
                    <h4 className="text-sm font-semibold text-foreground mb-1.5">
                      {action.name}
                    </h4>
                    <DescriptionLines
                      lines={action.paragraphs}
                      insetAccent="amber"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
