import { useEffect, useMemo, useState } from "react";
import { getListSpells } from "@/features/dnd/spells/services/spell.service";
import {
  buildSpellPhraseLinksForText,
} from "@/shared/utils/spell-phrase-links.utils";
import type { RichTextPhraseLink } from "@/shared/utils/dnd-rich-text.utils";

let cachedSpellNames: string[] | null = null;
let pendingSpellNames: Promise<string[]> | null = null;

function loadSpellNames(): Promise<string[]> {
  if (cachedSpellNames) return Promise.resolve(cachedSpellNames);
  if (!pendingSpellNames) {
    pendingSpellNames = getListSpells()
      .then((spells) => {
        const names = [
          ...new Set(spells.map((spell) => spell.name.trim()).filter(Boolean)),
        ].sort((a, b) => b.length - a.length);
        cachedSpellNames = names;
        return names;
      })
      .catch(() => {
        pendingSpellNames = null;
        return [] as string[];
      });
  }
  return pendingSpellNames;
}

/** Clears the module-level spell-name cache (tests / sync invalidation). */
export function clearSpellPhraseLinkNameCache(): void {
  cachedSpellNames = null;
  pendingSpellNames = null;
}

/** Catalog spell names for prose linking (null while loading). */
export function useSpellNameIndex(): string[] | null {
  const [names, setNames] = useState<string[] | null>(cachedSpellNames);

  useEffect(() => {
    if (cachedSpellNames) {
      setNames(cachedSpellNames);
      return;
    }
    let cancelled = false;
    void loadSpellNames().then((loaded) => {
      if (!cancelled) setNames(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return names;
}

/**
 * Phrase links for spell names that appear in `text`. Empty until the catalog
 * loads or when no spells are referenced.
 */
export function useSpellPhraseLinksForText(text: string): RichTextPhraseLink[] {
  const names = useSpellNameIndex();
  return useMemo(
    () => (names ? buildSpellPhraseLinksForText(text, names) : []),
    [text, names],
  );
}
