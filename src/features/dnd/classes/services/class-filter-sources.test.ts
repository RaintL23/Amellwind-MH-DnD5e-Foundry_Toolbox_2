import { describe, expect, it } from "vitest";
import { collectClassFilterSourceCodes } from "./class.service";
import type { Class, Subclass } from "@/shared/types";

function subclass(source: string, name = "Subclass"): Subclass {
  return {
    id: `${name}::${source}`,
    name,
    source,
    shortName: name,
    features: [],
  } as Subclass;
}

function cls(
  source: string,
  subclasses: Subclass[],
  variantSources?: string[],
): Class {
  return {
    id: `Rogue::${source}`,
    name: "Rogue",
    source,
    subclasses,
    variantSources,
  } as Class;
}

describe("collectClassFilterSourceCodes", () => {
  it("includes subclass-only books like RHW Ravenloft", () => {
    const codes = collectClassFilterSourceCodes([
      cls("XPHB", [
        subclass("XPHB", "Thief"),
        subclass("RHW", "Phantom"),
        subclass("TCE", "Phantom"),
      ]),
      cls("PHB", [subclass("PHB", "Thief"), subclass("XGE", "Swashbuckler")]),
    ]);

    expect(codes).toEqual(
      expect.arrayContaining(["XPHB", "PHB", "RHW", "TCE", "XGE"]),
    );
  });

  it("merges brew codes and class variantSources", () => {
    const codes = collectClassFilterSourceCodes(
      [cls("XPHB", [], ["XPHB", "PHB"])],
      ["UATheMysticClass"],
    );
    expect(codes).toEqual(
      expect.arrayContaining(["XPHB", "PHB", "UATheMysticClass"]),
    );
  });
});
