import { AlertTriangle, Layers, Trash2, X } from "lucide-react";

interface BuildDrawerHeaderProps {
  totalRunes: number;
  totalViolations: number;
  onClear: () => void;
  onClose: () => void;
}

export function BuildDrawerHeader({
  totalRunes,
  totalViolations,
  onClear,
  onClose,
}: BuildDrawerHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-amber-400" />
        <h2 className="text-base font-bold text-foreground">Build Planner</h2>
        {totalRunes > 0 && (
          <span className="rounded-full bg-amber-600/20 text-amber-400 border border-amber-600/30 px-2 py-0.5 text-xs font-semibold">
            {totalRunes}
          </span>
        )}
        {totalViolations > 0 && (
          <span className="rounded-full bg-orange-900/30 text-orange-400 border border-orange-700/40 px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {totalViolations}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {totalRunes > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Limpiar build"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-md p-1.5 hover:bg-accent text-muted-foreground transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
