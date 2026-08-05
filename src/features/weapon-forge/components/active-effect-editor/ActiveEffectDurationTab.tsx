import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  DAE_SPECIAL_DURATION_OPTIONS,
  type WeaponActiveEffectConfig,
} from "@/shared/foundry/weapons";
import type { WeaponActivityParams } from "@/shared/foundry/weapons";
import {
  joinCsv,
  parseCsv,
  parseOptionalNumber,
} from "./active-effect-editor.utils";
import type { PatchAeFn } from "./active-effect-editor.types";

interface ActiveEffectDurationTabProps {
  cfg: WeaponActiveEffectConfig;
  params: WeaponActivityParams;
  specialSet: Set<string>;
  patchAe: PatchAeFn;
  toggleSpecialDuration: (value: string, on: boolean) => void;
}

export function ActiveEffectDurationTab({
  cfg,
  params,
  specialSet,
  patchAe,
  toggleSpecialDuration,
}: ActiveEffectDurationTabProps) {
  return (
    <div className="space-y-3 mt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ae-sec">Effect Duration (Seconds)</Label>
          <Input
            id="ae-sec"
            value={
              cfg.durationSeconds == null
                ? ""
                : String(cfg.durationSeconds)
            }
            onChange={(e) =>
              patchAe({
                durationSeconds: parseOptionalNumber(e.target.value),
              })
            }
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ae-sec-formula">
            Roll expression in seconds (DAE)
          </Label>
          <Input
            id="ae-sec-formula"
            value={cfg.durationSecondsFormula ?? ""}
            onChange={(e) =>
              patchAe({
                durationSecondsFormula: e.target.value || undefined,
              })
            }
            placeholder="1d6 * 60"
            className="h-9 font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ae-start-time">Effect Start Time</Label>
          <Input
            id="ae-start-time"
            value={cfg.startTime == null ? "" : String(cfg.startTime)}
            onChange={(e) =>
              patchAe({ startTime: parseOptionalNumber(e.target.value) })
            }
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ae-combat">Combat Encounter id</Label>
          <Input
            id="ae-combat"
            value={cfg.combat ?? ""}
            onChange={(e) =>
              patchAe({ combat: e.target.value || null })
            }
            className="h-9 font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ae-rounds">Duration Rounds</Label>
          <Input
            id="ae-rounds"
            value={
              cfg.durationRounds == null ? "" : String(cfg.durationRounds)
            }
            onChange={(e) =>
              patchAe({
                durationRounds: parseOptionalNumber(e.target.value),
              })
            }
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ae-turns">Duration Turns</Label>
          <Input
            id="ae-turns"
            value={
              cfg.durationTurns == null ? "" : String(cfg.durationTurns)
            }
            onChange={(e) =>
              patchAe({
                durationTurns: parseOptionalNumber(e.target.value),
              })
            }
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ae-start-round">Start Round</Label>
          <Input
            id="ae-start-round"
            value={cfg.startRound == null ? "" : String(cfg.startRound)}
            onChange={(e) =>
              patchAe({ startRound: parseOptionalNumber(e.target.value) })
            }
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ae-start-turn">Start Turn</Label>
          <Input
            id="ae-start-turn"
            value={cfg.startTurn == null ? "" : String(cfg.startTurn)}
            onChange={(e) =>
              patchAe({ startTurn: parseOptionalNumber(e.target.value) })
            }
            className="h-9"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ae-macro-repeat">Macro Repeat (DAE)</Label>
          <Select
            id="ae-macro-repeat"
            value={cfg.macroRepeat ?? ""}
            onChange={(e) =>
              patchAe({ macroRepeat: e.target.value || undefined })
            }
            className="h-9"
          >
            <option value="">(none)</option>
            <option value="startEveryTurn">Start of every turn</option>
            <option value="endEveryTurn">End of every turn</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Special Duration (DAE + Times Up)</Label>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {DAE_SPECIAL_DURATION_OPTIONS.map((value) => (
            <label
              key={value}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <Checkbox
                checked={specialSet.has(value)}
                onCheckedChange={(checked) =>
                  toggleSpecialDuration(value, checked === true)
                }
              />
              <span className="font-mono">{value}</span>
            </label>
          ))}
        </div>
        <Input
          value={joinCsv(cfg.specialDuration ?? params.specialDuration)}
          onChange={(e) => {
            const specialDuration = parseCsv(e.target.value);
            patchAe(
              {
                specialDuration: specialDuration.length
                  ? specialDuration
                  : undefined,
              },
              {
                specialDuration: specialDuration.length
                  ? specialDuration
                  : undefined,
              },
            );
          }}
          placeholder="Custom specialDuration (comma-separated)"
          className="h-9 font-mono text-xs"
        />
      </div>
    </div>
  );
}
