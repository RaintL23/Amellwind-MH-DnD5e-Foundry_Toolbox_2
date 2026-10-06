import { describe, expect, it } from "vitest";
import type { ItemBaseIndexes, RawItemEntity } from "../utils/item-raw.types";
import {
  renderDndItemPlainDescription,
  resolveDndItemOwnEntries,
} from "./item.mapper";
import { mapDndBaseItemToArmor } from "./dnd-armor.mapper";
import { mapDndBaseItemToWeapon } from "./dnd-weapon.mapper";

function makeIndexes(itemEntries: Record<string, unknown[]> = {}): ItemBaseIndexes {
  return {
    itemTypes: new Map(),
    itemProperties: new Map(),
    itemMasteries: new Map(),
    itemTypeAdditionalEntries: [],
    itemEntries: new Map(Object.entries(itemEntries)),
  };
}

const nestedArmor: RawItemEntity = {
  name: "Armor of Testing",
  source: "TST",
  type: "MA",
  ac: 14,
  armor: true,
  _isBaseItem: true,
  entries: [
    "You have resistance to {@damage 1d6} damage.",
    {
      type: "list",
      items: [
        "Plain bullet",
        { type: "item", name: "Named", entries: ["Named bullet body."] },
      ],
    },
    { type: "entries", name: "Curse", entries: ["Cursed text."] },
  ],
};

describe("renderDndItemPlainDescription", () => {
  it("keeps nested lists and named entries the compendium shows", () => {
    expect(renderDndItemPlainDescription(nestedArmor, makeIndexes())).toBe(
      [
        "You have resistance to 1d6 damage.",
        "• Plain bullet",
        "• Named. Named bullet body.",
        "Curse. Cursed text.",
      ].join("\n\n"),
    );
  });

  it("expands {#itemEntry} refs from the shared indexes", () => {
    const raw: RawItemEntity = {
      name: "Ref Sword",
      source: "TST",
      entries: ["{#itemEntry Shared Text|TST}"],
    };
    const indexes = makeIndexes({ "shared text|tst": ["Expanded body."] });
    expect(resolveDndItemOwnEntries(raw, indexes)).toEqual(["Expanded body."]);
  });
});

describe("Builder equipment mappers share the compendium description", () => {
  it("armor description includes nested content", () => {
    const armor = mapDndBaseItemToArmor(nestedArmor, makeIndexes());
    expect(armor?.description).toContain("• Named. Named bullet body.");
  });

  it("weapon description uses the same renderer", () => {
    const raw: RawItemEntity = {
      ...nestedArmor,
      name: "Sword of Testing",
      type: "M",
      weapon: true,
      armor: undefined,
    };
    expect(mapDndBaseItemToWeapon(raw, makeIndexes()).description).toBe(
      renderDndItemPlainDescription(raw, makeIndexes()),
    );
  });
});
