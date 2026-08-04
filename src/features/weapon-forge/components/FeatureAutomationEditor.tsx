import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  WEAPON_ACTIVITY_TEMPLATE_KINDS,
  TEMPLATE_LABELS,
  type WeaponActivityTemplateKind,
  type WeaponFeatureAutomationSpec,
  type WeaponActivityParams,
} from "@/shared/foundry/weapons";
import { lookupWeaponFeatureAutomation } from "@/shared/foundry/weapons";
import { FeatureActiveEffectEditor } from "./FeatureActiveEffectEditor";

interface FeatureAutomationEditorProps {
  value: WeaponFeatureAutomationSpec | undefined;
  onChange: (next: WeaponFeatureAutomationSpec | undefined) => void;
  /** When true, this link upgrades another feature — default template hint. */
  isUpgradeLink?: boolean;
  /** Feature name — used to seed registry defaults when enabling mapping. */
  featureName?: string;
  /** Merged preview JSON for the chain at the current editor rarity. */
  mergedPreviewJson?: string;
  disabled?: boolean;
}

function emptySpec(isUpgrade: boolean): WeaponFeatureAutomationSpec {
  return {
    template: isUpgrade ? "upgrade_scaler" : "unmapped",
    enabled: false,
    params: {},
  };
}

function isMappingEnabled(spec: WeaponFeatureAutomationSpec): boolean {
  return spec.enabled !== false && spec.template !== "unmapped";
}

