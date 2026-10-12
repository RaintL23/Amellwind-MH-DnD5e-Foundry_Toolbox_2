import { describe, expect, it } from "vitest";
import { normalizeBuilderSnapshot } from "../foundry-export/builder-snapshot";
import { normalizeBuilderPersistedBuild } from "../storage/builder-autosave.storage";
import { parseBuilderCharacter } from "./parse-builder-character";
import { builderCharacterJsonFromPersistedBuild } from "./export-builder-character";
import {
  BUILDER_CHARACTER_JSON_KIND,
  BUILDER_CHARACTER_JSON_VERSION,
  BUILDER_SNAPSHOT_VERSION,
} from "./builder-character.types";
import v1Fixture from "./__fixtures__/builder-character.v1.json";

function minimalEnvelope(overrides: Record<string, unknown> = {}) {
  return {
    kind: BUILDER_CHARACTER_JSON_KIND,
    version: BUILDER_CHARACTER_JSON_VERSION,
    snapshotVersion: BUILDER_SNAPSHOT_VERSION,
    identity: {
      class: { id: "fighter|xphb", name: "Fighter" },
      subclass: null,
      species: { id: "human|xphb", name: "Human" },
      background: { id: "soldier|xphb", name: "Soldier" },
    },
    core: {
      name: "Aria",
      size: "M",
      alignment: ["L", "G"],
      level: 5,
      abilities: { str: 16, dex: 14, con: 14, int: 8, wis: 12, cha: 10 },
    },
    multiclass: { enabled: false, entries: [], primaryClassLevel: 5 },
    snapshot: {
      version: BUILDER_SNAPSHOT_VERSION,
      useAmellwindHomebrew: false,
      featSelections: [{ id: "alert", name: "Alert", source: "dnd2024" }],
      classSkillChoices: { 0: ["ath", "prc"] },
    },
    ...overrides,
  };
}

