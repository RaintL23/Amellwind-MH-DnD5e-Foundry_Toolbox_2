import { useEffect, useState } from "react";
import { Dice6, Package, Scissors, Target } from "lucide-react";
import type { Monster, Rune } from "@/shared/types";
import { getCarveDc } from "@/shared/utils/cr.utils";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NumberStepper } from "@/features/builder/components/shared/NumberStepper";
import { getRunesByMonster } from "@/features/runes/services/rune.service";
import { getMaterialEffectNameIndex } from "@/features/material-effects/services/material-effect.service";
import type { MaterialEffectNameIndex } from "@/features/material-effects/services/material-effect.service";
import { EffectSection } from "@/features/runes/components/detail/EffectSection";
import { TierBadge } from "@/features/runes/components/shared/TierBadge";
import type { RollMode } from "@/features/environments/utils/environmentRoll.utils";
import {
  formatChanceDisplay,
  formatSlotsDisplay,
  matchesChanceRange,
  rollMonsterLoot,
  type CarveRollResult,
  type LootObtainmentMode,
} from "../../utils/carve-roll.utils";

interface MonsterCarvePanelProps {
  monster: Monster;
}

export function MonsterCarvePanel({ monster }: MonsterCarvePanelProps) {
  const [runes, setRunes] = useState<Rune[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialEffectIndex, setMaterialEffectIndex] =
    useState<MaterialEffectNameIndex | null>(null);

  const [mode, setMode] = useState<LootObtainmentMode>("carve");
  const [modifier, setModifier] = useState(0);
  const [rollMode, setRollMode] = useState<RollMode>("normal");
  const [lastResult, setLastResult] = useState<CarveRollResult | null>(null);
  const [history, setHistory] = useState<CarveRollResult[]>([]);

  const carveDc = getCarveDc(monster.cr);
  const rollsCount = monster.loot?.rolls ?? runes[0]?.rolls ?? 0;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void Promise.all([
      getRunesByMonster(monster.name),
      getMaterialEffectNameIndex(),
    ]).then(([monsterRunes, index]) => {
      if (cancelled) return;
      setRunes(monsterRunes);
      setMaterialEffectIndex(index);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [monster.name]);

  function handleRoll() {
    if (runes.length === 0) return;

    const result = rollMonsterLoot({
      runes,
      mode,
      carveDc,
      modifier,
      rollMode,
    });

    setLastResult(result);
    setHistory((prev) => [result, ...prev].slice(0, 8));
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading material table…</p>
    );
  }

  if (runes.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/10 px-4 py-10 text-center">
        <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          This monster has no carve / capture loot table.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            Carve / Capture
          </h2>
          <p className="text-sm text-muted-foreground">
            Challenge Rating {monster.cr}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <p>
            <span className="font-semibold text-foreground">Carve DC:</span>{" "}
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {carveDc}
            </span>
          </p>
          {rollsCount > 0 && (
            <p>
              <span className="font-semibold text-foreground">
                Carves / Capture:
              </span>{" "}
              {rollsCount}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Dice6 className="h-4 w-4 text-primary" />
          Roll Materials
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <fieldset className="space-y-2">
            <legend className="text-xs text-muted-foreground">
              Obtainment
            </legend>
            <RadioGroup
              value={mode}
              onValueChange={(value) => setMode(value as LootObtainmentMode)}
              className="flex flex-col gap-2"
            >
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="carve" id="carve-mode" />
                <Scissors className="h-3.5 w-3.5 text-orange-400" />
                Carved (hunted)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="capture" id="capture-mode" />
                <Target className="h-3.5 w-3.5 text-blue-400" />
                Captured
              </label>
            </RadioGroup>
          </fieldset>

          <label className="text-xs text-muted-foreground space-y-2 block">
            Survival Modifier
            <NumberStepper
              value={modifier}
              onChange={setModifier}
              min={-10}
              max={30}
              ariaLabel="Survival modifier"
            />
          </label>

          <label className="text-xs text-muted-foreground space-y-1 block">
            Roll Mode
            <select
              value={rollMode}
              onChange={(e) => setRollMode(e.target.value as RollMode)}
              disabled={mode === "capture"}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground disabled:opacity-50"
            >
              <option value="normal">Normal</option>
              <option value="advantage">Advantage</option>
              <option value="disadvantage">Disadvantage</option>
            </select>
          </label>

          <div className="flex items-end">
            <Button type="button" onClick={handleRoll} className="w-full">
              {mode === "carve"
                ? `Roll Carve Check (DC ${carveDc})`
                : "Roll Capture Material"}
            </Button>
          </div>
        </div>

        {mode === "carve" && (
          <p className="text-xs text-muted-foreground">
            Dexterity (Survival) vs Carve DC. On failure, the loot roll counts
            as 1.
          </p>
        )}
        {mode === "capture" && (
          <p className="text-xs text-muted-foreground">
            No check is required when capturing. Roll d20 on the Capture column.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-emerald-900/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-900 text-white">
                <th className="px-4 py-2.5 text-left font-semibold">Carve</th>
                <th className="px-4 py-2.5 text-left font-semibold">
                  Capture
                </th>
                <th className="px-4 py-2.5 text-left font-semibold">
                  Material
                </th>
                <th className="px-4 py-2.5 text-left font-semibold">Slots</th>
              </tr>
            </thead>
            <tbody>
              {runes.map((rune, index) => {
                const highlighted =
                  lastResult?.rune?.name === rune.name &&
                  lastResult.mode === mode;
                const matchesLootRoll =
                  lastResult != null &&
                  matchesChanceRange(
                    mode === "carve" ? rune.carveChance : rune.captureChance,
                    lastResult.lootRoll,
                  );

                return (
                  <tr
                    key={`${rune.name}-${index}`}
                    className={cn(
                      index % 2 === 0
                        ? "bg-muted/50"
                        : "bg-emerald-50/70 dark:bg-emerald-950/25",
                      (highlighted || matchesLootRoll) &&
                        "ring-2 ring-inset ring-amber-500/70 bg-amber-500/10",
                    )}
                  >
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {formatChanceDisplay(rune.carveChance)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {formatChanceDisplay(rune.captureChance)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {rune.name}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      {formatSlotsDisplay(rune.slots)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {lastResult && (
        <CarveRollResultCard
          result={lastResult}
          materialEffectIndex={materialEffectIndex}
        />
      )}

      {history.length > 1 && (
        <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Rolls
          </p>
          <ul className="space-y-1.5">
            {history.slice(1).map((entry, index) => (
              <li
                key={index}
                className="text-xs text-muted-foreground flex flex-wrap gap-x-2"
              >
                <span className="font-medium text-foreground">
                  {entry.mode === "carve" ? "Carved" : "Captured"}
                </span>
                {entry.carveCheck && (
                  <span>
                    Check {entry.carveCheck.total} vs DC {entry.carveCheck.dc}{" "}
                    ({entry.carveCheck.success ? "success" : "fail"})
                  </span>
                )}
                <span>Loot d20: {entry.lootRoll}</span>
                <span>
                  → {entry.rune?.name ?? "No matching material"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function CarveRollResultCard({
  result,
  materialEffectIndex,
}: {
  result: CarveRollResult;
  materialEffectIndex: MaterialEffectNameIndex | null;
}) {
  const { rune, lootRoll, carveCheck, mode } = result;

  return (
    <div className="rounded-lg border border-amber-600/30 bg-amber-600/5 p-4 space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Roll Result</h3>
        <div className="text-xs text-muted-foreground space-y-0.5">
          {carveCheck && (
            <p>
              Carve check: d20 {carveCheck.d20Rolls.join(" / ")} (
              {carveCheck.rollMode}) {carveCheck.modifier >= 0 ? "+" : ""}
              {carveCheck.modifier} = {carveCheck.total} vs DC {carveCheck.dc}{" "}
              —{" "}
              <span
                className={
                  carveCheck.success
                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                    : "text-red-500 font-medium"
                }
              >
                {carveCheck.success ? "Success" : "Failure (loot roll = 1)"}
              </span>
            </p>
          )}
          <p>
            {mode === "capture" ? "Capture" : "Loot"} table roll:{" "}
            <strong className="text-foreground">d20 = {lootRoll}</strong>
          </p>
        </div>
      </div>

      {rune ? (
        <div className="rounded-md border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-bold text-amber-400">{rune.name}</h4>
            <TierBadge tier={rune.tier} variant="full" />
            {rune.slots.includes("A") && <Badge variant="blue">Armor</Badge>}
            {rune.slots.includes("W") && (
              <Badge variant="orange">Weapon</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-muted/30 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Carve (d20)
              </p>
              <p className="font-semibold">
                {formatChanceDisplay(rune.carveChance)}
              </p>
            </div>
            <div className="rounded-md bg-muted/30 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Capture (d20)
              </p>
              <p className="font-semibold">
                {formatChanceDisplay(rune.captureChance)}
              </p>
            </div>
          </div>

          {rune.armorEffect && (
            <EffectSection
              label="Armor Effect"
              text={rune.armorEffect}
              slot="armor"
              tags={rune.armorTags}
              materialEffectIndex={materialEffectIndex}
            />
          )}
          {rune.weaponEffect && (
            <EffectSection
              label="Weapon Effect"
              text={rune.weaponEffect}
              slot="weapon"
              tags={rune.weaponTags}
              materialEffectIndex={materialEffectIndex}
            />
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No material matched loot roll {lootRoll} on the{" "}
          {mode === "carve" ? "Carve" : "Capture"} column.
        </p>
      )}
    </div>
  );
}
