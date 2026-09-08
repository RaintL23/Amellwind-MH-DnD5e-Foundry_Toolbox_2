/**
 * Regenerate Foundry golden weapon examples (Common → Legendary).
 *
 * Run:
 *   UPDATE_FOUNDRY_EXAMPLES=1 pnpm exec vitest run src/features/raintdm/weapon-forge/generate-vr-legendary-examples.test.ts
 *
 * Hand-tuned ammo/coating weapons (HBG / LBG / Bow) clone the previous golden
 * and merge newly exported combat activities + description/stats so ammo macros
 * are preserved. Other weapons export from the forge builder and graft Item Macro
 * flags from a known-good lower tier when needed.
 */
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

const ALL_TIERS = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
] as const;

type Tier = (typeof ALL_TIERS)[number];

const TIER_SLUG: Record<Tier, string> = {
  Common: "common",
  Uncommon: "uncommon",
  Rare: "rare",
  "Very Rare": "very-rare",
  Legendary: "legendary",
};

/** Clone previous golden + merge export (preserves hand-tuned ammo activities). */
const CLONE_MERGE_WEAPONS = new Set([
  "heavy-bowgun.json",
  "light-bowgun.json",
  "bow.json",
]);

/** Graft itemacro/midi/world from a lower golden tier onto fresh export. */
const GRAFT_MACRO_FROM: Record<string, Tier> = {
  "heavy-bowgun.json": "Rare",
  "light-bowgun.json": "Very Rare",
  "bow.json": "Rare",
  "wire-knuckles.json": "Rare",
  "gunlance.json": "Rare",
  "lance.json": "Rare",
  "sword-and-shield.json": "Rare",
};

/** Uncommon/Rare goldens that are hand-tuned (ammo macros, dialogs); do not overwrite. */
const PRESERVE_EXISTING_TIERS: Record<string, Tier[]> = {
  "heavy-bowgun.json": ["Uncommon", "Rare"],
  "light-bowgun.json": ["Uncommon", "Rare", "Very Rare"],
  "bow.json": ["Uncommon", "Rare"],
  "gunlance.json": ["Uncommon", "Rare"],
  "lance.json": ["Uncommon", "Rare"],
};

function ensureNamedAttack(item: FoundryItem): void {
  const system = item.system as { activities?: Record<string, Record<string, unknown>> };
  for (const act of Object.values(system.activities ?? {})) {
    if (act.type === "attack" && !String(act.name ?? "").trim()) {
      act.name = "Attack";
    }
  }
}

function weaponStem(filename: string): string {
  return filename.replace(/\.json$/, "");
}

function goldenPath(stem: string, tier: Tier): string {
  return path.join(
    "public/data/foundry-jsons-example/weapons",
    stem,
    `fvtt-Item-${stem}-${TIER_SLUG[tier]}.json`,
  );
}

function loadGolden(stem: string, tier: Tier): FoundryItem | null {
  const p = goldenPath(stem, tier);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8")) as FoundryItem;
}

function activityName(a: Record<string, unknown>): string {
  return String(a.name ?? "").trim() || "(unnamed)";
}

/**
 * Prefer exported combat activities; keep golden-only activities (ammo, coatings
 * dialogs, etc.) that the forge exporter does not emit.
 */
function mergeActivities(
  exported: FoundryItem,
  golden: FoundryItem,
): Record<string, unknown> {
  const exportedActs = (exported.system as { activities?: Record<string, unknown> })
    .activities;
  const goldenActs = (golden.system as { activities?: Record<string, unknown> })
    .activities;
  const out: Record<string, unknown> = { ...(exportedActs ?? {}) };

  const exportedNames = new Set(
    Object.values(out).map((a) =>
      activityName(a as Record<string, unknown>).toLowerCase(),
    ),
  );

  for (const [id, raw] of Object.entries(goldenActs ?? {})) {
    const act = raw as Record<string, unknown>;
    const name = activityName(act).toLowerCase();
    // Skip duplicate primary attacks / empty names already covered by export.
    if (!name || name === "(unnamed)" || name === "attack") continue;
    // Keep golden ammo / specialty activities not present in export.
    if (!exportedNames.has(name) && !out[id]) {
      out[id] = act;
      exportedNames.add(name);
    }
  }
  return out;
}

