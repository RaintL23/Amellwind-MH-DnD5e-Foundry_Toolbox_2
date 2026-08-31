import { describe, expect, it } from "vitest";
import {
  categorizeRuneTag,
  mergeTagFilterSelections,
  splitTagFilterSelections,
  splitTagsByCategory,
} from "./rune-tag-categories.utils";

describe("rune tag filter categories", () => {
  it("classifies weapon, class, damage, and play-style tags", () => {
    expect(categorizeRuneTag("weapon-type:bow")).toBe("weapon");
    expect(categorizeRuneTag("class:spellcaster")).toBe("class");
    expect(categorizeRuneTag("damage:fire")).toBe("damage");
    expect(categorizeRuneTag("mechanic:damage-reduction")).toBe("damage");
    expect(categorizeRuneTag("mechanic:extra-damage:major")).toBe("damage");
    expect(categorizeRuneTag("type:offensive")).toBe("playStyle");
    expect(categorizeRuneTag("type:support")).toBe("playStyle");
    expect(categorizeRuneTag("mechanic:passive")).toBe("playStyle");
    expect(categorizeRuneTag("mechanic:active")).toBe("playStyle");
    expect(categorizeRuneTag("mechanic:movement")).toBe("other");
  });

  it("splits and merges tag filter selections", () => {
    const selected = [
      "weapon-type:hammer",
      "class:spellcaster",
      "damage:cold",
      "mechanic:damage-reduction",
      "type:defensive",
      "mechanic:passive",
      "mechanic:movement",
    ];

    const split = splitTagFilterSelections(selected);
    expect(split.tagWeapon).toEqual(["weapon-type:hammer"]);
    expect(split.tagClass).toEqual(["class:spellcaster"]);
    expect(split.tagDamage).toEqual([
      "damage:cold",
      "mechanic:damage-reduction",
    ]);
    expect(split.tagPlayStyle).toEqual([
      "mechanic:passive",
      "type:defensive",
    ]);
    expect(split.tag).toEqual(["mechanic:movement"]);

    expect(mergeTagFilterSelections(split).sort()).toEqual(selected.sort());
  });

  it("groups unique tags into sorted category buckets", () => {
    expect(
      splitTagsByCategory([
        "mechanic:bonus-action",
        "class:monk",
        "weapon-type:bow",
        "damage:fire",
      ]),
    ).toEqual({
      weapon: ["weapon-type:bow"],
      class: ["class:monk"],
      damage: ["damage:fire"],
      playStyle: [],
      other: ["mechanic:bonus-action"],
    });
  });
});
