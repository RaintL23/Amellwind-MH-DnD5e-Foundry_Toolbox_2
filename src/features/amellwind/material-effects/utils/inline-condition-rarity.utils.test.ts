import { describe, expect, it } from "vitest";
import {
  inferRarityFromConditionDefenseTags,
  inferRarityFromConditionImmunityTags,
} from "./inline-condition-rarity.utils";

describe("inferRarityFromConditionDefenseTags", () => {
  it("assigns Common for advantage against a condition", () => {
    expect(
      inferRarityFromConditionDefenseTags([
        "mechanic:against-condition",
        "mechanic:advantage",
        "mechanic:condition-poisoned",
        "mechanic:passive",
        "type:defensive",
      ]),
    ).toBe("Common");
  });

  it("returns null without against-condition", () => {
    expect(
      inferRarityFromConditionDefenseTags([
        "mechanic:advantage",
        "mechanic:saving-throw",
      ]),
    ).toBeNull();
  });

  it("returns null for condition immunity (stronger; not this band)", () => {
    expect(
      inferRarityFromConditionDefenseTags([
        "mechanic:against-condition",
        "mechanic:advantage",
        "mechanic:immunity",
        "mechanic:condition-poisoned",
      ]),
    ).toBeNull();
  });
});

describe("inferRarityFromConditionImmunityTags", () => {
  it("assigns Uncommon for immunity to the poisoned condition", () => {
    expect(
      inferRarityFromConditionImmunityTags([
        "mechanic:immunity",
        "mechanic:condition",
        "mechanic:condition-poisoned",
        "mechanic:passive",
        "type:defensive",
      ]),
    ).toBe("Uncommon");
  });

  it("returns null for damage immunity without a named condition", () => {
    expect(
      inferRarityFromConditionImmunityTags([
        "mechanic:immunity",
        "damage:fire",
        "mechanic:passive",
      ]),
    ).toBeNull();
  });
});
