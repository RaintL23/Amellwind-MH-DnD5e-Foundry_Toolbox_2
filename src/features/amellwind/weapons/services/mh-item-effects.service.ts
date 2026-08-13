import { getGtmhData } from "@/shared/db/sync.service";
import { mapMhItemEffects } from "../mappers/mh-item-effects.mapper";

let cache: Map<string, string> | null = null;

export async function getMhItemEffectsMap(): Promise<Map<string, string>> {
  if (cache) return cache;

  const raw = await getGtmhData();
  cache = mapMhItemEffects(Array.isArray(raw) ? raw : []);
  return cache;
}

export function clearMhItemEffectsCache(): void {
  cache = null;
}

/** Strips phial cost suffixes from weapon-table display names. */
export function normalizeUnlockDisplayName(displayName: string): string {
  return displayName.replace(/\s*\(Costs\s+\d+\)\s*$/i, "").trim();
}

export function resolveMhItemEffect(
  displayName: string,
  effectsMap: Map<string, string>,
): string | undefined {
  const candidates = [
    displayName,
    normalizeUnlockDisplayName(displayName),
  ];

  for (const candidate of candidates) {
    const effect = effectsMap.get(candidate.toLowerCase());
    if (effect) return effect;
  }

  return undefined;
}

export function resolveMhItemParagraphs(
  displayName: string,
  effectsMap: Map<string, string>,
): string[] {
  const effect = resolveMhItemEffect(displayName, effectsMap);
  return effect ? [effect] : [];
}
