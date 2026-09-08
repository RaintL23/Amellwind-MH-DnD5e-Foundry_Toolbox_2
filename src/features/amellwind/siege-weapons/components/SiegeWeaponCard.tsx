import type { SiegeWeapon } from "@/shared/types";
import { Card } from "@/components/ui/card";
import { Crosshair } from "lucide-react";

interface SiegeWeaponCardProps {
  weapon: SiegeWeapon;
  onClick: () => void;
}

export function SiegeWeaponCard({ weapon, onClick }: SiegeWeaponCardProps) {
  return (
    <Card
      asChild
      className="w-full text-left p-4 transition-all duration-200 hover:bg-card/80 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-orange-500/40"
    >
      <button type="button" onClick={onClick}>
        <div className="flex items-start gap-3 mb-3">
          <div className="rounded-md p-2 shrink-0 bg-orange-950/60">
            <Crosshair className="h-5 w-5 text-orange-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground leading-tight truncate">
              {weapon.name}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="inline-block rounded border border-orange-800/50 bg-orange-950/40 px-1.5 py-0.5 text-[10px] font-medium text-orange-400">
                {weapon.objectTypeLabel}
              </span>
              <span className="inline-block rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {weapon.sizeLabel}
              </span>
            </div>
          </div>
        </div>

        {weapon.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
            {weapon.summary}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5">
          <span>
            AC {weapon.acLabel} · HP {weapon.hpLabel}
          </span>
          <span>
            {weapon.source}
            {weapon.page !== undefined ? ` · p. ${weapon.page}` : ""}
          </span>
        </div>
      </button>
    </Card>
  );
}
