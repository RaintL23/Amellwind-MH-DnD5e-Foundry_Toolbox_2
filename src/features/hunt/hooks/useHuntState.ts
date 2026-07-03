import { useCallback, useEffect, useMemo, useState } from "react";
import type { Background, Environment, Monster, Species } from "@/shared/types";
import { getAllEnvironments } from "@/features/environments/services/environment.service";
import { getAllMonsters } from "@/features/monsters/services/monster.service";
import {
  findResourceRowByRoll,
  rollD20WithMode,
  rollFromRangeLabel,
  type RollMode,
} from "@/features/environments/utils/environmentRoll.utils";
import {
  createPrepEntry,
  createEmptyHuntPrepTables,
  type HuntPrepTableKey,
  type HuntPrepTables,
} from "../data/hunt-prep-defaults.data";
import {
  generateHuntPrepTables,
  type HuntEncounterDifficulty,
} from "../utils/hunt-prep-generator.utils";
import { loadNpcGeneratorData } from "@/features/npc-generator/services/npc-generator.service";
import {
  environmentMatchesMonster,
  formatResolvedTrackingOutcome,
  getCompatibleEnvironments,
  getCompatibleMonsters,
  pickPrepEntry,
  pickRandom,
  resolveTrackingOutcome,
  rollFindingSigns,
  type FindingSignsResult,
  type ResolvedTrackingOutcome,
} from "../utils/hunt-roll.utils";

export type HuntRollSection = "tracking" | "resources";

export interface HuntRollEntry {
  id: string;
  createdAt: Date;
  section: HuntRollSection;
  label: string;
  details: string;
  result: string;
  success?: boolean;
  signsGained?: number;
  eventType?: FindingSignsResult["event"];
  resolvedOutcome?: ResolvedTrackingOutcome;
}

export interface UseHuntStateResult {
  monsters: Monster[];
  environments: Environment[];
  monstersLoading: boolean;
  prepGenerating: boolean;
  setupComplete: boolean;
  hasBaseSetup: boolean;
  encounterDifficulty: HuntEncounterDifficulty;
  selectedMonster: Monster | null;
  selectedEnvironment: Environment | null;
  compatibleEnvironments: Environment[];
  compatibleMonsters: Monster[];
  selectedTierIndex: number;
  signsFound: number;
  signsRequired: number;
  areasVisited: number;
  flatBonus: number;
  rollMode: RollMode;
  survivalSucceeded: boolean;
  rollHistory: HuntRollEntry[];
  monsterFound: boolean;
  selectedTier: Environment["levelTiers"][number] | null;
  prepTables: HuntPrepTables;
  setSelectedTierIndex: (index: number) => void;
  setSignsRequired: (value: number) => void;
  setFlatBonus: (value: number) => void;
  setRollMode: (mode: RollMode) => void;
  setSurvivalSucceeded: (value: boolean) => void;
  setEncounterDifficulty: (value: HuntEncounterDifficulty) => void;
  completeSetup: () => void;
  regeneratePrepTables: () => void;
  pickMonster: (monster: Monster | null) => void;
  pickEnvironment: (environment: Environment | null) => void;
  randomize: () => void;
  rollTracking: () => void;
  rollResource: (resourceColumnIndex: number) => void;
  addPrepEntry: (table: HuntPrepTableKey, text?: string) => void;
  updatePrepEntry: (table: HuntPrepTableKey, id: string, text: string) => void;
  removePrepEntry: (table: HuntPrepTableKey, id: string) => void;
  resetPrepTables: () => void;
  rollPrepTable: (table: HuntPrepTableKey) => string | null;
  clearHistory: () => void;
  resetHunt: () => void;
}

function createRollEntry(
  entry: Omit<HuntRollEntry, "id" | "createdAt">,
): HuntRollEntry {
  return {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date(),
  };
}

