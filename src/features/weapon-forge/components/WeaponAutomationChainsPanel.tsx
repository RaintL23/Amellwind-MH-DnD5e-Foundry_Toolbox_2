import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { WeaponForgeFeatureDef } from "../types/weapon-forge.types";
import {
  resolveCombatChainsAtRarity,
  type ResolvedCombatChain,
} from "@/shared/foundry/weapons";
import type { WeaponFeatureAutomationStatus } from "@/shared/foundry/weapons";
import { TEMPLATE_LABELS } from "@/shared/foundry/weapons";

interface WeaponAutomationChainsPanelProps {
  rarityRows: import("@/shared/types").WeaponRarityRow[];
  customFeatures: WeaponForgeFeatureDef[];
  rarityIndex: number;
  className?: string;
}

const STATUS_STYLES: Record<WeaponFeatureAutomationStatus, string> = {
  ready: "border-emerald-700/50 bg-emerald-950/30 text-emerald-300",
  partial: "border-amber-700/50 bg-amber-950/30 text-amber-300",
  unmapped: "border-border/60 bg-muted/40 text-muted-foreground",
  resource_skipped: "border-border/40 text-muted-foreground/70",
};

function statusLabel(status: WeaponFeatureAutomationStatus): string {
  switch (status) {
    case "ready":
      return "ready";
    case "partial":
      return "partial";
    case "resource_skipped":
      return "resource";
    default:
      return "unmapped";
  }
}

function chainTitle(resolved: ResolvedCombatChain): string {
  const names = resolved.prefix.map(
    (l) => l.def?.name ?? l.featureName,
  );
  if (names.length === 1) return names[0];
  return `${names[0]} → ${names[names.length - 1]}`;
}

export function WeaponAutomationChainsPanel({
  rarityRows,
  customFeatures,
  rarityIndex,
  className,
}: WeaponAutomationChainsPanelProps) {
  const chains = useMemo(
    () =>
      resolveCombatChainsAtRarity(
        { rarityRows, customFeatures },
        rarityIndex,
      ),
    [rarityRows, customFeatures, rarityIndex],
  );

  if (chains.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div>
        <p className="text-sm font-medium">Foundry activities (this rarity)</p>
        <p className="text-xs text-muted-foreground">
          Each row is one feature chain. Most emit one Activity; charge pools
          emit Gather Charge plus ×1…×N attacks. Upgrades merge into that chain.
        </p>
      </div>
      <ul className="space-y-1.5">
        {chains.map((resolved) => {
          const template = resolved.effective?.template ?? "unmapped";
          const params = resolved.effective?.params ?? {};
          const summaryParts: string[] = [];
          if (params.damageFormula) summaryParts.push(params.damageFormula);
          if (params.itemUsesMax) {
            summaryParts.push(
              template === "counter_spend" ||
                template === "charge_pool_attack"
                ? `pool ${params.itemUsesMax} · spend ${params.spendMin ?? 1}–${params.spendMax ?? params.itemUsesMax}`
                : `uses ${params.itemUsesMax}`,
            );
          } else if (
            (template === "counter_spend" ||
              template === "charge_pool_attack") &&
            (params.spendMax || params.spendMin)
          ) {
            summaryParts.push(
              `spend ${params.spendMin ?? 1}–${params.spendMax ?? "?"}`,
            );
          }
          if (params.activation) summaryParts.push(params.activation);

          return (
            <li
              key={resolved.chain.chainKey}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border/50 px-2.5 py-1.5 text-xs"
            >
              <span className="font-medium text-foreground min-w-0 flex-1 truncate">
                {chainTitle(resolved)}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "rounded px-1.5 py-0 text-[10px] font-medium",
                  STATUS_STYLES[resolved.status],
                )}
              >
                {statusLabel(resolved.status)}
              </Badge>
              <span className="text-muted-foreground shrink-0">
                {TEMPLATE_LABELS[template] ?? template}
              </span>
              {summaryParts.length > 0 && (
                <span className="text-muted-foreground/80 shrink-0">
                  ({summaryParts.join(" · ")})
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
