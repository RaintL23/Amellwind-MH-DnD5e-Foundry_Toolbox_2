import { describe, expect, it } from "vitest";
import { normalizeBuilderSnapshot } from "../foundry-export/builder-snapshot";
import { parseBuilderCharacter } from "./parse-builder-character";
import {
  BUILDER_CHARACTER_JSON_KIND,
  BUILDER_CHARACTER_JSON_VERSION,
  BUILDER_SNAPSHOT_VERSION,
} from "./builder-character.types";

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
});

describe("normalizeBuilderSnapshot", () => {
  it("returns null for unsupported versions", () => {
    expect(normalizeBuilderSnapshot({ version: 0 })).toBeNull();
    expect(normalizeBuilderSnapshot(null)).toBeNull();
  });
});
