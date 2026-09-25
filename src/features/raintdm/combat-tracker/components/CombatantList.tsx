import { useMemo } from "react";
import type { Combatant } from "../utils/combat-tracker.types";
import { sortByInitiative } from "../utils/initiative.utils";
import { CombatantRow } from "./CombatantRow";

interface CombatantListProps {
  combatants: Combatant[];
  activeId: string | null;
  selectedIds: Set<string>;
  initiativeEditable: boolean;
  onToggleSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onInitiativeChange: (id: string, value: number | null) => void;
  onRollInitiative: (id: string) => void;
  onOpenHp: (ids: string[]) => void;
  onRemove: (id: string) => void;
  onDeathSaveCount: (
    id: string,
    side: "successes" | "failures",
    count: number,
  ) => void;
  onRollDeathSave: (id: string) => void;
}

export function CombatantList({
  combatants,
  activeId,
  selectedIds,
  initiativeEditable,
  onToggleSelect,
  onSelectAll,
  onInitiativeChange,
  onRollInitiative,
  onOpenHp,
  onRemove,
  onDeathSaveCount,
  onRollDeathSave,
}: CombatantListProps) {
  const ordered = useMemo(() => sortByInitiative(combatants), [combatants]);

  if (ordered.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No combatants yet. Add PCs, custom NPCs, or monsters from the
        compendium to start building the encounter.
      </p>
    );
  }

  const allSelected =
    ordered.length > 0 && ordered.every((c) => selectedIds.has(c.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-primary"
            checked={allSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
          />
          Select all ({ordered.length})
        </label>
        <span className="ml-auto hidden sm:inline">Init · Name · AC · HP</span>
      </div>
      <ul className="space-y-2">
        {ordered.map((c) => (
          <li key={c.id}>
            <CombatantRow
              combatant={c}
              isActive={c.id === activeId}
              selected={selectedIds.has(c.id)}
              initiativeEditable={initiativeEditable}
              onSelectChange={(selected) => onToggleSelect(c.id, selected)}
              onInitiativeChange={(value) => onInitiativeChange(c.id, value)}
              onRollInitiative={() => onRollInitiative(c.id)}
              onOpenHp={() => onOpenHp([c.id])}
              onRemove={() => onRemove(c.id)}
              onDeathSaveCount={(side, count) =>
                onDeathSaveCount(c.id, side, count)
              }
              onRollDeathSave={() => onRollDeathSave(c.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
