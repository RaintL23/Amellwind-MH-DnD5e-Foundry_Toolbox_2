import { describe, expect, it } from "vitest";
import {
  buildFoundryItemFilename,
  ensureFoundryItemFilename,
  formatWeaponFoundryItemName,
  isFoundryItemDocument,
  stripFoundryWeaponRaritySuffix,
} from "@/shared/foundry/item-naming";

describe("foundry item naming", () => {
  it("builds fvtt-Item filenames with rarity suffix for weapons", () => {
    expect(buildFoundryItemFilename("Great Sword", "Rare")).toBe(
      "fvtt-Item-great-sword-rare.json",
    );
    expect(buildFoundryItemFilename("Great Sword", "Base")).toBe(
      "fvtt-Item-great-sword-base.json",
    );
  });

  it("normalizes existing prefixes case-insensitively", () => {
    expect(ensureFoundryItemFilename("fvtt-item-melody-of-might.json")).toBe(
      "fvtt-Item-melody-of-might.json",
    );
    expect(ensureFoundryItemFilename("melody-of-might")).toBe(
      "fvtt-Item-melody-of-might.json",
    );
  });

  it("formats weapon Foundry display names with rarity", () => {
    expect(formatWeaponFoundryItemName("Great Sword", "Rare")).toBe(
      "Great Sword (Rare)",
    );
    expect(formatWeaponFoundryItemName("Great Sword", "Base")).toBe(
      "Great Sword (Base)",
    );
    expect(formatWeaponFoundryItemName("Great Sword (Uncommon)", "Rare")).toBe(
      "Great Sword (Rare)",
    );
  });

  it("strips rarity suffixes from weapon names", () => {
    expect(stripFoundryWeaponRaritySuffix("Great Sword (Very Rare)")).toBe(
      "Great Sword",
    );
  });

  it("detects Item documents vs Actors", () => {
    expect(isFoundryItemDocument({ type: "weapon", name: "GS" })).toBe(true);
    expect(isFoundryItemDocument({ type: "character", name: "Hero" })).toBe(
      false,
    );
  });
});
