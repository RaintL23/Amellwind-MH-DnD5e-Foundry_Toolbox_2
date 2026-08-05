/**
 * Builds the Foundry spell item list for export:
 * - Prepared casters: full class list (leveled) with prepared flags; cantrips only selected.
 * - Known / pact casters: only selected + grants, all available.
 */

import type { Spell } from "@/shared/types";
import type { BuilderSpellSelection } from "@/shared/types";
import type { SpellItemInput, SpellPreparationMode } from "./item.builders";
import { resolveSpellIcon } from "@/shared/foundry";
import {
  spellMatchesCharacterSpellList,
  type CharacterSpellListContext,
  type SubclassSpellGrant,
} from "../utils/subclass-spells.utils";

function joinDescription(lines: string[] | undefined): string | undefined {
  if (!lines || lines.length === 0) return undefined;
  return lines.join("\n\n");
}

function spellNameKey(name: string): string {
  return name.trim().toLowerCase();
}

function toSpellItem(
  spell: Spell,
  opts: {
    ability?: string;
    prepared: boolean;
    preparationMode: SpellPreparationMode;
    fluffImg?: string;
  },
): SpellItemInput {
  return {
    name: spell.name,
    level: spell.level,
    ability: opts.ability,
    prepared: opts.prepared,
    preparationMode: opts.preparationMode,
    description: joinDescription(spell.description),
    source: spell.source,
    school: spell.school,
    castingTime: spell.castingTime,
    range: spell.range,
    duration: spell.duration,
    isRitual: spell.isRitual,
    isConcentration: spell.isConcentration,
    components: spell.components,
    spellAttack: spell.spellAttack,
    savingThrows: spell.savingThrows,
    damageTypes: spell.damageTypes,
    img: resolveSpellIcon(spell.school, opts.fluffImg),
  };
}

export interface BuildSpellExportListOptions {
  allSpells: Spell[];
  selections: BuilderSpellSelection[];
  isPreparedCaster: boolean;
  isPactMagic: boolean;
  spellAbilityKey: string;
  listContext: Omit<CharacterSpellListContext, "selectedSpellLevel" | "isPactPool">;
  alwaysPrepared: SubclassSpellGrant[];
  bonusKnown: SubclassSpellGrant[];
  optionalFeatureGranted: SubclassSpellGrant[];
  /** name|source (lower) or name-only → fluff img URL */
  resolveFluffImg: (name: string, source?: string) => string | undefined;
}

/**
 * Assembles SpellItemInput[] for Foundry export from catalog + builder choices.
 */
export function buildSpellExportList(
  options: BuildSpellExportListOptions,
): SpellItemInput[] {
  const {
    allSpells,
    selections,
    isPreparedCaster,
    isPactMagic,
    spellAbilityKey,
    listContext,
    alwaysPrepared,
    bonusKnown,
    optionalFeatureGranted,
    resolveFluffImg,
  } = options;

  const ability = spellAbilityKey || undefined;
  const defaultMode: SpellPreparationMode = isPactMagic ? "pact" : "prepared";

  const byId = new Map(allSpells.map((s) => [s.id, s]));
  const byName = new Map<string, Spell>();
  for (const s of allSpells) {
    const k = spellNameKey(s.name);
    if (!byName.has(k)) byName.set(k, s);
  }

  const selectedIds = new Set(selections.map((s) => s.id));
  const selectedNames = new Set(selections.map((s) => spellNameKey(s.name)));

  const alwaysNames = new Set(
    alwaysPrepared.map((g) => spellNameKey(g.name)),
  );
  const grantNames = new Set([
    ...alwaysPrepared.map((g) => spellNameKey(g.name)),
    ...bonusKnown.map((g) => spellNameKey(g.name)),
    ...optionalFeatureGranted.map((g) => spellNameKey(g.name)),
  ]);

  const maxSlotLevel = Math.max(0, ...listContext.availableSpellSlotLevels);
  const out = new Map<string, SpellItemInput>();

  const pushSpell = (
    spell: Spell,
    prepared: boolean,
    mode: SpellPreparationMode,
  ) => {
    const key = spellNameKey(spell.name);
    const existing = out.get(key);
    // Prefer prepared / always over unprepared duplicates.
    if (existing) {
      const existingPrepared = existing.prepared === true;
      const existingAlways = existing.preparationMode === "always";
      if (existingAlways || (existingPrepared && !prepared && mode !== "always")) {
        return;
      }
    }
    out.set(
      key,
      toSpellItem(spell, {
        ability,
        prepared,
        preparationMode: mode,
        fluffImg: resolveFluffImg(spell.name, spell.source),
      }),
    );
  };

  const resolveGrantSpell = (name: string): Spell | undefined =>
    byName.get(spellNameKey(name));

  // Always-prepared / bonus / optional grants (any caster type).
  for (const grant of alwaysPrepared) {
    const spell = resolveGrantSpell(grant.name);
    if (spell) pushSpell(spell, true, "always");
  }
  for (const grant of [...bonusKnown, ...optionalFeatureGranted]) {
    const spell = resolveGrantSpell(grant.name);
    if (spell) pushSpell(spell, true, defaultMode);
  }

  // User selections (cantrips + leveled).
  for (const selection of selections) {
    const spell =
      byId.get(selection.id) ?? byName.get(spellNameKey(selection.name));
    if (!spell) {
      // Selection without catalog match — emit a minimal item.
      const key = spellNameKey(selection.name);
      if (!out.has(key)) {
        out.set(key, {
          name: selection.name,
          level: selection.level,
          ability,
          prepared: true,
          preparationMode: alwaysNames.has(key) ? "always" : defaultMode,
          source: selection.source,
          school: selection.school,
          img: resolveSpellIcon(
            selection.school,
            resolveFluffImg(selection.name, selection.source),
          ),
        });
      }
      continue;
    }
    const mode = alwaysNames.has(spellNameKey(spell.name))
      ? "always"
      : defaultMode;
    pushSpell(spell, true, mode);
  }

  if (isPreparedCaster) {
    // Full class list for leveled spells up to available slots; unprepared unless selected/grant.
    for (const spell of allSpells) {
      if (spell.level < 1) continue;
      if (spell.level > maxSlotLevel) continue;
      const matches = spellMatchesCharacterSpellList(spell, {
        ...listContext,
        selectedSpellLevel: spell.level,
        isPactPool: false,
      });
      if (!matches) continue;
      const key = spellNameKey(spell.name);
      if (out.has(key)) continue;
      const isSelected =
        selectedIds.has(spell.id) || selectedNames.has(key) || grantNames.has(key);
      pushSpell(
        spell,
        isSelected,
        alwaysNames.has(key) ? "always" : defaultMode,
      );
    }
  }

  return [...out.values()].sort(
    (a, b) => a.level - b.level || a.name.localeCompare(b.name),
  );
}
