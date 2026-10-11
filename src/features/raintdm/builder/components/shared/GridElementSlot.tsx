import { ReactNode } from "react";
import { Lock, Plus, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SlotAccent = "default" | "weapon" | "armor";

interface GridElementSlotProps {
  label: string;
  icon: ReactNode;
  equipped: { name: string; detail?: string } | null;
  onClickEquip: () => void;
  onClickDetails: () => void;
  onUnequip?: () => void;
  isSelected: boolean;
  disabled?: boolean;
  disabledHint?: string;
  accent?: SlotAccent;
  emptyTitle?: string;
  highlighted?: boolean;
  /** Suggested next choice from the creation checklist (softer than `highlighted`). */
  isNext?: boolean;
}

const ACCENT_CLASS: Record<SlotAccent, string> = {
  default: "",
  weapon: "border-violet-400/50 hover:border-violet-400/80",
  armor: "border-sky-400/50 hover:border-sky-400/80",
};

const NEXT_SLOT_CLASS =
  "border-primary/70 bg-primary/10 text-foreground ring-2 ring-primary/40 hover:border-primary";

function NextBadge() {
  return (
    <span className="pointer-events-none absolute -left-1 -top-1.5 flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-primary-foreground shadow-sm">
      <span
        className="h-1.5 w-1.5 rounded-full bg-primary-foreground motion-safe:animate-pulse"
        aria-hidden
      />
      Next
    </span>
  );
}

export function GridElementSlot({
  label,
  icon,
  equipped,
  onClickEquip,
  onClickDetails,
  onUnequip,
  isSelected,
  disabled = false,
  disabledHint,
  accent = "default",
  emptyTitle,
  highlighted = false,
  isNext = false,
}: Readonly<GridElementSlotProps>) {
  const showNext = isNext && !highlighted;
  if (disabled) {
    return (
      <div
        title={disabledHint ?? label}
        className="flex min-h-[72px] w-full cursor-not-allowed flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/40 bg-muted/20 p-2 text-center opacity-50"
      >
        <Lock className="h-4 w-4 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">{label}</span>
        {disabledHint && (
          <span className="text-[11px] leading-tight text-muted-foreground/70">
            {disabledHint}
          </span>
        )}
      </div>
    );
  }

  if (!equipped) {
    return (
      <div className="relative w-full">
        <button
          type="button"
          onClick={onClickEquip}
          title={emptyTitle ?? `Equip ${label}`}
          aria-label={showNext ? `${label} (suggested next step)` : undefined}
          className={cn(
            "flex min-h-[72px] w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed p-2 text-[11px] text-muted-foreground transition-all hover:text-foreground",
            highlighted
              ? "border-amber-500/70 bg-amber-500/10 ring-1 ring-amber-500/40 hover:border-amber-500 hover:bg-amber-500/15"
              : showNext
                ? NEXT_SLOT_CLASS
                : "border-border/70 bg-muted/20 hover:border-border hover:bg-muted/40",
            !showNext && ACCENT_CLASS[accent],
          )}
        >
          <Plus className="h-5 w-5" />
          <span>{label}</span>
        </button>
        {showNext && <NextBadge />}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative w-full">
        <button
          type="button"
          onClick={onClickDetails}
          title={`${equipped.name} — click to view or change`}
          className={cn(
            "flex min-h-[72px] w-full flex-col items-center justify-center gap-0.5 rounded-md border border-solid p-2 text-center transition-all",
            highlighted
              ? "border-amber-500/70 bg-amber-500/10 ring-1 ring-amber-500/40 hover:border-amber-500"
              : showNext
                ? NEXT_SLOT_CLASS
                : "border-border/70 bg-card hover:border-primary/40",
            isSelected && "border-primary bg-primary/10 ring-1 ring-primary/30",
            !showNext && ACCENT_CLASS[accent],
          )}
        >
          {icon}
          <span className="w-full truncate text-[11px] font-medium text-foreground">
            {equipped.name}
          </span>
          {equipped.detail && (
            <span className="text-[11px] text-muted-foreground">
              {equipped.detail}
            </span>
          )}
        </button>
        {onUnequip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnequip();
                }}
                aria-label={`Remove ${label}`}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                <X className="h-3 w-3" strokeWidth={3} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Remove {label}</TooltipContent>
          </Tooltip>
        )}
        {showNext && <NextBadge />}
      </div>
    </TooltipProvider>
  );
}
