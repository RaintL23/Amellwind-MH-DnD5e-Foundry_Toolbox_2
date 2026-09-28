import { describe, expect, it } from "vitest";
import {
  collectTraitContent,
  isSpeciesTraitCreationChoice,
  mapTraits,
} from "./species-race-core.mapper";

describe("collectTraitContent", () => {
  it("includes string list items under a racial trait (Warforged Constructed Resilience)", () => {
    const { texts } = collectTraitContent([
      "You were created to have remarkable fortitude, represented by the following benefits:",
      {
        type: "list",
        items: [
          "You have advantage on saving throws against being {@condition poisoned}, and you have resistance to poison damage.",
          "You don't need to eat, drink, or breathe.",
          "You are immune to disease.",
          "You don't need to sleep, and magic can't put you to sleep.",
        ],
      },
    ]);

    expect(texts).toEqual([
      "You were created to have remarkable fortitude, represented by the following benefits:",
      "• You have advantage on saving throws against being poisoned, and you have resistance to poison damage.",
      "• You don't need to eat, drink, or breathe.",
      "• You are immune to disease.",
      "• You don't need to sleep, and magic can't put you to sleep.",
    ]);
  });

  it("includes named list items with a single body entry", () => {
    const { texts } = collectTraitContent([
      {
        type: "list",
        items: [
          {
            type: "item",
            name: "Darkvision",
            entries: ["You can see in dim light within 60 feet."],
          },
        ],
      },
    ]);

    expect(texts).toEqual([
      "• Darkvision: You can see in dim light within 60 feet.",
    ]);
  });
});

describe("isSpeciesTraitCreationChoice", () => {
  it("detects Goliath Giant Ancestry prose", () => {
    expect(
      isSpeciesTraitCreationChoice(
        "Giant Ancestry",
        "Choose one of the following benefits; you can use the chosen benefit a number of times equal to your Proficiency Bonus.",
      ),
    ).toBe(true);
  });

  it("rejects Hobgoblin per-use Fey Gift", () => {
    expect(
      isSpeciesTraitCreationChoice(
        "Fey Gift",
        "Starting at 3rd level, choose one of the options below each time you take the Help action with this trait:",
      ),
    ).toBe(false);
  });
});

describe("mapTraits", () => {
  it("maps Constructed Resilience with its benefit list intact", () => {
    const traits = mapTraits([
      {
        type: "entries",
        name: "Constructed Resilience",
        entries: [
          "You were created to have remarkable fortitude, represented by the following benefits:",
          {
            type: "list",
            items: [
              "You don't need to eat, drink, or breathe.",
              "You are immune to disease.",
            ],
          },
        ],
      },
    ]);

    expect(traits).toHaveLength(1);
    expect(traits[0]?.name).toBe("Constructed Resilience");
    expect(traits[0]?.entries).toEqual([
      "You were created to have remarkable fortitude, represented by the following benefits:",
      "• You don't need to eat, drink, or breathe.",
      "• You are immune to disease.",
    ]);
    expect(traits[0]?.creationChoice).toBeUndefined();
  });

  it("extracts Giant Ancestry creation options without flattening them into entries", () => {
    const traits = mapTraits([
      {
        type: "entries",
        name: "Giant Ancestry",
        entries: [
          "You are descended from Giants. Choose one of the following benefits; you can use the chosen benefit a number of times equal to your Proficiency Bonus:",
          {
            type: "list",
            style: "list-hang-notitle",
            items: [
              {
                type: "item",
                name: "Cloud's Jaunt (Cloud Giant)",
                entries: [
                  "As a Bonus Action, you magically teleport up to 30 feet.",
                ],
              },
              {
                type: "item",
                name: "Stone's Endurance (Stone Giant)",
                entries: [
                  "When you take damage, you can take a Reaction to roll 1d12.",
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(traits).toHaveLength(1);
    const trait = traits[0]!;
    expect(trait.entries).toEqual([
      "You are descended from Giants. Choose one of the following benefits; you can use the chosen benefit a number of times equal to your Proficiency Bonus:",
    ]);
    expect(trait.creationChoice?.options).toEqual([
      {
        id: "cloud-s-jaunt-cloud-giant",
        name: "Cloud's Jaunt (Cloud Giant)",
        entries: ["As a Bonus Action, you magically teleport up to 30 feet."],
      },
      {
        id: "stone-s-endurance-stone-giant",
        name: "Stone's Endurance (Stone Giant)",
        entries: ["When you take damage, you can take a Reaction to roll 1d12."],
      },
    ]);
  });
});
