import { describe, expect, it } from "vitest";
import {
  fitSingleLine,
  fitTextToBox,
  formatSectionText,
  layoutSectionsIntoBoxes,
  linesThatFit,
  wrapTextLines,
  type PdfTextMeasurer,
} from "./pdf-text-layout.utils";

/** Monospace fake: every character is 0.5em wide, line height 1em before the 1.2 factor. */
const mono: PdfTextMeasurer = {
  widthOfTextAtSize: (text, size) => text.length * size * 0.5,
  heightAtSize: (size) => size,
};

describe("wrapTextLines", () => {
  it("wraps on words and keeps explicit newlines as paragraph ends", () => {
    // width 30 at size 10 → a line must be shorter than 6 chars
    const lines = wrapTextLines("aa bb cc\ndd", mono, 10, 30);
    expect(lines.map((line) => line.text)).toEqual(["aa bb", "cc", "dd"]);
    expect(lines.map((line) => line.paragraphEnd)).toEqual([false, true, true]);
  });

  it("hard-breaks words longer than the line", () => {
    const lines = wrapTextLines("abcdefghij", mono, 10, 30);
    expect(lines.map((line) => line.text)).toEqual(["abcde", "fghij"]);
  });

  it("keeps blank lines", () => {
    expect(wrapTextLines("a\n\nb", mono, 10, 100).map((line) => line.text)).toEqual([
      "a",
      "",
      "b",
    ]);
  });
});

describe("linesThatFit", () => {
  it("reserves room for the last line's descender", () => {
    // line height 12; 36pt fits 3 lines only if the descender allowance is ignored
    expect(linesThatFit(36, mono, 10)).toBe(2);
    expect(linesThatFit(39, mono, 10)).toBe(3);
  });
});

describe("fitTextToBox / fitSingleLine", () => {
  it("picks the largest size that fits", () => {
    const result = fitTextToBox("aaaa bbbb", mono, { width: 40, height: 100 }, {
      maxSize: 10,
      minSize: 5,
    });
    expect(result.fits).toBe(true);
    expect(result.fontSize).toBe(10);
    expect(result.text).toBe("aaaa\nbbbb");
  });

  it("reports when even the minimum size overflows", () => {
    const result = fitTextToBox("a ".repeat(200), mono, { width: 20, height: 10 }, {
      maxSize: 8,
      minSize: 6,
    });
    expect(result.fits).toBe(false);
    expect(result.fontSize).toBe(6);
  });

  it("shrinks a single line until it fits the width", () => {
    expect(fitSingleLine("abcdefghij", mono, 41, { maxSize: 10, minSize: 4 })).toBe(8);
  });
});

describe("formatSectionText", () => {
  it("uses a run-in heading", () => {
    expect(formatSectionText({ title: "Second Wind", body: "Heal." })).toBe(
      "Second Wind. Heal.",
    );
    expect(formatSectionText({ title: "Ideal:", body: "Greater good" })).toBe(
      "Ideal: Greater good",
    );
    expect(formatSectionText({ title: "Darkvision", body: "" })).toBe("Darkvision");
  });
});

describe("layoutSectionsIntoBoxes", () => {
  const sections = [
    { title: "A", body: "one two three" },
    { title: "B", body: "four five six" },
    { title: "C", body: "seven eight nine" },
  ];

  it("fits everything at the largest size and flows across boxes", () => {
    const result = layoutSectionsIntoBoxes(
      sections,
      [
        { width: 1000, height: 40 },
        { width: 1000, height: 40 },
      ],
      mono,
      { maxSize: 10, minSize: 5 },
    );
    expect(result.overflow).toEqual([]);
    expect(result.fontSize).toBe(10);
    // 3 lines per box at size 10: "A. …", gap, "B. …" | "C. …"
    expect(result.texts[0].split("\n")).toEqual(["A. one two three", "", "B. four five six"]);
    expect(result.texts[1]).toBe("C. seven eight nine");
  });

  it("moves whole sections to overflow and adds the continuation note", () => {
    const result = layoutSectionsIntoBoxes(sections, [{ width: 1000, height: 40 }], mono, {
      maxSize: 10,
      minSize: 10,
      continuationNote: "(more)",
    });
    // The note is set apart by a blank line when there is room for it.
    expect(result.texts[0].split("\n")).toEqual(["A. one two three", "", "(more)"]);
    expect(result.overflow.map((section) => section.title)).toEqual(["B", "C"]);
  });

  it("splits the section at the cut point without leaving an orphan", () => {
    const long = [{ title: "Long", body: "w ".repeat(60).trim() }];
    // ~10 chars per line at size 10 in 50pt → many lines; box fits 5 lines
    const result = layoutSectionsIntoBoxes(long, [{ width: 50, height: 66 }], mono, {
      maxSize: 10,
      minSize: 10,
      continuationNote: "(more)",
    });
    const kept = result.texts[0].split("\n");
    expect(kept[kept.length - 1]).toBe("(more)");
    expect(result.overflow).toHaveLength(1);
    expect(result.overflow[0].title).toBe("Long (continued)");
    const keptWords = kept.slice(0, -1).join(" ").split(/\s+/).filter(Boolean).length;
    const restWords = result.overflow[0].body.split(/\s+/).length;
    expect(keptWords + restWords).toBe(61); // "Long." + 60 words, nothing lost
  });
});
