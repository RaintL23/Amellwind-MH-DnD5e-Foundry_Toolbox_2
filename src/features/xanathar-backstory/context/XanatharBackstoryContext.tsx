import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { XGE_SECTIONS, TABLE_BY_ID } from "../data/xanathar-tables.data";
import {
  rollOnTable,
  selectRowOnTable,
  extractLifestyleModifier,
  type RollContext,
  type RollResult,
} from "../utils/xanathar-roll.utils";
import {
  cascadeDependents,
  getCascadeLockState,
} from "../utils/xanathar-cascade.utils";
import { formatBackstorySummaryText } from "../utils/xanathar-summary-text.utils";
import {
  DEFAULT_XANATHAR_BACKSTORY_STATE,
  loadXanatharBackstoryState,
  persistXanatharBackstoryState,
} from "../storage/xanathar-backstory.storage";

function applyTableResult(
  next: Record<string, RollResult>,
  tableId: string,
  result: RollResult,
  buildContext: (results: Record<string, RollResult>) => RollContext,
): Record<string, RollResult> {
  next[tableId] = result;
  cascadeDependents(next, tableId, buildContext(next));
  return next;
}

interface XanatharBackstoryContextValue {
  selectedRace: string;
  selectedBackground: string;
  selectedClass: string;
  charismaModifier: number;
  results: Record<string, RollResult>;
  rollLockedIds: Set<string>;
  selectLockedIds: Set<string>;
  lockReasons: Record<string, string>;
  setSelectedRace: (value: string) => void;
  setSelectedBackground: (value: string) => void;
  setSelectedClass: (value: string) => void;
  setCharismaModifier: (value: number) => void;
  handleRoll: (tableId: string) => void;
  handleSelect: (tableId: string, rowIndex: number) => void;
  handleRollAll: () => void;
  handleReset: () => void;
  getSummaryText: () => string;
}

const XanatharBackstoryContext =
  createContext<XanatharBackstoryContextValue | null>(null);

export function XanatharBackstoryProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [selectedRace, setSelectedRace] = useState(
    () => loadXanatharBackstoryState().selectedRace,
  );
  const [selectedBackground, setSelectedBackground] = useState(
    () => loadXanatharBackstoryState().selectedBackground,
  );
  const [selectedClass, setSelectedClass] = useState(
    () => loadXanatharBackstoryState().selectedClass,
  );
  const [charismaModifier, setCharismaModifier] = useState(
    () => loadXanatharBackstoryState().charismaModifier,
  );
  const [results, setResults] = useState<Record<string, RollResult>>(
    () => loadXanatharBackstoryState().results,
  );

  useEffect(() => {
    persistXanatharBackstoryState({
      selectedRace,
      selectedBackground,
      selectedClass,
      charismaModifier,
      results,
    });
  }, [
    selectedRace,
    selectedBackground,
    selectedClass,
    charismaModifier,
    results,
  ]);

  const buildContext = useCallback(
    (currentResults: Record<string, RollResult>): RollContext => {
      const lifestyleResult = currentResults["family-lifestyle"];
      return {
        charismaModifier,
        lifestyleModifier: lifestyleResult
          ? extractLifestyleModifier(lifestyleResult.result)
          : 0,
        isDwarfOrElf: selectedRace === "Dwarf" || selectedRace === "Elf",
      };
    },
    [charismaModifier, selectedRace],
  );

  const handleRoll = useCallback(
    (tableId: string) => {
      const table = TABLE_BY_ID[tableId];
      if (!table) return;

      setResults((prev) => {
        const ctx = buildContext(prev);
        const result = rollOnTable(table, ctx);
        const next = { ...prev };
        return applyTableResult(next, tableId, result, buildContext);
      });
    },
    [buildContext],
  );

  const handleSelect = useCallback(
    (tableId: string, rowIndex: number) => {
      const table = TABLE_BY_ID[tableId];
      if (!table) return;

      setResults((prev) => {
        const result = selectRowOnTable(table, rowIndex);
        const next = { ...prev };
        return applyTableResult(next, tableId, result, buildContext);
      });
    },
    [buildContext],
  );

  const handleRollAll = useCallback(() => {
    setResults((prev) => {
      let next = { ...prev };

      const rollAndCascade = (tableId: string) => {
        const table = TABLE_BY_ID[tableId];
        if (!table) return;
        next[tableId] = rollOnTable(table, buildContext(next));
        cascadeDependents(next, tableId, buildContext(next));
      };

      for (const id of [
        "parents",
        "birthplace",
        "siblings-count",
        "family",
        "family-lifestyle",
        "childhood-memories",
      ]) {
        rollAndCascade(id);
      }

      const raceTableMap: Record<string, string> = {
        "Half-Elf": "parents-half-elf",
        "Half-Orc": "parents-half-orc",
        Tiefling: "parents-tiefling",
      };
      const raceTableId = raceTableMap[selectedRace];
      if (raceTableId) rollAndCascade(raceTableId);

      if (selectedBackground) {
        const bgTable = XGE_SECTIONS[1].tables.find(
          (t) =>
            t.filterType === "background" &&
            t.filterValue === selectedBackground,
        );
        if (bgTable) rollAndCascade(bgTable.id);
      }

      if (selectedClass) {
        const clsTable = XGE_SECTIONS[1].tables.find(
          (t) => t.filterType === "class" && t.filterValue === selectedClass,
        );
        if (clsTable) rollAndCascade(clsTable.id);
      }

      rollAndCascade("life-events-by-age");

      return next;
    });
  }, [buildContext, selectedBackground, selectedClass, selectedRace]);

  const handleReset = useCallback(() => {
    setResults({});
  }, []);

  const getSummaryText = useCallback(
    () => formatBackstorySummaryText(results),
    [results],
  );

  const { rollLockedIds, selectLockedIds, reasons: lockReasons } =
    getCascadeLockState(results);

  const value = useMemo(
    () => ({
      selectedRace,
      selectedBackground,
      selectedClass,
      charismaModifier,
      results,
      rollLockedIds,
      selectLockedIds,
      lockReasons,
      setSelectedRace,
      setSelectedBackground,
      setSelectedClass,
      setCharismaModifier,
      handleRoll,
      handleSelect,
      handleRollAll,
      handleReset,
      getSummaryText,
    }),
    [
      selectedRace,
      selectedBackground,
      selectedClass,
      charismaModifier,
      results,
      rollLockedIds,
      selectLockedIds,
      lockReasons,
      handleRoll,
      handleSelect,
      handleRollAll,
      handleReset,
      getSummaryText,
    ],
  );

  return (
    <XanatharBackstoryContext.Provider value={value}>
      {children}
    </XanatharBackstoryContext.Provider>
  );
}

export function useXanatharBackstory(): XanatharBackstoryContextValue {
  const ctx = useContext(XanatharBackstoryContext);
  if (!ctx) {
    throw new Error(
      "useXanatharBackstory must be used inside XanatharBackstoryProvider",
    );
  }
  return ctx;
}

export { DEFAULT_XANATHAR_BACKSTORY_STATE };
