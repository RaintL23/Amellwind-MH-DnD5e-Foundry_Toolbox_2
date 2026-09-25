import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePlayCharacter } from "../hooks/usePlayCharacter";
import { useSheetRoller } from "../hooks/useSheetRoller";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { ActionsPanel } from "./ActionsPanel";
import { SpellsPanel } from "./SpellsPanel";
import { FeaturesPanel } from "./FeaturesPanel";
import { InventoryPanel } from "./InventoryPanel";
import { SheetStatsPanel } from "./SheetStatsPanel";
import { SheetHeaderBar } from "./SheetHeaderBar";
import { SheetNav, buildSheetTabs, type SheetTabId } from "./SheetNav";
import { HpSheet } from "./HpSheet";
import { RestSheet } from "./RestSheet";
import { StatusSheet } from "./StatusPanel";
import { HitDicePanel, ResourcesPanel } from "./ResourcesPanel";
import { RollLogPanel } from "./RollLogPanel";
import { getEffectiveArmorClass } from "../utils/effective-armor-class";
import { setLinkedSheetId } from "../utils/linked-sheet.storage";

export function CharacterSheetPage() {
  const { characterId } = useParams<{ characterId: string }>();
  const {
    record,
    loading,
    error,
    dispatch,
    locks,
    rolls,
    addRoll,
    clearRolls,
  } = usePlayCharacter(characterId);
  const { rollD20Test, logRoll, rollModeDialog } = useSheetRoller(addRoll);
  const { confirm, confirmDialog } = useConfirmDialog();
  const [tab, setTab] = useState<SheetTabId>("actions");
  const [hpOpen, setHpOpen] = useState(false);
  const [restKind, setRestKind] = useState<"short" | "long" | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const isLg = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    if (characterId) setLinkedSheetId(characterId);
  }, [characterId]);

  useEffect(() => {
    if (isXl && (tab === "stats" || tab === "rolls")) setTab("actions");
    else if (isLg && !isXl && tab === "stats") setTab("actions");
  }, [isLg, isXl, tab]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading sheet…</div>
    );
  }
  if (error || !record || !locks) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-destructive">{error ?? "Not found"}</p>
        <Link
          to="/sheet"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input px-4 text-sm hover:bg-accent"
        >
          Back to roster
        </Link>
      </div>
    );
  }

  const { compiled, session } = record;
  const effectiveAc = getEffectiveArmorClass(compiled, session);
  const hasSpells = Boolean(compiled.spellcasting);
  const tabs = buildSheetTabs(hasSpells);

  const onRollInit = () => {
    void rollD20Test({
      label: "Initiative",
      modifier: compiled.initiativeMod,
      kind: "init",
      locks,
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col md:min-h-0">
      {rollModeDialog}
      {confirmDialog}

      <SheetHeaderBar
        compiled={compiled}
        session={session}
        locks={locks}
        effectiveAc={effectiveAc}
        dispatch={dispatch}
        onOpenHp={() => setHpOpen(true)}
        onRest={(kind) => setRestKind(kind)}
        onRollInit={onRollInit}
        onOpenStatus={() => setStatusOpen(true)}
      />

      <SheetNav
        tabs={tabs}
        tab={tab}
        onTabChange={setTab}
        hideStats={isLg}
        hideRolls={isXl}
        variant="top"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-3 pb-24 lg:pb-4">
        <aside className="hidden w-72 shrink-0 space-y-4 overflow-y-auto lg:block">
          <SheetStatsPanel
            compiled={compiled}
            session={session}
            locks={locks}
            dispatch={dispatch}
            rollD20Test={rollD20Test}
            compact
          />
        </aside>

        <main className="min-w-0 flex-1">
          {tab === "actions" && (
            <ActionsPanel
              compiled={compiled}
              session={session}
              locks={locks}
              dispatch={dispatch}
              rollD20Test={rollD20Test}
              logRoll={logRoll}
              confirm={confirm}
              onOpenTab={(t) => setTab(t)}
            />
          )}
          {tab === "spells" && hasSpells && (
            <SpellsPanel
              compiled={compiled}
              session={session}
              locks={locks}
              dispatch={dispatch}
              rollD20Test={rollD20Test}
              logRoll={logRoll}
              confirm={confirm}
            />
          )}
          {tab === "features" && (
            <FeaturesPanel
              compiled={compiled}
              session={session}
              dispatch={dispatch}
            />
          )}
          {tab === "inventory" && (
            <InventoryPanel
              compiled={compiled}
              session={session}
              dispatch={dispatch}
              confirm={confirm}
              logRoll={logRoll}
            />
          )}
          {tab === "stats" && (
            <div className="lg:hidden">
              <SheetStatsPanel
                compiled={compiled}
                session={session}
                locks={locks}
                dispatch={dispatch}
                rollD20Test={rollD20Test}
                showResources
              />
            </div>
          )}
          {tab === "rolls" && (
            <div className="xl:hidden">
              <RollLogPanel rolls={rolls} onClear={clearRolls} />
            </div>
          )}
        </main>

        <aside className="hidden w-72 shrink-0 space-y-6 overflow-y-auto xl:block">
          <ResourcesPanel
            compiled={compiled}
            session={session}
            dispatch={dispatch}
          />
          <HitDicePanel
            compiled={compiled}
            session={session}
            dispatch={dispatch}
          />
          <RollLogPanel
            rolls={rolls}
            onClear={clearRolls}
            maxHeightClass="max-h-[40vh]"
          />
        </aside>
      </div>

      <SheetNav
        tabs={tabs}
        tab={tab}
        onTabChange={setTab}
        hideStats={false}
        hideRolls={false}
        variant="bottom"
      />

      <HpSheet
        open={hpOpen}
        onOpenChange={setHpOpen}
        session={session}
        locks={locks}
        dispatch={dispatch}
        rollD20Test={rollD20Test}
      />

      <RestSheet
        restKind={restKind}
        onOpenChange={(open) => {
          if (!open) setRestKind(null);
        }}
        compiled={compiled}
        session={session}
        dispatch={dispatch}
        logRoll={logRoll}
      />

      <StatusSheet
        open={statusOpen}
        onOpenChange={setStatusOpen}
        session={session}
        edition={compiled.rulesEdition}
        dispatch={dispatch}
        confirm={confirm}
      />
    </div>
  );
}
