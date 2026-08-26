import { describe, expect, it } from "vitest";
import type { Rune } from "@/shared/types";
import {
  buildRuneSearchIndex,
  matchesRuneSearchQuery,
} from "./rune-search.utils";

function makeRune(partial: Partial<Rune> & Pick<Rune, "name">): Rune {
  return {
    monsterName: "Rathalos",
    monsterSource: "MHMM",
    monsterCr: "10",
    monsterCrs: ["10"],
    tier: 2,
    carveChance: "1-10",
    captureChance: "-",
    rolls: 3,
    slots: ["A", "W"],
    armorEffect: null,
    weaponEffect: null,
    otherEffect: null,
    tags: [],
    weaponTags: [],
    armorTags: [],
    ...partial,
  };
}

describe("buildRuneSearchIndex / matchesRuneSearchQuery", () => {
  const rune = makeRune({
    name: "Rathalos Scale",
    armorEffect: "You have resistance to {@damage fire} damage.",
    weaponEffect: "This weapon deals an extra {@dice 1d6} fire damage.",
    armorTags: ["mechanic:resistance", "damage:fire"],
    weaponTags: ["damage:fire"],
    tags: ["mechanic:resistance", "damage:fire"],
  });

  const [entry] = buildRuneSearchIndex([rune], null);

  it("matches name, monster, and parsed effect text without re-parsing tags", () => {
    expect(matchesRuneSearchQuery(entry, "scale")).toBe(true);
    expect(matchesRuneSearchQuery(entry, "rathalos")).toBe(true);
    expect(matchesRuneSearchQuery(entry, "resistance to fire")).toBe(true);
    expect(matchesRuneSearchQuery(entry, "1d6 fire")).toBe(true);
    expect(matchesRuneSearchQuery(entry, "{@damage")).toBe(false);
    expect(matchesRuneSearchQuery(entry, "kirin")).toBe(false);
  });

  it("respects slot and same-side tag gates when searching effect text", () => {
    expect(
      matchesRuneSearchQuery(entry, "1d6", {
        slot: "A",
        tags: [],
        materialEffectTier: [],
      }),
    ).toBe(false);
    expect(
      matchesRuneSearchQuery(entry, "1d6", {
        slot: "W",
        tags: [],
        materialEffectTier: [],
      }),
    ).toBe(true);
    expect(
      matchesRuneSearchQuery(entry, "resistance", {
        slot: "",
        tags: ["mechanic:resistance"],
        materialEffectTier: [],
      }),
    ).toBe(true);
  });
});
