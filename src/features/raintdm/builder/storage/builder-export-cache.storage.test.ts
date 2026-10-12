import { describe, expect, it } from "vitest";
import v1Fixture from "../builder-json/__fixtures__/builder-character.v1.json";
import { normalizeBuilderPersistedBuild, type BuilderPersistedBuild } from "./builder-autosave.storage";
import { builderBuildKey } from "./builder-export-cache.storage";

describe("builderBuildKey", () => {
  it("matches a live payload and the same build read back from the autosave", () => {
    const fromAutosave = normalizeBuilderPersistedBuild(structuredClone(v1Fixture))!;
    // Live refs omit the subrace keys the autosave normalizer adds.
    const live = structuredClone(fromAutosave) as BuilderPersistedBuild;
    live.identity.class = { id: "XPHB::Fighter", name: "Fighter" };

    expect(builderBuildKey(live)).toBe(builderBuildKey(fromAutosave));
  });

  it("changes when a choice changes", () => {
    const build = normalizeBuilderPersistedBuild(structuredClone(v1Fixture))!;
    const edited = structuredClone(build);
    edited.snapshot.speciesSkillChoices = ["prc"];
    expect(builderBuildKey(edited)).not.toBe(builderBuildKey(build));
  });
});