function graftMacroFlags(
  item: FoundryItem,
  from: FoundryItem | null,
): void {
  if (!from?.flags) return;
  const src = from.flags as Record<string, unknown>;
  const dst = (item.flags ?? {}) as Record<string, unknown>;
  item.flags = {
    ...dst,
    itemacro: src.itemacro ?? dst.itemacro,
    "midi-qol": src["midi-qol"] ?? dst["midi-qol"],
    world: {
      ...((dst.world as Record<string, unknown>) ?? {}),
      ...((src.world as Record<string, unknown>) ?? {}),
    },
  };
}

function cloneMergeTier(
  exported: FoundryItem,
  stem: string,
  tier: Tier,
  filename: string,
): FoundryItem {
  const prevTier: Tier[] =
    tier === "Legendary"
      ? ["Very Rare", "Rare", "Uncommon"]
      : tier === "Very Rare"
        ? ["Rare", "Uncommon"]
        : tier === "Rare"
          ? ["Uncommon"]
          : [];

  let base: FoundryItem | null = null;
  for (const prev of prevTier) {
    base = loadGolden(stem, prev);
    if (base) break;
  }

  if (!base) return exported;

  const merged: FoundryItem = structuredClone(base);
  merged.name = exported.name;
  merged._id = exported._id;

  const expSys = exported.system as Record<string, unknown>;
  const mSys = merged.system as Record<string, unknown>;
  mSys.rarity = expSys.rarity;
  mSys.magicalBonus = expSys.magicalBonus;
  mSys.properties = expSys.properties;
  mSys.uses = expSys.uses;
  mSys.description = expSys.description;
  if (expSys.chat) mSys.chat = expSys.chat;
  mSys.activities = mergeActivities(exported, base);
  merged.effects = exported.effects?.length ? exported.effects : merged.effects;

  const graftFrom = GRAFT_MACRO_FROM[filename];
  const macroSource =
    (graftFrom ? loadGolden(stem, graftFrom) : null) ?? base;
  graftMacroFlags(merged, macroSource);

  // Refresh world tier flags from export when present.
  const expWorld = (exported.flags as { world?: Record<string, unknown> } | undefined)
    ?.world;
  if (expWorld) {
    const flags = (merged.flags ?? {}) as Record<string, unknown>;
    flags.world = {
      ...((flags.world as Record<string, unknown>) ?? {}),
      ...expWorld,
    };
    merged.flags = flags;
  }

  // Hand-tuned bowgun / bow world counters by tier.
  const flags = (merged.flags ?? {}) as Record<string, unknown>;
  const world = {
    ...((flags.world as Record<string, unknown>) ?? {}),
  };
  if (stem === "heavy-bowgun") {
    const hbg = { ...((world.hbg as Record<string, unknown>) ?? {}) };
    hbg.tier = tier === "Very Rare" ? "veryRare" : "legendary";
    hbg.specialAmmoMax = tier === "Very Rare" ? 6 : 8;
    world.hbg = hbg;
  } else if (stem === "light-bowgun") {
    const lbg = { ...((world.lbg as Record<string, unknown>) ?? {}) };
    lbg.tier = tier === "Very Rare" ? "veryRare" : "legendary";
    lbg.specialAmmoMax = tier === "Very Rare" ? 6 : 10;
    world.lbg = lbg;
  } else if (stem === "bow") {
    const bow = { ...((world.bow as Record<string, unknown>) ?? {}) };
    bow.tier = tier === "Very Rare" ? "veryRare" : "legendary";
    bow.tracerMax = tier === "Very Rare" ? 4 : 5;
    world.bow = bow;
    // Tracer charge pool on item uses.
    mSys.uses = {
      spent: 0,
      recovery: [],
      max: String(bow.tracerMax),
    };
    if (tier === "Legendary") {
      const acts = mSys.activities as Record<string, Record<string, unknown>>;
      for (const act of Object.values(acts ?? {})) {
        if (/^dragonpiercer$/i.test(String(act?.name ?? "").trim())) {
          act.name = "True Dragonpiercer";
          const midi =
            (act.midiProperties as Record<string, unknown> | undefined) ?? {};
          act.midiProperties = {
            ...midi,
            identifier: "true-dragonpiercer",
            displayActivityName: true,
          };
        }
      }
    }
  } else if (stem === "gunlance") {
    const gunlance = {
      ...((world.gunlance as Record<string, unknown>) ?? {}),
    };
    gunlance.isGunlance = true;
    gunlance.tier = tier === "Very Rare" ? "veryRare" : "legendary";
    gunlance.shellMax = tier === "Very Rare" ? 5 : 6;
    world.gunlance = gunlance;
  }
  flags.world = world;
  merged.flags = flags;

  return merged;
}

