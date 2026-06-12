import { useMemo } from "react";
import { ABILITY_LABELS, AbilityKey } from "@/shared/types";
import { Select } from "@/components/ui/select";
import { useCharacterBuilder } from "../../../context/CharacterBuilderContext";
import { useSelectedSpecies } from "../../../hooks/useSelectedSpecies";
import { useSelectedDndBackground } from "../../../hooks/useSelectedDndBackground";
import {
  formatChooseSlotLabel,
  getSpeciesChooseSlots,
  getWeightedDistributionBonus,
} from "../../../utils/species-ability-bonuses";
import { ABILITIES } from "./constants";

function BackgroundAsiPanel({ compact }: { compact: boolean }) {
  const {
    background: backgroundRef,
    backgroundAsiMode,
    setBackgroundAsiMode,
    backgroundAsiPlus2,
    backgroundAsiPlus1,
    setBackgroundAsiPlus2,
    setBackgroundAsiPlus1,
  } = useCharacterBuilder();
  const { dndBackground } = useSelectedDndBackground();

  const weightedAsi = dndBackground
    ? getWeightedDistributionBonus(dndBackground.abilityBonuses)
    : null;

  if (!backgroundRef || !dndBackground || !weightedAsi) return null;

  const abilityOptions = (exclude: AbilityKey[]) =>
    weightedAsi.from
      .filter((key) => !exclude.includes(key))
      .map((key) => ({ key, label: ABILITY_LABELS[key] }));

  return (
    <div
      className={`rounded-md border border-border/60 bg-muted/20 ${
        compact ? "space-y-1.5 p-1.5" : "space-y-2 p-2"
      }`}
    >
      <p className="text-[10px] leading-snug text-muted-foreground">
        <span className="font-medium text-foreground">
          {dndBackground.name} (2024)
        </span>
        : assign +2/+1 or +1/+1/+1 among{" "}
        {weightedAsi.from.map((key) => ABILITY_LABELS[key]).join(", ")}.
      </p>

      <div
        className={`flex flex-wrap gap-2 ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {weightedAsi.modes.map((mode) => {
          const modeKey =
            mode.weights.some((weight) => weight === 2)
              ? "plus2plus1"
              : "plus1each";
          return (
            <label
              key={mode.label}
              className="flex items-center gap-1 cursor-pointer text-muted-foreground"
            >
              <input
                type="radio"
                name="background-asi-mode"
                checked={backgroundAsiMode === modeKey}
                onChange={() => {
                  setBackgroundAsiMode(modeKey);
                  if (modeKey === "plus1each") {
                    setBackgroundAsiPlus2(null);
                    setBackgroundAsiPlus1(null);
                  }
                }}
                className="rounded border-border"
              />
              {mode.label}
            </label>
          );
        })}
      </div>

      {backgroundAsiMode === "plus2plus1" && (
        <div
          className={`flex flex-wrap gap-2 ${compact ? "text-[10px]" : "text-xs"}`}
        >
          <label className="flex items-center gap-1 text-muted-foreground">
            +2
            <Select
              value={backgroundAsiPlus2 ?? ""}
              onChange={(e) =>
                setBackgroundAsiPlus2((e.target.value as AbilityKey) || null)
              }
              className={compact ? "h-6 w-16 text-[10px]" : "h-7 w-20 text-xs"}
            >
              <option value="">—</option>
              {abilityOptions(
                backgroundAsiPlus1 ? [backgroundAsiPlus1] : [],
              ).map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-1 text-muted-foreground">
            +1
            <Select
              value={backgroundAsiPlus1 ?? ""}
              onChange={(e) =>
                setBackgroundAsiPlus1((e.target.value as AbilityKey) || null)
              }
              className={compact ? "h-6 w-16 text-[10px]" : "h-7 w-20 text-xs"}
            >
              <option value="">—</option>
              {abilityOptions(
                backgroundAsiPlus2 ? [backgroundAsiPlus2] : [],
              ).map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
        </div>
      )}

      {backgroundAsiMode === "plus1each" && (
        <p className="text-[10px] text-emerald-400">
          +1 to {weightedAsi.from.map((key) => ABILITY_LABELS[key]).join(", ")}
        </p>
      )}
    </div>
  );
}

export function OriginBonusesPanel({ compact }: { compact: boolean }) {
  const {
    species: speciesRef,
    useTashaOrigin,
    setUseTashaOrigin,
    tashaPlus2,
    tashaPlus1,
    setTashaPlus2,
    setTashaPlus1,
    speciesAbilityChoices,
    setSpeciesAbilityChoice,
  } = useCharacterBuilder();
  const { species } = useSelectedSpecies();
  const { dndBackground } = useSelectedDndBackground();

  const hasBackgroundAsi = dndBackground
    ? getWeightedDistributionBonus(dndBackground.abilityBonuses) !== null
    : false;

  const chooseSlots = useMemo(
    () =>
      species && !useTashaOrigin && !hasBackgroundAsi
        ? getSpeciesChooseSlots(species.abilityBonuses)
        : [],
    [species, useTashaOrigin, hasBackgroundAsi],
  );

  const abilityOptions = (exclude: AbilityKey[]) =>
    ABILITIES.filter(({ key }) => !exclude.includes(key));

  if (hasBackgroundAsi) {
    return <BackgroundAsiPanel compact={compact} />;
  }

  if (!speciesRef) return null;

  return (
    <div
      className={`rounded-md border border-border/60 bg-muted/20 ${
        compact ? "space-y-1.5 p-1.5" : "space-y-2 p-2"
      }`}
    >
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={useTashaOrigin}
          onChange={(e) => setUseTashaOrigin(e.target.checked)}
          className="mt-0.5 rounded border-border"
        />
        <span className="text-[10px] leading-snug text-muted-foreground">
          <span
            className="relative group font-medium text-foreground cursor-help"
            title="Ignore the bonuses of your species and assign +2 and +1 to the attributes you choose (not the same attribute)."
          >
            Customizing Your Origin (Tasha's Cauldron)
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-md border border-border bg-popover px-2 py-1.5 text-left text-[10px] font-normal leading-relaxed text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100"
            >
              Ignore the bonuses of your species and assign +2 and +1 to the
              attributes you choose (not the same attribute).
            </span>
          </span>
        </span>
      </label>

      {useTashaOrigin && (
        <div
          className={`flex flex-wrap gap-2 ${compact ? "text-[10px]" : "text-xs"}`}
        >
          <label className="flex items-center gap-1 text-muted-foreground">
            +2
            <Select
              value={tashaPlus2 ?? ""}
              onChange={(e) =>
                setTashaPlus2((e.target.value as AbilityKey) || null)
              }
              className={compact ? "h-6 w-16 text-[10px]" : "h-7 w-20 text-xs"}
            >
              <option value="">—</option>
              {abilityOptions(tashaPlus1 ? [tashaPlus1] : []).map(
                ({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ),
              )}
            </Select>
          </label>
          <label className="flex items-center gap-1 text-muted-foreground">
            +1
            <Select
              value={tashaPlus1 ?? ""}
              onChange={(e) =>
                setTashaPlus1((e.target.value as AbilityKey) || null)
              }
              className={compact ? "h-6 w-16 text-[10px]" : "h-7 w-20 text-xs"}
            >
              <option value="">—</option>
              {abilityOptions(tashaPlus2 ? [tashaPlus2] : []).map(
                ({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ),
              )}
            </Select>
          </label>
        </div>
      )}

      {!useTashaOrigin && speciesRef && species && chooseSlots.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">
            {species.name} bonuses:
            {species.abilitySummary ? ` (${species.abilitySummary})` : ""}:
          </p>
          <div className="flex flex-wrap gap-2">
            {chooseSlots.map((slot, index) => {
              const taken = speciesAbilityChoices.filter(
                (choice, i) => i !== index && choice,
              ) as AbilityKey[];
              const options = slot.from.filter((key) => !taken.includes(key));

              return (
                <label
                  key={`${slot.blockIndex}-${slot.slotIndex}`}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground"
                >
                  {formatChooseSlotLabel(slot)}
                  <Select
                    value={speciesAbilityChoices[index] ?? ""}
                    onChange={(e) =>
                      setSpeciesAbilityChoice(
                        index,
                        (e.target.value as AbilityKey) || null,
                      )
                    }
                    className="h-6 w-16 text-[10px]"
                  >
                    <option value="">—</option>
                    {options.map((key) => (
                      <option key={key} value={key}>
                        {ABILITY_LABELS[key]}
                      </option>
                    ))}
                  </Select>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {!useTashaOrigin &&
        speciesRef &&
        species &&
        chooseSlots.length === 0 &&
        species.abilityBonuses.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {species.name} bonuses:{" "}
            <span className="font-medium text-emerald-400">
              {species.abilitySummary}
            </span>
          </p>
        )}
    </div>
  );
}
