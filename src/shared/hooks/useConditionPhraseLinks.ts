import { useEffect, useMemo, useState } from "react";
import { getAllConditions } from "@/features/amellwind/conditions/services/condition.service";
import { getAllDiseases } from "@/features/amellwind/diseases/services/disease.service";
import {
  getListDndConditions,
  getListDndDiseases,
} from "@/features/dnd/conditions/services/dnd-condition.service";
import {
  buildConditionPhraseLinksForText,
  type ConditionCatalogEntry,
} from "@/shared/utils/condition-phrase-links.utils";
import type { RichTextPhraseLink } from "@/shared/utils/dnd-rich-text.utils";

let cachedEntries: ConditionCatalogEntry[] | null = null;
let pendingEntries: Promise<ConditionCatalogEntry[]> | null = null;

function loadConditionCatalogEntries(): Promise<ConditionCatalogEntry[]> {
  if (cachedEntries) return Promise.resolve(cachedEntries);
  if (!pendingEntries) {
    pendingEntries = Promise.all([
      getAllConditions(),
      getAllDiseases(),
      getListDndConditions(),
      getListDndDiseases(),
    ])
      .then(([mhConditions, mhDiseases, dndConditions, dndDiseases]) => {
        const entries: ConditionCatalogEntry[] = [
          ...mhConditions.map((c) => ({
            name: c.name.trim(),
            kind: "condition" as const,
          })),
          ...dndConditions.map((c) => ({
            name: c.name.trim(),
            kind: "condition" as const,
          })),
          ...mhDiseases.map((d) => ({
            name: d.name.trim(),
            kind: "disease" as const,
          })),
          ...dndDiseases.map((d) => ({
            name: d.name.trim(),
            kind: "disease" as const,
          })),
        ].filter((entry) => entry.name.length > 0);
        cachedEntries = entries;
        return entries;
      })
      .catch(() => {
        pendingEntries = null;
        return [] as ConditionCatalogEntry[];
      });
  }
  return pendingEntries;
}

/** Clears the module-level catalog cache (tests / sync invalidation). */
export function clearConditionPhraseLinkNameCache(): void {
  cachedEntries = null;
  pendingEntries = null;
}

/** Condition + disease catalog entries for prose linking (null while loading). */
export function useConditionCatalogIndex(): ConditionCatalogEntry[] | null {
  const [entries, setEntries] = useState<ConditionCatalogEntry[] | null>(
    cachedEntries,
  );

  useEffect(() => {
    if (cachedEntries) {
      setEntries(cachedEntries);
      return;
    }
    let cancelled = false;
    void loadConditionCatalogEntries().then((loaded) => {
      if (!cancelled) setEntries(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return entries;
}

/**
 * Phrase links for condition/disease names that appear in `text`. Empty until
 * the catalog loads or when none are referenced.
 */
export function useConditionPhraseLinksForText(
  text: string,
): RichTextPhraseLink[] {
  const entries = useConditionCatalogIndex();
  return useMemo(
    () => (entries ? buildConditionPhraseLinksForText(text, entries) : []),
    [text, entries],
  );
}
