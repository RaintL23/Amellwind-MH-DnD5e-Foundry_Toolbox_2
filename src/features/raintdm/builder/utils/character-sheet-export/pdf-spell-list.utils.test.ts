import { describe, expect, it } from "vitest";
import type { BuilderSpellSelection, Spell } from "@/shared/types";
import { PDF_SPELL_ROWS } from "./pdf-field-mappings";
import { buildSpellListExport } from "./pdf-spell-list.utils";

function spell(id: string, name: string, level: number, extra: Partial<Spell> = {}): Spell {
  return {
    id,
    name,
    level,
    source: "XPHB",
    castingTime: "Action",
    range: "60 feet",
    components: {},
    isRitual: false,
    isConcentration: false,
    ...extra,
  } as Spell;
}

function pick(s: Spell): BuilderSpellSelection {
  return { id: s.id, name: s.name, level: s.level, source: s.source };
}

const fireBolt = spell("fb", "Fire Bolt", 0);
const shield = spell("sh", "Shield", 1);
const bless = spell("bl", "Bless", 1, { isConcentration: true });
const findFamiliar = spell("ff", "Find Familiar", 1, {
  isRitual: true,
  components: { v: true, s: true, m: "10 GP worth of charcoal" },
});
const fireball = spell("fbl", "Fireball", 3, { components: { v: true, s: true, m: "a ball of bat guano" } });
const allSpells = [fireBolt, shield, bless, findFamiliar, fireball];

const noGrants = {
  subclassAlwaysPrepared: [],
  subclassBonusKnown: [],
  optionalFeatureGranted: [],
};

describe("buildSpellListExport", () => {
  it("sorts by level then name and maps flags", () => {
    const result = buildSpellListExport({
      spellSelections: { 3: [pick(fireball)], 1: [pick(shield), pick(findFamiliar)], 0: [pick(fireBolt)] },
      spellcasting: noGrants,
      allSpells,
      characterLevel: 5,
    });
    expect(result.map((entry) => entry.name)).toEqual([
      "Fire Bolt",
      "Find Familiar",
      "Shield",
      "Fireball",
    ]);
    const ff = result[1];
    expect(ff.isRitual).toBe(true);
    expect(ff.hasMaterial).toBe(true);
    expect(ff.notes).toBe("10 GP worth of charcoal");
    expect(result[3].notes).toBeUndefined(); // material without a cost
  });

  it("adds unlocked grants, tags always-prepared and dedupes by name", () => {
    const result = buildSpellListExport({
      spellSelections: { 1: [pick(shield)] },
      spellcasting: {
        subclassAlwaysPrepared: [
          { name: "Bless", grantType: "always-prepared", unlockedAtLevel: 3 },
          { name: "Fireball", grantType: "always-prepared", unlockedAtLevel: 9 },
        ],
        subclassBonusKnown: [{ name: "shield", grantType: "bonus-known", unlockedAtLevel: 1 }],
        optionalFeatureGranted: [],
      },
      allSpells,
      characterLevel: 5,
    });
    expect(result.map((entry) => entry.name)).toEqual(["Bless", "Shield"]);
    expect(result[0].notes).toBe("Always prepared");
    expect(result[0].isConcentration).toBe(true);
  });
});

describe("PDF_SPELL_ROWS", () => {
  it("covers the 29 text rows with unique fields and checkboxes", () => {
    expect(PDF_SPELL_ROWS).toHaveLength(29);
    const indexes = PDF_SPELL_ROWS.map((row) => row.fieldIndex);
    expect(new Set(indexes).size).toBe(29);
    expect([...indexes].sort((a, b) => a - b)).toEqual(Array.from({ length: 29 }, (_, i) => i));
    const boxes = PDF_SPELL_ROWS.flatMap((row) => [row.c, row.r, row.m]);
    expect(new Set(boxes).size).toBe(87);
    // The topmost diamond row has no text fields and must stay unused.
    expect(boxes).not.toContain("Check Box0");
    expect(boxes).not.toContain("Check Box59");
    expect(boxes).not.toContain("Check Box60");
  });
});
