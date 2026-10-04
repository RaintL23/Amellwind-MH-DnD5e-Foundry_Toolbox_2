import { describe, expect, it } from "vitest";
import {
  parseFiveToolsMarkup,
  renderFiveToolsEntries,
} from "./fivetools-parser";
import { mapStatBlockEntries } from "./statblock-entries.mapper";

describe("parseFiveToolsMarkup preserveEntityTags", () => {
  it("keeps {@creature} tags when preserveEntityTags is true", () => {
    const raw =
      "See its game statistics in the accompanying {@creature Drake Companion|FTD} stat block.";
    expect(parseFiveToolsMarkup(raw, { preserveEntityTags: true })).toBe(raw);
  });

  it("still strips {@creature} by default", () => {
    expect(
      parseFiveToolsMarkup(
        "See the {@creature Drake Companion|FTD} stat block.",
      ),
    ).toBe("See the Drake Companion stat block.");
  });

  it("still flattens dice/dc while preserving creatures", () => {
    expect(
      parseFiveToolsMarkup(
        "{@dc 15} or take {@damage 1d6} near the {@creature Beast of the Land|TCE}.",
        { preserveEntityTags: true },
      ),
    ).toBe(
      "DC 15 or take 1d6 near the {@creature Beast of the Land|TCE}.",
    );
  });
});

describe("mapStatBlockEntries preserves creature tags", () => {
  it("keeps {@creature} in paragraph content for DndRichText", () => {
    const content = mapStatBlockEntries([
      "Choose its stat block—{@creature Beast of the Land|TCE}, {@creature Beast of the Sea|TCE}, or {@creature Beast of the Sky|TCE}.",
    ]);
    expect(content).toHaveLength(1);
    expect(content[0]).toMatchObject({ type: "paragraph" });
    if (content[0]?.type === "paragraph") {
      expect(content[0].text).toContain("{@creature Beast of the Land|TCE}");
      expect(content[0].text).toContain("{@creature Beast of the Sea|TCE}");
      expect(content[0].text).toContain("{@creature Beast of the Sky|TCE}");
    }
  });

  it("maps list items that use singular entry (Aspect of the Wyrm style)", () => {
    const content = mapStatBlockEntries([
      {
        type: "list",
        style: "list-hang-notitle",
        items: [
          {
            type: "item",
            name: "Frightful Presence",
            entry:
              "The target must succeed on a Wisdom saving throw or become {@condition frightened}.",
          },
          {
            type: "item",
            name: "Resistance",
            entry:
              "You and your allies within the aura have resistance to that damage.",
          },
        ],
      },
    ]);

    expect(content).toHaveLength(1);
    expect(content[0]).toMatchObject({ type: "list" });
    if (content[0]?.type !== "list") return;

    expect(content[0].items).toHaveLength(2);
    const frightful = content[0].items[0];
    const resistance = content[0].items[1];
    expect(frightful).toMatchObject({
      type: "named",
      name: "Frightful Presence",
    });
    expect(resistance).toMatchObject({ type: "named", name: "Resistance" });
    if (frightful?.type === "named") {
      expect(frightful.children).toEqual([
        {
          type: "paragraph",
          text: "The target must succeed on a Wisdom saving throw or become {@condition frightened}.",
        },
      ]);
    }
    if (resistance?.type === "named") {
      expect(resistance.children).toHaveLength(1);
      expect(resistance.children[0]).toMatchObject({ type: "paragraph" });
    }
  });
});

describe("renderFiveToolsEntries preserveEntityTags", () => {
  it("keeps summon-spirit creature tags in spell prose", () => {
    const lines = renderFiveToolsEntries(
      [
        "This corporeal form uses the {@creature Construct Spirit|TCE} stat block.",
      ],
      { preserveEntityTags: true },
    );
    expect(lines.join(" ")).toContain("{@creature Construct Spirit|TCE}");
  });
});
