import { useCallback, useMemo, useState, type ReactNode } from "react";
import { formatModifier } from "@/shared/utils/cr.utils";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { ABILITY_LABELS, AbilityKey } from "@/shared/types";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  STANDARD_ARRAY,
  POINT_BUY_BUDGET,
  POINT_BUY_MAX,
  pointBuyRemaining,
  pointBuyTotalSpent,
  canRaisePointBuy,
  canLowerPointBuy,
  defaultPointBuyScores,
  rollSixAbilityScores,
  poolOptionsForAbility,
  assignFromPool,
  assignmentsToAbilityScores,
} from "../../utils/ability-scores";
import { useSelectedSpecies } from "../../hooks/useSelectedSpecies";
import { useSelectedDndBackground } from "../../hooks/useSelectedDndBackground";
import {
  applyBaseScores,
  buildAbilityBonusMap,
  effectiveModifier,
  formatBonusTooltip,
  formatChooseSlotLabel,
  getSpeciesChooseSlots,
  getWeightedDistributionBonus,
} from "../../utils/species-ability-bonuses";
import { applyFeatAsiBonuses } from "../../utils/feat-asi-bonuses";
import { AbilityScoreValue } from "./AbilityScoreValue";

const ABILITIES: { key: AbilityKey; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

type GenerationMethod = "manual" | "standard" | "pointbuy" | "dice";

const ABILITY_CARD_CLASS =
  "flex flex-col items-center rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 transition-colors";

function AbilityStatCard({
  label,
  modifier,
  children,
}: {
  label: string;
  modifier: string;
  children: ReactNode;
}) {
  return (
    <div className={ABILITY_CARD_CLASS}>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
      <span className="text-[11px] text-muted-foreground">{modifier}</span>
    </div>
  );
}

function AbilityStatRow({
  label,
  modifier,
  children,
}: {
  label: string;
  modifier: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-foreground w-8">{label}</span>
      {children}
      <span className="text-xs font-medium text-primary min-w-[28px]">
        {modifier}
      </span>
    </div>
  );
}

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

function OriginBonusesPanel({ compact }: { compact: boolean }) {
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

export function AbilityScoresSection({
  compact = false,
}: {
  compact?: boolean;
}) {
  const {
    character,
    setAbilityScore,
    setAbilityScores,
    class: classSelection,
    featSelections,
    useTashaOrigin,
    tashaPlus2,
    tashaPlus1,
    speciesAbilityChoices,
    backgroundAsiMode,
    backgroundAsiPlus2,
    backgroundAsiPlus1,
  } = useCharacterBuilder();
  const { species } = useSelectedSpecies();
  const { dndBackground } = useSelectedDndBackground();
  const [method, setMethod] = useState<GenerationMethod>("manual");
  const [pool, setPool] = useState<number[]>([...STANDARD_ARRAY]);
  const [assignments, setAssignments] = useState<
    Partial<Record<AbilityKey, number>>
  >({});
  const [heroicRolls, setHeroicRolls] = useState(false);
  const [lastRolls, setLastRolls] = useState<number[] | null>(null);

  const syncAssignmentsToCharacter = useCallback(
    (next: Partial<Record<AbilityKey, number>>) => {
      const scores = assignmentsToAbilityScores(next);
      if (Object.keys(scores).length > 0) {
        setAbilityScores(scores);
      }
    },
    [setAbilityScores],
  );

  const initStandardArray = useCallback(() => {
    setPool([...STANDARD_ARRAY]);
    setAssignments({});
    setLastRolls(null);
    setAbilityScores(defaultPointBuyScores());
  }, [setAbilityScores]);

  const initPointBuy = useCallback(() => {
    setAbilityScores(defaultPointBuyScores());
    setAssignments({});
    setPool([]);
    setLastRolls(null);
  }, [setAbilityScores]);

  const handleMethodChange = (next: GenerationMethod) => {
    setMethod(next);
    if (next === "standard") initStandardArray();
    else if (next === "pointbuy") initPointBuy();
    else if (next === "dice") {
      setPool([]);
      setAssignments({});
      setLastRolls(null);
      setAbilityScores(defaultPointBuyScores());
    }
  };

  const handlePoolAssign = (key: AbilityKey, raw: string) => {
    const value = raw === "" ? null : parseInt(raw, 10);
    const { assignments: nextAssignments, pool: nextPool } = assignFromPool(
      key,
      value,
      assignments,
      pool,
    );
    setAssignments(nextAssignments);
    setPool(nextPool);
    syncAssignmentsToCharacter(nextAssignments);
  };

  const rollDice = () => {
    const rolled = rollSixAbilityScores(heroicRolls);
    setLastRolls(rolled);
    setPool([...rolled].sort((a, b) => b - a));
    setAssignments({});
    setAbilityScores(defaultPointBuyScores());
  };

  const adjustPointBuy = (key: AbilityKey, delta: number) => {
    const current = character.abilities[key];
    const next = current + delta;
    if (delta > 0 && !canRaisePointBuy(character.abilities, key)) return;
    if (delta < 0 && !canLowerPointBuy(character.abilities, key)) return;
    setAbilityScore(key, next);
  };

  const adjustManual = (key: AbilityKey, delta: number) => {
    const next = character.abilities[key] + delta;
    if (next < 1 || next > 30) return;
    setAbilityScore(key, next);
  };

  const pointsRemaining = pointBuyRemaining(character.abilities);
  const pointsSpent = pointBuyTotalSpent(character.abilities);
  const poolLabel = pool.length > 0 ? pool.join(", ") : "—";

  const scoreBreakdowns = useMemo(() => {
    const bonusMap = buildAbilityBonusMap(species, {
      useTashaOrigin,
      tashaPlus2,
      tashaPlus1,
      speciesChoices: speciesAbilityChoices,
      background: dndBackground
        ? {
            name: dndBackground.name,
            abilityBonuses: dndBackground.abilityBonuses,
          }
        : null,
      backgroundAsiMode,
      backgroundAsiPlus2,
      backgroundAsiPlus1,
    });
    applyFeatAsiBonuses(
      bonusMap,
      featSelections,
      classSelection?.name ?? "",
      character.level,
    );
    return applyBaseScores(bonusMap, character.abilities);
  }, [
    species,
    useTashaOrigin,
    tashaPlus2,
    tashaPlus1,
    speciesAbilityChoices,
    dndBackground,
    backgroundAsiMode,
    backgroundAsiPlus2,
    backgroundAsiPlus1,
    featSelections,
    classSelection?.name,
    character.abilities,
    character.level,
  ]);

  const getBreakdown = (key: AbilityKey, baseScore: number) => ({
    ...scoreBreakdowns[key],
    base: baseScore,
    total: baseScore + scoreBreakdowns[key].bonus,
  });

  return (
    <div className="space-y-2">
      <OriginBonusesPanel compact={compact} />
      {!compact && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">
            Ability Scores
          </label>
          <Select
            value={method}
            onChange={(e) =>
              handleMethodChange(e.target.value as GenerationMethod)
            }
            className="h-8 text-xs"
          >
            <option value="manual">Manual</option>
            <option value="standard">
              Standard Array (15, 14, 13, 12, 10, 8)
            </option>
            <option value="pointbuy">Point Buy (27 pts, max 15)</option>
            <option value="dice">Roll Dice (4d6 drop lowest)</option>
          </Select>
        </div>
      )}

      {compact && (
        <Select
          value={method}
          onChange={(e) =>
            handleMethodChange(e.target.value as GenerationMethod)
          }
          className="mb-2 h-7 w-full text-[12px]"
        >
          <option value="manual">Manual</option>
          <option value="standard">
            Standard Array (15, 14, 13, 12, 10, 8)
          </option>
          <option value="pointbuy">Point buy</option>
          <option value="dice">Roll Dice (4d6 drop lowest)</option>
        </Select>
      )}

      {method === "standard" && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          Assign each value in the array to an ability. Available:{" "}
          <span className="font-medium text-foreground">{poolLabel}</span>
        </p>
      )}

      {method === "pointbuy" && (
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">
            Points:{" "}
            <span
              className={
                pointsRemaining < 0
                  ? "text-destructive font-semibold"
                  : "text-foreground font-medium"
              }
            >
              {pointsRemaining}
            </span>
            <span className="text-muted-foreground"> / {POINT_BUY_BUDGET}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={initPointBuy}
          >
            Reset (8 points)
          </Button>
        </div>
      )}

      {method === "dice" && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={rollDice}
            >
              Roll 6× (4d6 drop lowest)
            </Button>
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={heroicRolls}
                onChange={(e) => setHeroicRolls(e.target.checked)}
                className="rounded border-border"
              />
              Heroic (re-roll 1s on 1s)
            </label>
          </div>
          {lastRolls && (
            <p className="text-[10px] text-muted-foreground">
              Results: {lastRolls.join(", ")} — unassigned:{" "}
              <span className="font-medium text-foreground">{poolLabel}</span>
            </p>
          )}
          {!lastRolls && (
            <p className="text-[10px] text-muted-foreground">
              Roll the dice and assign each result to an ability.
            </p>
          )}
        </div>
      )}

      <div
        className={
          compact ? "grid grid-cols-2 gap-1.5" : "grid grid-cols-2 gap-2"
        }
      >
        {ABILITIES.map(({ key, label }) => {
          const isPoolMethod = method === "standard" || method === "dice";
          const poolScore = assignments[key];
          const characterScore = character.abilities[key];
          const baseScore = isPoolMethod
            ? (poolScore ?? characterScore)
            : characterScore;
          const breakdown = getBreakdown(key, baseScore);
          const modifier =
            isPoolMethod && poolScore === undefined
              ? "—"
              : formatModifier(effectiveModifier(baseScore, breakdown.bonus));

          const poolSelect = (
            <div className="flex items-center gap-1">
              <Select
                value={assignments[key] ?? ""}
                onChange={(e) => handlePoolAssign(key, e.target.value)}
                className={
                  compact
                    ? "h-7 w-full max-w-[4.5rem] px-1 text-sm text-center"
                    : "h-8 w-14 px-1 text-sm text-center"
                }
                disabled={
                  method === "dice" &&
                  pool.length === 0 &&
                  assignments[key] === undefined
                }
              >
                <option value="">—</option>
                {poolOptionsForAbility(key, assignments, pool).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
              {poolScore !== undefined && breakdown.bonus > 0 && (
                <span
                  className="relative group text-[10px] font-medium text-emerald-400"
                  title={formatBonusTooltip(breakdown)}
                >
                  → {breakdown.total}
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 w-max max-w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1.5 text-[10px] leading-relaxed text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100 whitespace-pre-line text-center"
                  >
                    {formatBonusTooltip(breakdown)}
                  </span>
                </span>
              )}
            </div>
          );

          const stepperControls = (
            canDecrease: boolean,
            canIncrease: boolean,
            onDecrease: () => void,
            onIncrease: () => void,
          ) => (
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={`text-xs shrink-0 ${compact ? "h-6 w-6" : "h-7 w-7"}`}
                disabled={!canDecrease}
                onClick={onDecrease}
                aria-label={`Lower ${label}`}
              >
                −
              </Button>
              <AbilityScoreValue breakdown={breakdown} compact={compact} />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={`text-xs shrink-0 ${compact ? "h-6 w-6" : "h-7 w-7"}`}
                disabled={!canIncrease}
                onClick={onIncrease}
                aria-label={`Raise ${label}`}
              >
                +
              </Button>
            </div>
          );

          const manualControls = stepperControls(
            characterScore > 1,
            characterScore < 30,
            () => adjustManual(key, -1),
            () => adjustManual(key, 1),
          );

          const pointBuyControls = stepperControls(
            canLowerPointBuy(character.abilities, key),
            canRaisePointBuy(character.abilities, key),
            () => adjustPointBuy(key, -1),
            () => adjustPointBuy(key, 1),
          );

          if (compact) {
            if (method === "manual") {
              return (
                <AbilityStatCard key={key} label={label} modifier={modifier}>
                  {manualControls}
                </AbilityStatCard>
              );
            }

            if (isPoolMethod) {
              return (
                <AbilityStatCard key={key} label={label} modifier={modifier}>
                  {poolSelect}
                </AbilityStatCard>
              );
            }

            return (
              <AbilityStatCard key={key} label={label} modifier={modifier}>
                {pointBuyControls}
              </AbilityStatCard>
            );
          }

          if (isPoolMethod) {
            return (
              <AbilityStatRow key={key} label={label} modifier={modifier}>
                {poolSelect}
              </AbilityStatRow>
            );
          }

          if (method === "pointbuy") {
            return (
              <AbilityStatRow key={key} label={label} modifier={modifier}>
                {pointBuyControls}
              </AbilityStatRow>
            );
          }

          return (
            <AbilityStatRow key={key} label={label} modifier={modifier}>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={characterScore}
                  onChange={(e) =>
                    setAbilityScore(key, parseInt(e.target.value, 10) || 10)
                  }
                  className="w-14 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {breakdown.bonus > 0 && (
                  <span
                    className="relative group text-[10px] font-medium text-emerald-400"
                    title={formatBonusTooltip(breakdown)}
                  >
                    → {breakdown.total}
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 w-max max-w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1.5 text-[10px] leading-relaxed text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100 whitespace-pre-line text-center"
                    >
                      {formatBonusTooltip(breakdown)}
                    </span>
                  </span>
                )}
              </div>
            </AbilityStatRow>
          );
        })}
      </div>

      {method === "pointbuy" && (
        <p className="text-[10px] text-muted-foreground">
          Spent: {pointsSpent}/{POINT_BUY_BUDGET}. Maximum {POINT_BUY_MAX}{" "}
          before origin bonuses.
        </p>
      )}
    </div>
  );
}
