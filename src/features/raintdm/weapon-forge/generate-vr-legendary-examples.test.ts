import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";
import type { FoundryItem } from "@/shared/foundry";
import { buildFoundryItemFilename } from "@/shared/foundry";

const MANIFEST = JSON.parse(
  readFileSync("public/data/raintdm-weapons/manifest.json", "utf8"),
) as { weapons: string[] };

const EXPORT_TIERS = ["Very Rare", "Legendary"] as const;

function weaponStem(filename: string): string {
  return filename.replace(/\.json$/, "");
}

/** Golden files are hand-tuned Item Macro tier clones (not raw export). */
const MANUAL_MACRO_WEAPONS = new Set(["light-bowgun.json"]);

const MERGE_MACRO_WEAPONS: Record<
  string,
  { macroFromTier: "rare" | "very-rare"; patchUses?: (item: FoundryItem, tier: string) => void }
> = {
  "heavy-bowgun.json": {
    macroFromTier: "rare",
    patchUses: (item, tier) => {
      const system = item.system as Record<string, unknown>;
      system.rarity = tier === "Very Rare" ? "veryRare" : "legendary";
      system.magicalBonus = tier === "Very Rare" ? 2 : 3;
      system.uses = { spent: 0, recovery: [], max: tier === "Very Rare" ? "10" : "12" };
      const props = system.properties as string[];
      if (!props.includes("mgc")) system.properties = [...props, "mgc"];
      const flags = (item.flags ?? {}) as Record<string, unknown>;
      const world = (flags.world as Record<string, unknown> | undefined) ?? {};
      const hbg = (world.hbg as Record<string, unknown>) ?? {};
      item.flags = {
        ...flags,
        world: {
          ...world,
          hbg: {
            ...hbg,
            tier: tier === "Very Rare" ? "veryRare" : "legendary",
            specialAmmoMax: tier === "Very Rare" ? 6 : 8,
          },
        },
      };
    },
  },
  "bow.json": {
    macroFromTier: "rare",
    patchUses: (item, tier) => {
      const system = item.system as Record<string, unknown>;
      system.rarity = tier === "Very Rare" ? "veryRare" : "legendary";
      system.magicalBonus = tier === "Very Rare" ? 2 : 3;
      system.uses = { spent: 0, recovery: [], max: tier === "Very Rare" ? "4" : "5" };
      const props = system.properties as string[];
      if (!props.includes("mgc")) system.properties = [...props, "mgc"];
      const flags = (item.flags ?? {}) as Record<string, unknown>;
      const world = (flags.world as Record<string, unknown> | undefined) ?? {};
      const bow = (world.bow as Record<string, unknown>) ?? {};
      item.flags = {
        ...flags,
        world: {
          ...world,
          bow: {
            ...bow,
            tier: tier === "Very Rare" ? "veryRare" : "legendary",
            tracerMax: tier === "Very Rare" ? 4 : 5,
          },
        },
      };
    },
  },
};

function loadGoldenMacro(stem: string, fromTier: "rare" | "very-rare") {
  const p = path.join(
    "public/data/foundry-jsons-example/weapons",
    stem,
    `fvtt-Item-${stem}-${fromTier}.json`,
  );
  const golden = JSON.parse(readFileSync(p, "utf8")) as {
    flags?: { itemacro?: unknown; world?: unknown };
  };
  return golden.flags;
}

describe("Generate merge-macro Very Rare / Legendary weapons", () => {
  for (const [filename, cfg] of Object.entries(MERGE_MACRO_WEAPONS)) {
    describe(filename, () => {
      const raw = JSON.parse(
        readFileSync(`public/data/raintdm-weapons/${filename}`, "utf8"),
      );
      const [weapon] = parseImportedWeapons([raw], { isCustom: false });
      const stem = weaponStem(filename);

      for (const tier of EXPORT_TIERS) {
        it(`exports ${tier} with grafted macro`, () => {
          const idx = weapon.rarityRows.findIndex((r) => r.rarity === tier);
          expect(idx).toBeGreaterThanOrEqual(0);

          const item = buildWeaponFoundryItem(weapon, idx);
          const macroFrom =
            tier === "Legendary" ? "very-rare" : cfg.macroFromTier;
          const goldenFlags = loadGoldenMacro(stem, macroFrom);
          const flags = (item.flags ?? {}) as Record<string, unknown>;
          item.flags = {
            ...flags,
            itemacro: goldenFlags?.itemacro,
            world: goldenFlags?.world,
          };
          cfg.patchUses?.(item, tier);

          const dir = path.join(
            "public/data/foundry-jsons-example/weapons",
            stem,
          );
          const outPath = path.join(
            dir,
            buildFoundryItemFilename(weapon.name, tier),
          );

          if (process.env.UPDATE_FOUNDRY_EXAMPLES === "1") {
            mkdirSync(dir, { recursive: true });
            writeFileSync(outPath, `${JSON.stringify(item, null, 2)}\n`);
          } else if (!existsSync(outPath)) {
            expect.fail(`Missing golden file: ${outPath}`);
          }
        });
      }
    });
  }
});

describe("Generate Very Rare / Legendary Foundry weapon examples", () => {
  for (const filename of MANIFEST.weapons) {
    if (MANUAL_MACRO_WEAPONS.has(filename)) continue;

    describe(filename, () => {
      const raw = JSON.parse(
        readFileSync(`public/data/raintdm-weapons/${filename}`, "utf8"),
      );
      const [weapon] = parseImportedWeapons([raw], { isCustom: false });

      for (const tier of EXPORT_TIERS) {
        it(`exports ${tier}`, () => {
          const idx = weapon.rarityRows.findIndex((r) => r.rarity === tier);
          expect(idx, `${tier} row missing`).toBeGreaterThanOrEqual(0);

          const item = buildWeaponFoundryItem(weapon, idx);
          if (filename === "wire-knuckles.json" && tier === "Legendary") {
            const system = item.system as Record<string, unknown>;
            system.magicalBonus = 0;
            system.properties = (system.properties as string[]).filter(
              (p) => p !== "mgc",
            );
            system.uses = {
              spent: 0,
              max: "4",
              recovery: [{ period: "sr", type: "recoverAll" }],
            };
          }
          const stem = weaponStem(filename);
          const dir = path.join(
            "public/data/foundry-jsons-example/weapons",
            stem,
          );
          const outPath = path.join(
            dir,
            buildFoundryItemFilename(weapon.name, tier),
          );

          expect(item.name).toContain(
            tier === "Very Rare" ? "Very Rare" : "Legendary",
          );

          if (process.env.UPDATE_FOUNDRY_EXAMPLES === "1") {
            mkdirSync(dir, { recursive: true });
            writeFileSync(outPath, `${JSON.stringify(item, null, 2)}\n`);
          } else if (!existsSync(outPath)) {
            expect.fail(
              `Missing golden file: ${outPath} (run with UPDATE_FOUNDRY_EXAMPLES=1)`,
            );
          }
        });
      }
    });
  }
});
