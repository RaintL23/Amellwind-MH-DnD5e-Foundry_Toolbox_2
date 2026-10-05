import { describe, expect, it } from "vitest";
import { parseEntriesProficiencyGrants } from "./text-proficiency-grants.parser";

const source = { type: "feat" as const, name: "Test feat" };

function fixedItems(
  grants: ReturnType<typeof parseEntriesProficiencyGrants>,
  key: "weaponGrants" | "armorGrants" | "toolGrants",
): string[] {
  return grants[key].flatMap((grant) => (grant.kind === "fixed" ? grant.items : []));
}

describe("parseEntriesProficiencyGrants", () => {
  it("keeps a full martial category grant", () => {
    const grants = parseEntriesProficiencyGrants(
      ["You gain proficiency with martial weapons."],
      source,
    );
    expect(fixedItems(grants, "weaponGrants")).toEqual(["Martial"]);
  });

  it("keeps both categories in simple and martial weapons", () => {
    const grants = parseEntriesProficiencyGrants(
      ["You gain proficiency with simple and martial weapons."],
      source,
    );
    expect(fixedItems(grants, "weaponGrants")).toEqual(["Simple", "Martial"]);
  });

  it("does not expand the Rogue finesse or light phrase into all martial weapons", () => {
    const grants = parseEntriesProficiencyGrants(
      [
        "You gain proficiency with martial weapons that have the Finesse or Light property.",
      ],
      source,
    );
    const items = fixedItems(grants, "weaponGrants");
    expect(items).toHaveLength(1);
    expect(items[0]?.toLowerCase()).toContain("finesse");
    expect(items[0]?.toLowerCase()).toContain("light");
    expect(items).not.toContain("Martial");
  });

  it("reads specific weapon names", () => {
    const grants = parseEntriesProficiencyGrants(
      [
        "You have proficiency with the longsword, shortsword, shortbow, and longbow.",
      ],
      source,
    );
    expect(fixedItems(grants, "weaponGrants")).toEqual([
      "Longsword",
      "Shortsword",
      "Shortbow",
      "Longbow",
    ]);
  });

  it("reads firearms and a heavy crossbow", () => {
    const grants = parseEntriesProficiencyGrants(
      ["You gain proficiency with firearms and the heavy crossbow."],
      source,
    );
    expect(fixedItems(grants, "weaponGrants")).toEqual([
      "Firearms",
      "Heavy Crossbow",
    ]);
  });

  it("reads noun-style martial proficiency plus armor", () => {
    const grants = parseEntriesProficiencyGrants(
      ["You gain Martial weapon proficiency and Medium armor."],
      source,
    );
    expect(fixedItems(grants, "weaponGrants")).toEqual(["Martial"]);
    expect(fixedItems(grants, "armorGrants")).toEqual(["Medium"]);
  });

  it("turns four weapons of your choice into a picker grant", () => {
    const grants = parseEntriesProficiencyGrants(
      ["You gain proficiency with four weapons of your choice."],
      source,
    );
    expect(grants.weaponGrants).toEqual([
      expect.objectContaining({
        kind: "any",
        count: 4,
        label: "Weapons",
      }),
    ]);
    const grant = grants.weaponGrants[0];
    expect(grant?.kind).toBe("any");
    if (grant?.kind !== "any") return;
    expect(grant.options).toEqual(
      expect.arrayContaining(["Heavy Crossbow", "Longsword", "Dagger"]),
    );
  });

  it("turns one martial weapon of your choice into a martial picker", () => {
    const grants = parseEntriesProficiencyGrants(
      ["You gain proficiency with one martial weapon of your choice."],
      source,
    );
    expect(grants.weaponGrants[0]).toEqual(
      expect.objectContaining({
        kind: "any",
        count: 1,
        label: "Martial weapon",
      }),
    );
  });

  it("turns a musical instrument of your choice into a tool picker", () => {
    const grants = parseEntriesProficiencyGrants(
      ["You gain proficiency with one musical instrument of your choice."],
      source,
    );
    expect(grants.toolGrants[0]).toEqual(
      expect.objectContaining({
        kind: "any",
        count: 1,
        label: "Musical instrument",
      }),
    );
  });
});
