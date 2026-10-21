import { describe, expect, it } from "vitest";
import type { BuilderMulticlassEntry } from "@/shared/types";
import { buildFoundryActor } from "./actor.builder";
import type { ClassInfoInput, FoundryExportInput } from "./actor-export.types";
import { normalizeMulticlassEntries } from "./builder-snapshot-validators";
import { readBuilderMulticlass, toBuilderSnapshotFlags } from "./builder-snapshot";
import { parseFoundryActor } from "../foundry-import";

function classInfo(name: string, levels: number, overrides: Partial<ClassInfoInput> = {}): ClassInfoInput {
  return {
    name,
    identifier: name.toLowerCase(),
    hitDie: "d10",
    levels,
    spellcastingProgression: "none",
    spellcastingAbility: "",
    primaryAbilities: [],
    saveProficiencies: [],
    features: [],
    ...overrides,
  };
}

function exportInput(overrides: Partial<FoundryExportInput> = {}): FoundryExportInput {
  return {
    name: "Aria",
    size: "M",
    alignment: "",
    level: 5,
    xp: 0,
    abilities: { str: 14, dex: 14, con: 14, int: 14, wis: 10, cha: 10 },
    saveProficiencies: [],
    skillProficiencies: {},
    proficiencyBonus: 3,
    hp: 40,
    speed: { walk: 30 },
    acCalc: "default",
    acFlat: null,
    initiativeAbility: "",
    darkvision: null,
    languages: [],
    tools: [],
    weaponProficiencies: [],
    armorProficiencies: [],
    resistances: [],
    immunities: [],
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    spellcastingAbility: "",
    casterProgression: "none",
    casterLevel: 0,
    pactSlots: null,
    attunementMax: 3,
    biography: "",
    classInfo: classInfo("Fighter", 3, { saveProficiencies: ["str", "con"] }),
    subclassInfo: null,
    additionalClasses: [],
    spellSlotOverride: null,
    raceInfo: null,
    backgroundInfo: null,
    feats: [],
    weapons: [],
    armors: [],
    trinkets: [],
    loot: [],
    spells: [],
    runes: [],
    ...overrides,
  };
}

function itemsOfType(actor: ReturnType<typeof buildFoundryActor>, type: string) {
  return actor.items.filter((item) => item.type === type);
}

describe("buildFoundryActor — multiclass", () => {
  it("emits one class item per class with its own levels and HP advancement", () => {
    const actor = buildFoundryActor(
      exportInput({
        additionalClasses: [
          {
            classInfo: classInfo("Wizard", 2, {
              hitDie: "d6",
              spellcastingProgression: "full",
              spellcastingAbility: "int",
            }),
            subclassInfo: null,
          },
        ],
        spellSlotOverride: { 1: 3 },
      }),
    );

    const classes = itemsOfType(actor, "class");
    expect(classes.map((c) => c.name)).toEqual(["Fighter", "Wizard"]);
    const system = (item: (typeof classes)[number]) =>
      item.system as { levels: number; advancement: { type: string; value: Record<string, string> }[] };
    expect(system(classes[1]).levels).toBe(2);
    const wizardHp = system(classes[1]).advancement.find((a) => a.type === "HitPoints");
    expect(wizardHp?.value).toEqual({ 1: "avg", 2: "avg" });
    const fighterHp = system(classes[0]).advancement.find((a) => a.type === "HitPoints");
    expect(fighterHp?.value["1"]).toBe("max");

    const details = actor.system as { details: { originalClass: string }; spells: Record<string, { value: number }> };
    expect(details.details.originalClass).toBe(classes[0]._id);
    expect(details.spells.spell1.value).toBe(3);
  });

  it("groups optional-feature picks under their own class", () => {
    const actor = buildFoundryActor(
      exportInput({
        additionalClasses: [{ classInfo: classInfo("Warlock", 2), subclassInfo: null }],
        feats: [
          {
            name: "Agonizing Blast",
            subtype: "feat",
            level: 0,
            originKind: "class",
            originClass: "warlock",
          },
        ],
      }),
    );
    const warlock = itemsOfType(actor, "class").find((c) => c.name === "Warlock");
    const feat = actor.items.find((item) => item.name === "Agonizing Blast");
    const origin = (feat?.flags as Record<string, Record<string, unknown>> | undefined)?.dnd5e
      ?.advancementOrigin;
    expect(String(origin ?? "")).toContain(warlock?._id ?? "missing");
  });
});

const FIRE_BOLT = { id: "fire-bolt|xphb", name: "Fire Bolt", level: 0, source: "XPHB" };

const entries: BuilderMulticlassEntry[] = [
  {
    classRef: { id: "wizard|xphb", name: "Wizard" },
    level: 2,
    subclass: null,
    spellSelections: {
      0: [{ id: "fire-bolt|xphb", name: "Fire Bolt", level: 0, source: "XPHB" }],
    },
  },
];

describe("Foundry multiclass round trip", () => {
  it("keeps additional classes and their spells in the actor flags", () => {
    const flags = toBuilderSnapshotFlags(
      {} as Parameters<typeof toBuilderSnapshotFlags>[0],
      entries,
    );
    expect(readBuilderMulticlass(flags)).toMatchObject(entries);
  });

  it("parses the primary class from details.originalClass and sums levels", () => {
    const parsed = parseFoundryActor({
      type: "character",
      name: "Aria",
      system: { details: { originalClass: "fighterId" } },
      items: [
        { _id: "wizardId", type: "class", name: "Wizard", system: { identifier: "wizard", levels: 2 } },
        { _id: "fighterId", type: "class", name: "Fighter", system: { identifier: "fighter", levels: 3 } },
        { type: "subclass", name: "Champion", system: { classIdentifier: "fighter" } },
      ],
    });
    expect(parsed.className).toBe("Fighter");
    expect(parsed.subclassName).toBe("Champion");
    expect(parsed.level).toBe(5);
    expect(parsed.additionalClasses).toEqual([
      { name: "Wizard", levels: 2, subclassName: null },
    ]);
  });
});

describe("normalizeMulticlassEntries", () => {
  it("drops invalid spells and clamps the level", () => {
    const warnings: string[] = [];
    const [entry] = normalizeMulticlassEntries(
      [
        {
          classRef: { id: "wizard|xphb", name: "Wizard" },
          subclass: null,
          level: 40,
          spellSelections: { 1: [{ id: "x" }, FIRE_BOLT] },
        },
      ],
      (message) => warnings.push(message),
    );
    expect(entry.level).toBe(19);
    expect(entry.spellSelections?.[1]).toHaveLength(1);
    expect(warnings.length).toBeGreaterThan(0);
  });
});
