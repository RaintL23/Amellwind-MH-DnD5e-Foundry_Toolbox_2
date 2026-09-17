import { describe, expect, it } from "vitest";
import { parseRichText, getRichTextSegmentClass } from "./dnd-rich-text.utils";

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
      href: "/dnd-conditions?condition=Stunned",
      content: "Stunned",
      refKind: "condition",
    });
  });

  it("links {@disease} tags", () => {
    const segments = parseRichText(
      "contracts {@disease frenzy virus|MHMM}",
      { highlightKeywords: false },
    );
    expect(segments.find((seg) => seg.kind === "entityLink")).toMatchObject({
      href: "/conditions?disease=Frenzy+Virus",
      content: "Frenzy Virus",
      refKind: "disease",
    });
  });

  it("links {@object} AGMH tags to siege weapons", () => {
    const segments = parseRichText("{@object Dragonator|AGMH}", {
      highlightKeywords: false,
    });
    expect(segments.find((seg) => seg.kind === "entityLink")).toMatchObject({
      href: "/siege-weapons?object=Dragonator",
      content: "Dragonator",
      refKind: "object",
    });
  });

  it("resolves {@itemProperty} to display name, not abbreviation", () => {
    const withDisplay = parseRichText(
      "weapon with the {@itemProperty AF|XDMG|Ammunition} property",
      { highlightKeywords: false },
    );
    expect(withDisplay.map((s) => s.content).join("")).toBe(
      "weapon with the Ammunition property",
    );

    const withoutDisplay = parseRichText(
      "weapon with the {@itemProperty AF|XDMG} property",
      { highlightKeywords: false },
    );
    expect(withoutDisplay.map((s) => s.content).join("")).toBe(
      "weapon with the Ammunition property",
    );
  });

  it("styles phrase and entity links with a visible underline", () => {
    const phrase = parseRichText("learn two Arcane Shot options", {
      highlightKeywords: false,
      phraseLinks: [{ id: "opt:arcane", phrase: "Arcane Shot options" }],
    });
    const phraseSeg = phrase.find((s) => s.kind === "phraseLink");
    expect(phraseSeg).toBeTruthy();
    expect(getRichTextSegmentClass(phraseSeg!)).toContain("underline");
    expect(getRichTextSegmentClass(phraseSeg!)).not.toContain("hover:underline");

    const entity = parseRichText("{@spell haste|XPHB}", {
      highlightKeywords: false,
    });
    const entitySeg = entity.find((s) => s.kind === "entityLink");
    expect(entitySeg).toBeTruthy();
    expect(getRichTextSegmentClass(entitySeg!)).toContain("underline");
  });
});
