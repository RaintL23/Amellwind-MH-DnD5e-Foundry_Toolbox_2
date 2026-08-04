import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ACTIVE_AURA_TARGET_OPTIONS,
  DAE_SPECIAL_DURATION_OPTIONS,
  DAE_STACKABLE_OPTIONS,
  EFFECT_MODE_OPTIONS,
  emptyEffectChange,
  type WeaponActiveEffectConfig,
  type WeaponEffectChangeDraft,
} from "@/shared/foundry/weapons";
import { previewWeaponActiveEffectJson } from "@/shared/foundry/weapons";
import type { WeaponActivityParams } from "@/shared/foundry/weapons";
import { Plus, Trash2 } from "lucide-react";

interface FeatureActiveEffectEditorProps {
  params: WeaponActivityParams;
  onChangeParams: (patch: Partial<WeaponActivityParams>) => void;
  featureName: string;
}

function parseCsv(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinCsv(values: string[] | undefined): string {
  return values?.join(", ") ?? "";
}

function parseOptionalNumber(raw: string): number | null | undefined {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function FeatureActiveEffectEditor({
  params,
  onChangeParams,
  featureName,
}: FeatureActiveEffectEditorProps) {
  const cfg = params.activeEffect ?? {};
  const changes = cfg.changes ?? [];

  function patchAe(
    patch: Partial<WeaponActiveEffectConfig>,
    legacy?: Partial<WeaponActivityParams>,
  ) {
    onChangeParams({
      ...legacy,
      activeEffect: { ...cfg, ...patch },
    });
  }

  function updateChange(index: number, patch: Partial<WeaponEffectChangeDraft>) {
    const next = changes.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchAe({ changes: next });
  }

  function addChange() {
    patchAe({ changes: [...changes, emptyEffectChange()] });
  }

  function removeChange(index: number) {
    patchAe({ changes: changes.filter((_, i) => i !== index) });
  }

  function toggleSpecialDuration(value: string, on: boolean) {
    const current = new Set(cfg.specialDuration ?? params.specialDuration ?? []);
    if (on) current.add(value);
    else current.delete(value);
    const specialDuration = [...current];
    patchAe(
      { specialDuration: specialDuration.length ? specialDuration : undefined },
      {
        specialDuration: specialDuration.length ? specialDuration : undefined,
      },
    );
  }

  const previewJson = previewWeaponActiveEffectJson(
    featureName.trim() || "Feature",
    params,
  );

  const specialSet = new Set(cfg.specialDuration ?? params.specialDuration ?? []);

  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-muted/10 p-2.5">
      <div>
        <p className="text-sm font-medium">Active Effect (Foundry sheet)</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Mirrors the Foundry Active Effect dialog (Details / Duration / Changes
          / Auras) plus DAE fields written into the export JSON. Empty optional
          fields stay at Foundry defaults.
        </p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="details" className="text-xs">
            Details
          </TabsTrigger>
          <TabsTrigger value="duration" className="text-xs">
            Duration
          </TabsTrigger>
          <TabsTrigger value="changes" className="text-xs">
            Changes
          </TabsTrigger>
          <TabsTrigger value="auras" className="text-xs">
            Auras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-3 mt-3">
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
        </TabsContent>

        <TabsContent value="duration" className="space-y-3 mt-3">
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
        </TabsContent>

        <TabsContent value="changes" className="space-y-3 mt-3">
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
        </TabsContent>

        <TabsContent value="auras" className="space-y-3 mt-3">
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
        </TabsContent>
      </Tabs>

      <div className="space-y-1.5">
        <Label>Active Effect JSON preview (export shape)</Label>
        <pre className="max-h-48 overflow-auto rounded-md bg-muted/50 p-2 text-[10px] leading-relaxed text-muted-foreground">
          {previewJson}
        </pre>
      </div>
    </div>
  );
}
