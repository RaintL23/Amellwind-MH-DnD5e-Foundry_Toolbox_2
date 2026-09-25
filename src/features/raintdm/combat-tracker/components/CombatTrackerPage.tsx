import { useCallback, useEffect, useMemo, useState } from "react";
import { Swords } from "lucide-react";
import { toast } from "sonner";
import { useCombatTracker } from "../hooks/useCombatTracker";
import type { Combatant } from "../utils/combat-tracker.types";
import { AddCombatantDialog } from "./AddCombatantDialog";
import { CombatantList } from "./CombatantList";
import { CombatToolbar } from "./CombatToolbar";
import { HpAdjustDialog } from "./HpAdjustDialog";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export function CombatTrackerPage() {
  const {
    state,
    addCombatants,
    removeCombatant,
    setInitiative,
    rollInitiative,
    rollOneInitiative,
    startCombat,
    nextTurn,
    prevTurn,
    applyHp,
    setDeathSaves,
    rollDeathSave,
    endCombat,
  } = useCombatTracker();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [hpTargetIds, setHpTargetIds] = useState<string[] | null>(null);
  /** During combat, initiative is locked unless the GM unlocks editing. */
  const [initiativeUnlocked, setInitiativeUnlocked] = useState(false);

  const initiativeEditable = !state.started || initiativeUnlocked;

  const activeName = useMemo(() => {
    if (!state.activeId) return null;
    return state.combatants.find((c) => c.id === state.activeId)?.name ?? null;
  }, [state.activeId, state.combatants]);

  const hpTargets = useMemo(() => {
    if (!hpTargetIds) return [];
    return state.combatants.filter((c) => hpTargetIds.includes(c.id));
  }, [hpTargetIds, state.combatants]);

  const existingNames = useMemo(
    () => state.combatants.map((c) => c.name),
    [state.combatants],
  );

  const handleAdd = useCallback(
    (combatants: Combatant[]) => {
      addCombatants(combatants);
      toast.success(
        combatants.length === 1
          ? `Added ${combatants[0].name}`
          : `Added ${combatants.length} combatants`,
      );
    },
    [addCombatants],
  );

  const handleRemove = useCallback(
    (id: string) => {
      const name = state.combatants.find((c) => c.id === id)?.name;
      removeCombatant(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.message(name ? `Removed ${name}` : "Removed combatant");
    },
    [removeCombatant, state.combatants],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (addOpen || hpTargetIds) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        if (e.shiftKey) prevTurn();
        else if (state.started) nextTurn();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addOpen, hpTargetIds, nextTurn, prevTurn, state.started]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-start gap-3">
          <Swords className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Combat Tracker
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Track initiative, HP, and death saves for your table. Pull
              monsters from the D&amp;D bestiary or Amellwind compendium, apply
              multi-target damage, and advance turns with round tracking.
            </p>
          </div>
        </div>
      </div>

      <CombatToolbar
        state={state}
        activeName={activeName}
        selectedCount={selectedIds.size}
        initiativeEditable={initiativeUnlocked}
        onStart={() => {
          setInitiativeUnlocked(false);
          startCombat();
        }}
        onNext={nextTurn}
        onPrev={prevTurn}
        onRollInitiative={(scope) => {
          rollInitiative(scope);
          toast.success(
            scope === "all"
              ? "Rolled initiative for everyone"
              : "Rolled initiative for NPCs",
          );
        }}
        onToggleInitiativeEdit={() =>
          setInitiativeUnlocked((prev) => !prev)
        }
        onAdd={() => setAddOpen(true)}
        onEnd={() => {
          endCombat();
          setSelectedIds(new Set());
          setInitiativeUnlocked(false);
          toast.message("Combat ended");
        }}
        onApplyHpSelected={() =>
          setHpTargetIds(Array.from(selectedIds))
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-24 sm:px-6 sm:pb-6">
        <div className="mx-auto max-w-4xl">
          <CombatantList
            combatants={state.combatants}
            activeId={state.activeId}
            selectedIds={selectedIds}
            initiativeEditable={initiativeEditable}
            onToggleSelect={(id, selected) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (selected) next.add(id);
                else next.delete(id);
                return next;
              });
            }}
            onSelectAll={(selected) => {
              setSelectedIds(
                selected
                  ? new Set(state.combatants.map((c) => c.id))
                  : new Set(),
              );
            }}
            onInitiativeChange={setInitiative}
            onRollInitiative={rollOneInitiative}
            onOpenHp={(ids) => setHpTargetIds(ids)}
            onRemove={handleRemove}
            onDeathSaveCount={setDeathSaves}
            onRollDeathSave={rollDeathSave}
          />
        </div>
      </div>

      <AddCombatantDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        existingNames={existingNames}
        onAdd={handleAdd}
      />

      <HpAdjustDialog
        open={hpTargetIds != null && hpTargets.length > 0}
        onOpenChange={(open) => {
          if (!open) setHpTargetIds(null);
        }}
        targets={hpTargets}
        onApply={(ids, delta, opts) => {
          applyHp(ids, delta, opts);
          setSelectedIds(new Set());
          const label =
            delta === 0
              ? "Updated temp HP"
              : delta > 0
                ? `Healed ${delta}`
                : `Dealt ${-delta} damage`;
          toast.success(
            ids.length > 1 ? `${label} to ${ids.length} targets` : label,
          );
        }}
      />
    </div>
  );
}
