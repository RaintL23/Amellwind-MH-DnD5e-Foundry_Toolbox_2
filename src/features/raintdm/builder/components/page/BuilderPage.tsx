import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
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
import {
  BuilderMobileTabBar,
  builderMobileTabPanelId,
} from "./BuilderMobileTabBar";
import { HomebrewModeToggle } from "../shared/HomebrewModeToggle";
import { BuildCompletenessProvider } from "../../context/BuildCompletenessContext";
import { BuilderSlotSelectionProvider } from "../../context/BuilderSlotSelectionContext";
import {
  BuilderLayoutProvider,
  useBuilderLayout,
  type BuilderMobileTab,
} from "../../context/BuilderLayoutContext";
import { useBuilderSlotSelection } from "../../hooks/useBuilderSlotSelection";
import { RpgbotRatingsProvider } from "../../context/RpgbotRatingsContext";
import { XanatharBackstoryProvider } from "@/features/dnd/xanathar-backstory/context/XanatharBackstoryContext";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { BuilderGrantSync } from "../BuilderGrantSync";

export function BuilderPage() {
  return (
    <BuilderLayoutProvider>
      <BuilderSlotSelectionProvider>
        <BuildCompletenessProvider>
          <RpgbotRatingsProvider>
            <XanatharBackstoryProvider>
              <BuilderPageContent />
            </XanatharBackstoryProvider>
          </RpgbotRatingsProvider>
        </BuildCompletenessProvider>
      </BuilderSlotSelectionProvider>
    </BuilderLayoutProvider>
  );
}

function BuilderPageContent() {
  const { isMobileLayout } = useBuilderLayout();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <BuilderGrantSync />
      <BuilderHeader />
      {isMobileLayout ? <BuilderMobileLayout /> : <BuilderDesktopLayout />}
    </div>
  );
}

function BuilderHeader() {
  return (
    <div className="shrink-0 border-b border-border bg-card/50 px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
      <div className="flex items-center justify-between gap-2 sm:items-start sm:gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-foreground sm:text-lg lg:text-xl">
            Character Builder
          </h1>
          <p className="mt-0.5 hidden text-xs text-muted-foreground md:block lg:text-sm">
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
  );
}

// ─── Desktop (lg+): independently scrolling columns ───

function BuilderDesktopLayout() {
  const isWide = useMediaQuery("(min-width: 1280px)");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col overflow-hidden rounded-lg bg-muted/20 2xl:max-w-[1760px]">
        <BuilderProgressBar />

        <div className="grid min-h-0 w-full flex-1 grid-cols-[300px_minmax(0,1fr)] gap-3 p-3 xl:grid-cols-[280px_minmax(0,1fr)_260px] 2xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          {isWide ? (
            <>
              <ScrollColumn>
                <CharacterPanels />
                <ProficiencyCheckPanels />
              </ScrollColumn>
              <ScrollColumn>
                <BuilderCenterPanel />
              </ScrollColumn>
              <ScrollColumn>
                <GearPanels />
                <ProficiencyListPanels />
              </ScrollColumn>
            </>
          ) : (
            <>
              <ScrollColumn>
                <StatsPanel />
                <BuilderDerivedPanel />
                <BuilderImagePanel />
                <ProficiencyCheckPanels />
                <BuilderInventoryPanel />
                <ProficiencyListPanels />
              </ScrollColumn>
              <ScrollColumn>
                <BuilderCenterPanel />
              </ScrollColumn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ScrollColumn({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-2.5 overflow-y-auto overscroll-contain pb-2 pr-1 [scrollbar-gutter:stable] [&>*]:shrink-0">
      {children}
    </div>
  );
}

// ─── Mobile (< lg): one tab at a time + bottom tab bar ───

function BuilderMobileLayout() {
  const { activeTab, setActiveTab } = useBuilderLayout();
  const { selectedSlot } = useBuilderSlotSelection();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Slot editors live in the Build tab (bottom sheet), so selecting a slot reveals it.
  useEffect(() => {
    if (selectedSlot) setActiveTab("build");
  }, [selectedSlot, setActiveTab]);

  // Layout effect: reset before deep-link scrolls queued via requestAnimationFrame.
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  return (
    <>
      <BuilderProgressBar />
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20 p-2 sm:p-3"
      >
        {/* All tabs stay mounted (like desktop) so local panel state survives tab switches. */}
        <MobileTabPanel tab="build" activeTab={activeTab}>
          <BuilderCenterPanel />
        </MobileTabPanel>
        <MobileTabPanel tab="character" activeTab={activeTab}>
          <CharacterPanels />
        </MobileTabPanel>
        <MobileTabPanel tab="proficiencies" activeTab={activeTab}>
          <ProficiencyCheckPanels />
          <ProficiencyListPanels />
        </MobileTabPanel>
        <MobileTabPanel tab="gear" activeTab={activeTab}>
          <GearPanels />
        </MobileTabPanel>
      </div>
      <BuilderMobileTabBar />
    </>
  );
}

function MobileTabPanel({
  tab,
  activeTab,
  children,
}: Readonly<{
  tab: BuilderMobileTab;
  activeTab: BuilderMobileTab;
  children: ReactNode;
}>) {
  return (
    <div
      id={builderMobileTabPanelId(tab)}
      role="tabpanel"
      aria-labelledby={`builder-tab-${tab}`}
      hidden={tab !== activeTab}
      className="mx-auto w-full max-w-3xl flex-col gap-2.5 [&:not([hidden])]:flex"
    >
      {children}
    </div>
  );
}

// ─── Panel groups shared by both layouts ───

function CharacterPanels() {
  return (
    <>
      <StatsPanel />
      <BuilderImagePanel />
    </>
  );
}

function ProficiencyCheckPanels() {
  return (
    <>
      <BuilderSavingThrowsPanel />
      <BuilderSkillChecksPanel />
    </>
  );
}

function ProficiencyListPanels() {
  return (
    <>
      <BuilderOtherProficienciesPanel />
      <BuilderLanguagesPanel />
      <BuilderDefensesPanel />
    </>
  );
}

function GearPanels() {
  return (
    <>
      <BuilderDerivedPanel />
      <BuilderInventoryPanel />
    </>
  );
}
