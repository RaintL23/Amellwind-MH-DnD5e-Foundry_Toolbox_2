import { describe, expect, it } from "vitest";
import type { Class, Subclass } from "@/shared/types";
import {
  applyArchetypeAbilityPriority,
  isFeatBlockedForArchetype,
  pickBuildArchetype,
} from "./build-archetype.utils";

const cls = (name: string, casterProgression?: string) =>
  ({ name, casterProgression }) as Pick<Class, "name" | "casterProgression">;
const sub = (name: string) => ({ name }) as Pick<Subclass, "name">;

describe("pickBuildArchetype", () => {
  it("full casters without a gish subclass are casters", () => {
    for (let i = 0; i < 20; i++) {
      expect(pickBuildArchetype(cls("Wizard", "full"), null).archetype).toBe("caster");
      expect(pickBuildArchetype(cls("Sorcerer", "full"), null).archetype).toBe("caster");
    }
  });

  it("subclass identity overrides the class weights", () => {
    expect(
      pickBuildArchetype(cls("Wizard", "full"), sub("Bladesinger")).archetype,
    ).toBe("gish");
    expect(
      pickBuildArchetype(cls("Bard", "full"), sub("College of Valor")).archetype,
    ).toBe("gish");
  });

  it("Monks are always DEX melee and Barbarians never casters or ranged", () => {
    for (let i = 0; i < 30; i++) {
      expect(pickBuildArchetype(cls("Monk"), null).archetype).toBe("dex-melee");
      expect(["great-weapon", "sword-board", "dual-wield"]).toContain(
        pickBuildArchetype(cls("Barbarian"), null).archetype,
      );
    }
  });

  it("unknown non-casters fall back to a martial archetype", () => {
    expect(pickBuildArchetype(cls("Sidekick Warrior"), null).archetype).toBe(
      "great-weapon",
    );
  });
});

describe("applyArchetypeAbilityPriority", () => {
  it("puts the archetype's lead abilities first and keeps the rest", () => {
    expect(
      applyArchetypeAbilityPriority(["str", "con", "dex", "wis", "int", "cha"], {
        archetype: "dex-ranged",
        abilityPriority: ["dex", "con", "wis"],
      }),
    ).toEqual(["dex", "con", "wis", "str", "int", "cha"]);
  });
});

describe("isFeatBlockedForArchetype", () => {
  it("blocks feats that clash with the archetype's weapons", () => {
    expect(isFeatBlockedForArchetype("Sharpshooter", "great-weapon")).toBe(true);
    expect(isFeatBlockedForArchetype("Great Weapon Master", "caster")).toBe(true);
    expect(isFeatBlockedForArchetype("Great Weapon Master", "great-weapon")).toBe(false);
    expect(isFeatBlockedForArchetype("War Caster", "caster")).toBe(false);
  });
});
