import { CharacterBuilderProvider } from "../context/CharacterBuilderContext";
import { StatsPanel } from "./StatsPanel";
import { PaperDoll } from "./PaperDoll";
import { BuilderInventoryPanel } from "./BuilderInventoryPanel";
import { CombatResultsPanel } from "./CombatResultsPanel";

export function BuilderPage() {
  return (
    <CharacterBuilderProvider>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="shrink-0 border-b border-border bg-card/50 px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Character Builder (ALPHA)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Equip weapons, armor & runes to test damage output per turn (Work in
            progress, a lot of bugs and missing features)
          </p>
        </div>

        {/* Main content grid */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 max-w-[1200px]">
            {/* Left column: Stats + Combat Results stacked */}
            <div className="space-y-4">
              <StatsPanel />
              <CombatResultsPanel />
            </div>

            {/* Right column: Paper Doll + Inventory (separate cards) */}
            <div className="flex flex-col xl:flex-row gap-4 min-w-0 xl:items-start">
              <PaperDoll />
              <BuilderInventoryPanel />
            </div>
          </div>
        </div>
      </div>
    </CharacterBuilderProvider>
  );
}