function maybeGraftMacro(
  item: FoundryItem,
  stem: string,
  filename: string,
  tier: Tier,
): FoundryItem {
  const graftFrom = GRAFT_MACRO_FROM[filename];
  if (!graftFrom) return item;
  // Only graft when this tier is above the macro source (or equal for rebuild).
  const fromIdx = ALL_TIERS.indexOf(graftFrom);
  const tierIdx = ALL_TIERS.indexOf(tier);
  if (tierIdx < fromIdx) return item;

  const golden = loadGolden(stem, graftFrom);
  if (!golden) return item;
  graftMacroFlags(item, golden);

  // Hand-tuned lower tiers carry their own world.tier; refresh for VR/Legendary.
  if (stem === "gunlance" && (tier === "Very Rare" || tier === "Legendary")) {
    const flags = (item.flags ?? {}) as Record<string, unknown>;
    const world = {
      ...((flags.world as Record<string, unknown>) ?? {}),
    };
    world.gunlance = {
      ...((world.gunlance as Record<string, unknown>) ?? {}),
      isGunlance: true,
      tier: tier === "Very Rare" ? "veryRare" : "legendary",
      shellMax: tier === "Very Rare" ? 5 : 6,
    };
    flags.world = world;
    item.flags = flags;
  }

  return item;
}

describe("Generate Foundry weapon examples (all rarities)", () => {
  for (const filename of MANIFEST.weapons) {
    describe(filename, () => {
      const raw = JSON.parse(
        readFileSync(`public/data/raintdm-weapons/${filename}`, "utf8"),
      );
      const [weapon] = parseImportedWeapons([raw], { isCustom: false });
      const stem = weaponStem(filename);

      for (const tier of ALL_TIERS) {
        it(`exports ${tier}`, () => {
          const idx = weapon.rarityRows.findIndex((r) => r.rarity === tier);
          expect(idx, `${tier} row missing`).toBeGreaterThanOrEqual(0);

          const preserveTiers = PRESERVE_EXISTING_TIERS[filename] ?? [];
          const existing = loadGolden(stem, tier);
          if (
            preserveTiers.includes(tier) &&
            existing &&
            process.env.UPDATE_FOUNDRY_EXAMPLES === "1"
          ) {
            // Keep hand-tuned golden; still assert it exists.
            expect(existing.name).toContain(
              tier === "Very Rare" ? "Very Rare" : tier,
            );
            return;
          }

          let item = buildWeaponFoundryItem(weapon, idx);
          ensureNamedAttack(item);

          const useCloneMerge =
            CLONE_MERGE_WEAPONS.has(filename) &&
            (tier === "Very Rare" || tier === "Legendary");

          if (useCloneMerge) {
            item = cloneMergeTier(item, stem, tier, filename);
            ensureNamedAttack(item);
          } else {
            item = maybeGraftMacro(item, stem, filename, tier);
          }

          expect(item.name).toContain(tier === "Very Rare" ? "Very Rare" : tier);

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
          } else if (!existsSync(outPath) && tier !== "Common") {
            // Common goldens are optional historically; require U→L.
            expect.fail(
              `Missing golden file: ${outPath} (run with UPDATE_FOUNDRY_EXAMPLES=1)`,
            );
          }
        });
      }
    });
  }
});
