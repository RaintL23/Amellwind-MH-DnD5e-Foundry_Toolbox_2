import { describe, expect, it } from "vitest";
import { parseRichText } from "./dnd-rich-text.utils";

describe("parseRichText entity links", () => {
  it("turns {@spell} into an in-app spell link", () => {
    const segments = parseRichText(
      "you can cast {@spell dimension door|XPHB}",
      { highlightKeywords: false },
    );
    const link = segments.find((seg) => seg.kind === "entityLink");
    expect(link).toMatchObject({
      kind: "entityLink",
      content: "Dimension Door",
      href: "/spells?spell=Dimension+Door",
      refKind: "spell",
    });
  });

  it("links nested {@item} inside {@i}", () => {
    const segments = parseRichText(
      "{@i See {@item Tranq Bomb|AGMH} (AGMH p.62) for capturing rules.}",
      { highlightKeywords: false },
    );
    const link = segments.find((seg) => seg.kind === "entityLink");
    expect(link).toMatchObject({
      kind: "entityLink",
      href: "/items?item=Tranq+Bomb",
      content: "Tranq Bomb",
      refKind: "item",
    });
    expect(segments.some((seg) => seg.kind === "italic")).toBe(true);
  });

  it("links {@condition} tags", () => {
    const segments = parseRichText(
      "or be {@condition stunned} until the end of its next turn.",
      { highlightKeywords: false },
    );
    expect(segments.find((seg) => seg.kind === "entityLink")).toMatchObject({
      href: "/conditions?condition=Stunned",
      content: "Stunned",
      refKind: "condition",
    });
  });
});
