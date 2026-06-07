import { useState, useCallback } from "react";
import { BookOpen, Dices } from "lucide-react";
import {
  XGE_SECTIONS,
  TABLE_BY_ID,
  type XgeTable,
} from "../data/xanathar-tables.data";
import {
  rollOnTable,
  selectRowOnTable,
  extractLifestyleModifier,
  type RollResult,
  type RollContext,
} from "../utils/xanathar-roll.utils";
import {
  cascadeDependents,
  getCascadeLockState,
} from "../utils/xanathar-cascade.utils";
import { CharacterSetupBar } from "./CharacterSetupBar";
import { BackstorySection } from "./BackstorySection";
import { BackstorySummary } from "./BackstorySummary";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the set of currently visible tables given the character setup */
function getVisibleTables(
  section: ReturnType<typeof XGE_SECTIONS[number]["tables"]["filter"]>,
  selectedRace: string,
  selectedBackground: string,
  selectedClass: string,
): XgeTable[] {
  return section.filter((table) => {
    if (!table.filterType) return true;
    if (table.filterType === "race") return table.filterValue === selectedRace;
    if (table.filterType === "background") {
      if (!selectedBackground) return false;
      return table.filterValue === selectedBackground;
    }
    if (table.filterType === "class") {
      if (!selectedClass) return false;
      return table.filterValue === selectedClass;
    }
    return true;
  });
}

/** Apply a table result and cascade dependent rolls in hierarchical order. */
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function XanatharBackstoryPage() {
  // Character setup
  const [selectedRace, setSelectedRace] = useState("Human");
  const [selectedBackground, setSelectedBackground] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [charismaModifier, setCharismaModifier] = useState(0);

  // Roll results keyed by table id
  const [results, setResults] = useState<Record<string, RollResult>>({});

  // ---------------------------------------------------------------------------
  // Roll context
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Single table roll
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Roll All
  // ---------------------------------------------------------------------------

  const handleRollAll = useCallback(() => {
    setResults((prev) => {
      let next = { ...prev };

      const rollAndCascade = (tableId: string) => {
        const table = TABLE_BY_ID[tableId];
        if (!table) return;
        next[tableId] = rollOnTable(table, buildContext(next));
        cascadeDependents(next, tableId, buildContext(next));
      };

      // Origins — dependents cascade automatically in order
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
          (t) => t.filterType === "background" && t.filterValue === selectedBackground,
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

  // ---------------------------------------------------------------------------
  // Lock logic
  // ---------------------------------------------------------------------------

  const { rollLockedIds, selectLockedIds, reasons: lockReasons } =
    getCascadeLockState(results);

  const handleReset = () => setResults({});

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BookOpen className="h-6 w-6 text-primary shrink-0" />
              <h1 className="text-xl font-bold text-foreground">
                Xanathar Backstory Helper
              </h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Roll on the "This Is Your Life" tables from{" "}
              <em>Xanathar's Guide to Everything</em> to build your character's
              backstory. Set up your character, roll individual tables, or use
              "Roll All" to generate everything at once.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRollAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shrink-0"
          >
            <Dices className="h-4 w-4" />
            Roll All Tables
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Setup bar */}
          <CharacterSetupBar
            selectedRace={selectedRace}
            selectedBackground={selectedBackground}
            selectedClass={selectedClass}
            charismaModifier={charismaModifier}
            onRaceChange={setSelectedRace}
            onBackgroundChange={setSelectedBackground}
            onClassChange={setSelectedClass}
            onCharismaChange={setCharismaModifier}
          />

          {/* Main two-column layout */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
            {/* Left: sections */}
            <div className="flex flex-col gap-4">
              {XGE_SECTIONS.map((section, idx) => {
                const visibleTables = getVisibleTables(
                  section.tables,
                  selectedRace,
                  selectedBackground,
                  selectedClass,
                );
                // Also include dynamic life-event results (life-events-2, life-events-3, …)
                const sectionResults = { ...results };

                return (
                  <BackstorySection
                    key={section.id}
                    section={section}
                    visibleTables={visibleTables}
                    results={sectionResults}
                    onRoll={handleRoll}
                    onSelect={handleSelect}
                    rollLockedIds={rollLockedIds}
                    selectLockedIds={selectLockedIds}
                    lockReasons={lockReasons}
                    allResults={results}
                    defaultOpen={idx === 0}
                  />
                );
              })}
            </div>

            {/* Right: summary */}
            <div className="xl:sticky xl:top-4">
              <BackstorySummary results={results} onReset={handleReset} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