export function useHuntState(): UseHuntStateResult {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [monstersLoading, setMonstersLoading] = useState(true);
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<Environment | null>(null);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [signsFound, setSignsFound] = useState(0);
  const [signsRequired, setSignsRequired] = useState(3);
  const [areasVisited, setAreasVisited] = useState(0);
  const [flatBonus, setFlatBonus] = useState(0);
  const [rollMode, setRollMode] = useState<RollMode>("normal");
  const [survivalSucceeded, setSurvivalSucceeded] = useState(true);
  const [rollHistory, setRollHistory] = useState<HuntRollEntry[]>([]);
  const [prepTables, setPrepTables] = useState<HuntPrepTables>(
    createEmptyHuntPrepTables,
  );
  const [prepGenerating, setPrepGenerating] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [encounterDifficulty, setEncounterDifficulty] =
    useState<HuntEncounterDifficulty>("normal");
  const [npcSpecies, setNpcSpecies] = useState<Species[]>([]);
  const [npcBackgrounds, setNpcBackgrounds] = useState<Background[]>([]);

  const environments = useMemo(() => getAllEnvironments(), []);

  useEffect(() => {
    getAllMonsters()
      .then((data) => {
        setMonsters(data);
      })
      .finally(() => {
        setMonstersLoading(false);
      });
  }, []);

  useEffect(() => {
    loadNpcGeneratorData().then(({ species, backgrounds }) => {
      setNpcSpecies(species);
      setNpcBackgrounds(backgrounds);
    });
  }, []);

  const hasBaseSetup = Boolean(selectedMonster && selectedEnvironment);

  const compatibleEnvironments = useMemo(
    () => getCompatibleEnvironments(selectedMonster, environments),
    [selectedMonster, environments],
  );

  const compatibleMonsters = useMemo(
    () => getCompatibleMonsters(selectedEnvironment, monsters),
    [selectedEnvironment, monsters],
  );

  const selectedTier =
    selectedEnvironment?.levelTiers[selectedTierIndex] ??
    selectedEnvironment?.levelTiers[0] ??
    null;

  const monsterFound = signsFound >= signsRequired;

  const pushHistory = useCallback((entry: Omit<HuntRollEntry, "id" | "createdAt">) => {
    setRollHistory((prev) => [createRollEntry(entry), ...prev]);
  }, []);

  const invalidateSetup = useCallback(() => {
    setSetupComplete(false);
    setSignsFound(0);
    setAreasVisited(0);
    setRollHistory([]);
  }, []);

  const regeneratePrepTables = useCallback(() => {
    if (!selectedMonster || !selectedEnvironment || !selectedTier) return;
    if (npcSpecies.length === 0) return;

    setPrepGenerating(true);
    void generateHuntPrepTables({
      target: selectedMonster,
      environment: selectedEnvironment,
      tier: selectedTier,
      difficulty: encounterDifficulty,
      allMonsters: monsters,
      species: npcSpecies,
      backgrounds: npcBackgrounds,
    })
      .then((tables) => {
        setPrepTables(tables);
        invalidateSetup();
      })
      .finally(() => {
        setPrepGenerating(false);
      });
  }, [
    encounterDifficulty,
    invalidateSetup,
    monsters,
    npcBackgrounds,
    npcSpecies,
    selectedEnvironment,
    selectedMonster,
    selectedTier,
  ]);

  useEffect(() => {
    if (!hasBaseSetup || !selectedTier || npcSpecies.length === 0) {
      setPrepTables(createEmptyHuntPrepTables());
      return;
    }

    let cancelled = false;
    setPrepGenerating(true);
    void generateHuntPrepTables({
      target: selectedMonster!,
      environment: selectedEnvironment!,
      tier: selectedTier,
      difficulty: encounterDifficulty,
      allMonsters: monsters,
      species: npcSpecies,
      backgrounds: npcBackgrounds,
    })
      .then((tables) => {
        if (cancelled) return;
        setPrepTables(tables);
        invalidateSetup();
      })
      .finally(() => {
        if (!cancelled) setPrepGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    encounterDifficulty,
    hasBaseSetup,
    invalidateSetup,
    monsters,
    npcBackgrounds,
    npcSpecies,
    selectedEnvironment,
    selectedMonster,
    selectedTier,
    selectedTierIndex,
  ]);

  const completeSetup = useCallback(() => {
    if (!hasBaseSetup || prepTables.signs.length === 0) return;
    setSetupComplete(true);
  }, [hasBaseSetup, prepTables.signs.length]);

  const pickMonster = useCallback(
    (monster: Monster | null) => {
      setSelectedMonster(monster);
      invalidateSetup();
      if (
        monster &&
        selectedEnvironment &&
        !environmentMatchesMonster(selectedEnvironment, monster)
      ) {
        setSelectedEnvironment(null);
        setSelectedTierIndex(0);
      }
    },
    [invalidateSetup, selectedEnvironment],
  );

  const pickEnvironment = useCallback(
    (environment: Environment | null) => {
      setSelectedEnvironment(environment);
      setSelectedTierIndex(0);
      invalidateSetup();
      if (
        environment &&
        selectedMonster &&
        !environmentMatchesMonster(environment, selectedMonster)
      ) {
        setSelectedMonster(null);
      }
    },
    [invalidateSetup, selectedMonster],
  );

  const randomize = useCallback(() => {
    const monsterPool = selectedEnvironment
      ? getCompatibleMonsters(selectedEnvironment, monsters)
      : monsters;
    const environmentPool = selectedMonster
      ? getCompatibleEnvironments(selectedMonster, environments)
      : environments;

    const nextMonster =
      selectedMonster ?? pickRandom(monsterPool) ?? pickRandom(monsters);
    const nextEnvironment =
      selectedEnvironment ??
      (nextMonster
        ? pickRandom(getCompatibleEnvironments(nextMonster, environments))
        : pickRandom(environmentPool));

    setSelectedMonster(nextMonster ?? null);
    setSelectedEnvironment(nextEnvironment ?? null);
    setSelectedTierIndex(0);
    invalidateSetup();
  }, [environments, invalidateSetup, monsters, selectedEnvironment, selectedMonster]);

  const updatePrepEntry = useCallback(
    (table: HuntPrepTableKey, id: string, text: string) => {
      setPrepTables((prev) => ({
        ...prev,
        [table]: prev[table].map((entry) =>
          entry.id === id ? { ...entry, text } : entry,
        ),
      }));
      setSetupComplete(false);
    },
    [],
  );

  const removePrepEntry = useCallback((table: HuntPrepTableKey, id: string) => {
    setPrepTables((prev) => ({
      ...prev,
      [table]: prev[table].filter((entry) => entry.id !== id),
    }));
    setSetupComplete(false);
  }, []);

  const addPrepEntry = useCallback((table: HuntPrepTableKey, text = "") => {
    setPrepTables((prev) => ({
      ...prev,
      [table]: [...prev[table], createPrepEntry(text)],
    }));
    setSetupComplete(false);
  }, []);

  const resetPrepTables = useCallback(() => {
    regeneratePrepTables();
  }, [regeneratePrepTables]);

  const rollPrepTable = useCallback(
    (table: HuntPrepTableKey) => pickPrepEntry(prepTables[table]),
    [prepTables],
  );

  const rollTracking = useCallback(() => {
    if (!setupComplete || !selectedMonster || !selectedEnvironment) return;

    const outcome = rollFindingSigns(survivalSucceeded, flatBonus);
    const resolvedOutcome = resolveTrackingOutcome(
      outcome.event,
      outcome.signs,
      prepTables,
    );
    const resolvedText = formatResolvedTrackingOutcome(resolvedOutcome);

    setAreasVisited((prev) => prev + 1);
    setSignsFound((prev) => prev + outcome.signs);

    pushHistory({
      section: "tracking",
      label: outcome.label,
      details: `d${outcome.dieSides} ${outcome.rawRoll}${
        outcome.flatBonus !== 0
          ? ` ${outcome.flatBonus >= 0 ? "+" : ""}${outcome.flatBonus}`
          : ""
      } = ${outcome.adjustedRoll} (Survival ${survivalSucceeded ? "success" : "failure"})`,
      result: resolvedText || outcome.description,
      signsGained: outcome.signs,
      eventType: outcome.event,
      resolvedOutcome,
    });
  }, [
    flatBonus,
    prepTables,
    pushHistory,
    selectedEnvironment,
    selectedMonster,
    survivalSucceeded,
    setupComplete,
  ]);

  const rollResource = useCallback(
    (resourceColumnIndex: number) => {
      if (!setupComplete || !selectedEnvironment || !selectedTier) return;

      const resourceColumn = selectedTier.resources.columns[resourceColumnIndex];
      if (!resourceColumn) return;

      const d20 = rollD20WithMode(rollMode);
      const total = d20.selected + flatBonus;
      const passResourceCheck = total >= resourceColumn.dc;

      if (!passResourceCheck) {
        pushHistory({
          section: "resources",
          label: `${resourceColumn.category} Resource Check`,
          details: `d20 ${d20.rolls.join(" / ")} (${d20.mode}) + bonus ${flatBonus >= 0 ? "+" : ""}${flatBonus}`,
          result: `Failed: total ${total} vs DC ${resourceColumn.dc}`,
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
        section: "resources",
        label: `${resourceColumn.category} Resource Check`,
        details: `d20 ${d20.rolls.join(" / ")} (${d20.mode}) + bonus ${flatBonus >= 0 ? "+" : ""}${flatBonus}; d6 ${d6Result}`,
        result: item
          ? `Success: ${item} (row ${row?.roll ?? "-"})`
          : "Success, but no resource item matched that roll/category.",
        success: true,
      });
    },
    [flatBonus, pushHistory, rollMode, selectedEnvironment, selectedTier, setupComplete],
  );

  const clearHistory = useCallback(() => {
    setRollHistory([]);
  }, []);

  const resetHunt = useCallback(() => {
    setSelectedMonster(null);
    setSelectedEnvironment(null);
    setSelectedTierIndex(0);
    setSignsFound(0);
    setSignsRequired(3);
    setAreasVisited(0);
    setFlatBonus(0);
    setRollMode("normal");
    setSurvivalSucceeded(true);
    setRollHistory([]);
    setPrepTables(createEmptyHuntPrepTables());
    setSetupComplete(false);
    setEncounterDifficulty("normal");
  }, []);

  return {
    monsters,
    environments,
    monstersLoading,
    prepGenerating,
    setupComplete,
    hasBaseSetup,
    encounterDifficulty,
    selectedMonster,
    selectedEnvironment,
    compatibleEnvironments,
    compatibleMonsters,
    selectedTierIndex,
    signsFound,
    signsRequired,
    areasVisited,
    flatBonus,
    rollMode,
    survivalSucceeded,
    rollHistory,
    monsterFound,
    selectedTier,
    prepTables,
    setSelectedTierIndex,
    setSignsRequired,
    setFlatBonus,
    setRollMode,
    setSurvivalSucceeded,
    setEncounterDifficulty,
    completeSetup,
    regeneratePrepTables,
    pickMonster,
    pickEnvironment,
    randomize,
    rollTracking,
    rollResource,
    addPrepEntry,
    updatePrepEntry,
    removePrepEntry,
    resetPrepTables,
    rollPrepTable,
    clearHistory,
    resetHunt,
  };
}