export function FeatureAutomationEditor({
  value,
  onChange,
  isUpgradeLink = false,
  featureName = "",
  mergedPreviewJson,
  disabled = false,
}: FeatureAutomationEditorProps) {
  const spec = value ?? emptySpec(isUpgradeLink);
  const params = spec.params ?? {};
  const mappingOn = !disabled && isMappingEnabled(spec);

  function patch(patchSpec: Partial<WeaponFeatureAutomationSpec>) {
    onChange({ ...spec, ...patchSpec });
  }

  function patchParams(patchP: Partial<WeaponActivityParams>) {
    patch({ params: { ...params, ...patchP } });
  }

  function handleMappingToggle(checked: boolean) {
    if (!checked) {
      // Persistable opt-out: keeps template/params for later re-enable.
      onChange({
        ...spec,
        enabled: false,
        template:
          spec.template === "unmapped" && isUpgradeLink
            ? "upgrade_scaler"
            : spec.template,
        params: { ...params },
      });
      return;
    }

    const fromRegistry = featureName.trim()
      ? lookupWeaponFeatureAutomation(featureName)
      : undefined;

    if (fromRegistry && fromRegistry.template !== "unmapped") {
      onChange({
        ...fromRegistry,
        params: { ...fromRegistry.params },
        enabled: true,
        chainKey: spec.chainKey ?? fromRegistry.chainKey,
        notes: spec.notes?.trim() ? spec.notes : fromRegistry.notes,
      });
      return;
    }

    if (spec.template !== "unmapped") {
      onChange({ ...spec, enabled: true, params: { ...params } });
      return;
    }

    onChange({
      template: isUpgradeLink ? "upgrade_scaler" : "action_ability",
      enabled: true,
      params: { ...params },
      chainKey: spec.chainKey,
      notes: spec.notes,
    });
  }

  return (
    <Accordion type="single" collapsible className="rounded-md border border-border/70">
      <AccordionItem value="foundry-automation" className="border-0 px-3">
        <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
          <span className="flex flex-col items-start gap-0.5 text-left">
            <span>Foundry automation</span>
            <span className="text-xs font-normal text-muted-foreground">
              {disabled
                ? "Unavailable for weapon resources"
                : mappingOn
                  ? `Mapped · ${TEMPLATE_LABELS[spec.template]}`
                  : "Not mapped — optional"}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-3">
          <p className="text-xs text-muted-foreground">
            One upgrade chain becomes one Activity. Upgrade links only change
            params (e.g. 2d6 → 3d6) — they do not create a second Activity.
          </p>

          {disabled ? (
            <p className="text-xs text-muted-foreground">
              Weapon resources are out of scope for automation (Phials, Coatings,
              Ammo, Notes, …).
            </p>
          ) : (
            <>
              <label className="flex items-start gap-2 cursor-pointer rounded-md border border-border/60 bg-muted/20 p-2.5">
                <Checkbox
                  checked={mappingOn}
                  onCheckedChange={(checked) =>
                    handleMappingToggle(checked === true)
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="text-sm font-medium">
                    Map in Foundry export
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    When off, this feature stays description-only (no Activity or
                    Active Effect). Turning it off keeps your template settings
                    for later.
                  </span>
                </span>
              </label>

              {mappingOn && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="feat-auto-template">Template</Label>
                    <Select
                      id="feat-auto-template"
                      value={spec.template}
                      onChange={(e) =>
                        patch({
                          template: e.target.value as WeaponActivityTemplateKind,
                          enabled: true,
                        })
                      }
                      className="h-9"
                    >
                      {WEAPON_ACTIVITY_TEMPLATE_KINDS.filter(
                        (kind) =>
                          kind !== "unmapped" && kind !== "charge_pool_attack",
                      ).map((kind) => (
                        <option key={kind} value={kind}>
                          {TEMPLATE_LABELS[kind]}
                        </option>
                      ))}
                    </Select>
                    {isUpgradeLink && (
                      <p className="text-xs text-muted-foreground">
                        Prefer{" "}
                        <span className="font-medium">Upgrade scaler</span> and
                        only fill fields that change at this rarity.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-activation">Activation</Label>
                      <Select
                        id="feat-auto-activation"
                        value={params.activation ?? ""}
                        onChange={(e) =>
                          patchParams({
                            activation: e.target
                              .value as WeaponActivityParams["activation"],
                          })
                        }
                        className="h-9"
                      >
                        <option value="">(template default)</option>
                        <option value="action">Action</option>
                        <option value="bonus">Bonus action</option>
                        <option value="reaction">Reaction</option>
                        <option value="special">Special</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-activity-type">
                        Activity type
                      </Label>
                      <Select
                        id="feat-auto-activity-type"
                        value={params.activityType ?? ""}
                        onChange={(e) =>
                          patchParams({
                            activityType: (e.target.value || undefined) as
                              | WeaponActivityParams["activityType"]
                              | undefined,
                          })
                        }
                        className="h-9"
                      >
                        <option value="">(infer)</option>
                        <option value="attack">Attack</option>
                        <option value="damage">Damage</option>
                        <option value="save">Save</option>
                        <option value="utility">Utility</option>
                        <option value="heal">Heal</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-dmg">
                        Damage formula
                        {spec.template === "counter_spend" ||
                        spec.template === "charge_pool_attack"
                          ? " (per counter)"
                          : ""}
                      </Label>
                      <Input
                        id="feat-auto-dmg"
                        value={params.damageFormula ?? ""}
                        onChange={(e) =>
                          patchParams({ damageFormula: e.target.value })
                        }
                        placeholder="e.g. 2d6"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-dmg-type">Damage type</Label>
                      <Input
                        id="feat-auto-dmg-type"
                        value={params.damageType ?? ""}
                        onChange={(e) =>
                          patchParams({ damageType: e.target.value })
                        }
                        placeholder="e.g. fire, slashing"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-save">Save ability</Label>
                      <Input
                        id="feat-auto-save"
                        value={params.saveAbility ?? ""}
                        onChange={(e) =>
                          patchParams({ saveAbility: e.target.value })
                        }
                        placeholder="dex, con, …"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-dc">Save DC formula</Label>
                      <Input
                        id="feat-auto-dc"
                        value={params.saveDcFormula ?? ""}
                        onChange={(e) =>
                          patchParams({ saveDcFormula: e.target.value })
                        }
                        placeholder="8 + @mod + @prof"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-uses">Activity uses max</Label>
                      <Input
                        id="feat-auto-uses"
                        value={params.usesMax ?? ""}
                        onChange={(e) =>
                          patchParams({ usesMax: e.target.value })
                        }
                        placeholder="e.g. 1 or @prof"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-recovery">Uses recovery</Label>
                      <Select
                        id="feat-auto-recovery"
                        value={params.usesRecoveryPeriod ?? ""}
                        onChange={(e) =>
                          patchParams({
                            usesRecoveryPeriod: (e.target.value ||
                              undefined) as
                              | WeaponActivityParams["usesRecoveryPeriod"]
                              | undefined,
                          })
                        }
                        className="h-9"
                      >
                        <option value="">None</option>
                        <option value="sr">Short rest</option>
                        <option value="lr">Long rest</option>
                        <option value="day">Day</option>
                        <option value="recharge">Recharge</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-item-uses">
                        Item uses max
                        {spec.template === "counter_spend" ||
                        spec.template === "charge_pool_attack"
                          ? " (counter pool)"
                          : " (gauge)"}
                      </Label>
                      <Input
                        id="feat-auto-item-uses"
                        value={params.itemUsesMax ?? ""}
                        onChange={(e) =>
                          patchParams({ itemUsesMax: e.target.value })
                        }
                        placeholder="e.g. 5"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-template-type">
                        AoE template
                      </Label>
                      <Input
                        id="feat-auto-template-type"
                        value={params.templateType ?? ""}
                        onChange={(e) =>
                          patchParams({ templateType: e.target.value })
                        }
                        placeholder="line, cone, sphere…"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-template-size">
                        Template size
                      </Label>
                      <Input
                        id="feat-auto-template-size"
                        value={params.templateSize ?? ""}
                        onChange={(e) =>
                          patchParams({ templateSize: e.target.value })
                        }
                        placeholder="30"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="feat-auto-mastery">Mastery id</Label>
                      <Input
                        id="feat-auto-mastery"
                        value={params.mastery ?? ""}
                        onChange={(e) =>
                          patchParams({ mastery: e.target.value })
                        }
                        placeholder="sap, nick, graze…"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={params.consumeItemUses === true}
                        onCheckedChange={(checked) =>
                          patchParams({ consumeItemUses: checked === true })
                        }
                      />
                      <span className="text-sm">
                        Consume item uses (gauge)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={params.triggerFromAttack === true}
                        onCheckedChange={(checked) =>
                          patchParams({ triggerFromAttack: checked === true })
                        }
                      />
                      <span className="text-sm">
                        Trigger from weapon Attack (Midi)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={params.ignoreCover === true}
                        onCheckedChange={(checked) =>
                          patchParams({ ignoreCover: checked === true })
                        }
                      />
                      <span className="text-sm">
                        Ignore half / three-quarters cover
                      </span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="feat-auto-notes">Notes</Label>
                    <Textarea
                      id="feat-auto-notes"
                      value={spec.notes ?? ""}
                      onChange={(e) => patch({ notes: e.target.value })}
                      rows={2}
                      placeholder="Optional implementer notes (modules, limitations)…"
                    />
                  </div>

                  <FeatureActiveEffectEditor
                    params={params}
                    onChangeParams={patchParams}
                    featureName={featureName}
                  />

                  {mergedPreviewJson && (
                    <div className="space-y-1.5">
                      <Label>Merged params at current rarity (preview)</Label>
                      <pre className="max-h-40 overflow-auto rounded-md bg-muted/50 p-2 text-[10px] leading-relaxed text-muted-foreground">
                        {mergedPreviewJson}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
