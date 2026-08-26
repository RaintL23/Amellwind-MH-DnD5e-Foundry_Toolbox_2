import { describe, expect, it } from "vitest";
import {
  buildSpellPhraseLinksForText,
  findSpellNameHitsInText,
} from "./spell-phrase-links.utils";

const NAMES = [
  "Speak with Dead",
  "Haste",
  "Shield",
  "Protection from Energy",
  "Enlarge/Reduce",
  "Mending",
  "Aganazzar's Scorcher",
  "Burning Hands",
  "Scorching Ray",
  "Poison Spray",
];

describe("findSpellNameHitsInText", () => {
  it("links speak with dead including the trailing spell cue", () => {
    const text =
      "ask one question as if by the speak with dead spell.";
    const hits = findSpellNameHitsInText(text, NAMES);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      name: "Speak with Dead",
      phrase: "speak with dead spell",
    });
  });

  it("requires spell/cantrip cue for single-word names", () => {
    expect(findSpellNameHitsInText("raise your shield and jump", NAMES)).toEqual(
      [],
    );
    expect(
      findSpellNameHitsInText("you have resistance to fire damage", [
        ...NAMES,
        "Resistance",
      ]),
    ).toEqual([]);
    const hits = findSpellNameHitsInText("cast the haste spell from it", NAMES);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.name).toBe("Haste");
    expect(hits[0]?.phrase).toBe("haste spell");
  });

  it("allows bare single-word names before a list parenthetical", () => {
    const hits = findSpellNameHitsInText("harm (6 runes)", [...NAMES, "Harm"]);
    expect(hits[0]?.name).toBe("Harm");
    expect(hits[0]?.phrase).toBe("harm");
  });

  it("matches cantrips with a cantrip cue", () => {
    const hits = findSpellNameHitsInText(
      "you know the mending cantrip, but you must lick",
      NAMES,
    );
    expect(hits[0]).toMatchObject({
      name: "Mending",
      phrase: "mending cantrip",
    });
  });

  it("allows optional parenthetical before spell", () => {
    const hits = findSpellNameHitsInText(
      "cast the protection from energy (lightning) spell once a day",
      NAMES,
    );
    expect(hits[0]).toMatchObject({
      name: "Protection from Energy",
      phrase: "protection from energy (lightning) spell",
    });
  });

  it("matches slash names and apostrophes", () => {
    expect(
      findSpellNameHitsInText("cast the enlarge/reduce spell", NAMES)[0]?.name,
    ).toBe("Enlarge/Reduce");
    expect(
      findSpellNameHitsInText(
        "aganazzar's scorcher (2 runes), or flaming sphere",
        NAMES,
      )[0]?.name,
    ).toBe("Aganazzar's Scorcher");
  });

  it("matches bare multi-word names in lists", () => {
    const hits = findSpellNameHitsInText(
      "burning hands (1 rune) scorching ray (2 runes)",
      NAMES,
    );
    expect(hits.map((h) => h.name)).toEqual([
      "Burning Hands",
      "Scorching Ray",
    ]);
  });

  it("prefers the longer overlapping spell name", () => {
    // "Poison Spray" should win over a hypothetical shorter fragment
    const hits = findSpellNameHitsInText(
      "you know the poison spray cantrip",
      NAMES,
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]?.name).toBe("Poison Spray");
  });
});

describe("buildSpellPhraseLinksForText", () => {
  it("builds /spells query links for hits", () => {
    const links = buildSpellPhraseLinksForText(
      "as if by the speak with dead spell.",
      NAMES,
    );
    expect(links.some((l) => l.href === "/spells?spell=Speak+with+Dead")).toBe(
      true,
    );
    expect(
      links.some(
        (l) =>
          l.phrase.toLowerCase() === "speak with dead spell" &&
          l.href === "/spells?spell=Speak+with+Dead",
      ),
    ).toBe(true);
  });
});
