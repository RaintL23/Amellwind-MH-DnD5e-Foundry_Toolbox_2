import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import type { FoundryItem } from "@/shared/foundry";
import { FOUNDRY_EXPORT_TARGET } from "@/shared/foundry";
import type { ResolvedCombatChain } from "@/shared/foundry/weapons";
import {
  asRecord,
  formatDamageField,
} from "@/features/weapons/components/foundry-preview/foundry-preview.formatters";
import { ActivityCard } from "@/features/weapons/components/foundry-preview/FoundryPreviewActivityCard";
import { ChainStatusList } from "@/features/weapons/components/foundry-preview/FoundryPreviewChainStatusList";
import { DetailsSection } from "@/features/weapons/components/foundry-preview/FoundryPreviewDetailsSection";
import { FeatDetailsSection } from "@/features/weapons/components/foundry-preview/FoundryFeatPreviewDetailsSection";
import { EffectCard } from "@/features/weapons/components/foundry-preview/FoundryPreviewEffectCard";
import { SectionTitle } from "@/features/weapons/components/foundry-preview/FoundryPreviewFieldRow";
import { FoundryRawJsonDialog } from "@/features/weapons/components/foundry-preview/FoundryRawJsonDialog";
import { Braces } from "lucide-react";

export function PreviewBody({
  item,
  chains = [],
  filename,
  variant = "weapon",
}: {
  item: FoundryItem;
  chains?: ResolvedCombatChain[];
  filename: string;
  /** Weapon sheet vs resource feat (Melodies, …). */
  variant?: "weapon" | "feat";
}) {
  const [jsonOpen, setJsonOpen] = useState(false);
  const system = item.system as Record<string, unknown>;
  const activities = asRecord(system.activities) ?? {};
  const activityList = Object.values(activities)
    .map(asRecord)
    .filter((a): a is Record<string, unknown> => !!a)
    .sort(
      (a, b) =>
        (typeof a.sort === "number" ? a.sort : 0) -
        (typeof b.sort === "number" ? b.sort : 0),
    );

  const damage = asRecord(system.damage);
  const baseDamageLabel = formatDamageField(damage?.base);
  const isFeat = variant === "feat";

  return (
    <div className="space-y-4 pb-2">
      <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {item.name}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {item.type}
          </Badge>
          {typeof system.rarity === "string" && system.rarity && (
            <Badge variant="outline" className="text-[10px]">
              {system.rarity}
            </Badge>
          )}
          {typeof system.magicalBonus === "number" &&
            system.magicalBonus > 0 && (
              <Badge variant="outline" className="text-[10px]">
                +{system.magicalBonus}
              </Badge>
            )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Foundry VTT v{FOUNDRY_EXPORT_TARGET.coreVersion} / dnd5e{" "}
          {FOUNDRY_EXPORT_TARGET.systemVersion}. Fields below are read from the
          same Foundry Item object Export downloads (see Raw Foundry JSON).
        </p>
      </div>

      {isFeat ? (
        <FeatDetailsSection system={system} />
      ) : (
        <DetailsSection system={system} />
      )}

      <section className="space-y-2">
        <SectionTitle>Activities ({activityList.length})</SectionTitle>
        {activityList.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activities emitted.</p>
        ) : (
          <Accordion type="multiple" defaultValue={[]} className="space-y-2">
            {activityList.map((activity) => (
              <ActivityCard
                key={String(activity._id)}
                activity={activity}
                baseDamageLabel={baseDamageLabel}
              />
            ))}
          </Accordion>
        )}
      </section>

      <section className="space-y-2">
        <SectionTitle>Active Effects ({item.effects.length})</SectionTitle>
        {item.effects.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active effects.</p>
        ) : (
          <Accordion type="multiple" defaultValue={[]} className="space-y-2">
            {item.effects.map((effect) => (
              <EffectCard key={effect._id} effect={effect} />
            ))}
          </Accordion>
        )}
      </section>

      {!isFeat && (
        <section className="space-y-2">
          <SectionTitle>Feature automation map</SectionTitle>
          <ChainStatusList chains={chains} />
        </section>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2.5 text-xs"
        onClick={() => setJsonOpen(true)}
      >
        <Braces className="mr-1.5 h-3.5 w-3.5" />
        Raw Foundry JSON
      </Button>

      <FoundryRawJsonDialog
        open={jsonOpen}
        onOpenChange={setJsonOpen}
        item={item}
        filename={filename}
      />
    </div>
  );
}
