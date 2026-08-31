import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryResourceGroups } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";
import { buildFoundryItemFilename } from "@/shared/foundry";
import { melodyFeatFilename } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-melody.export";
import { phialFeatFilename } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-phial.export";
import { magazineConsumableFilename } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-magazine.export";
import { coatingConsumableFilename } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-coating.export";

const MANIFEST = JSON.parse(
  readFileSync("public/data/raintdm-weapons/manifest.json", "utf8"),
) as { weapons: string[] };

const RESOURCES_ROOT = "public/data/foundry-jsons-example/weapons-resources";

const GROUP_DIRS: Record<string, string> = {
  melodies: "melodies",
  phials: "phials",
  magazines: "magazines",
  coatings: "coatings",
};

function filenameForGroup(groupId: string, item: { name?: string }): string {
  switch (groupId) {
    case "melodies":
      return melodyFeatFilename(item as never);
    case "phials":
      return phialFeatFilename(item as never);
    case "magazines":
      return magazineConsumableFilename(item as never);
    case "coatings":
      return coatingConsumableFilename(item as never);
    default:
      return buildFoundryItemFilename(item.name ?? "resource");
  }
}

function writeResource(groupId: string, item: Record<string, unknown>): string {
  const dir = path.join(RESOURCES_ROOT, GROUP_DIRS[groupId] ?? groupId);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, filenameForGroup(groupId, item));
  writeFileSync(file, `${JSON.stringify(item, null, 2)}\n`, "utf8");
  return file;
}

describe("Generate weapon resource Foundry examples", () => {
  it("writes export-builder resources when UPDATE_FOUNDRY_EXAMPLES=1", () => {
    if (process.env.UPDATE_FOUNDRY_EXAMPLES !== "1") return;

    const written: string[] = [];

    for (const file of MANIFEST.weapons) {
      const raw = JSON.parse(
        readFileSync(path.join("public/data/raintdm-weapons", file), "utf8"),
      );
      const [weapon] = parseImportedWeapons([raw], { isCustom: false });
      const maxIdx = weapon.rarityRows.length - 1;
      const groups = buildWeaponFoundryResourceGroups(weapon, maxIdx);

      for (const group of groups) {
        for (const item of group.items) {
          written.push(
            writeResource(group.id, item as unknown as Record<string, unknown>),
          );
        }
      }
    }

    expect(written.length).toBeGreaterThan(0);
  });

  it("can bootstrap missing export resources on demand", () => {
    const missing: string[] = [];

    for (const file of MANIFEST.weapons) {
      const raw = JSON.parse(
        readFileSync(path.join("public/data/raintdm-weapons", file), "utf8"),
      );
      const [weapon] = parseImportedWeapons([raw], { isCustom: false });
      const maxIdx = weapon.rarityRows.length - 1;

      for (const group of buildWeaponFoundryResourceGroups(weapon, maxIdx)) {
        for (const item of group.items) {
          const rel = path.join(
            RESOURCES_ROOT,
            GROUP_DIRS[group.id] ?? group.id,
            filenameForGroup(group.id, item),
          );
          if (!existsSync(rel)) missing.push(rel);
        }
      }
    }

    if (missing.length > 0 && process.env.UPDATE_FOUNDRY_EXAMPLES === "1") {
      expect.fail(`Still missing after update:\n${missing.join("\n")}`);
    }

    expect(missing, missing.join("\n")).toEqual([]);
  });
});
