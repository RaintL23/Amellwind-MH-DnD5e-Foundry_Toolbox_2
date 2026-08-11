import { describe, expect, it } from "vitest";
import { splitDndKeywords } from "./dnd-keywords.utils";

function categoriesOf(text: string) {
  return splitDndKeywords(text)
    .filter((seg) => seg.category)
    .map((seg) => ({ text: seg.text, category: seg.category }));
}

describe("splitDndKeywords", () => {
  it("prefers 'bonus action' over bare 'bonus'", () => {
    expect(categoriesOf("as a bonus action, you leap")).toEqual([
      { text: "bonus action", category: "action" },
    ]);
  });

  it("highlights bare 'bonus' when it is not part of a longer phrase", () => {
    expect(categoriesOf("you gain a +2 bonus to")).toEqual([
      { text: "bonus", category: "resource" },
    ]);
  });

  it("prefers 'proficiency bonus' over bare 'bonus'", () => {
    expect(categoriesOf("add your proficiency bonus.")).toEqual([
      { text: "proficiency bonus", category: "save" },
    ]);
  });

  it("matches keywords next to punctuation and at string edges", () => {
    expect(categoriesOf("Bonus action!")).toEqual([
      { text: "Bonus action", category: "action" },
    ]);
    expect(categoriesOf("(reaction)")).toEqual([
      { text: "reaction", category: "action" },
    ]);
  });

  it("does not match keyword substrings inside longer words", () => {
    expect(categoriesOf("the faction gathers")).toEqual([]);
  });

  it("allows flexible whitespace inside multi-word phrases", () => {
    expect(categoriesOf("make a  saving   throw")).toEqual([
      { text: "saving   throw", category: "save" },
    ]);
  });

  it("prefers 'ability check' / 'skill check' over bare terms", () => {
    expect(categoriesOf("make an Ability check")).toEqual([
      { text: "Ability check", category: "save" },
    ]);
    expect(categoriesOf("a skill check using Stealth")).toEqual([
      { text: "skill check", category: "save" },
      { text: "Stealth", category: "save" },
    ]);
  });

  it("highlights bare skill and ability when standalone", () => {
    expect(categoriesOf("choose a skill")).toEqual([
      { text: "skill", category: "save" },
    ]);
    expect(categoriesOf("increase an ability")).toEqual([
      { text: "ability", category: "save" },
    ]);
  });
});
