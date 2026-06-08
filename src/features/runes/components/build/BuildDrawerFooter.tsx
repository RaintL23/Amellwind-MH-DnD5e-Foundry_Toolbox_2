import { AlertTriangle } from "lucide-react";

interface BuildDrawerFooterProps {
  totalRunes: number;
  totalViolations: number;
}

export function BuildDrawerFooter({ totalRunes, totalViolations }: BuildDrawerFooterProps) {
  if (totalRunes === 0) return null;

  return (
    <div className="shrink-0 border-t border-border px-5 py-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalRunes} material{totalRunes !== 1 ? "es" : ""} en el build</span>
        {totalViolations > 0 ? (
          <span className="flex items-center gap-1 text-orange-400 text-xs font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            {totalViolations} conflicto{totalViolations !== 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-green-400 text-xs font-medium">Build válido ✓</span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground/60 italic">
        Los cambios no se guardan entre sesiones.
      </p>
    </div>
  );
}
