import { describe, expect, it } from "vitest";
import {
  spellLevelLabel,
  toDescriptionLines,
} from "./description-lines.utils";

describe("spellLevelLabel", () => {
  it("labels cantrips and leveled spells", () => {
    expect(spellLevelLabel(0)).toBe("Cantrip");
    expect(spellLevelLabel(1)).toBe("Level 1");
    expect(spellLevelLabel(9)).toBe("Level 9");
  });
});

describe("toDescriptionLines", () => {
  it("splits inline bullets onto their own lines", () => {
    const lines = toDescriptionLines(
      "Choose one: • Heavenly Wings. You fly. • Inner Radiance. You glow.",
    );
    expect(lines[0]).toBe("Choose one:");
    expect(lines[1]).toBe("• **Heavenly Wings.** You fly.");
    expect(lines[2]).toBe("• **Inner Radiance.** You glow.");
  });

  it("preserves existing newlines", () => {
    expect(toDescriptionLines("Line one.\n\nLine two.")).toEqual([
      "Line one.",
      "Line two.",
    ]);
  });
});
