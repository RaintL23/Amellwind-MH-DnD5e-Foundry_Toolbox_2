import { describe, expect, it } from "vitest";
import {
  mergeMonsterFeeds,
  mergeNamedFeeds,
  monsterNameKeys,
  normalizeMonsterName,
} from "./mm-supplement";

describe("normalizeMonsterName", () => {
  it("folds case, punctuation, and known spelling variants", () => {
    expect(normalizeMonsterName("Solider Helmcrab (MHW)")).toBe(
      "soldier helmcrab",
    );
    expect(normalizeMonsterName("Bloodsoaked Odogaron")).toBe(
      "blood soaked odogaron",
    );
    expect(normalizeMonsterName("Dah'ren Mohran")).toBe("dahren mohran");
  });
});

describe("monsterNameKeys", () => {
  it("equates juvenile comma and prefix order", () => {
    expect(monsterNameKeys("Dodogama, Juvenile")).toEqual(
      expect.arrayContaining([
        "dodogama, juvenile",
        "juvenile dodogama",
        "dodogama juvenile",
      ]),
    );
    expect(monsterNameKeys("Juvenile Dodogama")).toEqual(
      expect.arrayContaining(["juvenile dodogama", "dodogama, juvenile"]),
    );
  });
});

describe("mergeMonsterFeeds", () => {
  it("prefers local sheets and keeps GitHub-only names", () => {
    const result = mergeMonsterFeeds(
      [{ name: "Rathalos", source: "MHMM" }],
      [
        { name: "Rathalos", source: "MHMM-Patreon" },
        { name: "Chatacabra", source: "MHMM-Patreon" },
      ],
    );

    expect(result.monsters).toEqual([
      { name: "Rathalos", source: "MHMM-Patreon" },
      { name: "Chatacabra", source: "MHMM-Patreon" },
    ]);
    expect(result.unusedGithubNames).toEqual(["Rathalos"]);
  });

  it("retires a GitHub sheet when the PDF uses a folded name", () => {
    const result = mergeMonsterFeeds(
      [{ name: "Soldier Helmcrab" }],
      [{ name: "Solider Helmcrab (MHW)" }],
    );

    expect(result.monsters).toEqual([
      { name: "Solider Helmcrab (MHW)" },
    ]);
    expect(result.unusedGithubNames).toEqual(["Soldier Helmcrab"]);
  });

  it("retires GitHub juvenile sheets when the PDF uses comma order", () => {
    const result = mergeMonsterFeeds(
      [{ name: "Juvenile Dodogama" }],
      [{ name: "Dodogama, Juvenile" }],
    );

    expect(result.monsters).toHaveLength(1);
    expect(result.unusedGithubNames).toEqual(["Juvenile Dodogama"]);
  });

  it("keeps a GitHub-only name the PDF does not cover", () => {
    const result = mergeMonsterFeeds(
      [{ name: "Astalos" }, { name: "Crimson Qurupeco" }],
      [{ name: "Juvenile Astalos" }],
    );

    expect(result.monsters.map((m) => (m as { name: string }).name)).toEqual([
      "Juvenile Astalos",
      "Astalos",
      "Crimson Qurupeco",
    ]);
    expect(result.unusedGithubNames).toEqual([]);
  });
});

describe("mergeNamedFeeds", () => {
  it("retires a GitHub condition when the PDF lists it as a disease", () => {
    const result = mergeNamedFeeds(
      [{ name: "Iceblight", source: "MHMM" }],
      [{ name: "Frozen", source: "MHMM-Patreon" }],
      ["Iceblight"],
    );

    expect(result.items).toEqual([{ name: "Frozen", source: "MHMM-Patreon" }]);
    expect(result.unusedGithubNames).toEqual(["Iceblight"]);
  });
});
