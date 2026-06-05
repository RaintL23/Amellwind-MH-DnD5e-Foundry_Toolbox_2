import { ReactNode } from "react";
import { formatModifier } from "@/shared/utils/cr.utils";
import { Shield } from "lucide-react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { BuilderPanel } from "./BuilderPanel";

export function BuilderDerivedPanel() {
  const {
    character,
    totalAC,
    attacksPerTurnOverride,
    setAttacksPerTurnOverride,
    effectiveAttacksPerTurn,
    combat,
  } = useCharacterBuilder();

  const critRange = combat.mainHand?.critRange ?? 20;
  const critPct = Math.round(((21 - critRange) / 20) * 100);

  return (
    <BuilderPanel
      title={
        <>
          <Shield className="h-3.5 w-3.5" aria-hidden /> Other Stats
        </>
      }
    >
      <div className="space-y-0">
        <DerivedRow
          label="Proficiency"
          value={`+${character.getProficiencyBonus()}`}
        />
        <DerivedRow label="CA" value={String(totalAC)} />
        <DerivedRow
          label="Initiative"
          value={formatModifier(character.getModifier("dex"))}
        />
        <DerivedRow
          label="Attacks/turn"
          value={
            <input
              type="number"
              min={1}
              max={10}
              value={attacksPerTurnOverride ?? 1}
              placeholder={String(character.getAttacksPerTurn())}
              onChange={(e) => {
                const v = e.target.value;
                setAttacksPerTurnOverride(
                  v === "" ? null : Math.max(1, parseInt(v) || 1),
                );
              }}
              className="w-10 rounded border border-border bg-background px-1 py-0.5 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              title={`Default: ${character.getAttacksPerTurn()} (level). Override to customize.`}
            />
          }
        />
        <DerivedRow
          label="Critical Range"
          value={critRange === 20 ? "20" : `${critRange}–20`}
        />
      </div>
      {attacksPerTurnOverride !== null && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Effective: {effectiveAttacksPerTurn} attacks/turn (overridden)
        </p>
      )}
      <p className="mt-2 text-[10px] text-muted-foreground">
        Critical Chance:{" "}
        <span className="font-medium text-foreground">{critPct}%</span>
      </p>
    </BuilderPanel>
  );
}

function DerivedRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-1.5 text-[13px] last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
