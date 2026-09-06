import { describe, expect, it } from "vitest";
import { collectTraitContent, mapTraits } from "./species-race-core.mapper";

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
  });
});
