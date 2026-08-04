import type { FoundryItem } from "@/shared/foundry";
import { buildFeatItem } from "./item.builders";
import { buildItemGrantAdvancement } from "./advancement.builders";
import type { FeatureInput } from "./actor-export.types";

/** Sets `flags.dnd5e.advancementOrigin` so the sheet groups features by class/race/…. */
export function stampAdvancementOrigins(
  featureItems: FoundryItem[],
  advancements: Record<string, unknown>[],
  parentId: string,
): void {
  const featIdToAdvId = new Map<string, string>();
  for (const adv of advancements) {
    if (adv.type !== "ItemGrant") continue;
    const value = adv.value as { added?: Record<string, string> } | undefined;
    for (const featId of Object.keys(value?.added ?? {})) {
      featIdToAdvId.set(featId, String(adv._id));
    }
  }
  for (const feat of featureItems) {
    const advId = featIdToAdvId.get(feat._id);
    const origin = advId ? `${parentId}.${advId}` : parentId;
    const prev = (feat.flags.dnd5e as Record<string, unknown> | undefined) ?? {};
    feat.flags = {
      ...feat.flags,
      dnd5e: { ...prev, advancementOrigin: origin },
    };
  }
}

export function buildFeatureItems(
  features: FeatureInput[],
): { items: FoundryItem[]; byLevel: Map<number, string[]> } {
  const items: FoundryItem[] = [];
  const byLevel = new Map<number, string[]>();
  for (const f of features) {
    const item = buildFeatItem({
      name: f.name,
      description: f.description,
      subtype: f.subtype,
      identifier: f.identifier,
      img: f.img,
    });
    items.push(item);
    const level = Math.max(0, f.level);
    const list = byLevel.get(level) ?? [];
    list.push(item._id);
    byLevel.set(level, list);
  }
  return { items, byLevel };
}

export function itemGrantsByLevel(
  byLevel: Map<number, string[]>,
  icon?: string,
): Record<string, unknown>[] {
  return [...byLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, ids]) => buildItemGrantAdvancement(level, ids, "Features", icon));
}

