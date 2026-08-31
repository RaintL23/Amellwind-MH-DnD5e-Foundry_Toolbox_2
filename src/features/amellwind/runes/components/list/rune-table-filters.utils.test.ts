import { describe, expect, it } from "vitest";
import type { Rune } from "@/shared/types";
import {
  buildRuneColumnFilters,
  matchesRuneListRow,
  payloadFromRuneFilters,
  sortRuneListRows,
  type RuneListRow,
} from "./rune-table-filters.utils";
import type { MaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import { UNKNOWN_MATERIAL_EFFECT_TIER } from "@/features/amellwind/material-effects/constants/material-effect.constants";

function makeRow(partial: Partial<Rune> & Pick<Rune, "name">): RuneListRow {
  const rune: Rune = {
    monsterName: "Test Monster",
    monsterSource: "GTMH",
    monsterCr: "5",
    monsterCrs: ["5"],
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
  return {
    rune,
    name: rune.name.toLowerCase(),
    monsterName: rune.monsterName.toLowerCase(),
    armorHaystack: (rune.armorEffect ?? "").toLowerCase(),
    weaponHaystack: (rune.weaponEffect ?? "").toLowerCase(),
    materialEffectTiers: [UNKNOWN_MATERIAL_EFFECT_TIER],
  };
}

const emptyIndex: MaterialEffectNameIndex = {
  all: [],
  bySlot: { weapon: [], armor: [] },
  byKey: new Map(),
};

describe("rune table column filters", () => {
  it("requires all tags on the same effect side", () => {
    const row = makeRow({
      name: "Rathalos Scale",
      armorEffect: "You are immune to fire damage while you wear this armor.",
      weaponEffect: "Extra fire damage on hit.",
      armorTags: ["mechanic:immunity", "damage:fire", "type:defensive"],
      weaponTags: ["damage:fire", "type:offensive"],
    });

    expect(
      matchesRuneListRow(
        row,
        payloadFromRuneFilters({
          name: "",
          monster: [],
          monsterCr: [],
          slot: "A",
          obtainment: [],
          tag: ["damage:fire", "mechanic:immunity"],
          monsterTier: [],
          materialEffectTier: [],
          materialEffect: [],
        }),
        emptyIndex,
      ),
    ).toBe(true);
  });

  it("round-trips dialog filters through column filter state", () => {
    const filters = {
      name: "fire",
      monster: ["Rathalos"],
      monsterCr: ["5"],
      slot: "A" as const,
      obtainment: ["Carveable"],
      tag: ["damage:fire"],
      monsterTier: ["2"],
      materialEffectTier: ["Rare"],
      materialEffect: ["Fire Resist"],
    };
    const columnFilters = buildRuneColumnFilters(filters);
    expect(columnFilters[0]?.value).toMatchObject({
      q: "fire",
      monster: ["Rathalos"],
      materialEffectName: ["Fire Resist"],
    });
  });

  it("sorts filtered rows to match table column order", () => {
    const rows = [
      makeRow({ name: "Z Scale", monsterName: "Zinogre" }),
      makeRow({ name: "A Scale", monsterName: "Anjanath" }),
      makeRow({ name: "M Scale", monsterName: "Mizutsune" }),
    ];

    expect(
      sortRuneListRows(rows, [{ id: "name", desc: false }]).map(
        (row) => row.rune.name,
      ),
    ).toEqual(["A Scale", "M Scale", "Z Scale"]);

    expect(
      sortRuneListRows(rows, [{ id: "monsterName", desc: true }]).map(
        (row) => row.rune.monsterName,
      ),
    ).toEqual(["Zinogre", "Mizutsune", "Anjanath"]);
  });
});
