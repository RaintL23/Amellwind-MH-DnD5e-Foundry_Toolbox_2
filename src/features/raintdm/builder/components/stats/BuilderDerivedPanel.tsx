import { ReactNode } from "react";
import { formatModifier } from "@/shared/utils/cr.utils";
import { Shield } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { getAttunementInfo } from "../../utils/attunement.utils";
import { useCharacterArmorClass } from "../../hooks/useCharacterArmorClass";
import { useCharacterHitPoints } from "../../hooks/useCharacterHitPoints";
import { useCharacterSpeed } from "../../hooks/useCharacterSpeed";
import { BuilderPanel } from "../shared/BuilderPanel";
import { HintTooltip } from "@/shared/components/HintTooltip";

export function BuilderDerivedPanel() {
  const { character, class: classSelection, useAmellwindHomebrew } =
    useCharacterBuilder();
  const hitPointStats = useCharacterHitPoints();
  const armorClass = useCharacterArmorClass();
  const speedStats = useCharacterSpeed();
  const attunement = getAttunementInfo(classSelection?.name, character.level);

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
        <DerivedRow
          label="Attunement"
          value={`${attunement.attunementSlots} slots`}
          valueTooltip={attunement.tooltip}
        />
        {useAmellwindHomebrew &&
          attunement.isArtificer &&
          attunement.artificerBonusMaterialSlots > 0 && (
          <DerivedRow
            label="Bonus Material Slots"
            value={`+${attunement.artificerBonusMaterialSlots} (weapon & armor)`}
            valueTooltip={attunement.tooltip}
          />
        )}
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
      {valueTooltip ? (
        <HintTooltip content={valueTooltip} align="end" className="text-left">
          <span className="cursor-help text-sm font-medium text-foreground">
            {value}
          </span>
        </HintTooltip>
      ) : (
        <span className="text-sm font-medium text-foreground">{value}</span>
      )}
    </div>
  );
}
