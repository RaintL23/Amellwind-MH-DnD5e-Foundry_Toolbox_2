import { ReactNode } from "react";
import { Lock, Plus, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

type SlotAccent = "default" | "weapon" | "armor";

interface GridEquipmentSlotProps {
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
}

const ACCENT_CLASS: Record<SlotAccent, string> = {
  default: "",
  weapon: "border-violet-400/50 hover:border-violet-400/80",
  armor: "border-sky-400/50 hover:border-sky-400/80",
};

export function GridEquipmentSlot({
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
}: Readonly<GridEquipmentSlotProps>) {
  if (disabled) {
    return (
      <div
        title={disabledHint ?? label}
        className="flex min-h-[72px] cursor-not-allowed flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/40 bg-muted/20 p-2 text-center opacity-50"
      >
        <Lock className="h-4 w-4 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">{label}</span>
        {disabledHint && (
          <span className="text-[9px] leading-tight text-muted-foreground/70">
            {disabledHint}
          </span>
        )}
      </div>
    );
  }

  if (!equipped) {
    return (
      <button
        type="button"
        onClick={onClickEquip}
        title={emptyTitle ?? `Equipar ${label}`}
        className={cn(
          "flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/70 bg-muted/20 p-2 text-[11px] text-muted-foreground transition-all hover:border-border hover:bg-muted/40 hover:text-foreground",
          ACCENT_CLASS[accent],
        )}
      >
        <Plus className="h-5 w-5" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClickDetails}
        onDoubleClick={onClickEquip}
        title={`${equipped.name} — clic para detalles, doble clic para cambiar`}
        className={cn(
          "flex min-h-[72px] w-full flex-col items-center justify-center gap-0.5 rounded-md border border-solid border-border/70 bg-card p-2 text-center transition-all hover:border-primary/40",
          isSelected && "border-primary bg-primary/10 ring-1 ring-primary/30",
          ACCENT_CLASS[accent],
        )}
      >
        {icon}
        <span className="w-full truncate text-[11px] font-medium text-foreground">
          {equipped.name}
        </span>
        {equipped.detail && (
          <span className="text-[10px] text-muted-foreground">
            {equipped.detail}
          </span>
        )}
      </button>
      {onUnequip && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnequip();
          }}
          title={`Quitar ${label}`}
          aria-label={`Quitar ${label}`}
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <X className="h-2.5 w-2.5" strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
