import { AlertTriangle, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    void downloadAllBuildRuneJsons(
      weaponRunes,
      armorRunes,
      trinket1Rune,
      trinket2Rune,
    );
  };

  return (
    <div className="shrink-0 border-t border-border px-5 py-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalRunes} material{totalRunes !== 1 ? "es" : ""} en el build
        </span>
        {totalViolations > 0 ? (
          <Badge variant="orange" className="gap-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            {totalViolations} conflicto{totalViolations !== 1 ? "s" : ""}
          </Badge>
        ) : (
          <Badge variant="green" className="font-medium">
            Build válido ✓
          </Badge>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground/60 italic">
        Los cambios no se guardan entre sesiones.
      </p>
      <Button
        onClick={handleDownload}
        variant="outline"
        className="mt-3 w-full gap-2 border-amber-600/30 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 hover:text-amber-400"
      >
        <Download className="h-4 w-4" />
        Export Runes to Foundry
      </Button>
    </div>
  );
}
