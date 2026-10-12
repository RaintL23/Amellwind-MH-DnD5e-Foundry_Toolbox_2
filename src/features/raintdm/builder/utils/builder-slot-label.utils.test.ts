import { describe, expect, it } from "vitest";
import { formatBuilderSlotLabel } from "./builder-slot-label.utils";

describe("formatBuilderSlotLabel", () => {
  it("uses the progression name for optional-feature slots", () => {
    expect(
      formatBuilderSlotLabel("opt-wm-fighter-xphb", {
        "wm-fighter-xphb": "Weapon Mastery",
      }),
    ).toBe("Weapon Mastery");
  });

  it("falls back to a generic label without progression names", () => {
    expect(formatBuilderSlotLabel("opt-fc_class_XPHB__Cleric_Divine_Order_L1")).toBe(
      "Optional Feature",
    );
  });

  it("labels origin feat slots", () => {
    expect(formatBuilderSlotLabel("origin-feat")).toBe("Origin Feat");
    expect(formatBuilderSlotLabel("origin-feat-opt-0")).toBe("Origin Feat");
  });

  it("labels feat, spell and multiclass slots", () => {
    expect(formatBuilderSlotLabel("feat-2")).toBe("Feat Slot 3");
    expect(formatBuilderSlotLabel("spell-level-0")).toBe("Cantrips");
    expect(formatBuilderSlotLabel("spell-level-3")).toBe("Level 3 Spells");
    expect(formatBuilderSlotLabel("spell-pact")).toBe("Pact Spells");
    expect(formatBuilderSlotLabel("spell-cantrip-magic-initiate")).toBe("Bonus Spells");
    expect(formatBuilderSlotLabel("spell-feat-magic-initiate")).toBe("Bonus Spells");
    expect(formatBuilderSlotLabel("multiclass-class-0")).toBe("Multiclass");
    expect(formatBuilderSlotLabel("multiclass-subclass-1")).toBe("Multiclass Subclass");
  });

  it("humanizes plain slot ids", () => {
    expect(formatBuilderSlotLabel("mainHand")).toBe("Main Hand");
    expect(formatBuilderSlotLabel("trinket1")).toBe("Trinket 1");
    expect(formatBuilderSlotLabel("species")).toBe("Species");
    expect(formatBuilderSlotLabel(null)).toBe("Slot");
  });
});
