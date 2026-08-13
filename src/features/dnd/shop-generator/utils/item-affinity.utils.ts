import type { DndItem } from "@/shared/types";
import type { AffinityProfile } from "../data/class-affinity.data";
import { matchesTypePreference } from "../data/shop-themes.data";

function itemBlob(item: DndItem): string {
  return `${item.name} ${item.searchText} ${item.attunement ?? ""} ${item.typeLabel} ${item.properties ?? ""}`.toLowerCase();
}

/**
 * Soft match strength for an affinity profile.
 * 1 = no meaningful match (neutral), >1 = stronger bias.
 */
export function affinityMatchMultiplier(
  item: DndItem,
  profile: AffinityProfile,
): number {
  const blob = itemBlob(item);
  const name = item.name.toLowerCase();
  const attune = (item.attunement ?? "").toLowerCase();
  let score = 1;

  if (matchesTypePreference(item.typeLabel, profile.preferredTypes)) {
    score *= 1.35;
  }

  const keywordHits = profile.keywords.filter((k) =>
    blob.includes(k.toLowerCase()),
  ).length;
  if (keywordHits > 0) {
    score *= 1.25 + Math.min(keywordHits, 3) * 0.15;
  }

  const signatureHit = profile.signatureItems.some((sig) =>
    name.includes(sig.toLowerCase()),
  );
  if (signatureHit) {
    score *= 2.1;
  }

  if (
    profile.attunementIncludes.length > 0 &&
    profile.attunementIncludes.some((frag) => attune.includes(frag.toLowerCase()))
  ) {
    score *= 2.4;
  }

  return score;
}

/** Best multiplier among selected profiles (OR within a category). */
export function bestAffinityMultiplier(
  item: DndItem,
  profiles: AffinityProfile[],
): number {
  if (profiles.length === 0) return 1;
  let best = 1;
  for (const profile of profiles) {
    const m = affinityMatchMultiplier(item, profile);
    if (m > best) best = m;
  }
  return best;
}
