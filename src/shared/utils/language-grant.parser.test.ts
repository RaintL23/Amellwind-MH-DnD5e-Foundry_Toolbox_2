import { describe, expect, it } from "vitest";
import { parseLanguageGrantsFromFeatureText } from "./language-grant.parser";

const classSource = { type: "class" as const, name: "Ranger — Deft Explorer" };

describe("parseLanguageGrantsFromFeatureText", () => {
  it("parses Deft Explorer language choice from feature prose", () => {
    const text =
      "Thanks to your travels, you gain the following benefits. Expertise Choose one of your skill proficiencies with which you lack Expertise. You gain Expertise in that skill. Languages You know two languages of your choice from the language tables in chapter 2.";

    const grants = parseLanguageGrantsFromFeatureText(text, classSource);

    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({
      kind: "any",
      count: 2,
      label: "Languages",
      source: classSource,
    });
  });

  it("parses learn N languages phrasing", () => {
    const grants = parseLanguageGrantsFromFeatureText(
      "You learn two languages of your choice.",
      classSource,
    );

    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({ kind: "any", count: 2 });
  });
});
