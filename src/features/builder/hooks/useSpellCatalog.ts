import { useEffect, useMemo, useState } from "react";
import { getListSpells } from "@/features/spells/services/spell.service";
import type { Spell } from "@/shared/types";

export function buildSpellLevelByName(spells: Spell[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const spell of spells) {
    map.set(spell.name.toLowerCase(), spell.level);
  }
  return map;
}

export function useSpellCatalog() {
  const [allSpells, setAllSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getListSpells()
      .then(setAllSpells)
      .finally(() => setLoading(false));
  }, []);

  const spellLevelByName = useMemo(
    () => buildSpellLevelByName(allSpells),
    [allSpells],
  );

  return { allSpells, loading, spellLevelByName };
}
