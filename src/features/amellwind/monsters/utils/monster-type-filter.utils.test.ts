import { describe, expect, it } from "vitest";
import {
  buildMonsterTypeTaxonomy,
  encodeMonsterTypeFilterValue,
  formatMonsterTypeTagLabel,
  monsterMatchesTypeFilters,
  parseMonsterTypeFilterValue,
} from "./monster-type-filter.utils";
import { buildMonsterFilterSections } from "./monster-filter-sections";

describe("monster type filter utils", () => {
  it("encodes and parses type + tag values", () => {
    expect(encodeMonsterTypeFilterValue("wyvern")).toBe("wyvern");
    expect(encodeMonsterTypeFilterValue("wyvern", "flying")).toBe(
      "wyvern:flying",
    );
    expect(parseMonsterTypeFilterValue("wyvern")).toEqual({ type: "wyvern" });
    expect(parseMonsterTypeFilterValue("wyvern:flying")).toEqual({
      type: "wyvern",
      tag: "flying",
    });
  });

  it("builds taxonomy with sorted tags per base type", () => {
    const taxonomy = buildMonsterTypeTaxonomy([
      { type: { type: "wyvern", tags: ["flying"] } },
      { type: { type: "wyvern", tags: ["brute", "flying"] } },
      { type: { type: "amphibian", tags: [] } },
      { type: { type: "beast", tags: ["Fanged"] } },
    ]);

    expect(taxonomy).toEqual([
      { type: "amphibian", tags: [] },
      { type: "beast", tags: ["fanged"] },
      { type: "wyvern", tags: ["brute", "flying"] },
    ]);
  });

  it("matches base type and subtype filters", () => {
    const flying = { type: { type: "wyvern", tags: ["flying"] } };
    const brute = { type: { type: "wyvern", tags: ["brute"] } };
    const amphibian = { type: { type: "amphibian", tags: [] } };

    expect(monsterMatchesTypeFilters(flying, [])).toBe(true);
    expect(monsterMatchesTypeFilters(flying, ["wyvern"])).toBe(true);
    expect(monsterMatchesTypeFilters(flying, ["wyvern:flying"])).toBe(true);
    expect(monsterMatchesTypeFilters(flying, ["wyvern:brute"])).toBe(false);
    expect(monsterMatchesTypeFilters(brute, ["wyvern:flying", "amphibian"])).toBe(
      false,
    );
    expect(monsterMatchesTypeFilters(amphibian, ["amphibian"])).toBe(true);
    expect(monsterMatchesTypeFilters(amphibian, ["wyvern"])).toBe(false);
  });

  it("formats subtype labels for the filter UI", () => {
    expect(formatMonsterTypeTagLabel("wyvern", "flying")).toBe(
      "Flying Wyvern",
    );
  });
});

describe("buildMonsterFilterSections type hierarchy", () => {
  it("puts tagged types in expandable groups and plain types as flat options", () => {
    const sections = buildMonsterFilterSections(
      ["1"],
      [
        { type: "amphibian", tags: [] },
        { type: "wyvern", tags: ["flying", "fanged"] },
      ],
      ["forest"],
    );

    const typeSection = sections.find((section) => section.id === "type");
    expect(typeSection).toBeDefined();
    expect(typeSection?.options).toEqual([
      { value: "amphibian", label: "Amphibian" },
    ]);
    expect(typeSection?.groups).toEqual([
      {
        id: "type-wyvern",
        label: "Wyvern",
        options: [
          { value: "wyvern", label: "All Wyvern" },
          { value: "wyvern:flying", label: "Flying Wyvern" },
          { value: "wyvern:fanged", label: "Fanged Wyvern" },
        ],
      },
    ]);
  });
});
