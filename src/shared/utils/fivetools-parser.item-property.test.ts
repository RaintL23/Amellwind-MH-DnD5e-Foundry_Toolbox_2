import { describe, expect, it } from "vitest";
import { parseFiveToolsMarkup } from "./fivetools-parser";

describe("parseFiveToolsMarkup itemProperty", () => {
  it("uses the display name from {@itemProperty Abbrev|Src|Display}", () => {
    expect(
      parseFiveToolsMarkup(
        "a weapon with the {@itemProperty AF|XDMG|Ammunition} property",
      ),
    ).toBe("a weapon with the Ammunition property");
  });

  it("falls back to PROPERTY_LABELS when display is omitted", () => {
    expect(
      parseFiveToolsMarkup(
        "a weapon with the {@itemProperty AF|XDMG} property",
      ),
    ).toBe("a weapon with the Ammunition property");
  });

  it("keeps known labels for other property abbreviations", () => {
    expect(
      parseFiveToolsMarkup("the {@itemProperty L|XPHB|Light} property"),
    ).toBe("the Light property");
    expect(parseFiveToolsMarkup("the {@itemProperty LD|XPHB} property")).toBe(
      "the Loading property",
    );
  });
});
