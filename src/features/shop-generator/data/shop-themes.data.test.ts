import { describe, expect, it } from "vitest";
import {
  getShopTheme,
  itemMatchesShopTheme,
} from "./shop-themes.data";

describe("itemMatchesShopTheme", () => {
  it("keeps potions in alchemist shops and rejects weapons/armor", () => {
    const theme = getShopTheme("alchemist");
    expect(
      itemMatchesShopTheme(
        "Potion",
        "potion of healing potion common",
        theme,
      ),
    ).toBe(true);
    expect(
      itemMatchesShopTheme(
        "Poison",
        "assassin's blood poison",
        theme,
      ),
    ).toBe(true);
    expect(
      itemMatchesShopTheme(
        "Weapon",
        "flame tongue longsword spell fire",
        theme,
      ),
    ).toBe(false);
    expect(
      itemMatchesShopTheme(
        "Wondrous Item",
        "alchemy jug alchem",
        theme,
      ),
    ).toBe(false);
  });

  it("keeps arcane foci and rejects spell-tagged weapons", () => {
    const theme = getShopTheme("arcane");
    expect(
      itemMatchesShopTheme("Wand", "wand of fireballs wand", theme),
    ).toBe(true);
    expect(
      itemMatchesShopTheme(
        "Wondrous Item",
        "bag of holding wondrous",
        theme,
      ),
    ).toBe(true);
    expect(
      itemMatchesShopTheme(
        "Weapon",
        "sword of sharpness spell weapon",
        theme,
      ),
    ).toBe(false);
    expect(
      itemMatchesShopTheme("Armor", "armor of invulnerability", theme),
    ).toBe(false);
    expect(itemMatchesShopTheme("Potion", "potion of healing", theme)).toBe(
      false,
    );
  });

  it("restricts temple wondrous items to sacred keywords", () => {
    const theme = getShopTheme("temple");
    expect(
      itemMatchesShopTheme("Holy Symbol", "holy symbol amulet", theme),
    ).toBe(true);
    expect(
      itemMatchesShopTheme(
        "Wondrous Item",
        "amulet of the devout holy cleric",
        theme,
      ),
    ).toBe(true);
    expect(
      itemMatchesShopTheme(
        "Wondrous Item",
        "deck of many things chaotic",
        theme,
      ),
    ).toBe(false);
    expect(
      itemMatchesShopTheme("Weapon", "holy avenger longsword", theme),
    ).toBe(false);
  });

  it("limits blacksmith stock to forged gear", () => {
    const theme = getShopTheme("blacksmith");
    expect(itemMatchesShopTheme("Melee Weapon", "longsword", theme)).toBe(
      true,
    );
    expect(itemMatchesShopTheme("Armor", "plate armor", theme)).toBe(true);
    expect(itemMatchesShopTheme("Scroll", "spell scroll", theme)).toBe(false);
    expect(
      itemMatchesShopTheme("Wondrous Item", "belt of giant strength", theme),
    ).toBe(false);
  });
});
