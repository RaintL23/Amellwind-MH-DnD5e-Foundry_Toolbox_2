import { ReactNode } from "react";
import { formatModifier } from "@/shared/utils/cr.utils";
import { Shield } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useCharacterArmorClass } from "../../hooks/useCharacterArmorClass";
import { useCharacterHitPoints } from "../../hooks/useCharacterHitPoints";
import { useCharacterSpeed } from "../../hooks/useCharacterSpeed";
import { BuilderPanel } from "../shared/BuilderPanel";

export function BuilderDerivedPanel() {
  const { character } = useCharacterBuilder();
  const hitPointStats = useCharacterHitPoints();
  const armorClass = useCharacterArmorClass();
  const speedStats = useCharacterSpeed();

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
        <DerivedRow
          label="Hit Points"
          value={hitPointStats ? String(hitPointStats.max) : "—"}
          valueTooltip={hitPointStats?.tooltip}
        />
        <DerivedRow label="Hit Dice" value={hitPointStats?.hitDice ?? "—"} />
        <DerivedRow
          label="AC"
          value={String(armorClass.total)}
          valueTooltip={armorClass.tooltip}
        />
        <DerivedRow
          label="Speed"
          value={speedStats.display}
          valueTooltip={speedStats.tooltip}
        />
        <DerivedRow
          label="Initiative"
          value={formatModifier(character.getModifier("dex"))}
        />
      </div>
    </BuilderPanel>
  );
}

function DerivedRow({
  label,
  value,
  valueTooltip,
}: {
  label: string;
  value: ReactNode;
  valueTooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-1.5 text-[13px] last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`relative text-sm font-medium text-foreground ${
          valueTooltip ? "group cursor-help" : ""
        }`}
        title={valueTooltip}
      >
        {value}
        {valueTooltip && (
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-md border border-border bg-popover px-2 py-1.5 text-left text-[10px] leading-relaxed text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100 whitespace-pre-line"
          >
            {valueTooltip}
          </span>
        )}
      </span>
    </div>
  );
}
