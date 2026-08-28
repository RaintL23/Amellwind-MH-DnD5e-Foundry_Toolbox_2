import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Background, Environment, Monster, Species } from "@/shared/types";
import { getAllEnvironments } from "@/features/amellwind/environments/services/environment.service";
import { getAllMonsters } from "@/features/amellwind/monsters/services/monster.service";
import {
  clearHuntState,
  huntPrepTablesHaveContent,
  loadHuntState,
  persistHuntState,
} from "../storage/hunt.storage";
import {
  findResourceRowByRoll,
  rollD20WithMode,
  rollFromRangeLabel,
  type RollMode,
} from "@/features/amellwind/environments/utils/environmentRoll.utils";
import {
  createEnvironmentInvestigationRoll,
  createEnvironmentNavigationRoll,
  createEnvironmentEncounterRoll,
  createEnvironmentWeatherRoll,
  createScoutPerceptionRoll,
  createScoutStealthRoll,
  createSpotterPassiveInvestigationCheck,
  createSpotterPassivePerceptionCheck,
  type EnvironmentRollContext,
} from "@/features/amellwind/environments/utils/environment-roll-actions";
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
import { loadNpcGeneratorData } from "@/features/amellwind/npc-generator/services/npc-generator.service";
import {
  createDefaultHunterLevels,
  createTargetProgressMap,
  DEFAULT_HUNTER_COUNT,
  getAveragePartyLevel,
  getHuntCombatDifficulty,
  getMonsterKey,
  getTotalTargetCr,
  resizeHunterLevels,
  type HuntTargetProgress,
} from "../utils/hunt-party.utils";
import {
  environmentMatchesAllMonsters,
  environmentMatchesMonster,
  formatResolvedTrackingOutcome,
  getCompatibleEnvironments,
  getCompatibleMonsters,
  pickPrepEntry,
  pickRandom,
  resolveFindingSignsRoll,
  resolveTrackingOutcome,
  type FindingSignsResult,
  type ResolvedTrackingOutcome,
} from "../utils/hunt-roll.utils";

export type HuntRollSection =
  | "tracking"
  | "resources"
  | "environment"
  | "scout"
  | "spotter";

export type HuntTrackingRollMode = "random" | "manual";

