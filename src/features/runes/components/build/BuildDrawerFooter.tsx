import { useState } from "react";
import { AlertTriangle, Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MaterialEffectSlot, Rune } from "@/shared/types";
import { extractLeadingMaterialEffectName } from "@/features/material-effects/utils/material-effect-highlight.utils";
import { useRuneBuild } from "../../context/RuneBuildContext";

interface BuildDrawerFooterProps {
  totalRunes: number;
  totalViolations: number;
}

function listRunes(runes: (Rune | null)[]): string[] {
  const filled = runes.filter((r): r is Rune => r !== null);
  if (filled.length === 0) return ["- (none)"];
  return filled.map((r) => `- ${r.name} (${r.monsterName})`);
}

function describeTrinket(
  label: string,
  rune: Rune | null,
  kind: MaterialEffectSlot | null,
): string {
  if (!rune) return `${label}: (empty)`;
  const effectKind = kind ?? (rune.weaponEffect ? "weapon" : "armor");
  const effectText =
    effectKind === "weapon" ? rune.weaponEffect : rune.armorEffect;
  const materialEffectName = effectText
    ? extractLeadingMaterialEffectName(effectText)
    : null;
  const suffix = materialEffectName ? `: ${materialEffectName}` : "";
  return `${label}: ${rune.name} (${rune.monsterName}) — ${effectKind}${suffix}`;
}

export function BuildDrawerFooter({ totalRunes, totalViolations }: BuildDrawerFooterProps) {
  const {
    weaponRunes,
    armorRunes,
    trinket1Rune,
    trinket2Rune,
    trinket1Kind,
    trinket2Kind,
  } = useRuneBuild();
  const [copied, setCopied] = useState(false);

  if (totalRunes === 0) return null;

  const buildCopyText = (): string =>
    [
      "Weapon runes:",
      ...listRunes(weaponRunes),
      "Armor runes:",
      ...listRunes(armorRunes),
      "Trinkets:",
      `- ${describeTrinket("Trinket 1", trinket1Rune, trinket1Kind)}`,
      `- ${describeTrinket("Trinket 2", trinket2Rune, trinket2Kind)}`,
    ].join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
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
        onClick={handleCopy}
        variant="outline"
        className="mt-3 w-full gap-2 border-amber-600/30 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 hover:text-amber-400"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy runes names
          </>
        )}
      </Button>
    </div>
  );
}
