import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const supplementPath = path.join(
  root,
  "public/data/mhmm-patreon-2.0/supplement.json",
);

interface SupplementMonster {
  name: string;
  environment?: string[];
}

describe("MHMM Appendix A environments in supplement.json", () => {
  const supplement = JSON.parse(readFileSync(supplementPath, "utf8")) as {
    monster: SupplementMonster[];
  };
  const byName = new Map(supplement.monster.map((m) => [m.name, m]));

  it("tags Rathalos across Appendix A biomes", () => {
    const tags = byName.get("Rathalos")?.environment ?? [];
    expect(tags).toEqual(
      expect.arrayContaining([
        "desert",
        "forest",
        "grassland",
        "hill",
        "mountain",
        "swamp",
        "urban",
        "volcano",
      ]),
    );
  });

  it("expands Roaming-only quarry to every standard biome", () => {
    const tags = byName.get("Deviljho")?.environment ?? [];
    expect(tags.length).toBeGreaterThanOrEqual(10);
    expect(tags).toContain("arctic");
    expect(tags).toContain("volcano");
  });

  it("aliases Young Arzuros rows onto Arzuros Cub", () => {
    const tags = byName.get("Arzuros Cub")?.environment ?? [];
    expect(tags).toEqual(expect.arrayContaining(["forest", "hill"]));
  });
});