export interface HuntRollEntry {
  id: string;
  createdAt: Date;
  section: HuntRollSection;
  label: string;
  details: string;
  result: string;
  success?: boolean;
  signsGained?: number;
  targetMonsterKey?: string;
  targetMonsterName?: string;
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
  selectedMonsters: Monster[];
  selectedEnvironment: Environment | null;
  compatibleEnvironments: Environment[];
  compatibleMonsters: Monster[];
  selectedTierIndex: number;
  signsRequired: number;
  targetProgress: Record<string, HuntTargetProgress>;
  activeTrackingTargetKey: string | null;
  areasVisited: number;
  flatBonus: number;
  rollMode: RollMode;
  trackingRollMode: HuntTrackingRollMode;
  manualFindingSignsRoll: number | null;
  survivalSucceeded: boolean;
  hunterCount: number;
  hunterLevels: number[];
  averagePartyLevel: number;
  totalTargetCr: number;
  combatDifficulty: ReturnType<typeof getHuntCombatDifficulty>;
  scoutAmbushSpotNoticed: boolean;
  rollHistory: HuntRollEntry[];
  allMonstersFound: boolean;
  selectedTier: Environment["levelTiers"][number] | null;
  prepTables: HuntPrepTables;
  setSelectedTierIndex: (index: number) => void;
  setSignsRequired: (value: number) => void;
  setFlatBonus: (value: number) => void;
  setRollMode: (mode: RollMode) => void;
  setTrackingRollMode: (mode: HuntTrackingRollMode) => void;
  setManualFindingSignsRoll: (value: number | null) => void;
  setSurvivalSucceeded: (value: boolean) => void;
  setHunterCount: (count: number) => void;
  setHunterLevel: (index: number, level: number) => void;
  setActiveTrackingTargetKey: (key: string | null) => void;
  setScoutAmbushSpotNoticed: (value: boolean) => void;
  setEncounterDifficulty: (value: HuntEncounterDifficulty) => void;
  completeSetup: () => void;
  regeneratePrepTables: () => void;
  addMonster: (monster: Monster) => void;
  removeMonster: (monsterKey: string) => void;
  pickEnvironment: (environment: Environment | null) => void;
  randomize: () => void;
  rollTracking: () => void;
  rollResource: (resourceColumnIndex: number) => void;
  rollEnvironmentNavigation: () => void;
  rollEnvironmentEncounter: () => void;
  rollEnvironmentWeather: () => void;
  rollEnvironmentInvestigation: () => void;
  rollScoutStealth: () => void;
  rollScoutPerception: () => void;
  checkSpotterPerception: (passivePerception: number) => void;
  checkSpotterInvestigation: (passiveInvestigation: number) => void;
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

function resolveSavedMonsters(
  refs: Array<{ name: string; source: string | null }>,
  catalog: Monster[],
): Monster[] {
  const resolved: Monster[] = [];
  const seen = new Set<string>();
  for (const ref of refs) {
    const match =
      catalog.find(
        (monster) =>
          monster.name === ref.name &&
          (ref.source ? monster.source === ref.source : true),
      ) ?? catalog.find((monster) => monster.name === ref.name);
    if (!match) continue;
    const key = getMonsterKey(match);
    if (seen.has(key)) continue;
    seen.add(key);
    resolved.push(match);
  }
  return resolved;
}

export function useHuntState(): UseHuntStateResult {
  const persistedRef = useRef(loadHuntState());
  const persisted = persistedRef.current;
  const hydrationPendingRef = useRef(
    Boolean(
      persisted?.monsters?.length &&
        persisted?.environmentName &&
        huntPrepTablesHaveContent(persisted.prepTables),
    ),
  );

  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [monstersLoading, setMonstersLoading] = useState(true);
  const [selectedMonsters, setSelectedMonsters] = useState<Monster[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<Environment | null>(() => {
      if (!persisted?.environmentName) return null;
      return (
        getAllEnvironments().find(
          (env) => env.name === persisted.environmentName,
        ) ?? null
      );
    });
  const [selectedTierIndex, setSelectedTierIndex] = useState(
    persisted?.selectedTierIndex ?? 0,
  );
  const [signsRequired, setSignsRequired] = useState(
    persisted?.signsRequired ?? 3,
  );
  const [targetProgress, setTargetProgress] = useState<
    Record<string, HuntTargetProgress>
  >(persisted?.targetProgress ?? {});
  const [activeTrackingTargetKey, setActiveTrackingTargetKey] = useState<
    string | null
  >(persisted?.activeTrackingTargetKey ?? null);
  const [areasVisited, setAreasVisited] = useState(persisted?.areasVisited ?? 0);
  const [flatBonus, setFlatBonus] = useState(persisted?.flatBonus ?? 0);
  const [rollMode, setRollMode] = useState<RollMode>(
    persisted?.rollMode ?? "normal",
  );
  const [trackingRollMode, setTrackingRollMode] = useState<HuntTrackingRollMode>(
    persisted?.trackingRollMode ?? "random",
  );
  const [manualFindingSignsRoll, setManualFindingSignsRoll] = useState<
    number | null
  >(persisted?.manualFindingSignsRoll ?? null);
  const [survivalSucceeded, setSurvivalSucceeded] = useState(
    persisted?.survivalSucceeded ?? true,
  );
  const [hunterCount, setHunterCountState] = useState(
    persisted?.hunterCount ?? DEFAULT_HUNTER_COUNT,
  );
  const [hunterLevels, setHunterLevels] = useState<number[]>(
    persisted?.hunterLevels ??
      createDefaultHunterLevels(persisted?.hunterCount ?? DEFAULT_HUNTER_COUNT),
  );
  const [scoutAmbushSpotNoticed, setScoutAmbushSpotNoticed] = useState(
    persisted?.scoutAmbushSpotNoticed ?? false,
  );
  const [rollHistory, setRollHistory] = useState<HuntRollEntry[]>(
    persisted?.rollHistory ?? [],
  );
  const [prepTables, setPrepTables] = useState<HuntPrepTables>(
    () => persisted?.prepTables ?? createEmptyHuntPrepTables(),
  );
  const [prepGenerating, setPrepGenerating] = useState(false);
  const [setupComplete, setSetupComplete] = useState(
    persisted?.setupComplete ?? false,
  );
  const [encounterDifficulty, setEncounterDifficulty] =
    useState<HuntEncounterDifficulty>(persisted?.encounterDifficulty ?? "normal");
  const [npcSpecies, setNpcSpecies] = useState<Species[]>([]);
  const [npcBackgrounds, setNpcBackgrounds] = useState<Background[]>([]);

  const environments = useMemo(() => getAllEnvironments(), []);

  useEffect(() => {
    getAllMonsters()
      .then((data) => {
        setMonsters(data);
        const savedRefs = persistedRef.current?.monsters ?? [];
        if (savedRefs.length > 0) {
          const restored = resolveSavedMonsters(savedRefs, data);
          if (restored.length > 0) {
            setSelectedMonsters(restored);
            setTargetProgress((prev) => createTargetProgressMap(restored, prev));
            setActiveTrackingTargetKey((current) => {
              if (current && restored.some((m) => getMonsterKey(m) === current)) {
                return current;
              }
              return getMonsterKey(restored[0]);
            });
          } else {
            hydrationPendingRef.current = false;
          }
        }
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

  const hasBaseSetup =
    selectedMonsters.length > 0 && Boolean(selectedEnvironment);

  const compatibleEnvironments = useMemo(
    () => getCompatibleEnvironments(selectedMonsters, environments),
    [selectedMonsters, environments],
  );

  const compatibleMonsters = useMemo(
    () => getCompatibleMonsters(selectedEnvironment, monsters),
    [selectedEnvironment, monsters],
  );

  const selectedTier =
    selectedEnvironment?.levelTiers[selectedTierIndex] ??
    selectedEnvironment?.levelTiers[0] ??
    null;

  const averagePartyLevel = useMemo(
    () => getAveragePartyLevel(hunterLevels),
    [hunterLevels],
  );

  const totalTargetCr = useMemo(
    () => getTotalTargetCr(selectedMonsters),
    [selectedMonsters],
  );

  const combatDifficulty = useMemo(
    () =>
      getHuntCombatDifficulty(
        averagePartyLevel,
        totalTargetCr,
        hunterCount,
        selectedTier?.levelRange,
      ),
    [averagePartyLevel, totalTargetCr, hunterCount, selectedTier?.levelRange],
  );

  const allMonstersFound = useMemo(() => {
    if (selectedMonsters.length === 0) return false;
    return selectedMonsters.every((monster) => {
      const progress = targetProgress[getMonsterKey(monster)];
      return progress?.found ?? false;
    });
  }, [selectedMonsters, targetProgress]);

  const pushHistory = useCallback((entry: Omit<HuntRollEntry, "id" | "createdAt">) => {
    setRollHistory((prev) => [createRollEntry(entry), ...prev]);
  }, []);

  const invalidateSetup = useCallback(() => {
    setSetupComplete(false);
    setTargetProgress((prev) => {
      const reset: Record<string, HuntTargetProgress> = {};
      for (const [key] of Object.entries(prev)) {
        reset[key] = { signsFound: 0, found: false };
      }
      return reset;
    });
    setAreasVisited(0);
    setRollHistory([]);
  }, []);

  const regeneratePrepTables = useCallback(() => {
    if (selectedMonsters.length === 0 || !selectedEnvironment || !selectedTier) {
      return;
    }
    if (npcSpecies.length === 0) return;

    setPrepGenerating(true);
    void generateHuntPrepTables({
      targets: selectedMonsters,
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
    selectedMonsters,
    selectedTier,
  ]);

  useEffect(() => {
    if (hydrationPendingRef.current) {
      if (!hasBaseSetup || !selectedTier || npcSpecies.length === 0) return;
      hydrationPendingRef.current = false;
      return;
    }

    if (!hasBaseSetup || !selectedTier || npcSpecies.length === 0) {
      setPrepTables(createEmptyHuntPrepTables());
      return;
    }

    let cancelled = false;
    setPrepGenerating(true);
    void generateHuntPrepTables({
      targets: selectedMonsters,
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
    selectedMonsters,
    selectedTier,
    selectedTierIndex,
  ]);

  const completeSetup = useCallback(() => {
    if (!hasBaseSetup || prepTables.signs.length === 0) return;
    setSetupComplete(true);
  }, [hasBaseSetup, prepTables.signs.length]);

  const addMonster = useCallback(
    (monster: Monster) => {
      const key = getMonsterKey(monster);
      setSelectedMonsters((prev) => {
        if (prev.some((entry) => getMonsterKey(entry) === key)) return prev;
        return [...prev, monster];
      });
      setTargetProgress((prev) => createTargetProgressMap([monster], prev));
      setActiveTrackingTargetKey((prev) => prev ?? key);
      invalidateSetup();
      if (
        selectedEnvironment &&
        !environmentMatchesMonster(selectedEnvironment, monster)
      ) {
        setSelectedEnvironment(null);
        setSelectedTierIndex(0);
      }
    },
    [invalidateSetup, selectedEnvironment],
  );

  const removeMonster = useCallback(
    (monsterKey: string) => {
      setSelectedMonsters((prev) =>
        prev.filter((monster) => getMonsterKey(monster) !== monsterKey),
      );
      setTargetProgress((prev) => {
        const next = { ...prev };
        delete next[monsterKey];
        return next;
      });
      setActiveTrackingTargetKey((prev) =>
        prev === monsterKey ? null : prev,
      );
      invalidateSetup();
    },
    [invalidateSetup],
  );

  const pickEnvironment = useCallback(
    (environment: Environment | null) => {
      setSelectedEnvironment(environment);
      setSelectedTierIndex(0);
      invalidateSetup();
      if (
        environment &&
        selectedMonsters.length > 0 &&
        !environmentMatchesAllMonsters(environment, selectedMonsters)
      ) {
        setSelectedMonsters([]);
        setTargetProgress({});
        setActiveTrackingTargetKey(null);
      }
    },
    [invalidateSetup, selectedMonsters],
  );

  const randomize = useCallback(() => {
    const monsterPool = selectedEnvironment
      ? getCompatibleMonsters(selectedEnvironment, monsters)
      : monsters;
    const environmentPool =
      selectedMonsters.length > 0
        ? getCompatibleEnvironments(selectedMonsters, environments)
        : environments;

    const nextMonster =
      selectedMonsters[0] ?? pickRandom(monsterPool) ?? pickRandom(monsters);
    const nextEnvironment =
      selectedEnvironment ??
      (nextMonster
        ? pickRandom(getCompatibleEnvironments([nextMonster], environments))
        : pickRandom(environmentPool));

    setSelectedMonsters(nextMonster ? [nextMonster] : []);
    setTargetProgress(
      nextMonster
        ? createTargetProgressMap([nextMonster])
        : {},
    );
    setActiveTrackingTargetKey(nextMonster ? getMonsterKey(nextMonster) : null);
    setSelectedEnvironment(nextEnvironment ?? null);
    setSelectedTierIndex(0);
    invalidateSetup();
  }, [environments, invalidateSetup, monsters, selectedEnvironment, selectedMonsters]);

  const setHunterCount = useCallback((count: number) => {
    const clamped = Math.min(6, Math.max(1, count));
    setHunterCountState(clamped);
    setHunterLevels((prev) => resizeHunterLevels(prev, clamped));
  }, []);

  const setHunterLevel = useCallback((index: number, level: number) => {
    const clampedLevel = Math.min(20, Math.max(1, level));
    setHunterLevels((prev) =>
      prev.map((value, idx) => (idx === index ? clampedLevel : value)),
    );
  }, []);

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

  const getEnvironmentRollContext = useCallback((): EnvironmentRollContext | null => {
    if (!selectedEnvironment || !selectedTier) return null;
    return {
      environment: selectedEnvironment,
      tier: selectedTier,
      skillMod: flatBonus,
      rollMode,
    };
  }, [flatBonus, rollMode, selectedEnvironment, selectedTier]);

  const pushEnvironmentRoll = useCallback(
    (entry: ReturnType<typeof createEnvironmentNavigationRoll>) => {
      pushHistory({
        section: "environment",
        label: entry.label,
        details: entry.details,
        result: entry.result,
        success: entry.success,
      });
    },
    [pushHistory],
  );

  const rollEnvironmentNavigation = useCallback(() => {
    const context = getEnvironmentRollContext();
    if (!setupComplete || !context) return;
    pushEnvironmentRoll(createEnvironmentNavigationRoll(context));
  }, [getEnvironmentRollContext, pushEnvironmentRoll, setupComplete]);

  const rollEnvironmentEncounter = useCallback(() => {
    const context = getEnvironmentRollContext();
    if (!setupComplete || !context) return;
    pushEnvironmentRoll(createEnvironmentEncounterRoll(context));
  }, [getEnvironmentRollContext, pushEnvironmentRoll, setupComplete]);

  const rollEnvironmentWeather = useCallback(() => {
    const context = getEnvironmentRollContext();
    if (!setupComplete || !context) return;
    pushEnvironmentRoll(createEnvironmentWeatherRoll(context));
  }, [getEnvironmentRollContext, pushEnvironmentRoll, setupComplete]);

  const rollEnvironmentInvestigation = useCallback(() => {
    const context = getEnvironmentRollContext();
    if (!setupComplete || !context) return;
    pushEnvironmentRoll(createEnvironmentInvestigationRoll(context));
  }, [getEnvironmentRollContext, pushEnvironmentRoll, setupComplete]);

  const rollScoutStealth = useCallback(() => {
    if (!setupComplete) return;
    const entry = createScoutStealthRoll(flatBonus, rollMode);
    pushHistory({
      section: "scout",
      label: entry.label,
      details: entry.details,
      result: entry.result,
      success: entry.success,
    });
  }, [flatBonus, pushHistory, rollMode, setupComplete]);

  const rollScoutPerception = useCallback(() => {
    if (!setupComplete) return;
    const entry = createScoutPerceptionRoll(flatBonus, rollMode);
    pushHistory({
      section: "scout",
      label: entry.label,
      details: entry.details,
      result: entry.result,
      success: entry.success,
    });
  }, [flatBonus, pushHistory, rollMode, setupComplete]);

  const checkSpotterPerception = useCallback(
    (passivePerception: number) => {
      if (!setupComplete || !selectedEnvironment) return;
      const ambushDc = selectedEnvironment.encounterDC;
      const effectivePassive =
        passivePerception + (scoutAmbushSpotNoticed ? 4 : 0);
      const entry = createSpotterPassivePerceptionCheck(
        effectivePassive,
        ambushDc,
        scoutAmbushSpotNoticed,
      );
      pushHistory({
        section: "spotter",
        label: entry.label,
        details: entry.details,
        result: entry.result,
        success: entry.success,
      });
    },
    [pushHistory, scoutAmbushSpotNoticed, selectedEnvironment, setupComplete],
  );

  const checkSpotterInvestigation = useCallback(
    (passiveInvestigation: number) => {
      if (!setupComplete || !selectedEnvironment) return;
      const entry = createSpotterPassiveInvestigationCheck(
        passiveInvestigation,
        selectedEnvironment.investigationDC,
      );
      pushHistory({
        section: "spotter",
        label: entry.label,
        details: entry.details,
        result: entry.result,
        success: entry.success,
      });
    },
    [pushHistory, selectedEnvironment, setupComplete],
  );

  const rollTracking = useCallback(() => {
    if (!setupComplete || selectedMonsters.length === 0 || !selectedEnvironment) {
      return;
    }

    const targetKey =
      activeTrackingTargetKey ?? getMonsterKey(selectedMonsters[0]);
    const targetMonster = selectedMonsters.find(
      (monster) => getMonsterKey(monster) === targetKey,
    );
    if (!targetMonster) return;

    const currentProgress = targetProgress[targetKey];
    if (currentProgress?.found) return;

    if (
      trackingRollMode === "manual" &&
      (manualFindingSignsRoll == null || Number.isNaN(manualFindingSignsRoll))
    ) {
      return;
    }

    const outcome = resolveFindingSignsRoll(survivalSucceeded, flatBonus, {
      manualRoll:
        trackingRollMode === "manual" ? manualFindingSignsRoll ?? undefined : undefined,
    });
    const resolvedOutcome = resolveTrackingOutcome(
      outcome.event,
      outcome.signs,
      prepTables,
    );
    const resolvedText = formatResolvedTrackingOutcome(resolvedOutcome);

    setAreasVisited((prev) => prev + 1);
    setTargetProgress((prev) => {
      const current = prev[targetKey] ?? { signsFound: 0, found: false };
      const nextSigns = current.signsFound + outcome.signs;
      return {
        ...prev,
        [targetKey]: {
          signsFound: nextSigns,
          found: nextSigns >= signsRequired,
        },
      };
    });

    const rollSource =
      trackingRollMode === "manual" ? `${outcome.rawRoll} (manual)` : `${outcome.rawRoll}`;

    pushHistory({
      section: "tracking",
      label: outcome.label,
      details: `d${outcome.dieSides} ${rollSource}${
        outcome.flatBonus !== 0
          ? ` ${outcome.flatBonus >= 0 ? "+" : ""}${outcome.flatBonus}`
          : ""
      } = ${outcome.adjustedRoll} (Survival ${survivalSucceeded ? "success" : "failure"}) · ${targetMonster.name}`,
      result: resolvedText || outcome.description,
      signsGained: outcome.signs,
      targetMonsterKey: targetKey,
      targetMonsterName: targetMonster.name,
      eventType: outcome.event,
      resolvedOutcome,
    });
  }, [
    activeTrackingTargetKey,
    flatBonus,
    manualFindingSignsRoll,
    prepTables,
    pushHistory,
    selectedEnvironment,
    selectedMonsters,
    signsRequired,
    survivalSucceeded,
    setupComplete,
    targetProgress,
    trackingRollMode,
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

  useEffect(() => {
    if (selectedMonsters.length === 0) return;
    setActiveTrackingTargetKey((prev) => {
      if (prev && selectedMonsters.some((monster) => getMonsterKey(monster) === prev)) {
        return prev;
      }
      return getMonsterKey(selectedMonsters[0]);
    });
  }, [selectedMonsters]);

  useEffect(() => {
    if (monstersLoading) return;
    persistHuntState({
      monsters: selectedMonsters.map((monster) => ({
        name: monster.name,
        source: monster.source ?? null,
      })),
      activeTrackingTargetKey,
      environmentName: selectedEnvironment?.name ?? null,
      selectedTierIndex,
      signsRequired,
      targetProgress,
      areasVisited,
      flatBonus,
      rollMode,
      trackingRollMode,
      manualFindingSignsRoll,
      survivalSucceeded,
      hunterCount,
      hunterLevels,
      scoutAmbushSpotNoticed,
      rollHistory,
      prepTables,
      setupComplete,
      encounterDifficulty,
    });
  }, [
    monstersLoading,
    activeTrackingTargetKey,
    selectedMonsters,
    selectedEnvironment,
    selectedTierIndex,
    signsRequired,
    targetProgress,
    areasVisited,
    flatBonus,
    rollMode,
    trackingRollMode,
    manualFindingSignsRoll,
    survivalSucceeded,
    hunterCount,
    hunterLevels,
    scoutAmbushSpotNoticed,
    rollHistory,
    prepTables,
    setupComplete,
    encounterDifficulty,
  ]);

  const resetHunt = useCallback(() => {
    hydrationPendingRef.current = false;
    setSelectedMonsters([]);
    setSelectedEnvironment(null);
    setSelectedTierIndex(0);
    setSignsRequired(3);
    setTargetProgress({});
    setActiveTrackingTargetKey(null);
    setAreasVisited(0);
    setFlatBonus(0);
    setRollMode("normal");
    setTrackingRollMode("random");
    setManualFindingSignsRoll(null);
    setSurvivalSucceeded(true);
    setHunterCountState(DEFAULT_HUNTER_COUNT);
    setHunterLevels(createDefaultHunterLevels(DEFAULT_HUNTER_COUNT));
    setScoutAmbushSpotNoticed(false);
    setRollHistory([]);
    setPrepTables(createEmptyHuntPrepTables());
    setSetupComplete(false);
    setEncounterDifficulty("normal");
    clearHuntState();
  }, []);

  return {
    monsters,
    environments,
    monstersLoading,
    prepGenerating,
    setupComplete,
    hasBaseSetup,
    encounterDifficulty,
    selectedMonsters,
    selectedEnvironment,
    compatibleEnvironments,
    compatibleMonsters,
    selectedTierIndex,
    signsRequired,
    targetProgress,
    activeTrackingTargetKey,
    areasVisited,
    flatBonus,
    rollMode,
    trackingRollMode,
    manualFindingSignsRoll,
    survivalSucceeded,
    hunterCount,
    hunterLevels,
    averagePartyLevel,
    totalTargetCr,
    combatDifficulty,
    scoutAmbushSpotNoticed,
    rollHistory,
    allMonstersFound,
    selectedTier,
    prepTables,
    setSelectedTierIndex,
    setSignsRequired,
    setFlatBonus,
    setRollMode,
    setTrackingRollMode,
    setManualFindingSignsRoll,
    setSurvivalSucceeded,
    setHunterCount,
    setHunterLevel,
    setActiveTrackingTargetKey,
    setScoutAmbushSpotNoticed,
    setEncounterDifficulty,
    completeSetup,
    regeneratePrepTables,
    addMonster,
    removeMonster,
    pickEnvironment,
    randomize,
    rollTracking,
    rollResource,
    rollEnvironmentNavigation,
    rollEnvironmentEncounter,
    rollEnvironmentWeather,
    rollEnvironmentInvestigation,
    rollScoutStealth,
    rollScoutPerception,
    checkSpotterPerception,
    checkSpotterInvestigation,
    addPrepEntry,
    updatePrepEntry,
    removePrepEntry,
    resetPrepTables,
    rollPrepTable,
    clearHistory,
    resetHunt,
  };
}
