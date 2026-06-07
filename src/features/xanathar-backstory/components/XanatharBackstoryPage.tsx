import { BookOpen, Dices } from "lucide-react";
import { XGE_SECTIONS, type XgeTable } from "../data/xanathar-tables.data";
import { useXanatharBackstory } from "../context/XanatharBackstoryContext";
import { CharacterSetupBar } from "./CharacterSetupBar";
import { BackstorySection } from "./BackstorySection";
import { BackstorySummary } from "./BackstorySummary";

function getVisibleTables(
  section: ReturnType<(typeof XGE_SECTIONS)[number]["tables"]["filter"]>,
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

export function XanatharBackstoryPage() {
  const {
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
  } = useXanatharBackstory();

  return (
    <div className="flex flex-col h-full min-h-0">
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

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
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

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
            <div className="flex flex-col gap-4">
              {XGE_SECTIONS.map((section, idx) => {
                const visibleTables = getVisibleTables(
                  section.tables,
                  selectedRace,
                  selectedBackground,
                  selectedClass,
                );
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

            <div className="xl:sticky xl:top-4">
              <BackstorySummary results={results} onReset={handleReset} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
