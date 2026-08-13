import { useEffect, useMemo, useRef } from "react";
import type { CartEntry } from "@/shared/types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import type { CharacterBuilderContextValue } from "../context/character-builder.types";
import {
  applyBuilderSnapshot,
  gatherBuilderSnapshot,
  type ApplyBuilderSnapshotInventory,
} from "../foundry-export";
import { parseAlignmentAxes } from "../utils/alignment.utils";
import {
  loadBuilderAutosave,
  persistBuilderAutosave,
  type BuilderAutosaveState,
} from "../storage/builder-autosave.storage";

type PersistPayload = Omit<BuilderAutosaveState, "version" | "snapshotVersion">;

/** Builds the serializable autosave payload from the live builder state. */
function buildPersistPayload(
  builder: CharacterBuilderContextValue,
  inventory: { items: CartEntry[] },
): PersistPayload {
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
function hasBuildContent(payload: PersistPayload): boolean {
  const { identity, core, snapshot } = payload;
  const eq = snapshot.equipment;
  return Boolean(
    identity.class ||
      identity.species ||
      identity.background ||
      snapshot.featSelections.some(Boolean) ||
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
 * Restores a saved build. Mirrors the ordering used by the Foundry import
 * (`useFoundryImport`): identity first so the synchronous slice resets settle,
 * then multiclass, then core fields, then the lossless snapshot. Runs as a
 * single synchronous pass, so React batches all the setter updates together.
 */
function rehydrateBuild(
  builder: CharacterBuilderContextValue,
  inventory: ApplyBuilderSnapshotInventory,
  saved: BuilderAutosaveState,
): void {
  // Homebrew toggle first: its dependent reset effects must settle before
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
  // Set the total level last so it wins over the transient values the
  // multiclass level setters computed from stale (pre-batch) entries.
  builder.setLevel(saved.core.level);

  // Optional choices + exact equipment + loose inventory.
  applyBuilderSnapshot(builder, inventory, saved.snapshot);
}

/**
 * Autosaves the active build to localStorage and rehydrates it on mount so the
 * builder survives reloads and browser restarts. Rendered inside the builder
 * route providers only.
 */
export function BuilderAutosaveSync() {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const hydratedRef = useRef(false);
  const lastWrittenRef = useRef<string | null>(null);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const saved = loadBuilderAutosave();
    if (saved) rehydrateBuild(builder, inventory, saved);
    // Rehydrate exactly once on mount; the guard above prevents re-entry.
  }, []);

  const payload = useMemo(
    () => buildPersistPayload(builder, { items: inventory.items }),
    [builder, inventory.items],
  );
  const debounced = useDebouncedValue(payload, 500);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!hasBuildContent(debounced)) return;
    const serialized = JSON.stringify(debounced);
    if (serialized === lastWrittenRef.current) return;
    lastWrittenRef.current = serialized;
    persistBuilderAutosave(debounced);
  }, [debounced]);

  return null;
}
