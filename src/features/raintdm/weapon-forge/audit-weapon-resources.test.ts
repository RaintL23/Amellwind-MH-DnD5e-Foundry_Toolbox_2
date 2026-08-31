import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryResourceGroups } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";
import { getAssignedFeaturesForRow } from "@/features/raintdm/weapon-forge/utils/weapon-forge-features.utils";
import { isResourceColumnLabel } from "@/features/raintdm/weapon-forge/types/weapon-forge.types";
import { buildFoundryItemFilename } from "@/shared/foundry";

const MANIFEST = JSON.parse(
  readFileSync("public/data/raintdm-weapons/manifest.json", "utf8"),
) as { weapons: string[] };

const RESOURCES_ROOT = "public/data/foundry-jsons-example/weapons-resources";

/** Rarity-table columns that store numeric stats, not consumable item unlocks. */
const STAT_RESOURCE_COLUMNS = new Set(["spirit gain"]);

function listResourceJsonFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) listResourceJsonFiles(full, acc);
    else if (entry.endsWith(".json") && entry.startsWith("fvtt-Item-")) {
      acc.push(full);
    }
  }
  return acc;
}

function isConsumableResourceName(name: string, column: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || trimmed === "--" || trimmed === "-") return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (/upgrade/i.test(trimmed)) return false;
  if (STAT_RESOURCE_COLUMNS.has(column.trim().toLowerCase())) return false;
  return true;
}

describe("weapon resources audit", () => {
  it("reports missing weapons-resources JSON files", () => {
    const existingByName = new Map<string, string>();
    for (const file of listResourceJsonFiles(RESOURCES_ROOT)) {
      const item = JSON.parse(readFileSync(file, "utf8")) as { name?: string };
      if (item.name) existingByName.set(item.name, file);
    }

    const required = new Map<
      string,
      { weapon: string; column: string; source: "export" | "manual" }
    >();

    for (const file of MANIFEST.weapons) {
      const raw = JSON.parse(
        readFileSync(path.join("public/data/raintdm-weapons", file), "utf8"),
      );
      const [weapon] = parseImportedWeapons([raw], { isCustom: false });
      const maxIdx = weapon.rarityRows.length - 1;

      for (const group of buildWeaponFoundryResourceGroups(weapon, maxIdx)) {
        for (const item of group.items) {
          const name = String(item.name ?? "").trim();
          if (!name) continue;
          required.set(name, {
            weapon: weapon.name,
            column: group.label,
            source: "export",
          });
        }
      }

      const seen = new Set<string>();
      for (let i = 0; i <= maxIdx; i++) {
        const row = weapon.rarityRows[i];
        if (!row) continue;
        for (const ref of getAssignedFeaturesForRow(row, weapon.customFeatures)) {
          const col = ref.resourceColumn?.trim() ?? "";
          if (!col || !isResourceColumnLabel(col)) continue;
          if (/^melod|^notes?$/i.test(col)) continue;
          if (/^phials?$/i.test(col)) continue;
          if (/^magazines?$/i.test(col)) continue;
          if (/^coatings?$/i.test(col)) continue;

          const name = ref.name.trim();
          if (!isConsumableResourceName(name, col) || seen.has(name)) continue;
          seen.add(name);
          if (!required.has(name)) {
            required.set(name, { weapon: weapon.name, column: col, source: "manual" });
          }
        }
      }
    }

    const missing = [...required.entries()]
      .filter(([name]) => !existingByName.has(name))
      .sort(([a], [b]) => a.localeCompare(b));

    if (missing.length > 0) {
      const lines = missing.map(
        ([name, info]) =>
          `[${info.source}] ${name} (${info.column} · ${info.weapon}) → ${buildFoundryItemFilename(name)}`,
      );
      expect.fail(`Missing ${missing.length} weapon resource(s):\n${lines.join("\n")}`);
    }

    expect(missing).toEqual([]);
  });

  it("every export-builder resource file exists on disk", () => {
    const missingPaths: string[] = [];

    for (const file of MANIFEST.weapons) {
      const raw = JSON.parse(
        readFileSync(path.join("public/data/raintdm-weapons", file), "utf8"),
      );
      const [weapon] = parseImportedWeapons([raw], { isCustom: false });
      const maxIdx = weapon.rarityRows.length - 1;
      const groups = buildWeaponFoundryResourceGroups(weapon, maxIdx);
      for (const group of groups) {
        for (const item of group.items) {
          const name = String(item.name ?? "").trim();
          const filename = buildFoundryItemFilename(name);
          const dir = path.join(RESOURCES_ROOT, group.id);
          const rel = path.join(dir, filename);
          if (!existsSync(rel)) {
            missingPaths.push(`${weapon.name}: ${name} → ${rel}`);
          }
        }
      }
    }

    expect(missingPaths, missingPaths.join("\n")).toEqual([]);
  });
});
