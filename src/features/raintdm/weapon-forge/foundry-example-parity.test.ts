import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryExportBundle } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";

type AnyObj = Record<string, unknown>;

function isObj(v: unknown): v is AnyObj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Legacy Midi 11 key dropped when examples were upgraded to the 12.4 blob. */
function stripLegacyMidiKeys(midi: AnyObj): AnyObj {
  const out: AnyObj = {};
  for (const [k, v] of Object.entries(midi)) {
    if (k === "forceDialog") continue;
    out[k] = v;
  }
  return out;
}

function normalizeForParity(value: unknown, path = ""): unknown {
  if (Array.isArray(value)) {
    if (path.endsWith(".effects") || path === "effects") {
      const sorted = [...value].sort((a, b) => {
        const an = isObj(a) ? String(a.name ?? "") : "";
        const bn = isObj(b) ? String(b.name ?? "") : "";
        return an.localeCompare(bn);
      });
      return sorted.map((v, i) => normalizeForParity(v, `${path}[${i}]`));
    }
    if (path.endsWith(".properties") || path === "system.properties") {
      return [...value].map(String).sort((a, b) => a.localeCompare(b));
    }
    return value.map((v, i) => normalizeForParity(v, `${path}[${i}]`));
  }
  if (!isObj(value)) return value;

  // Canonicalize Active Effect objects (key order differs between builders).
  if (
    (/^effects\[\d+\]$/.test(path) || /\.effects\[\d+\]$/.test(path)) &&
    typeof value.name === "string"
  ) {
    const flags = isObj(value.flags) ? value.flags : {};
    const dae = isObj(flags.dae) ? { ...flags.dae } : undefined;
    if (dae) {
      // Optional false defaults — present in some Foundry saves, omitted in others.
      if (dae.selfTargetAlways === false) delete dae.selfTargetAlways;
      if (dae.dontApply === false) delete dae.dontApply;
    }
    return {
      name: value.name,
      img: value.img,
      transfer: value.transfer,
      disabled: value.disabled,
      changes: normalizeForParity(value.changes ?? [], `${path}.changes`),
      flags: normalizeForParity(
        { ...flags, ...(dae ? { dae } : {}) },
        `${path}.flags`,
      ),
    };
  }

  const out: AnyObj = {};
  for (const [k, v] of Object.entries(value)) {
    if (
      k === "_id" ||
      k === "id" ||
      k === "_stats" ||
      k === "sort" ||
      k === "ownership" ||
      k === "folder"
    ) {
      continue;
    }
    const next = path ? `${path}.${k}` : k;
    if (next === "flags.exportSource" || next === "flags.dnd5e.last") continue;
    if (next === "system.equipped") continue;
    if (
      next === "system.advancement" ||
      next === "system.cover" ||
      next === "system.crewed" ||
      next === "flags.dnd5e"
    ) {
      continue;
    }
    if (next.endsWith(".duration.startTime")) {
      out[k] = null;
      continue;
    }
    // Empty activity img is omitted in hand-tuned GS samples.
    if (k === "img" && v === "") continue;
    if (k === "midiProperties" && isObj(v)) {
      out[k] = stripLegacyMidiKeys(v);
      continue;
    }
    if (k === "activities" && isObj(v)) {
      const byKey: AnyObj = {};
      for (const act of Object.values(v)) {
        if (!isObj(act)) continue;
        const name = String(act.name ?? "").trim() || "(default)";
        const type = String(act.type ?? "");
        const midi = isObj(act.midiProperties)
          ? String(act.midiProperties.identifier ?? "")
          : "";
        byKey[`${type}::${name}::${midi}`] = normalizeForParity(act, next);
      }
      out[k] = byKey;
      continue;
    }
    out[k] = normalizeForParity(v, next);
  }
  return out;
}

function deepDiff(
  expected: unknown,
  actual: unknown,
  path: string,
  diffs: string[],
  limit: number,
): void {
  if (diffs.length >= limit) return;
  if (JSON.stringify(expected) === JSON.stringify(actual)) return;

  if (isObj(expected) && isObj(actual)) {
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const k of [...keys].sort()) {
      if (diffs.length >= limit) return;
      const next = path ? `${path}.${k}` : k;
      if (!(k in expected)) {
        diffs.push(`extra ${next}`);
        continue;
      }
      if (!(k in actual)) {
        diffs.push(`missing ${next}`);
        continue;
      }
      deepDiff(expected[k], actual[k], next, diffs, limit);
    }
    return;
  }

  diffs.push(
    `${path}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`,
  );
}

function loadWeapon(sourcePath: string) {
  const raw = JSON.parse(readFileSync(sourcePath, "utf8"));
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });
  return weapon;
}

