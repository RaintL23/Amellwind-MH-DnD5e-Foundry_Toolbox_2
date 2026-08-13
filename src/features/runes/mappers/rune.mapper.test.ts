import { describe, expect, it } from "vitest";
import { extractRuneEffectTags } from "../mappers/rune.mapper";

describe("extractRuneEffectTags — mixed resistance and immunity", () => {
  it("tags both resistance and immunity for resistant-to + condition immunity", () => {
    const tags = extractRuneEffectTags(
      "You are resistant to poison damage and immune to the {@condition poisoned} condition while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:resistance",
        "mechanic:immunity",
        "mechanic:condition",
        "damage:poison",
        "type:defensive",
      ]),
    );
  });

  it("tags resistance for classic resistance-to wording", () => {
    const tags = extractRuneEffectTags(
      "You have resistance to lightning damage, while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:resistance",
        "damage:lightning",
        "type:defensive",
      ]),
    );
  });

  it("tags disease and poison shorthand immunity", () => {
    const tags = extractRuneEffectTags(
      "You are immune to poison and disease while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:immunity",
        "mechanic:disease",
        "damage:poison",
        "type:defensive",
      ]),
    );
  });

  it("tags cantrip casts without spell:lvl1-2", () => {
    const tags = extractRuneEffectTags(
      "While holding this weapon, you can use an action to cast the {@spell light} cantrip from it. Once used, this property can't be used again until the next dawn.",
    );

    expect(tags).toContain("mechanic:cantrip");
    expect(tags.some((tag) => tag.startsWith("mechanic:spell:"))).toBe(false);
  });

  it("still tags leveled {@spell} as spell:lvl1-2", () => {
    const tags = extractRuneEffectTags(
      "You can cast {@spell shield} from this weapon (1 rune).",
    );

    expect(tags).toContain("mechanic:spell:lvl1-2");
  });

  it("tags condition immunity without {@condition} markup", () => {
    const tags = extractRuneEffectTags(
      "You are immune to the poisoned condition while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:immunity", "mechanic:condition"]),
    );
  });
});
