import { Check } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { RARITY_BADGE } from "../constants";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-primary">
      {children}
    </p>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-xs text-muted-foreground">{text}</p>
  );
}

export function LibraryItemBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "category";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium",
        variant === "category"
          ? "border-amber-700/40 bg-amber-950/30 text-amber-200/90"
          : "border-border/50 bg-muted/40 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function LibraryItemBadgeRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1 pl-5 pt-1">
      {children}
    </div>
  );
}

export function ItemRow({
  icon,
  name,
  meta,
  rarity,
  trailing,
  trailingTitle,
  equipped = false,
  disabled = false,
  disabledHint,
  onClick,
}: {
  icon: React.ReactNode;
  name: string;
  meta?: React.ReactNode;
  rarity?: string;
  trailing?: string;
  trailingTitle?: string;
  equipped?: boolean;
  disabled?: boolean;
  disabledHint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      className={cn(
        "mb-1 flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
        equipped ? "border-violet-400/40 bg-violet-400/5" : "border-border/60",
        disabled ? "cursor-not-allowed opacity-40" : "hover:bg-muted/50",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 font-medium text-foreground">
          {icon}
          <span className="truncate">{name}</span>
          {equipped && <Check className="h-3 w-3 shrink-0 text-emerald-400" />}
        </div>
        {meta}
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-1.5">
        {trailing && (
          <span
            className="max-w-[16rem] text-[10px] text-muted-foreground"
            title={trailingTitle ?? trailing}
          >
            {trailing}
          </span>
        )}
        {rarity && RARITY_BADGE[rarity] && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              RARITY_BADGE[rarity],
            )}
          >
            {rarity}
          </span>
        )}
      </div>
    </button>
  );
}
