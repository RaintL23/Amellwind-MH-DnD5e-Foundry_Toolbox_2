import { describe, expect, it, vi } from "vitest";
import { resolveAnyProficiencyOptions } from "@/shared/data/chooseable-tools-weapons";
import { parseClassToolGrants } from "./class-proficiency.mapper";

// The instrument catalog is fetched at runtime from items-base.json.
vi.mock("@/shared/data/chooseable-musical-instruments", () => ({
  getChooseableMusicalInstruments: () => ["Lute"],
}));

const source = { type: "class" as const, name: "Monk" };

describe("parseClassToolGrants", () => {
  it("merges alternative blocks into a single pick", () => {
    const grants = parseClassToolGrants(
      {
        tools: ["Choose one type of {@item Artisan's Tools|XPHB} or {@item Musical Instrument|XPHB}"],
        toolProficiencies: [{ anyArtisansTool: 1 }, { anyMusicalInstrument: 1 }],
      },
      source,
    );
    expect(grants).toHaveLength(1);
    const [grant] = grants;
    expect(grant).toEqual(
      expect.objectContaining({
        kind: "any",
        count: 1,
        label: "Artisan's tool or musical instrument",
      }),
    );
    if (grant.kind !== "any") throw new Error("expected an any grant");
    const options = resolveAnyProficiencyOptions(grant.label, grant.options);
    expect(options).toEqual(expect.arrayContaining(["Smith's Tools", "Lute"]));
  });

  it("parses only the structured block when prose is also present", () => {
    const grants = parseClassToolGrants(
      {
        tools: [
          "{@item Thieves' Tools|XPHB}",
          "{@item Tinker's Tools|XPHB}",
          "one type of {@item Artisan's Tools|XPHB} of your choice",
        ],
        toolProficiencies: [
          { "thieves' tools": true, "tinker's tools": true, anyArtisansTool: 1 },
        ],
      },
      { type: "class", name: "Artificer" },
    );
    expect(grants.map((grant) => grant.kind)).toEqual(["any", "fixed"]);
  });
});
