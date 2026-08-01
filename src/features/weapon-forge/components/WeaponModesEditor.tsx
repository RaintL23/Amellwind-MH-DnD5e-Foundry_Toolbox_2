import { Plus, Shield, Trash2 } from "lucide-react";
import { DMG_TYPE_LABELS, type WeaponModeDef } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/shared/utils/cn";

const DMG_OPTIONS = Object.entries(DMG_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface WeaponModesEditorProps {
  modes: WeaponModeDef[];
  defaultDmgType: string;
  onChange: (modes: WeaponModeDef[]) => void;
  onClearModes: () => void;
}

function emptyMode(index: number, dmgType: string): WeaponModeDef {
  return {
    label: index === 0 ? "Mode A" : index === 1 ? "Mode B" : `Mode ${index + 1}`,
    damage: "1d8",
    dmgType,
    hasShield: false,
    isTwoHanded: false,
    blocksOffHand: false,
  };
}

export function WeaponModesEditor({
  modes,
  defaultDmgType,
  onChange,
  onClearModes,
}: WeaponModesEditorProps) {
  const patchMode = (index: number, patch: Partial<WeaponModeDef>) => {
    onChange(
      modes.map((mode, i) => (i === index ? { ...mode, ...patch } : mode)),
    );
  };

  const toggleShield = (index: number, checked: boolean) => {
    patchMode(index, {
      hasShield: checked,
      ...(checked ? { blocksOffHand: true } : {}),
    });
  };

  const addMode = () => {
    onChange([...modes, emptyMode(modes.length, defaultDmgType)]);
  };

  const removeMode = (index: number) => {
    if (modes.length <= 2) return;
    onChange(modes.filter((_, i) => i !== index));
  };

  return (
    <div className="sm:col-span-3 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <Label>Weapon modes</Label>
          <p className="text-[11px] text-muted-foreground">
            Switch stances (e.g. Switch Axe Axe/Sword). Not the same as Versatile
            (V). Damage type and integrated shield can differ per mode.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addMode}>
            <Plus className="h-3.5 w-3.5" />
            Add mode
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClearModes}>
            Remove modes (single damage die)
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map((mode, index) => {
          const withShield = mode.hasShield === true;
          const modeDmgType = mode.dmgType?.trim() || defaultDmgType;
          return (
            <div
              key={`mode-${index}`}
              className={cn(
                "rounded-md border bg-muted/10 p-3 space-y-3",
                withShield
                  ? "border-teal-800/50 bg-teal-950/15"
                  : "border-border/60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Mode {index + 1}
                  {index === 0 ? " (primary)" : ""}
                  {withShield ? " · shield" : ""}
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

              <div className="space-y-1.5">
                <Label htmlFor={`wf-mode-label-${index}`}>Label</Label>
                <Input
                  id={`wf-mode-label-${index}`}
                  value={mode.label}
                  onChange={(e) => patchMode(index, { label: e.target.value })}
                  placeholder="e.g. Axe"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`wf-mode-dmg-${index}`}>Damage die</Label>
                  <Input
                    id={`wf-mode-dmg-${index}`}
                    value={mode.damage}
                    onChange={(e) =>
                      patchMode(index, { damage: e.target.value })
                    }
                    placeholder="1d10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`wf-mode-dmg-type-${index}`}>
                    Damage type
                  </Label>
                  <Select
                    id={`wf-mode-dmg-type-${index}`}
                    value={modeDmgType}
                    onChange={(e) =>
                      patchMode(index, { dmgType: e.target.value })
                    }
                  >
                    {DMG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
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
              </div>

              <label
                className={cn(
                  "flex items-start gap-2 rounded-md border px-2.5 py-2 text-sm",
                  withShield
                    ? "border-teal-700/50 bg-teal-950/30 text-teal-100"
                    : "border-border/50 bg-background/40",
                )}
              >
                <Checkbox
                  className="mt-0.5"
                  checked={withShield}
                  onCheckedChange={(checked) =>
                    toggleShield(index, checked === true)
                  }
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Shield className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    Integrated shield in this mode
                  </span>
                  <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground leading-snug">
                    {withShield
                      ? "This stance grants the weapon’s integrated shield AC."
                      : "Leave off if this stance has no shield (other modes still can)."}
                  </span>
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
