import { AlertTriangle, Download } from "lucide-react";
import { useRuneBuild } from "../../context/RuneBuildContext";
import { downloadAllBuildRuneJsons } from "../../utils/rune-foundry-export";

interface BuildDrawerFooterProps {
  totalRunes: number;
  totalViolations: number;
}

export function BuildDrawerFooter({ totalRunes, totalViolations }: BuildDrawerFooterProps) {
  const { weaponRunes, armorRunes, trinket1Rune, trinket2Rune } = useRuneBuild();

  if (totalRunes === 0) return null;

  const handleDownload = () => {
    downloadAllBuildRuneJsons(weaponRunes, armorRunes, trinket1Rune, trinket2Rune);
  };

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
      <button
        onClick={handleDownload}
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-md bg-amber-600/20 border border-amber-600/30 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-600/30 transition-colors"
      >
        <Download className="h-4 w-4" />
        Export Runes to Foundry
      </button>
    </div>
  );
}
