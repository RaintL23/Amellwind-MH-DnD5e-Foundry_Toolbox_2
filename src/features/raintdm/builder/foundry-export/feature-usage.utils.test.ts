import { describe, expect, it } from "vitest";
import { parseFeatureUsage } from "./feature-usage.utils";

describe("parseFeatureUsage", () => {
  it("does not treat once-per-turn limits as rest-based uses (Grappler)", () => {
    const description = [
      "You gain the following benefits.",
      "Punch and Grab. When you hit a creature with an Unarmed Strike as part of the Attack action on your turn, you can use both the Damage and the Grapple option. You can use this benefit only once per turn.",
      "Attack Advantage. You have Advantage on attack rolls against a creature Grappled by you.",
      "Fast Wrestler. You don't have to spend extra movement to move a creature Grappled by you if the creature is your size or smaller.",
    ].join(" ");

    expect(parseFeatureUsage(description)).toEqual({
      activationType: "",
      activationValue: null,
      usesMax: "",
      recoveryPeriod: "",
    });
  });

  it("ignores once per round cadence", () => {
    expect(
      parseFeatureUsage(
        "You can use this feature once per round when you take the Attack action.",
      ).usesMax,
    ).toBe("");
  });

  it("still parses real limited uses with rest recovery", () => {
    expect(
      parseFeatureUsage(
        "You can use this feature twice. You regain all expended uses when you finish a short or long rest.",
      ),
    ).toEqual({
      activationType: "",
      activationValue: null,
      usesMax: "2",
      recoveryPeriod: "sr",
    });
  });

  it("parses once-per-long-rest phrasing", () => {
    expect(
      parseFeatureUsage(
        "Once you use this feature, you can't do so again until you finish a long rest.",
      ),
    ).toEqual({
      activationType: "",
      activationValue: null,
      usesMax: "1",
      recoveryPeriod: "lr",
    });
  });

  it("treats short or long rest regain as short-rest recovery", () => {
    expect(
      parseFeatureUsage(
        "You can use this feature once. You regain all expended uses when you finish a short or long rest.",
      ).recoveryPeriod,
    ).toBe("sr");
  });
});
