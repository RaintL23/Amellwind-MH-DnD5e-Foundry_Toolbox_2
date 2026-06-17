import { ChevronUp, Info, Zap } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { averageRoll, parseDice } from "@/features/builder/utils/spell-selection.utils";

const SOURCE_COLORS: Record<string, string> = {
  PHB: "bg-amber-950/50 text-amber-300 border-amber-700/40",
  XPHB: "bg-sky-950/50 text-sky-300 border-sky-700/40",
  XGE: "bg-emerald-950/50 text-emerald-300 border-emerald-700/40",
  TCE: "bg-violet-950/50 text-violet-300 border-violet-700/40",
};

export function SpellLibrarySourceBadge({ source }: { source: string }) {
  const cls =
    SOURCE_COLORS[source] ??
    "bg-muted/40 text-muted-foreground border-border/50";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1 py-0 text-[9px] font-medium",
        cls,
      )}
    >
      {source}
    </span>
  );
}

export function SpellDamageResult({ damageRoll }: { damageRoll: string }) {
  const dice = parseDice(damageRoll);
  const avg = dice ? averageRoll(dice.count, dice.sides) : null;
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-md border border-amber-700/40 bg-amber-950/30 px-2 py-1.5 text-xs">
      <Zap className="h-3.5 w-3.5 shrink-0 text-amber-400" />
      <span className="font-medium text-amber-200">{damageRoll}</span>
      {avg !== null && (
        <span className="text-amber-300/70">(~{avg} prom.)</span>
      )}
    </div>
  );
}

export function SpellInfoToggleButton({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={expanded ? "Ocultar detalles" : "Ver detalles del hechizo"}
      aria-expanded={expanded}
      aria-label={
        expanded ? "Ocultar detalles del hechizo" : "Ver detalles del hechizo"
      }
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {expanded ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <Info className="h-3 w-3" />
      )}
    </button>
  );
}

export function SpellDamageToggleButton({
  showDamage,
  onToggle,
}: {
  showDamage: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title="Calcular daño"
      className="flex h-5 w-5 items-center justify-center rounded bg-amber-950/50 text-amber-400 transition-colors hover:bg-amber-950/80"
    >
      {showDamage ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <Zap className="h-3 w-3" />
      )}
    </button>
  );
}
