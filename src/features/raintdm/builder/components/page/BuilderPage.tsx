import { StatsPanel } from "../stats/StatsPanel";
import { BuilderImagePanel } from "../stats/BuilderImagePanel";
import { BuilderCenterPanel } from "../equipment/BuilderCenterPanel";
import { BuilderDerivedPanel } from "../stats/BuilderDerivedPanel";
import { BuilderSavingThrowsPanel } from "../stats/BuilderSavingThrowsPanel";
import { BuilderSkillChecksPanel } from "../stats/BuilderSkillChecksPanel";
import { BuilderOtherProficienciesPanel } from "../stats/BuilderOtherProficienciesPanel";
import { BuilderLanguagesPanel } from "../stats/BuilderLanguagesPanel";
import { BuilderDefensesPanel } from "../stats/BuilderDefensesPanel";
import { BuilderInventoryPanel } from "../stats/BuilderInventoryPanel";
import { CharacterCreationTipsPanel } from "./CharacterCreationTipsPanel";
import { BuilderProgressBar } from "./BuilderProgressBar";
import { HomebrewModeToggle } from "../shared/HomebrewModeToggle";
import { BuildCompletenessProvider } from "../../context/BuildCompletenessContext";
import { BuilderSlotSelectionProvider } from "../../context/BuilderSlotSelectionContext";
import { RpgbotRatingsProvider } from "../../context/RpgbotRatingsContext";
import { XanatharBackstoryProvider } from "@/features/dnd/xanathar-backstory/context/XanatharBackstoryContext";
import { BuilderGrantSync } from "../BuilderGrantSync";

export function BuilderPage() {
  return (
    <BuilderSlotSelectionProvider>
      <BuildCompletenessProvider>
        <RpgbotRatingsProvider>
          <XanatharBackstoryProvider>
            <BuilderPageContent />
          </XanatharBackstoryProvider>
        </RpgbotRatingsProvider>
      </BuildCompletenessProvider>
    </BuilderSlotSelectionProvider>
  );
}

function BuilderPageContent() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <BuilderGrantSync />
      <div className="shrink-0 border-b border-border bg-card/50 px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground lg:text-xl">
              Character Builder
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground lg:text-sm">
              Build your character from species, class, and feats through
              equipment, proficiencies, and derived combat stats.
            </p>
          </div>
          <div className="flex shrink-0 items-stretch gap-2">
            <HomebrewModeToggle />
            <CharacterCreationTipsPanel />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 lg:p-4">
        <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col overflow-y-auto rounded-lg bg-muted/20 p-3 lg:p-4">
          <BuilderProgressBar />

          <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-2.5 lg:gap-3 xl:grid-cols-[280px_minmax(0,1fr)_260px]">
            {/* Left column: identity, ASI, skills */}
            <div className="order-2 flex flex-col gap-2.5 xl:order-1">
              <StatsPanel />
              <BuilderImagePanel />
              <BuilderSavingThrowsPanel />
              <BuilderSkillChecksPanel />
            </div>

            {/* Center: equipment + library */}
            <div className="order-3 xl:order-2">
              <BuilderCenterPanel />
            </div>

            {/* Right: combat stats + inventory (first on mobile) */}
            <div className="order-1 flex flex-col gap-2.5 xl:order-3">
              <BuilderDerivedPanel />
              <BuilderInventoryPanel />
              <BuilderOtherProficienciesPanel />
              <BuilderLanguagesPanel />
              <BuilderDefensesPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
