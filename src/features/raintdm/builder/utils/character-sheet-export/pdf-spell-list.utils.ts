import type { BuilderSpellSelections, Spell } from "@/shared/types";
import type { SpellcastingInfo } from "@/features/raintdm/builder/hooks/useSpellcasting";
import type { SubclassSpellGrant } from "@/features/raintdm/builder/utils/subclass-spells.utils";
import type { CharacterSheetSpellExport } from "./character-sheet-export.types";

const COSTLY_MATERIAL = /\d+\s*(?:gp|sp|cp|pp)/i;

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

function toSpellExport(
  name: string,
  level: number,
  spell: Spell | undefined,
  alwaysPrepared: boolean,
): CharacterSheetSpellExport {
  const material = spell?.components.m ?? null;
  const costlyMaterial = material !== null && COSTLY_MATERIAL.test(material);
  return {
    name,
    level,
    range: spell?.range,
    castingTime: spell?.castingTime,
    isConcentration: spell?.isConcentration ?? false,
    isRitual: spell?.isRitual ?? false,
    hasMaterial: material !== null,
    notes: costlyMaterial
      ? material
      : alwaysPrepared
        ? "Always prepared"
        : undefined,
  };
}

/**
 * Spells for the sheet's spell table: the player's picks plus always-prepared,
 * bonus-known and optional-feature grants, deduplicated by name and sorted by
 * level then name (cantrips first).
 */
export function buildSpellListExport(options: {
  spellSelections: BuilderSpellSelections;
  spellcasting: Pick<
    SpellcastingInfo,
    "subclassAlwaysPrepared" | "subclassBonusKnown" | "optionalFeatureGranted"
  >;
  allSpells: Spell[];
  characterLevel: number;
}): CharacterSheetSpellExport[] {
  const { spellSelections, spellcasting, allSpells, characterLevel } = options;
  const byId = new Map(allSpells.map((spell) => [spell.id, spell]));
  const byName = new Map<string, Spell>();
  for (const spell of allSpells) {
    if (!byName.has(nameKey(spell.name))) byName.set(nameKey(spell.name), spell);
  }

  const entries = new Map<string, CharacterSheetSpellExport>();

  const addGrants = (grants: SubclassSpellGrant[], alwaysPrepared: boolean) => {
    for (const grant of grants) {
      if (grant.unlockedAtLevel > characterLevel) continue;
      const key = nameKey(grant.name);
      if (entries.has(key)) continue;
      const spell = byName.get(key);
      if (!spell) continue;
      entries.set(key, toSpellExport(spell.name, spell.level, spell, alwaysPrepared));
    }
  };

  addGrants(spellcasting.subclassAlwaysPrepared, true);

  for (const selection of Object.values(spellSelections).flat()) {
    const key = nameKey(selection.name);
    if (entries.has(key)) continue;
    const spell = byId.get(selection.id) ?? byName.get(key);
    entries.set(
      key,
      toSpellExport(selection.name, spell?.level ?? selection.level, spell, false),
    );
  }

  addGrants(
    [...spellcasting.subclassBonusKnown, ...spellcasting.optionalFeatureGranted],
    false,
  );

  return Array.from(entries.values()).sort(
    (a, b) => a.level - b.level || a.name.localeCompare(b.name),
  );
}
