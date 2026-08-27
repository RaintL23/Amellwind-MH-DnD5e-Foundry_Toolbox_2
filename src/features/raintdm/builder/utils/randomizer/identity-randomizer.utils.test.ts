import { describe, expect, it } from "vitest";
import type { Species } from "@/shared/types";
import { pickAmellwindSpecies } from "./identity-randomizer.utils";

function makeSpecies(
  name: string,
  bonuses: Species["abilityBonuses"],
): Pick<Species, "name" | "isSubrace" | "abilityBonuses"> {
  return {
    name,
    isSubrace: false,
    abilityBonuses: bonuses,
  };
}

describe("pickAmellwindSpecies", () => {
  const strDexSpecies = makeSpecies("Glavenuusfolk", [
    { kind: "fixed", bonuses: { str: 2, dex: 1 } },
  ]);
  const wisConSpecies = makeSpecies("Wisefolk", [
    { kind: "fixed", bonuses: { wis: 2, con: 1 } },
  ]);
  const chaSpecies = makeSpecies("Charmer", [
    { kind: "fixed", bonuses: { cha: 2, dex: 1 } },
  ]);

  it("prefers species that boost the primary casting stat", () => {
    const picked = pickAmellwindSpecies(
      [strDexSpecies, wisConSpecies, chaSpecies] as Species[],
      ["wis", "con", "cha"],
    );
    expect(picked?.name).toBe("Wisefolk");
  });

  it("falls back to secondary priorities when primary is unavailable", () => {
    const picked = pickAmellwindSpecies(
      [strDexSpecies, chaSpecies] as Species[],
      ["wis", "con", "cha"],
    );
    expect(picked?.name).toBe("Charmer");
  });

  it("prefers species with +2 to the primary stat over +1", () => {
    const dexPlusTwo = makeSpecies("Swiftfolk", [
      { kind: "fixed", bonuses: { dex: 2, wis: 1 } },
    ]);
    const picked = pickAmellwindSpecies(
      [strDexSpecies, dexPlusTwo] as Species[],
      ["dex", "wis", "con"],
    );
    expect(picked?.name).toBe("Swiftfolk");
  });
});
