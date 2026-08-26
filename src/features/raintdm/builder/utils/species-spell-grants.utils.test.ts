import { describe, expect, it } from "vitest";
import { parseRaceAdditionalSpells } from "@/features/dnd/races/mappers/dnd-race.mapper";
import { parseInnateSpellGrantsFromText } from "@/shared/utils/species-innate-spell-text.parser";
import {
  buildSpeciesLineageSpellSelectionsFromCatalog,
  listSpeciesLineageSpellGrantPreviews,
} from "@/features/raintdm/builder/utils/species-spell-grants.utils";
import type { Spell } from "@/shared/types";

const MODERN_ADDITIONAL_SPELLS = [
  {
    innate: {
      "1": ["create bonfire|XGE#c"],
      "3": { daily: { "1": ["enlarge/reduce"] } },
      "5": { daily: { "1": ["blindness/deafness"] } },
    },
    ability: "int",
  },
];

const CATALOG: Spell[] = [
  {
    id: "create-bonfire",
    name: "Create Bonfire",
    level: 0,
    schoolName: "Conjuration",
  } as Spell,
  {
    id: "enlarge-reduce",
    name: "Enlarge/Reduce",
    level: 2,
    schoolName: "Transmutation",
  } as Spell,
  {
    id: "blindness-deafness",
    name: "Blindness/Deafness",
    level: 2,
    schoolName: "Necromancy",
  } as Spell,
];

describe("parseRaceAdditionalSpells — Modern Wyverian shape", () => {
  it("extracts cantrip + leveled daily grants", () => {
    const parsed = parseRaceAdditionalSpells(MODERN_ADDITIONAL_SPELLS, null);
    expect(parsed.namedSpellGroups).toHaveLength(1);
    const group = parsed.namedSpellGroups[0]!;
    expect(group.cantrips.map((c) => c.toLowerCase())).toContain(
      "create bonfire",
    );
    expect(group.innateSpells).toEqual(
      expect.arrayContaining([
        {
          name: expect.stringMatching(/enlarge\/reduce/i),
          unlockedAtCharacterLevel: 3,
        },
        {
          name: expect.stringMatching(/blindness\/deafness/i),
          unlockedAtCharacterLevel: 5,
        },
      ]),
    );
  });
});

describe("parseInnateSpellGrantsFromText", () => {
  it("parses Modern Magic prose", () => {
    const text =
      "You know the {@spell create bonfire|XGE} cantrip. When you reach 3rd level, you can cast the {@spell enlarge/reduce} spell once per day. When you reach 5th level, you can also cast the {@spell blindness/deafness} spell once per day. Intelligence is your spellcasting ability for these spells.";
    const parsed = parseInnateSpellGrantsFromText(text);
    expect(parsed.cantrips.map((c) => c.toLowerCase())).toContain(
      "create bonfire",
    );
    expect(parsed.innateSpells).toEqual(
      expect.arrayContaining([
        {
          name: expect.stringMatching(/enlarge\/reduce/i),
          unlockedAtCharacterLevel: 3,
        },
        {
          name: expect.stringMatching(/blindness\/deafness/i),
          unlockedAtCharacterLevel: 5,
        },
      ]),
    );
  });
});

describe("species lineage unlock by character level", () => {
  const source = parseRaceAdditionalSpells(MODERN_ADDITIONAL_SPELLS, null);

  it("grants only the cantrip at level 1", () => {
    const selections = buildSpeciesLineageSpellSelectionsFromCatalog(
      source,
      null,
      1,
      CATALOG,
    );
    expect(selections.map((s) => s.name.toLowerCase())).toEqual([
      "create bonfire",
    ]);
  });

  it("adds enlarge/reduce at level 3", () => {
    const selections = buildSpeciesLineageSpellSelectionsFromCatalog(
      source,
      null,
      3,
      CATALOG,
    );
    expect(selections.map((s) => s.name.toLowerCase()).sort()).toEqual([
      "create bonfire",
      "enlarge/reduce",
    ]);
  });

  it("adds blindness/deafness at level 5", () => {
    const selections = buildSpeciesLineageSpellSelectionsFromCatalog(
      source,
      null,
      5,
      CATALOG,
    );
    expect(selections.map((s) => s.name.toLowerCase()).sort()).toEqual([
      "blindness/deafness",
      "create bonfire",
      "enlarge/reduce",
    ]);
  });

  it("previews locked and unlocked grants", () => {
    const previews = listSpeciesLineageSpellGrantPreviews(
      source,
      null,
      3,
      CATALOG,
    );
    const byName = Object.fromEntries(
      previews.map((p) => [p.name.toLowerCase(), p]),
    );
    expect(byName["create bonfire"]?.unlocked).toBe(true);
    expect(byName["enlarge/reduce"]?.unlocked).toBe(true);
    expect(byName["blindness/deafness"]?.unlocked).toBe(false);
  });
});
