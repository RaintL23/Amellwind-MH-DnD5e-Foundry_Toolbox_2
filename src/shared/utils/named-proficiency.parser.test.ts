import { describe, expect, it } from "vitest";
import type { NamedProficiencyGrant } from "@/shared/types/proficiency.types";
import {
  parseNamedProficiencyBlocks,
  resolveConditionalNamedGrants,
} from "./named-proficiency.parser";

const classSource = { type: "class" as const, name: "Artificer" };
const subclassSource = {
  type: "class" as const,
  name: "Battle Smith: Tools of the Trade",
  isSubclass: true,
};

const grants: NamedProficiencyGrant[] = [
  { kind: "any", count: 1, label: "Artisan's tool", source: classSource },
  { kind: "fixed", items: ["Thieves' Tools", "Tinker's Tools"], source: classSource },
  { kind: "fixed", items: ["Smith's Tools"], source: subclassSource },
  {
    kind: "any",
    count: 1,
    label: "Artisan's tool",
    source: subclassSource,
    ifAlreadyProficient: ["Smith's Tools"],
  },
];

function pickCounts(resolved: NamedProficiencyGrant[]): number[] {
  return resolved.flatMap((grant) => (grant.kind === "fixed" ? [] : [grant.count]));
}

describe("resolveConditionalNamedGrants", () => {
  it("disables the replacement pick when the tool is only granted by itself", () => {
    expect(pickCounts(resolveConditionalNamedGrants(grants, ["Brewer's Supplies"]))).toEqual([
      1, 0,
    ]);
  });

  it("enables the replacement pick when another source already grants the tool", () => {
    expect(pickCounts(resolveConditionalNamedGrants(grants, ["Smith's Tools"]))).toEqual([
      1, 1,
    ]);
  });

  it("keeps grant positions so choice indices stay stable", () => {
    expect(resolveConditionalNamedGrants(grants, [])).toHaveLength(grants.length);
  });
});

describe("parseNamedProficiencyBlocks", () => {
  const backgroundSource = { type: "background" as const, name: "Poacher" };

  it("keeps fixed tools that share a block with a choose list", () => {
    const parsed = parseNamedProficiencyBlocks(
      [{ "poisoner's kit": true, choose: { from: ["tinker's tools", "alchemist's supplies"], count: 1 } }],
      backgroundSource,
    );
    expect(parsed.map((grant) => grant.kind)).toEqual(["fixed", "choose"]);
  });

  it("expands anyArtisansTool next to a fixed tool", () => {
    const parsed = parseNamedProficiencyBlocks(
      [{ "herbalism kit": true, anyArtisansTool: 1 }],
      backgroundSource,
    );
    expect(parsed.map((grant) => grant.kind)).toEqual(["any", "fixed"]);
    const pick = parsed.find((grant) => grant.kind === "any");
    expect(pick?.kind === "any" && pick.label).toBe("Artisan's tool");
  });
});
