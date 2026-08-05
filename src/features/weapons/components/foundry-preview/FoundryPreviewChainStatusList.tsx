import { Badge } from "@/components/ui/badge";
import { TEMPLATE_LABELS } from "@/shared/foundry/weapons";
import type { ResolvedCombatChain } from "@/shared/foundry/weapons";

export function ChainStatusList({ chains }: { chains: ResolvedCombatChain[] }) {
  if (chains.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No combat feature chains at this rarity (resources are excluded).
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {chains.map((resolved) => {
        const template = resolved.effective?.template ?? "unmapped";
        const params = resolved.effective?.params ?? {};
        const bits: string[] = [];
        if (params.damageFormula) bits.push(params.damageFormula);
        if (params.itemUsesMax) {
          bits.push(
            template === "counter_spend" || template === "charge_pool_attack"
              ? `counters ${params.itemUsesMax}`
              : `gauge ${params.itemUsesMax}`,
          );
        }
        if (
          (template === "counter_spend" ||
            template === "charge_pool_attack") &&
          (params.spendMin || params.spendMax)
        ) {
          bits.push(
            `spend ${params.spendMin ?? 1}–${params.spendMax ?? "?"}`,
          );
        }
        return (
          <li
            key={resolved.chain.chainKey}
            className="flex flex-wrap items-center gap-2 text-xs"
          >
            <span className="font-medium text-foreground">
              {resolved.displayName}
            </span>
            <Badge variant="outline" className="rounded px-1.5 py-0 text-[10px]">
              {resolved.status}
            </Badge>
            <span className="text-muted-foreground">
              {TEMPLATE_LABELS[template] ?? template}
            </span>
            {bits.length > 0 && (
              <span className="text-muted-foreground/80">
                ({bits.join(" · ")})
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