describe("parseBuilderCharacter", () => {
  it("fills defaults for snapshot fields missing from older exports", () => {
    const result = parseBuilderCharacter(minimalEnvelope());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { snapshot } = result.data;
    expect(snapshot.featSelections).toHaveLength(1);
    expect(snapshot.classSkillChoices).toEqual({ 0: ["ath", "prc"] });
    expect(snapshot.speciesWeaponChoices).toEqual([]);
    expect(snapshot.speciesAbilityChoices).toEqual([]);
    expect(snapshot.equipment.inventory).toEqual([]);
    expect(snapshot.abilityScoreMethod).toBe("manual");
    // Absent backstory stays undefined so it never wipes locally saved notes.
    expect(snapshot.backstoryNotes).toBeUndefined();
  });

  it("keeps backstory, species weapon choices and data-URL art", () => {
    const envelope = minimalEnvelope({
      art: { portrait: "data:image/png;base64,AAAA", token: "https://example.com/x.png" },
    });
    envelope.snapshot = {
      ...envelope.snapshot,
      backstoryNotes: "Raised by the Guild.",
      speciesWeaponChoices: ["Longbow"],
    } as typeof envelope.snapshot;

    const result = parseBuilderCharacter(envelope);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.snapshot.backstoryNotes).toBe("Raised by the Guild.");
    expect(result.data.snapshot.speciesWeaponChoices).toEqual(["Longbow"]);
    expect(result.data.art).toEqual({
      portrait: "data:image/png;base64,AAAA",
      token: null,
    });
  });

  it("normalizes identity refs, clamps core values and drops empty multiclass", () => {
    const result = parseBuilderCharacter(
      minimalEnvelope({
        identity: { class: { id: 3 }, subclass: null, species: null, background: null },
        core: { name: "X", level: 42, abilities: { str: 99 } },
        multiclass: { enabled: true, entries: [], primaryClassLevel: 5 },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.identity.class).toBeNull();
    expect(result.data.core.level).toBe(20);
    expect(result.data.core.abilities.str).toBe(30);
    expect(result.data.core.abilities.dex).toBe(10);
    expect(result.data.multiclass.enabled).toBe(false);
  });

  it("rejects Foundry actors and mismatched versions", () => {
    const foundry = parseBuilderCharacter({ type: "character", system: {}, flags: {} });
    expect(foundry.ok).toBe(false);

    const badSnapshot = parseBuilderCharacter(
      minimalEnvelope({ snapshot: { version: 999 } }),
    );
    expect(badSnapshot.ok).toBe(false);
  });

  it("rejects files from a newer app version with a clear message", () => {
    const result = parseBuilderCharacter(
      minimalEnvelope({ version: BUILDER_CHARACTER_JSON_VERSION + 1 }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/newer version/);
  });

  it("migrates a v1 export: exportedAt moves to meta, provenance is kept", () => {
    const result = parseBuilderCharacter(structuredClone(v1Fixture));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.migratedFrom).toBe(1);
    expect(result.warnings).toEqual([]);
    expect(result.data.version).toBe(BUILDER_CHARACTER_JSON_VERSION);
    expect(result.data).not.toHaveProperty("exportedAt");
    expect(result.data.meta).toMatchObject({
      exportedAt: "2026-05-01T10:00:00.000Z",
      complete: false,
      sources: ["XPHB"],
    });
    // The Character Sheet compiler reads these: they must survive the parse.
    expect(result.data.provenance?.abilityScores.final.str).toBe(17);
    expect(result.data.provenance?.languages).toEqual([
      { name: "Common", grantedBy: ["Species: Human"] },
    ]);
    expect(result.data.snapshot.personality.trait1).toBe("Stubborn");
    expect(result.data.snapshot.backgroundOriginFeat?.name).toBe("Savage Attacker");
  });

  it("keeps provenance, derived and meta of a current export", () => {
    const v2 = builderCharacterJsonFromPersistedBuild(
      normalizeBuilderPersistedBuild(structuredClone(v1Fixture))!,
      {
        provenance: parseV1().provenance,
        derived: {
          proficiencyBonus: 3,
          hitPoints: { max: 44, hitDice: "5d10" },
          armorClass: 16,
          initiative: 2,
          speed: { walk: 30 },
          passivePerception: 14,
          spellcasting: null,
          attunement: { slots: 3, artificerBonusMaterialSlots: 0 },
        },
        completeness: { complete: true, pendingChoices: [] },
      },
    );
    const result = parseBuilderCharacter(JSON.parse(JSON.stringify(v2)));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.migratedFrom).toBeNull();
    expect(result.warnings).toEqual([]);
    expect(result.data).toEqual(v2);
    expect(Object.keys(result.data)).toEqual([
      "kind",
      "version",
      "snapshotVersion",
      "meta",
      "identity",
      "core",
      "multiclass",
      "snapshot",
      "provenance",
      "derived",
    ]);
  });

  it("drops malformed entries with warnings instead of failing", () => {
    const envelope = minimalEnvelope();
    envelope.snapshot = {
      ...envelope.snapshot,
      featSelections: [
        { id: "alert", name: "Alert", source: "dnd2024" },
        { name: "No id", source: "dnd2024" },
        null,
      ],
      classSkillChoices: { 0: ["ath", "xyz"], bad: ["prc"] },
      spellSelections: { 1: [{ id: "a", name: "Bless", source: "XPHB" }] },
      abilityScoreMethod: "telepathy",
      equipment: { inventory: [{ name: "Torch", quantity: 0 }, { cost: "1 gp" }] },
    } as unknown as typeof envelope.snapshot;

    const result = parseBuilderCharacter(envelope);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { snapshot } = result.data;
    // Index-bearing lists keep their positions.
    expect(snapshot.featSelections).toEqual([
      { id: "alert", name: "Alert", source: "dnd2024" },
      null,
      null,
    ]);
    expect(snapshot.classSkillChoices).toEqual({ 0: ["ath"] });
    expect(snapshot.spellSelections).toEqual({ 1: [] });
    expect(snapshot.abilityScoreMethod).toBe("manual");
    expect(snapshot.equipment.inventory).toEqual([
      { name: "Torch", cost: "", weight: "", quantity: 1 },
    ]);
    expect(result.warnings).toHaveLength(6);
    expect(result.warnings.join(" ")).toMatch(/"xyz"/);
  });

  it("falls back to base scores when provenance final scores are invalid", () => {
    const fixture = structuredClone(v1Fixture) as Record<string, unknown>;
    (fixture.provenance as { abilityScores: { final: unknown } }).abilityScores.final = "?";
    const result = parseBuilderCharacter(fixture);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.provenance?.abilityScores.final).toEqual(result.data.core.abilities);
    expect(result.warnings).toHaveLength(1);
  });
});

function parseV1() {
  const result = parseBuilderCharacter(structuredClone(v1Fixture));
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

describe("normalizeBuilderSnapshot", () => {
  it("returns null for unsupported versions", () => {
    expect(normalizeBuilderSnapshot({ version: 0 })).toBeNull();
    expect(normalizeBuilderSnapshot(null)).toBeNull();
  });

  it("is idempotent", () => {
    const once = normalizeBuilderSnapshot(structuredClone(v1Fixture.snapshot));
    const twice = normalizeBuilderSnapshot(JSON.parse(JSON.stringify(once)));
    expect(twice).toEqual(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });
});
