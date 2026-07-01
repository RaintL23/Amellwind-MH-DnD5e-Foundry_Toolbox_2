import { useMemo } from "react";
import { cn } from "@/shared/utils/cn";
import { ABILITY_LABELS, AbilityKey } from "@/shared/types";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSectionCompletenessHighlight } from "../../../context/BuildCompletenessContext";
import { CompletenessHighlightBanner } from "../../shared/CompletenessHighlightBanner";
import { HintTooltip } from "@/shared/components/HintTooltip";
import { useCharacterBuilder } from "../../../context/CharacterBuilderContext";
import { useSelectedSpecies } from "../../../hooks/useBuilderSelections";
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

      <RadioGroup
        value={backgroundAsiMode}
        onValueChange={(v) => {
          const modeKey = v as "plus2plus1" | "plus1each";
          setBackgroundAsiMode(modeKey);
          if (modeKey === "plus1each") {
            setBackgroundAsiPlus2(null);
            setBackgroundAsiPlus1(null);
          }
        }}
        className={`flex flex-wrap gap-2 ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {weightedAsi.modes.map((mode) => {
          const modeKey =
            mode.weights.some((weight) => weight === 2)
              ? "plus2plus1"
              : "plus1each";
          const id = `background-asi-${modeKey}`;
          return (
            <div key={mode.label} className="flex items-center gap-1">
              <RadioGroupItem id={id} value={modeKey} />
              <Label
                htmlFor={id}
                className="cursor-pointer font-normal text-muted-foreground"
              >
                {mode.label}
              </Label>
            </div>
          );
        })}
      </RadioGroup>

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
  const { highlighted, issues: abilityIssues } =
    useSectionCompletenessHighlight("ability-scores");

  const abilityOptions = (exclude: AbilityKey[]) =>
    ABILITIES.filter(({ key }) => !exclude.includes(key));

  const highlightWrapperClass = cn(
    highlighted &&
      "rounded-md border border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30",
  );

  if (hasBackgroundAsi) {
    return (
      <div className={highlightWrapperClass}>
        {highlighted && <CompletenessHighlightBanner issues={abilityIssues} />}
        <BackgroundAsiPanel compact={compact} />
      </div>
    );
  }

  if (!speciesRef) return null;

  return (
    <div
      className={cn(
        `rounded-md border border-border/60 bg-muted/20 ${
          compact ? "space-y-1.5 p-1.5" : "space-y-2 p-2"
        }`,
        highlighted &&
          "border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30",
      )}
    >
      {highlighted && <CompletenessHighlightBanner issues={abilityIssues} />}
      <div className="flex items-start gap-2">
        <Checkbox
          id="tasha-origin"
          checked={useTashaOrigin}
          onCheckedChange={(c) => setUseTashaOrigin(c === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor="tasha-origin"
          className="text-[10px] font-normal leading-snug text-muted-foreground"
        >
          <HintTooltip
            content="Ignore the bonuses of your species and assign +2 and +1 to the attributes you choose (not the same attribute)."
            align="start"
            className="text-left font-normal"
          >
            <span className="cursor-help font-medium text-foreground">
              Customizing Your Origin (Tasha's Cauldron)
            </span>
          </HintTooltip>
        </Label>
      </div>

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
