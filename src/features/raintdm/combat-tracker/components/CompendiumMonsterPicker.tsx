import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Plus, Search } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { NumberStepper } from "@/shared/components/NumberStepper";
import { getAllBestiaryCreatures } from "@/features/dnd/bestiary/services/bestiary.service";
import { getAllMonsters } from "@/features/amellwind/monsters/services/monster.service";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import type { Monster } from "@/shared/types/monster.types";
import { getBaseCr } from "@/shared/utils/cr.utils";
import type { Combatant } from "../utils/combat-tracker.types";
import {
  combatantFromAmellwindMonster,
  combatantFromBestiary,
} from "../mappers/combatant-from-creature.mapper";

export type CompendiumOrigin = "dnd-bestiary" | "amellwind";

interface PickerRow {
  id: string;
  name: string;
  cr: string;
  type: string;
  ac: number;
  hp: number;
  source: string;
  origin: CompendiumOrigin;
  creature: BestiaryCreature | Monster;
}

interface CompendiumMonsterPickerProps {
  existingNames: string[];
  onAdd: (combatants: Combatant[]) => void;
}

const globalFilter: FilterFn<PickerRow> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const r = row.original;
  return (
    r.name.toLowerCase().includes(q) ||
    r.cr.toLowerCase().includes(q) ||
    r.type.toLowerCase().includes(q) ||
    r.source.toLowerCase().includes(q)
  );
};

export function CompendiumMonsterPicker({
  existingNames,
  onAdd,
}: CompendiumMonsterPickerProps) {
  const [origin, setOrigin] = useState<CompendiumOrigin>("dnd-bestiary");
  const [rows, setRows] = useState<PickerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(1);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      if (origin === "dnd-bestiary") {
        const creatures = await getAllBestiaryCreatures();
        if (cancelled) return;
        setRows(
          creatures.map((c) => ({
            id: c.id,
            name: c.name,
            cr: c.crDisplay || getBaseCr(c.cr),
            type: c.type.type,
            ac: c.armorClass?.[0]?.ac ?? 10,
            hp: c.hp?.average ?? 1,
            source: c.source,
            origin: "dnd-bestiary" as const,
            creature: c,
          })),
        );
      } else {
        const monsters = await getAllMonsters();
        if (cancelled) return;
        setRows(
          monsters.map((m) => ({
            id: `${m.source}::${m.name}`,
            name: m.name,
            cr: getBaseCr(m.cr),
            type: m.type.type,
            ac: m.armorClass?.[0]?.ac ?? 10,
            hp: m.hp?.average ?? 1,
            source: m.source,
            origin: "amellwind" as const,
            creature: m,
          })),
        );
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [origin]);

  const addFromRow = useCallback(
    (row: PickerRow) => {
      const names = [...existingNames];
      const created: Combatant[] = [];
      for (let i = 0; i < count; i++) {
        const combatant =
          row.origin === "dnd-bestiary"
            ? combatantFromBestiary(row.creature as BestiaryCreature, names)
            : combatantFromAmellwindMonster(row.creature as Monster, names);
        names.push(combatant.name);
        created.push(combatant);
      }
      setLastAdded(`${row.name} ×${count}`);
      onAdd(created);
    },
    [count, existingNames, onAdd],
  );

  const columns = useMemo<ColumnDef<PickerRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "cr",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="CR" />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.original.cr}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => (
          <span className="text-xs capitalize text-muted-foreground">
            {row.original.type}
          </span>
        ),
      },
      {
        accessorKey: "ac",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="AC" />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums">{row.original.ac}</span>
        ),
      },
      {
        accessorKey: "hp",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="HP" />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums">{row.original.hp}</span>
        ),
      },
      {
        accessorKey: "source",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Source" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.source}
          </span>
        ),
      },
      {
        id: "add",
        enableSorting: false,
        header: () => <span className="sr-only">Add</span>,
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7"
            onClick={(e) => {
              e.stopPropagation();
              addFromRow(row.original);
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        ),
      },
    ],
    [addFromRow],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="compendium-origin">
            Compendium
          </Label>
          <Select
            id="compendium-origin"
            className="h-8 w-48 text-xs"
            value={origin}
            onChange={(e) => setOrigin(e.target.value as CompendiumOrigin)}
          >
            <option value="dnd-bestiary">D&amp;D 5e Bestiary</option>
            <option value="amellwind">Amellwind Monsters</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Quantity</Label>
          <NumberStepper value={count} min={1} max={20} onChange={setCount} />
        </div>
        {lastAdded ? (
          <p className="pb-1 text-xs text-muted-foreground">
            Last added: {lastAdded}
          </p>
        ) : null}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading compendium…
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          pageSize={10}
          globalFilterFn={globalFilter}
          emptyMessage="No creatures found."
          getRowId={(row) => row.id}
          onRowClick={(row) => addFromRow(row)}
          toolbar={({ searchValue, onSearchChange, filteredCount, totalCount }) => (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative min-w-[200px] max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search by name, type, CR…"
                  className="h-8 pl-9 text-sm"
                  aria-label="Search creatures"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Showing {filteredCount} of {totalCount}
              </p>
            </div>
          )}
        />
      )}
    </div>
  );
}
