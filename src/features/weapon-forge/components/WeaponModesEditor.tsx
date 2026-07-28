import { Plus, Trash2 } from "lucide-react";
import type { WeaponModeDef } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WeaponModesEditorProps {
  modes: WeaponModeDef[];
  onChange: (modes: WeaponModeDef[]) => void;
}

function emptyMode(index: number): WeaponModeDef {
  return {
    label: index === 0 ? "Mode A" : index === 1 ? "Mode B" : `Mode ${index + 1}`,
    damage: "1d8",
    hasShield: false,
    isTwoHanded: false,
    blocksOffHand: false,
  };
}

export function WeaponModesEditor({ modes, onChange }: WeaponModesEditorProps) {
  const patchMode = (index: number, patch: Partial<WeaponModeDef>) => {
    onChange(
      modes.map((mode, i) => (i === index ? { ...mode, ...patch } : mode)),
    );
  };

  const addMode = () => {
    onChange([...modes, emptyMode(modes.length)]);
  };

  const removeMode = (index: number) => {
    if (modes.length <= 2) return;
    onChange(modes.filter((_, i) => i !== index));
  };

  return (
    <div className="sm:col-span-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label>Weapon modes</Label>
          <p className="text-[11px] text-muted-foreground">
            Switch stances (e.g. Switch Axe Axe/Sword). Not the same as Versatile
            (V).
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addMode}>
          <Plus className="h-3.5 w-3.5" />
          Add mode
        </Button>
      </div>

      <div className="space-y-3">
        {modes.map((mode, index) => (
          <div
            key={`mode-${index}`}
            className="rounded-md border border-border/60 bg-muted/10 p-3 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                Mode {index + 1}
                {index === 0 ? " (primary)" : ""}
              </p>
              {modes.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:text-destructive"
                  onClick={() => removeMode(index)}
                  aria-label={`Remove mode ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`wf-mode-label-${index}`}>Label</Label>
                <Input
                  id={`wf-mode-label-${index}`}
                  value={mode.label}
                  onChange={(e) => patchMode(index, { label: e.target.value })}
                  placeholder="e.g. Axe"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`wf-mode-dmg-${index}`}>Damage die</Label>
                <Input
                  id={`wf-mode-dmg-${index}`}
                  value={mode.damage}
                  onChange={(e) => patchMode(index, { damage: e.target.value })}
                  placeholder="1d10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={mode.isTwoHanded === true}
                  onCheckedChange={(checked) =>
                    patchMode(index, { isTwoHanded: checked === true })
                  }
                />
                <span className="font-normal">Two-handed</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={mode.blocksOffHand === true}
                  onCheckedChange={(checked) =>
                    patchMode(index, { blocksOffHand: checked === true })
                  }
                />
                <span className="font-normal">Blocks off-hand</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={mode.hasShield === true}
                  onCheckedChange={(checked) =>
                    patchMode(index, { hasShield: checked === true })
                  }
                />
                <span className="font-normal">Integrated shield</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
