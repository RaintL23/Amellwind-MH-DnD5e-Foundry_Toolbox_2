import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  emptyEffectChange,
  type WeaponActiveEffectConfig,
  type WeaponEffectChangeDraft,
} from "@/shared/foundry/weapons";
import { previewWeaponActiveEffectJson } from "@/shared/foundry/weapons";
import type { WeaponActivityParams } from "@/shared/foundry/weapons";
import { ActiveEffectAurasTab } from "./ActiveEffectAurasTab";
import { ActiveEffectChangesTab } from "./ActiveEffectChangesTab";
import { ActiveEffectDetailsTab } from "./ActiveEffectDetailsTab";
import { ActiveEffectDurationTab } from "./ActiveEffectDurationTab";
import type { FeatureActiveEffectEditorProps } from "./active-effect-editor.types";

export type { PatchAeFn } from "./active-effect-editor.types";

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

        <TabsContent value="details">
          <ActiveEffectDetailsTab
            cfg={cfg}
            params={params}
            featureName={featureName}
            patchAe={patchAe}
          />
        </TabsContent>

        <TabsContent value="duration">
          <ActiveEffectDurationTab
            cfg={cfg}
            params={params}
            specialSet={specialSet}
            patchAe={patchAe}
            toggleSpecialDuration={toggleSpecialDuration}
          />
        </TabsContent>

        <TabsContent value="changes">
          <ActiveEffectChangesTab
            changes={changes}
            params={params}
            onChangeParams={onChangeParams}
            updateChange={updateChange}
            addChange={addChange}
            removeChange={removeChange}
          />
        </TabsContent>

        <TabsContent value="auras">
          <ActiveEffectAurasTab cfg={cfg} patchAe={patchAe} />
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
