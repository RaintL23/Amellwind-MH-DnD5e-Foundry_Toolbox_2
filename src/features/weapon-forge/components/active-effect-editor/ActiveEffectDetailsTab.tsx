import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DAE_STACKABLE_OPTIONS,
  type WeaponActiveEffectConfig,
} from "@/shared/foundry/weapons";
import type { WeaponActivityParams } from "@/shared/foundry/weapons";
import { joinCsv, parseCsv } from "./active-effect-editor.utils";
import type { PatchAeFn } from "./active-effect-editor.types";

interface ActiveEffectDetailsTabProps {
  cfg: WeaponActiveEffectConfig;
  params: WeaponActivityParams;
  featureName: string;
  patchAe: PatchAeFn;
}

export function ActiveEffectDetailsTab({
  cfg,
  params,
  featureName,
  patchAe,
}: ActiveEffectDetailsTabProps) {
  return (
    <div className="space-y-3 mt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ae-name">Effect name</Label>
          <Input
            id="ae-name"
            value={cfg.name ?? ""}
            onChange={(e) =>
              patchAe({ name: e.target.value || undefined })
            }
            placeholder={featureName.trim() || "Feature name"}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ae-tint">Icon tint</Label>
          <Input
            id="ae-tint"
            value={cfg.tint ?? "#ffffff"}
            onChange={(e) => patchAe({ tint: e.target.value })}
            className="h-9 font-mono"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ae-img">Icon path</Label>
          <Input
            id="ae-img"
            value={cfg.img ?? ""}
            onChange={(e) =>
              patchAe({ img: e.target.value || undefined })
            }
            placeholder="systems/dnd5e/icons/svg/items/weapon.svg"
            className="h-9 font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ae-desc">Effect description</Label>
          <Textarea
            id="ae-desc"
            value={cfg.description ?? ""}
            onChange={(e) => patchAe({ description: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          checked={cfg.disabled === true}
          onCheckedChange={(checked) =>
            patchAe({ disabled: checked === true })
          }
          className="mt-0.5"
        />
        <span className="text-sm">Effect Suspended (`disabled`)</span>
      </label>

      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          checked={(cfg.transfer ?? params.effectTransfer) === true}
          onCheckedChange={(checked) => {
            const transfer = checked === true;
            patchAe({ transfer }, { effectTransfer: transfer });
          }}
          className="mt-0.5"
        />
        <span>
          <span className="text-sm">Apply Effect to Actor (`transfer`)</span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            Enabled applies while the item is equipped. Disable for on-use /
            activity-applied effects.
          </span>
        </span>
      </label>

      <div className="space-y-1.5">
        <Label htmlFor="ae-disable-cond">
          Disable if expression is true (DAE)
        </Label>
        <Textarea
          id="ae-disable-cond"
          value={cfg.disableCondition ?? ""}
          onChange={(e) =>
            patchAe({ disableCondition: e.target.value || undefined })
          }
          rows={2}
          placeholder="An expression which if true will disable the effect"
          className="font-mono text-xs"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={cfg.disableIncapacitated === true}
          onCheckedChange={(checked) =>
            patchAe({ disableIncapacitated: checked === true })
          }
        />
        <span className="text-sm">
          Effect disabled if actor incapacitated
        </span>
      </label>

      <div className="space-y-1.5">
        <Label htmlFor="ae-stackable">Stackable (DAE)</Label>
        <Select
          id="ae-stackable"
          value={cfg.stackable ?? ""}
          onChange={(e) =>
            patchAe({ stackable: e.target.value || undefined })
          }
          className="h-9"
        >
          <option value="">(default)</option>
          {DAE_STACKABLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ae-statuses">Status Conditions</Label>
        <Input
          id="ae-statuses"
          value={joinCsv(cfg.statuses ?? params.statuses)}
          onChange={(e) => {
            const statuses = parseCsv(e.target.value);
            patchAe(
              { statuses: statuses.length ? statuses : undefined },
              { statuses: statuses.length ? statuses : undefined },
            );
          }}
          placeholder="prone, poisoned, …"
          className="h-9"
        />
        <p className="text-[10px] text-muted-foreground">
          While affected, the target is treated as having these status
          conditions (`statuses`).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ae-statuses-sep">Separate Status Conditions</Label>
        <Input
          id="ae-statuses-sep"
          value={joinCsv(cfg.statusesSeparate)}
          onChange={(e) => {
            const statusesSeparate = parseCsv(e.target.value);
            patchAe({
              statusesSeparate: statusesSeparate.length
                ? statusesSeparate
                : undefined,
            });
          }}
          placeholder="Applied separately on apply (DAE)"
          className="h-9"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={cfg.showIcon === true}
          onCheckedChange={(checked) =>
            patchAe({ showIcon: checked === true })
          }
        />
        <span className="text-sm">Always Show Effect Icon (DAE)</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={cfg.overlay === true}
          onCheckedChange={(checked) =>
            patchAe({ overlay: checked === true })
          }
        />
        <span className="text-sm">Icon Overlay (`flags.core.overlay`)</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={cfg.selfTargetAlways === true}
          onCheckedChange={(checked) =>
            patchAe({ selfTargetAlways: checked === true })
          }
        />
        <span className="text-sm">DAE selfTargetAlways</span>
      </label>
    </div>
  );
}
