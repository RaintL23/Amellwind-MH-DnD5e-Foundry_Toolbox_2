import { describe, expect, it } from "vitest";
import {
  buildConditionPhraseLinksForText,
  findConditionNameHitsInText,
  type ConditionCatalogEntry,
} from "./condition-phrase-links.utils";

const ENTRIES: ConditionCatalogEntry[] = [
  { name: "Waterblight", kind: "condition" },
  { name: "Thunderblight", kind: "condition" },
  { name: "Frozen", kind: "condition" },
  { name: "Slick", kind: "condition" },
  { name: "Stunned", kind: "condition" },
  { name: "Poisoned", kind: "condition" },
  { name: "Frenzy Virus", kind: "disease" },
  { name: "Iceblight", kind: "disease" },
];

describe("findConditionNameHitsInText", () => {
  it("links bare blight condition names", () => {
    const hits = findConditionNameHitsInText(
      "or be afflicted with waterblight until the end of its next turn.",
      ENTRIES,
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      name: "Waterblight",
      kind: "condition",
      phrase: "waterblight",
    });
  });

  it("links multi-word disease names", () => {
    const hits = findConditionNameHitsInText(
      "contract the Frenzy Virus after the hunt",
      ENTRIES,
    );
    expect(hits[0]).toMatchObject({
      name: "Frenzy Virus",
      kind: "disease",
      phrase: "Frenzy Virus",
    });
  });

  it("prefers longer overlapping names", () => {
    const hits = findConditionNameHitsInText(
      "suffers thunderblight",
      ENTRIES,
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]?.name).toBe("Thunderblight");
  });

  it("prefers disease when the same name is listed as both", () => {
    const hits = findConditionNameHitsInText("iceblight spreads", [
      { name: "Iceblight", kind: "condition" },
      { name: "Iceblight", kind: "disease" },
    ]);
    expect(hits[0]?.kind).toBe("disease");
  });

  it("respects word boundaries", () => {
    expect(
      findConditionNameHitsInText("unslicked residue", ENTRIES),
    ).toEqual([]);
  });
});

describe("buildConditionPhraseLinksForText", () => {
  it("builds in-place phrase ids without href", () => {
    const links = buildConditionPhraseLinksForText(
      "immune to poisoned and the frenzy virus",
      ENTRIES,
    );
    expect(
      links.some(
        (l) => l.id === "condition:Poisoned" && l.href === undefined,
      ),
    ).toBe(true);
    expect(
      links.some(
        (l) =>
          l.id === "disease:Frenzy Virus" &&
          l.phrase.toLowerCase() === "frenzy virus" &&
          l.href === undefined,
      ),
    ).toBe(true);
  });
});
