import { memo, useCallback } from "react";
import type { WeaponRarityRow } from "@/shared/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  RESOURCE_COLUMN_PRESETS,
  type WeaponForgeFormValues,
} from "../types/weapon-forge.types";
import {
  getResourceColumnNames,
  setResourceColumnNames,
} from "../utils/weapon-forge-features.utils";

interface WeaponResourcesEditorProps {
  rows: WeaponRarityRow[];
  resourceColumns: string[];
  onChangeRows: (rows: WeaponRarityRow[]) => void;
  onChangeResourceColumns: (
    columns: WeaponForgeFormValues["resourceColumns"],
  ) => void;
}

export const WeaponResourcesEditor = memo(function WeaponResourcesEditor({
  rows,
  resourceColumns,
  onChangeRows,
  onChangeResourceColumns,
}: WeaponResourcesEditorProps) {
  const addResourceColumn = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed || resourceColumns.includes(trimmed)) return;
      onChangeResourceColumns([...resourceColumns, trimmed]);
      onChangeRows(
        rows.map((row) => ({
          ...row,
          columns: {
            ...row.columns,
            [trimmed]: getResourceColumnNames(row, trimmed),
          },
        })),
      );
    },
    [resourceColumns, rows, onChangeResourceColumns, onChangeRows],
  );

  const removeResourceColumn = useCallback(
    (label: string) => {
      onChangeResourceColumns(resourceColumns.filter((c) => c !== label));
      onChangeRows(
        rows.map((row) => {
          const columns = { ...row.columns };
          delete columns[label];
          return { ...row, columns };
        }),
      );
    },
    [resourceColumns, rows, onChangeResourceColumns, onChangeRows],
  );

  const updateResourceItems = useCallback(
    (rowIndex: number, columnLabel: string, raw: string) => {
      const names = raw
        .split(/,\s*/)
        .map((n) => n.trim())
        .filter(Boolean);
      onChangeRows(
        rows.map((row, i) =>
          i === rowIndex
            ? setResourceColumnNames(row, columnLabel, names)
            : row,
        ),
      );
    },
    [rows, onChangeRows],
  );

  const unusedPresets = RESOURCE_COLUMN_PRESETS.filter(
    (preset) => !resourceColumns.includes(preset),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Label className="text-sm font-medium">Weapon resources</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unlocks per rarity for phials, coatings, ammo, notes, or other
            resource columns (separate from combat features).
          </p>
        </div>
        {unusedPresets.length > 0 && (
          <Select
            className="h-8 w-[180px]"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) addResourceColumn(e.target.value);
            }}
          >
            <option value="" disabled>
              Add resource type…
            </option>
            {unusedPresets.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </Select>
        )}
      </div>

      {resourceColumns.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2 rounded-md border border-dashed border-border/70 px-3">
          No resource columns yet. Add Phials, Coatings, Ammo, or Notes if this
          weapon unlocks consumables or ammo types by rarity.
        </p>
      ) : (
        <div className="space-y-4">
          {resourceColumns.map((columnLabel) => (
            <div
              key={columnLabel}
              className="rounded-md border border-border bg-card/30 p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium">{columnLabel}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeResourceColumn(columnLabel)}
                  title={`Remove ${columnLabel} column`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-2">
                {rows.map((row, index) => {
                  const items = getResourceColumnNames(row, columnLabel);
                  return (
                    <div
                      key={`${columnLabel}-${row.rarity}-${index}`}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">
                        {row.rarity}
                      </span>
                      <Input
                        value={items.join(", ")}
                        onChange={(e) =>
                          updateResourceItems(index, columnLabel, e.target.value)
                        }
                        placeholder="comma-separated unlocks"
                        className="h-8 flex-1 min-w-[200px]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => {
              const custom = window.prompt(
                "Custom resource column name (e.g. Available):",
              );
              if (custom?.trim()) addResourceColumn(custom.trim());
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Custom column
          </Button>
        </div>
      )}
    </div>
  );
});
