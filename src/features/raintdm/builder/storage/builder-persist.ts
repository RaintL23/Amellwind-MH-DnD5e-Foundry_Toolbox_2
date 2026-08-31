/**
 * Shared helpers for serializing and restoring a Character Builder build.
 * Used by both the local autosave (BuilderAutosaveSync) and the native
 * Builder JSON export/import so both paths reconstruct a build identically.
 *
 * Flow: buildBuilderPersistPayload → persist/download
 *       load/parse → rehydrateBuilderState
 */
import type { CartEntry } from "@/shared/types";
import type { CharacterBuilderContextValue } from "../context/character-builder.types";
import {
  applyBuilderSnapshot,
  gatherBuilderSnapshot,
  type ApplyBuilderSnapshotInventory,
} from "../foundry-export";
import { parseAlignmentAxes } from "../utils/alignment.utils";
import type { BuilderAutosaveState } from "./builder-autosave.storage";

export type BuilderPersistPayload = Omit<
  BuilderAutosaveState,
  "version" | "snapshotVersion"
>;

/** Serializes the live builder state into the persisted envelope shape. */
export function buildBuilderPersistPayload(
  builder: CharacterBuilderContextValue,
  inventory: { items: CartEntry[] },
): BuilderPersistPayload {
  return {
    identity: {
      class: builder.class,
      subclass: builder.subclass,
      species: builder.species,
      background: builder.background,
    },
    core: {
      name: builder.character.name,
      size: builder.character.size,
      alignment: builder.character.alignment,
      level: builder.character.level,
      abilities: builder.character.abilities,
    },
    multiclass: {
      enabled: builder.multiclassEnabled,
      entries: builder.multiclassEntries,
      primaryClassLevel: builder.primaryClassLevel,
    },
    snapshot: gatherBuilderSnapshot(builder, { items: inventory.items }),
  };
}

/** True when the build has any meaningful content worth persisting. */
export function hasBuildContent(payload: BuilderPersistPayload): boolean {
  const { identity, core, snapshot } = payload;
  const eq = snapshot.equipment;
  return Boolean(
    identity.class ||
      identity.species ||
      identity.background ||
      snapshot.featSelections.some(Boolean) ||
      snapshot.speciesOriginFeat ||
      snapshot.backgroundOriginFeat ||
      snapshot.optionalFeatureOriginFeats.some(Boolean) ||
      Object.keys(snapshot.spellSelections).length > 0 ||
      eq.mainHand ||
      eq.offHand ||
      eq.armor ||
      eq.shield ||
      eq.trinket1 ||
      eq.trinket2 ||
      eq.inventory.length > 0 ||
      core.name !== "Hunter" ||
      core.level !== 1,
  );
}

/**
 * Restores a saved build into the live CharacterBuilderContext.
 * Order matters: homebrew toggle → identity → multiclass → core fields →
 * lossless snapshot (same ordering as useFoundryImport).
 */
export function rehydrateBuilderState(
  builder: CharacterBuilderContextValue,
  inventory: ApplyBuilderSnapshotInventory,
  saved: BuilderAutosaveState,
): void {
  // Homebrew toggle first so its dependent reset effects settle before
  // identity-dependent choices are restored.
  builder.setUseAmellwindHomebrew(saved.snapshot.useAmellwindHomebrew);

  // Identity (refs are authoritative — no name matching needed).
  if (saved.identity.class) builder.setClass(saved.identity.class);
  if (saved.identity.subclass) builder.setSubclass(saved.identity.subclass);
  if (saved.identity.species) builder.setSpecies(saved.identity.species);
  if (saved.identity.background) builder.setBackground(saved.identity.background);

  // Multiclass (best-effort; entry mutations use functional state updates).
  const mc = saved.multiclass;
  if (mc.enabled && mc.entries.length > 0) {
    builder.setMulticlassEnabled(true);
    for (let i = 1; i < mc.entries.length; i += 1) builder.addMulticlassEntry();
    mc.entries.forEach((entry, index) => {
      if (entry.classRef) builder.setMulticlassEntryClass(index, entry.classRef);
      if (entry.subclass) builder.setMulticlassEntrySubclass(index, entry.subclass);
      builder.setMulticlassEntryLevel(index, entry.level);
    });
  }

  // Core character fields.
  builder.setName(saved.core.name);
  builder.setCreatureSize(saved.core.size === "S" ? "S" : "M");
  const { lawChaos, goodEvil } = parseAlignmentAxes(saved.core.alignment);
  builder.setLawChaosAlignment(lawChaos);
  builder.setGoodEvilAlignment(goodEvil);
  builder.setAbilityScores(saved.core.abilities);
  // Set total level last so it wins over transient values from multiclass setters.
  builder.setLevel(saved.core.level);

  // Optional choices + exact equipment + loose inventory.
  applyBuilderSnapshot(builder, inventory, saved.snapshot);
}
