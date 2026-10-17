import { ReactNode } from "react";
import { formatModifier } from "@/shared/utils/cr.utils";
import { Shield } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useBuilderDerivedStats } from "../../hooks/useBuilderDerivedStats";
import { BuilderPanel } from "../shared/BuilderPanel";
import { HintTooltip } from "@/shared/components/HintTooltip";
import { GlossaryHint } from "../shared/GlossaryHint";
import type { BuilderGlossaryTerm } from "../../data/builder-glossary";

export function BuilderDerivedPanel() {
  const { useAmellwindHomebrew } = useCharacterBuilder();
  const {
    proficiencyBonus,
    hitPoints: hitPointStats,
    armorClass,
    speed: speedStats,
    initiative,
    passivePerception,
    spellAttackStats,
    attunement,
  } = useBuilderDerivedStats();

  return (
    <BuilderPanel
      sectionId="combat-stats"
      title={
        <>
          <Shield className="h-3.5 w-3.5" aria-hidden /> General Stats
        </>
      }
    >
      <div className="space-y-0">
        <DerivedRow label="Proficiency" term="proficiency" value={`+${proficiencyBonus}`} />
        <DerivedRow
          label="Hit Points"
          term="hit-points"
          value={hitPointStats ? String(hitPointStats.max) : "—"}
          valueTooltip={hitPointStats?.tooltip}
        />
        <DerivedRow label="Hit Dice" term="hit-dice" value={hitPointStats?.hitDice ?? "—"} />
        <DerivedRow
          label="AC"
          term="armor-class"
          value={String(armorClass.total)}
          valueTooltip={armorClass.tooltip}
        />
        <DerivedRow
          label="Speed"
          term="speed"
          value={speedStats.display}
          valueTooltip={speedStats.tooltip}
        />
        <DerivedRow
          label="Initiative"
          term="initiative"
          value={formatModifier(initiative)}
        />
        <DerivedRow
          label="Passive Perception"
          term="passive-perception"
          value={String(passivePerception)}
        />
        {spellAttackStats &&
          spellAttackStats.spellAttackBonus !== undefined &&
          spellAttackStats.spellSaveDc !== undefined && (
            <>
              <DerivedRow
                label="Spell Attack"
                term="spell-attack"
                value={spellAttackStats.spellAttackBonus}
              />
              <DerivedRow
                label="Spell Save DC"
                term="spell-save-dc"
                value={spellAttackStats.spellSaveDc}
              />
            </>
          )}
        {/* AGMH replaces magic-item attunement with weapon + armor + trinkets. */}
        {!useAmellwindHomebrew && (
          <DerivedRow
            label="Attunement"
            term="attunement"
            value={`${attunement.attunementSlots} slots`}
            valueTooltip={attunement.tooltip}
          />
        )}
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
  term,
  value,
  valueTooltip,
}: {
  label: string;
  /** Glossary entry explaining the label (tap to open). */
  term?: BuilderGlossaryTerm;
  value: ReactNode;
  valueTooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-1.5 text-[13px] last:border-b-0">
      <span className="text-muted-foreground">
        {term ? <GlossaryHint term={term}>{label}</GlossaryHint> : label}
      </span>
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
