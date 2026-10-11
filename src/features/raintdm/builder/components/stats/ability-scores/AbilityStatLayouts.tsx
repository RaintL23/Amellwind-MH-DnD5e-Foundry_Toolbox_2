import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { ABILITY_CARD_CLASS } from "./constants";

interface AbilityStatLayoutProps {
  label: string;
  modifier: string;
  /** Short explanation of what the ability is used for. */
  description?: string;
  /** Marks one of the class's most important abilities. */
  isKey?: boolean;
  children: ReactNode;
}

function KeyBadge() {
  return (
    <span className="rounded bg-primary/15 px-1 text-[10px] font-semibold uppercase leading-tight text-primary">
      Key
    </span>
  );
}

export function AbilityStatCard({
  label,
  modifier,
  description,
  isKey = false,
  children,
}: Readonly<AbilityStatLayoutProps>) {
  return (
    <div
      className={cn(ABILITY_CARD_CLASS, isKey && "border-primary/50 bg-primary/5")}
    >
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
        {isKey && <KeyBadge />}
      </span>
      {description && (
        <span className="text-center text-[10px] leading-tight text-muted-foreground/80">
          {description}
        </span>
      )}
      {children}
      <span className="text-[11px] text-muted-foreground">{modifier}</span>
    </div>
  );
}

export function AbilityStatRow({
  label,
  modifier,
  description,
  isKey = false,
  children,
}: Readonly<AbilityStatLayoutProps>) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-foreground w-8">{label}</span>
      {children}
      <span className="text-xs font-medium text-primary min-w-[28px]">
        {modifier}
      </span>
      {(description || isKey) && (
        <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
          {isKey && <KeyBadge />}
          <span className="truncate">{description}</span>
        </span>
      )}
    </div>
  );
}
