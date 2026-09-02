import { describe, expect, it } from "vitest";
import {
  matchesInlineAbilityScoreSet,
  parseInlineAbilityScoreSet,
} from "./inline-ability-score-set.utils";

describe("inline-ability-score-set.utils", () => {
  it("parses score-is while attuned wording", () => {
    const text =
      "Your Strength score is 29 while you are attuned to this weapon. It has no effect on you if your Strength is already 29 or higher.";
    expect(parseInlineAbilityScoreSet(text)).toBe(29);
    expect(matchesInlineAbilityScoreSet(text)).toBe(true);
  });

  it("parses changes-to with attuned clause first (Bazelgeuse Gem)", () => {
    const text =
      "While attuned to this weapon, your Strength score changes to 25. If your Strength is already equal to or greater than 25, the material has no effect on you.";
    expect(parseInlineAbilityScoreSet(text)).toBe(25);
    expect(matchesInlineAbilityScoreSet(text)).toBe(true);
  });

  it("parses becomes without score word", () => {
    expect(parseInlineAbilityScoreSet("Your Dex becomes 19 while attuned.")).toBe(
      19,
    );
  });

  it("parses score-of wording", () => {
    expect(parseInlineAbilityScoreSet("Constitution score of 23")).toBe(23);
  });

  it("does not match flat increases by N", () => {
    const text =
      "This armor increases your Strength score by 2 while you wear it.";
    expect(matchesInlineAbilityScoreSet(text)).toBe(false);
  });

  it("does not match comparison-only clauses", () => {
    expect(
      matchesInlineAbilityScoreSet(
        "If your Strength is already equal to or greater than 25, no effect.",
      ),
    ).toBe(false);
  });
});