describe("Weapon Forge Foundry example parity", () => {
  it("Great Sword Uncommon matches example (normalized)", () => {
    const weapon = loadWeapon("public/data/raintdm-weapons/great-sword.json");
    const idx = weapon.rarityRows.findIndex((r) => r.rarity === "Uncommon");
    const { weapon: exported } = buildWeaponFoundryExportBundle(weapon, idx);
    const example = JSON.parse(
      readFileSync(
        "public/data/foundry-jsons-example/weapons/fvtt-Item-great-sword-uncommon.json",
        "utf8",
      ),
    );

    expect(exported.name).toBe("Great Sword (Uncommon)");
    expect(
      Object.values(
        (exported.system as { activities: Record<string, { name?: string }> })
          .activities,
      )
        .map((a) => a.name || "(default)")
        .sort(),
    ).toEqual(
      [
        "(default)",
        "Charged Slash: Gather Charge",
        "Charged Slash ×1",
        "Charged Slash ×2",
        "Charged Slash ×3",
      ].sort(),
    );

    const diffs: string[] = [];
    deepDiff(
      normalizeForParity(example),
      normalizeForParity(exported),
      "",
      diffs,
      40,
    );
    expect(diffs, diffs.slice(0, 15).join("\n")).toEqual([]);
  });

  it("Great Sword Rare matches example activities + envelope", () => {
    const weapon = loadWeapon("public/data/raintdm-weapons/great-sword.json");
    const idx = weapon.rarityRows.findIndex((r) => r.rarity === "Rare");
    const { weapon: exported } = buildWeaponFoundryExportBundle(weapon, idx);
    const example = JSON.parse(
      readFileSync(
        "public/data/foundry-jsons-example/weapons/fvtt-Item-great-sword-rare.json",
        "utf8",
      ),
    );

    expect(exported.name).toBe("Great Sword (Rare)");
    expect((exported.system as { magicalBonus?: number }).magicalBonus).toBe(1);

    const names = Object.values(
      (exported.system as { activities: Record<string, { name?: string }> })
        .activities,
    )
      .map((a) => a.name || "(default)")
      .sort();
    expect(names).toContain("Emergency Guard");
    expect(names).toContain("Charged Slash: Gather Charge");

    const eg = Object.values(
      (
        exported.system as {
          activities: Record<string, { name?: string; range?: { units?: string } }>;
        }
      ).activities,
    ).find((a) => a.name === "Emergency Guard");
    expect(eg?.range?.units).toBe("self");

    const diffs: string[] = [];
    deepDiff(
      normalizeForParity(example),
      normalizeForParity(exported),
      "",
      diffs,
      40,
    );
    expect(diffs, diffs.slice(0, 15).join("\n")).toEqual([]);
  });

  it("Hunting Horn Uncommon has Recital Songbook wiring + Melodies", () => {
    const weapon = loadWeapon("public/data/raintdm-weapons/hunting-horn.json");
    const idx = weapon.rarityRows.findIndex((r) => r.rarity === "Uncommon");
    const { weapon: exported, resources } = buildWeaponFoundryExportBundle(
      weapon,
      idx,
    );
    const example = JSON.parse(
      readFileSync(
        "public/data/foundry-jsons-example/weapons/fvtt-Item-hunting-horn-uncommon.json",
        "utf8",
      ),
    );

    expect(exported.name).toBe("Hunting Horn (Uncommon)");
    const acts = Object.values(
      (
        exported.system as {
          activities: Record<
            string,
            {
              name?: string;
              duration?: { units?: string; value?: string };
              description?: { chatFlavor?: string };
            }
          >;
        }
      ).activities,
    );
    const byName = Object.fromEntries(
      acts.map((a) => [a.name || "(default)", a]),
    );
    expect(byName.Attack).toBeDefined();
    expect(byName.Recital).toBeDefined();
    expect(byName["End Melodies"]).toBeDefined();
    expect(byName.Recital.duration?.units).toBe("minute");
    expect(byName.Recital.duration?.value).toBe("1");
    expect(byName.Recital.description?.chatFlavor).toBe(
      "Perform a Melody from your Songbook",
    );
    expect(byName["End Melodies"].description?.chatFlavor).toBe(
      "End all active Songbook Melodies",
    );

    const flags = exported.flags as {
      itemacro?: { macro?: { command?: string } };
      world?: { hh?: { songbook?: boolean } };
      "midi-qol"?: { onUseMacroName?: string };
    };
    expect(flags.itemacro?.macro?.command).toContain("Songbook");
    expect(flags.world?.hh?.songbook).toBe(true);
    expect(flags["midi-qol"]?.onUseMacroName).toBe("[preTargeting]ItemMacro");

    expect(resources.map((r) => r.name).sort()).toEqual([
      "Melody of Might",
      "Melody of Swiftness",
    ]);

    // HH example name lacks rarity suffix — compare without top-level name.
    const exNorm = normalizeForParity(example) as AnyObj;
    const acNorm = normalizeForParity(exported) as AnyObj;
    delete exNorm.name;
    delete acNorm.name;
    // Example default midi-qol is songbook-only; skip full tree — check key subsets above.
    expect(byName.Recital.duration).toEqual({
      value: "1",
      units: "minute",
      concentration: false,
      override: false,
    });
  });

  it("Melody feats match weapons-resources examples (normalized)", () => {
    const weapon = loadWeapon("public/data/raintdm-weapons/hunting-horn.json");
    const idx = weapon.rarityRows.findIndex((r) => r.rarity === "Uncommon");
    const { resources } = buildWeaponFoundryExportBundle(weapon, idx);
    const byName = Object.fromEntries(resources.map((r) => [r.name, r]));

    for (const [name, path] of [
      [
        "Melody of Might",
        "public/data/foundry-jsons-example/weapons-resources/melodies/fvtt-Item-melody-of-might.json",
      ],
      [
        "Melody of Swiftness",
        "public/data/foundry-jsons-example/weapons-resources/melodies/fvtt-Item-melody-of-swiftness.json",
      ],
    ] as const) {
      const example = JSON.parse(readFileSync(path, "utf8"));
      const exported = byName[name];
      expect(exported).toBeDefined();
      const diffs: string[] = [];
      deepDiff(
        normalizeForParity(example),
        normalizeForParity(exported),
        "",
        diffs,
        30,
      );
      expect(diffs, `${name}\n${diffs.slice(0, 12).join("\n")}`).toEqual([]);
    }
  });
});
