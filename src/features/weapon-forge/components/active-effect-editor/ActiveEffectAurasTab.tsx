import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ACTIVE_AURA_TARGET_OPTIONS,
  type WeaponActiveEffectConfig,
} from "@/shared/foundry/weapons";
import type { PatchAeFn } from "./active-effect-editor.types";

interface ActiveEffectAurasTabProps {
  cfg: WeaponActiveEffectConfig;
  patchAe: PatchAeFn;
}

export function ActiveEffectAurasTab({
  cfg,
  patchAe,
}: ActiveEffectAurasTabProps) {
  return (
    <div className="space-y-3 mt-3">
      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          checked={cfg.isAura === true}
          onCheckedChange={(checked) =>
            patchAe({ isAura: checked === true })
          }
          className="mt-0.5"
        />
        <span>
          <span className="text-sm">Effect is Aura?</span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            Writes `flags.ActiveAuras.*` (Foundry v12 Active Auras). Aura
            Effects on newer cores uses a different document type.
          </span>
        </span>
      </label>

      {cfg.isAura && (
        <div className="grid gap-3 sm:grid-cols-2 pl-1">
          <div className="space-y-1.5">
            <Label htmlFor="ae-aura-radius">Radius</Label>
            <Input
              id="ae-aura-radius"
              value={cfg.auraRadius ?? "10"}
              onChange={(e) => patchAe({ auraRadius: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ae-aura-targets">Targets</Label>
            <Select
              id="ae-aura-targets"
              value={cfg.auraTargets ?? "Allies"}
              onChange={(e) => patchAe({ auraTargets: e.target.value })}
              className="h-9"
            >
              {ACTIVE_AURA_TARGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ae-aura-align">Alignment filter</Label>
            <Input
              id="ae-aura-align"
              value={cfg.auraAlignment ?? ""}
              onChange={(e) =>
                patchAe({ auraAlignment: e.target.value || undefined })
              }
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ae-aura-type">Type filter</Label>
            <Input
              id="ae-aura-type"
              value={cfg.auraType ?? ""}
              onChange={(e) =>
                patchAe({ auraType: e.target.value || undefined })
              }
              className="h-9"
            />
          </div>
          {(
            [
              ["auraIgnoreSelf", "Ignore self"],
              ["auraHeight", "Height"],
              ["auraHidden", "Hidden"],
              ["auraDisplayTemp", "Display temporary"],
              ["auraHostile", "Hostile"],
              ["auraOnlyOnce", "Only once"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={cfg[key] === true}
                onCheckedChange={(checked) =>
                  patchAe({ [key]: checked === true })
                }
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
