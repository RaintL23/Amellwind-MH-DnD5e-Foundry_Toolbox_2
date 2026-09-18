import type { ReactNode } from "react";
import type {
  CompanionScaleDetection,
  CompanionScaleInputs,
} from "../utils/companion-scaling.utils";
import {
  DEFAULT_COMPANION_ABILITY_SCORE,
  deriveCompanionStats,
} from "../utils/companion-scaling.utils";
import { formatModifier } from "@/shared/utils/cr.utils";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/utils/cn";

interface CompanionScalingPanelProps {
  detection: CompanionScaleDetection;
  value: CompanionScaleInputs;
  onChange: (next: CompanionScaleInputs) => void;
  className?: string;
}

function parseOptionalInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.floor(n) : null;
}

function CompactField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <span className="whitespace-nowrap">{label}</span>
      {children}
    </label>
  );
}

function DerivedChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-amber-800/35 bg-amber-950/30 px-1.5 py-0.5 text-[11px] font-medium text-amber-200/90 tabular-nums">
      {children}
    </span>
  );
}

export function CompanionScalingPanel({
  detection,
  value,
  onChange,
  className,
}: CompanionScalingPanelProps) {
  const derived = deriveCompanionStats(value);
  const classHint = detection.ownerClassHint
    ? detection.ownerClassHint.charAt(0).toUpperCase() +
      detection.ownerClassHint.slice(1)
    : "Class";
  const abilityShort =
    detection.abilityLabel?.slice(0, 3).toUpperCase() ?? "ABI";
  const needsAbilityScore =
    detection.needsAbilityModifier || detection.needsSpellAttack;
  const showLevel = detection.needsOwnerLevel || detection.needsSpellAttack;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-amber-800/35 bg-amber-950/15 px-2.5 py-2",
        className,
      )}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-400/90">
        Scale
      </span>

      {showLevel && (
        <CompactField id="companion-owner-level" label={`${classHint} lvl`}>
          <Input
            id="companion-owner-level"
            type="number"
            min={1}
            max={20}
            className="h-7 w-14 px-2 text-xs tabular-nums"
            value={value.ownerLevel}
            onChange={(event) => {
              const n = Number(event.target.value);
              onChange({
                ...value,
                ownerLevel: Number.isFinite(n)
                  ? Math.min(20, Math.max(1, Math.floor(n)))
                  : 1,
              });
            }}
          />
        </CompactField>
      )}

      {needsAbilityScore && (
        <CompactField id="companion-ability-score" label={`${abilityShort}`}>
          <Input
            id="companion-ability-score"
            type="number"
            min={1}
            max={30}
            className="h-7 w-14 px-2 text-xs tabular-nums"
            value={value.abilityScore ?? DEFAULT_COMPANION_ABILITY_SCORE}
            onChange={(event) => {
              onChange({
                ...value,
                abilityScore:
                  parseOptionalInt(event.target.value) ??
                  DEFAULT_COMPANION_ABILITY_SCORE,
              });
            }}
          />
        </CompactField>
      )}

      <div
        className="flex flex-wrap items-center gap-1.5"
        aria-live="polite"
        title="Derived from level and ability score"
      >
        <DerivedChip>PB {formatModifier(derived.proficiencyBonus)}</DerivedChip>
        {needsAbilityScore && derived.abilityModifier != null && (
          <DerivedChip>
            {abilityShort} {formatModifier(derived.abilityModifier)}
          </DerivedChip>
        )}
        {detection.needsSpellAttack && derived.spellAttackBonus != null && (
          <DerivedChip>
            ATK {formatModifier(derived.spellAttackBonus)}
          </DerivedChip>
        )}
        {detection.needsSpellAttack && derived.spellSaveDc != null && (
          <DerivedChip>DC {derived.spellSaveDc}</DerivedChip>
        )}
      </div>
    </div>
  );
}
