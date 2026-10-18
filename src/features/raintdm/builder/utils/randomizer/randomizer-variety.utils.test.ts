import { beforeEach, describe, expect, it } from "vitest";
import {
  drawFromBag,
  excludeLastPick,
  getLastPick,
  rememberPick,
  resetVarietyMemory,
  type VarietyStorage,
} from "./randomizer-variety.utils";

function memoryStorage(): VarietyStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

const CLASSES = [
  "artificer", "barbarian", "bard", "cleric", "druid", "fighter", "monk",
  "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard",
];

describe("drawFromBag", () => {
  beforeEach(() => resetVarietyMemory());

  it("returns every class once before repeating any", () => {
    const storage = memoryStorage();
    const drawn = CLASSES.map(() => drawFromBag("class", CLASSES, storage));
    expect(new Set(drawn).size).toBe(CLASSES.length);
  });

  it("never repeats the same class back to back, even across refills", () => {
    const storage = memoryStorage();
    let previous: string | null = null;
    for (let i = 0; i < CLASSES.length * 6; i++) {
      const next = drawFromBag("class", CLASSES, storage);
      expect(next).not.toBe(previous);
      previous = next;
    }
  });

  it("drops keys that are no longer in the pool", () => {
    const storage = memoryStorage();
    drawFromBag("class", CLASSES, storage);
    const reduced = ["fighter", "wizard"];
    const next = drawFromBag("class", reduced, storage);
    expect(reduced).toContain(next);
  });

  it("works without storage (memory fallback)", () => {
    const first = drawFromBag("class", ["a", "b"], null);
    const second = drawFromBag("class", ["a", "b"], null);
    expect(new Set([first, second]).size).toBe(2);
  });
});

describe("excludeLastPick", () => {
  it("removes the last pick when other options remain", () => {
    expect(excludeLastPick(["a", "b", "c"], (x) => x, "b")).toEqual(["a", "c"]);
  });

  it("keeps a single option even if it was the last pick", () => {
    expect(excludeLastPick(["a"], (x) => x, "a")).toEqual(["a"]);
  });

  it("remembers picks per category", () => {
    const storage = memoryStorage();
    rememberPick("species", "elf", storage);
    expect(getLastPick("species", storage)).toBe("elf");
    expect(getLastPick("background", storage)).toBeNull();
  });
});
