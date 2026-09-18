import { describe, expect, it } from "vitest";
import {
  mapArmorClass,
  mapCreatureType,
  mapHP,
} from "./actor-from-raw.mapper";

describe("mapArmorClass / mapHP special formulas", () => {
  it("keeps companion AC special text", () => {
    expect(mapArmorClass([{ special: "14 + PB (natural armor)" }])).toEqual([
      { ac: 0, from: undefined, special: "14 + PB (natural armor)" },
    ]);
  });

  it("keeps companion HP special text", () => {
    expect(
      mapHP({
        special: "5 + five times your ranger level",
      }),
    ).toEqual({
      formula: undefined,
      average: undefined,
      special: "5 + five times your ranger level",
    });
  });
});

describe("mapCreatureType", () => {
  it("maps plain string types", () => {
    expect(mapCreatureType({ type: "dragon" })).toEqual({ type: "dragon" });
  });

  it("maps choose-from type objects without [object Object]", () => {
    expect(
      mapCreatureType({
        type: {
          type: { choose: { from: ["celestial", "fiend", "undead"] } },
        },
      }),
    ).toEqual({ type: "celestial or fiend or undead" });
  });

  it("maps tagged type objects", () => {
    expect(
      mapCreatureType({
        type: {
          type: "humanoid",
          tags: ["elf", { tag: "shapechanger" }],
        },
      }),
    ).toEqual({ type: "humanoid", tags: ["elf", "shapechanger"] });
  });
});
