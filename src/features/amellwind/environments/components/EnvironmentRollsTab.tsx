import { useState } from "react";
import type { Environment } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { DndRichText } from "@/shared/components/DndRichText";
import { Dice6, Package } from "lucide-react";
import {
  findEncounterByRoll,
  findResourceRowByRoll,
  findWeatherByRoll,
  rollDie,
  rollD20WithMode,
  rollFromRangeLabel,
  type RollEntry,
  type RollMode,
} from "../utils/environmentRoll.utils";

export function EnvironmentRollsTab({
  environments,
}: {
  environments: Environment[];
}) {
  const [selectedEnvironmentName, setSelectedEnvironmentName] = useState(
    environments[0]?.name ?? "",
  );
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [resourceColumnIndex, setResourceColumnIndex] = useState(0);
  const [skillMod, setSkillMod] = useState(0);
  const [rollMode, setRollMode] = useState<RollMode>("normal");
  const [history, setHistory] = useState<RollEntry[]>([]);

  const selectedEnvironment =
    environments.find((env) => env.name === selectedEnvironmentName) ??
    environments[0] ??
    null;

  const tiers = selectedEnvironment?.levelTiers ?? [];
  const selectedTier = tiers[selectedTierIndex] ?? tiers[0];
  const resourceColumns = selectedTier?.resources.columns ?? [];
  const selectedResourceColumn =
    resourceColumns[resourceColumnIndex] ?? resourceColumns[0];

  function pushHistory(entry: Omit<RollEntry, "id" | "createdAt">) {
    setHistory((prev) => [
      {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date(),
      },
      ...prev,
    ]);
  }

  function rollNavigationCheck() {
    if (!selectedEnvironment || !selectedTier) return;
    const d20 = rollD20WithMode(rollMode);
    const total = d20.selected + skillMod;
    const success = total >= selectedEnvironment.navigationDC;
    pushHistory({
      environmentName: selectedEnvironment.name,
      levelRange: selectedTier.levelRange,
      section: "navigation",
      label: "Navigation Check",
      details: `d20 ${d20.rolls.join(" / ")} (${d20.mode}) + mod ${skillMod >= 0 ? "+" : ""}${skillMod}`,
      result: `Total ${total} vs DC ${selectedEnvironment.navigationDC}`,
      success,
    });
  }

  function rollEncounter() {
    if (!selectedEnvironment || !selectedTier) return;
    const encounterCheck = rollDie(20);
    const triggered = encounterCheck >= selectedEnvironment.encounterDC;
    if (!triggered) {
      pushHistory({
        environmentName: selectedEnvironment.name,
        levelRange: selectedTier.levelRange,
        section: "encounter-check",
        label: "Encounter Check",
        details: `d20 ${encounterCheck} vs Encounter DC ${selectedEnvironment.encounterDC}`,
        result: "No encounter triggered.",
        success: false,
      });
      return;
    }

    const encounterRoll = rollDie(10);
    const encounter = findEncounterByRoll(selectedTier.encounters, encounterRoll);
    pushHistory({
      environmentName: selectedEnvironment.name,
      levelRange: selectedTier.levelRange,
      section: "encounter-check",
      label: "Encounter Check",
      details: `d20 ${encounterCheck} >= DC ${selectedEnvironment.encounterDC}; d10 ${encounterRoll}`,
      result: encounter
        ? `Encounter: ${encounter.description}`
        : "Encounter triggered but no matching row was found.",
      success: true,
    });
  }

  function rollWeather() {
    if (
      !selectedEnvironment ||
      !selectedTier ||
      !selectedEnvironment.weatherTable?.length
    )
      return;
    const weatherRoll = rollDie(20);
    const weather = findWeatherByRoll(
      selectedEnvironment.weatherTable,
      weatherRoll,
    );
    pushHistory({
      environmentName: selectedEnvironment.name,
      levelRange: selectedTier.levelRange,
      section: "weather",
      label: "Weather Roll",
      details: `d20 ${weatherRoll}`,
      result: weather ? weather.weather : "No weather row matched that roll.",
    });
  }

  function rollInvestigation() {
    if (!selectedEnvironment || !selectedTier) return;
    const d20 = rollD20WithMode(rollMode);
    const total = d20.selected + skillMod;
    const success = total >= selectedEnvironment.investigationDC;
    pushHistory({
      environmentName: selectedEnvironment.name,
      levelRange: selectedTier.levelRange,
      section: "investigation",
      label: "Investigation Check",
      details: `d20 ${d20.rolls.join(" / ")} (${d20.mode}) + mod ${skillMod >= 0 ? "+" : ""}${skillMod}`,
      result: `Total ${total} vs DC ${selectedEnvironment.investigationDC}`,
      success,
    });
  }

  function rollResources() {
    if (!selectedEnvironment || !selectedTier || !selectedResourceColumn)
      return;
    const d20 = rollD20WithMode(rollMode);
    const total = d20.selected + skillMod;
    const passResourceCheck = total >= selectedResourceColumn.dc;
    if (!passResourceCheck) {
      pushHistory({
        environmentName: selectedEnvironment.name,
        levelRange: selectedTier.levelRange,
        section: "resources",
        label: `${selectedResourceColumn.category} Resource Check`,
        details: `d20 ${d20.rolls.join(" / ")} (${d20.mode}) + mod ${skillMod >= 0 ? "+" : ""}${skillMod}`,
        result: `Failed: total ${total} vs DC ${selectedResourceColumn.dc}`,
        success: false,
      });
      return;
    }

    const rowRollSeed =
      selectedTier.resources.rows[
        Math.floor(Math.random() * selectedTier.resources.rows.length)
      ]?.roll ?? "1";
    const d6Result = rollFromRangeLabel(rowRollSeed);
    const row = findResourceRowByRoll(selectedTier.resources.rows, d6Result);
    const item = row?.items[resourceColumnIndex];
    pushHistory({
      environmentName: selectedEnvironment.name,
      levelRange: selectedTier.levelRange,
      section: "resources",
      label: `${selectedResourceColumn.category} Resource Check`,
      details: `d20 ${d20.rolls.join(" / ")} (${d20.mode}) + mod ${skillMod >= 0 ? "+" : ""}${skillMod}; d6 ${d6Result}`,
      result: item
        ? `Success: ${item} (row ${row?.roll ?? "-"})`
        : "Success, but no resource item matched that roll/category.",
      success: true,
    });
  }

  if (!selectedEnvironment || !selectedTier) {
    return (
      <p className="text-sm text-muted-foreground">No environments available.</p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Dice6 className="h-4 w-4 text-primary" />
          Roll Setup
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs text-muted-foreground space-y-1">
            Environment
            <select
              value={selectedEnvironment.name}
              onChange={(e) => {
                const next = e.target.value;
                setSelectedEnvironmentName(next);
                setSelectedTierIndex(0);
                setResourceColumnIndex(0);
              }}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              {environments.map((env) => (
                <option key={env.name} value={env.name}>
                  {env.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-muted-foreground space-y-1">
            Level Tier
            <select
              value={selectedTierIndex}
              onChange={(e) => {
                setSelectedTierIndex(Number(e.target.value));
                setResourceColumnIndex(0);
              }}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              {selectedEnvironment.levelTiers.map((tier, idx) => (
                <option key={tier.levelRange} value={idx}>
                  {tier.levelRange}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-muted-foreground space-y-1">
            Skill Modifier
            <input
              type="number"
              value={skillMod}
              onChange={(e) => setSkillMod(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>

          <label className="text-xs text-muted-foreground space-y-1">
            Roll Mode
            <select
              value={rollMode}
              onChange={(e) => setRollMode(e.target.value as RollMode)}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              <option value="normal">Normal</option>
              <option value="advantage">Advantage</option>
              <option value="disadvantage">Disadvantage</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 pt-1">
          <button
            onClick={rollNavigationCheck}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            Roll Navigation (DC {selectedEnvironment.navigationDC})
          </button>
          <button
            onClick={rollEncounter}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            Roll Encounter Flow
          </button>
          <button
            onClick={rollWeather}
            disabled={!selectedEnvironment.weatherTable?.length}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Roll Weather
          </button>
          <button
            onClick={rollInvestigation}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            Roll Investigation (DC {selectedEnvironment.investigationDC})
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Resource Table Roll
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground space-y-1">
            Resource Category
            <select
              value={resourceColumnIndex}
              onChange={(e) => setResourceColumnIndex(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              {resourceColumns.map((col, idx) => (
                <option key={col.category} value={idx}>
                  {col.category} (DC {col.dc})
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground flex items-center">
            This check uses your custom modifier and roll mode
            (normal/adv/disadv).
          </div>
        </div>

        <button
          onClick={rollResources}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
        >
          Roll Resource Check + Loot
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Environment Details Snapshot
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-md border border-border bg-card/40 p-3">
            <p className="text-xs text-muted-foreground">Special Rules</p>
            <ul className="mt-1 space-y-1">
              {selectedEnvironment.specialRules.length > 0 ? (
                selectedEnvironment.specialRules.map((rule) => (
                  <li key={rule.name} className="text-xs text-foreground">
                    <span className="font-semibold">{rule.name}:</span>{" "}
                    <DndRichText text={rule.description} />
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground">
                  No special rules.
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-md border border-border bg-card/40 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Quick Data</p>
            <p className="text-xs text-foreground">
              Biome: {selectedEnvironment.biome}
            </p>
            <p className="text-xs text-foreground">
              Common Weather: {selectedEnvironment.commonWeather}
            </p>
            <p className="text-xs text-foreground">
              Total Resources: {selectedEnvironment.totalResources}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Roll History</h3>
          <button
            onClick={() => setHistory([])}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear history
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No rolls yet. Start with any roll button to see detailed dice
            outcomes.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-md border border-border bg-card/40 p-3 space-y-1"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{entry.createdAt.toLocaleTimeString()}</span>
                  <span>-</span>
                  <span>{entry.environmentName}</span>
                  <span>-</span>
                  <span>{entry.levelRange}</span>
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {entry.label}
                  {typeof entry.success === "boolean" && (
                    <span
                      className={cn(
                        "ml-2",
                        entry.success ? "text-emerald-400" : "text-rose-400",
                      )}
                    >
                      {entry.success ? "SUCCESS" : "FAIL"}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{entry.details}</p>
                <p className="text-xs text-foreground">{entry.result}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
