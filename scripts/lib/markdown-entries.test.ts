import { describe, expect, it } from "vitest";
import {
  findAfflictionSections,
  markdownToEntries,
  stripAfflictionPrefixes,
} from "./markdown-entries.mjs";
import { mapStatBlockEntries } from "../../src/shared/utils/statblock-entries.mapper.ts";

describe("markdownToEntries", () => {
  it("keeps paragraph breaks from CRLF files", () => {
    expect(markdownToEntries("First\r\nline.\r\n\r\nSecond.")).toEqual([
      "First line.",
      "Second.",
    ]);
  });

  it("nests headings and parses named list items", () => {
    const md = [
      "Intro.",
      "",
      "### Disease: Frenzy Virus",
      "",
      "Body.",
      "",
      "#### Sentient Races",
      "",
      "- **Improved Critical.** Crit on 19.",
      "- plain item",
      "",
      "### Next",
      "",
      "Tail.",
    ].join("\n");

    expect(markdownToEntries(md)).toEqual([
      "Intro.",
      {
        type: "entries",
        name: "Disease: Frenzy Virus",
        entries: [
          "Body.",
          {
            type: "entries",
            name: "Sentient Races",
            entries: [
              {
                type: "list",
                items: [
                  {
                    type: "item",
                    name: "Improved Critical",
                    entries: ["Crit on 19."],
                  },
                  "plain item",
                ],
              },
            ],
          },
        ],
      },
      { type: "entries", name: "Next", entries: ["Tail."] },
    ]);
  });
});

describe("affliction sections", () => {
  const bio = markdownToEntries(
    "Lore.\n\n### Disease: Frenzy Virus\n\nBody.\n\n#### Prognosis\n\nGrim.",
  );

  it("finds Disease/Condition/Poison sections at any depth", () => {
    expect(findAfflictionSections(bio)).toEqual([
      {
        kind: "disease",
        name: "Frenzy Virus",
        entries: [
          "Body.",
          { type: "entries", name: "Prognosis", entries: ["Grim."] },
        ],
      },
    ]);
  });

  it("drops the prefix for display and renders as UI sections", () => {
    const content = mapStatBlockEntries(stripAfflictionPrefixes(bio));
    expect(content[1]).toMatchObject({ type: "section", name: "Frenzy Virus" });
  });
});
