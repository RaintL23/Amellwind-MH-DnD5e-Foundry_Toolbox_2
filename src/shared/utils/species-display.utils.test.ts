import { describe, expect, it } from "vitest";
import {
  resolveSpeciesDisplayStats,
  type SpeciesContentData,
} from "./species-display.utils";
import {
  combineSpeciesSpellGrantSource,
  resolveActiveSpellGroup,
} from "./species-spell-groups.utils";

function makeSpecies(overrides: Partial<SpeciesContentData>): SpeciesContentData {
  return {
    name: "Elf",
    source: "PHB",
    sizes: ["Medium"],
    speed: "30 ft.",
    abilitySummary: "+2 DEX",
    darkvision: 60,
    resistances: [],
    resistanceSummary: "",
    traitTags: ["Fey Ancestry"],
    traits: [],
    fluff: "",
    skillGrants: [
      { kind: "fixed", skills: ["prc"], source: { type: "species", name: "Elf" } },
    ],
    languageGrants: [],
    ...overrides,
  };
}

describe("resolveSpeciesDisplayStats", () => {
  it("merges subspecies stats over the base species", () => {
    const base = makeSpecies({});
    const sub = makeSpecies({
      name: "Wood Elf",
      speed: "35 ft.",
      abilitySummary: "+1 WIS",
      darkvision: undefined,
      resistances: ["poison"],
      traitTags: ["Fey Ancestry", "Mask of the Wild"],
      skillGrants: [],
    });

    const stats = resolveSpeciesDisplayStats(base, sub);

    expect(stats.speed).toBe("35 ft.");
    expect(stats.darkvision).toBe(60);
    expect(stats.resistances).toEqual(["poison"]);
    expect(stats.traitTags).toEqual(["Fey Ancestry", "Mask of the Wild"]);
    expect(stats.baseAbilitySummary).toBe("+2 DEX");
    expect(stats.subspeciesAbilitySummary).toBe("+1 WIS");
    expect(stats.proficiencyRows).toEqual([
      { label: "Skills", value: "Perception" },
    ]);
  });

  it("treats the em-dash ability summary as empty", () => {
    const stats = resolveSpeciesDisplayStats(makeSpecies({ abilitySummary: "—" }));
    expect(stats.baseAbilitySummary).toBeNull();
  });
});

describe("species spell groups", () => {
  const groups = [
    { name: "Abyssal", cantrips: ["Poison Spray"], resistance: "poison" as const },
    { name: "Infernal", cantrips: ["Fire Bolt"], resistance: "fire" as const },
  ];

  it("uses subspecies groups when present and stacks universal cantrips", () => {
    const source = combineSpeciesSpellGrantSource(
      { universalCantrips: ["Thaumaturgy"], namedSpellGroups: groups },
      { universalCantrips: ["Light"], namedSpellGroups: [groups[1]!] },
    );
    expect(source?.universalCantrips).toEqual(["Thaumaturgy", "Light"]);
    expect(source?.namedSpellGroups).toEqual([groups[1]]);
  });

  it("auto-selects a single group and requires a choice for several", () => {
    expect(
      resolveActiveSpellGroup({ namedSpellGroups: [groups[0]!] }, null)?.name,
    ).toBe("Abyssal");
    expect(resolveActiveSpellGroup({ namedSpellGroups: groups }, null)).toBeNull();
    expect(
      resolveActiveSpellGroup({ namedSpellGroups: groups }, "infernal")?.name,
    ).toBe("Infernal");
  });
});
