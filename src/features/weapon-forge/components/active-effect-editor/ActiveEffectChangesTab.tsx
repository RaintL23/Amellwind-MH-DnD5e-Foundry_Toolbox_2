import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  EFFECT_MODE_OPTIONS,
  type WeaponEffectChangeDraft,
} from "@/shared/foundry/weapons";
import type { WeaponActivityParams } from "@/shared/foundry/weapons";
import { Plus, Trash2 } from "lucide-react";

interface ActiveEffectChangesTabProps {
  changes: WeaponEffectChangeDraft[];
  params: WeaponActivityParams;
  onChangeParams: (patch: Partial<WeaponActivityParams>) => void;
  updateChange: (index: number, patch: Partial<WeaponEffectChangeDraft>) => void;
  addChange: () => void;
  removeChange: (index: number) => void;
}

export function ActiveEffectChangesTab({
  changes,
  params,
  onChangeParams,
  updateChange,
  addChange,
  removeChange,
}: ActiveEffectChangesTabProps) {
  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Attribute key / mode / value / priority → `changes[]` in JSON.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={addChange}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {changes.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No changes. Passiveivity helpers `acBonus` / `speedBonus` still merge
          in at export when set elsewhere.
        </p>
      ) : (
        <ul className="space-y-2">
          {changes.map((row, index) => (
            <li
              key={`chg-${index}`}
              className="grid gap-2 rounded-md border border-border/50 p-2 sm:grid-cols-[1fr_8rem_6rem_4.5rem_auto]"
            >
              <Input
                value={row.key}
                onChange={(e) =>
                  updateChange(index, { key: e.target.value })
                }
                placeholder="system.attributes.ac.bonus"
                className="h-8 font-mono text-xs"
              />
              <Select
                value={String(row.mode)}
                onChange={(e) =>
                  updateChange(index, {
                    mode: Number.parseInt(e.target.value, 10),
                  })
                }
                className="h-8 text-xs"
              >
                {EFFECT_MODE_OPTIONS.map((opt) => (
                  <option key={opt.mode} value={String(opt.mode)}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <Input
                value={row.value}
                onChange={(e) =>
                  updateChange(index, { value: e.target.value })
                }
                placeholder="+1"
                className="h-8 font-mono text-xs"
              />
              <Input
                value={String(row.priority ?? 20)}
                onChange={(e) =>
                  updateChange(index, {
                    priority:
                      Number.parseInt(e.target.value, 10) || 20,
                  })
                }
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeChange(index)}
                aria-label="Remove change"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-border/40">
        <div className="space-y-1.5">
          <Label htmlFor="ae-ac">Convenience: AC bonus</Label>
          <Input
            id="ae-ac"
            value={params.acBonus ?? ""}
            onChange={(e) =>
              onChangeParams({
                acBonus: e.target.value || undefined,
              })
            }
            placeholder="+1"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ae-speed">Convenience: walk speed bonus</Label>
          <Input
            id="ae-speed"
            value={params.speedBonus ?? ""}
            onChange={(e) =>
              onChangeParams({
                speedBonus: e.target.value || undefined,
              })
            }
            placeholder="+10"
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}
