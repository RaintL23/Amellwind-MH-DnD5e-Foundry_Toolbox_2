import type { ReactNode } from "react";
import { ABILITY_CARD_CLASS } from "./constants";

export function AbilityStatCard({
  label,
  modifier,
  children,
}: {
  label: string;
  modifier: string;
  children: ReactNode;
}) {
  return (
    <div className={ABILITY_CARD_CLASS}>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
      <span className="text-[11px] text-muted-foreground">{modifier}</span>
    </div>
  );
}

export function AbilityStatRow({
  label,
  modifier,
  children,
}: {
  label: string;
  modifier: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-foreground w-8">{label}</span>
      {children}
      <span className="text-xs font-medium text-primary min-w-[28px]">
        {modifier}
      </span>
    </div>
  );
}
