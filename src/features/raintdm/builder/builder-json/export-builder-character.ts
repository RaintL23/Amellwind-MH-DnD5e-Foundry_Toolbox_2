/**
 * Builds and downloads a BuilderCharacterJson file in the browser.
 * No portrait/token images are included — only the build state.
 */
import type { CartEntry } from "@/shared/types";
import type { CharacterBuilderContextValue } from "../context/character-builder.types";
import { buildBuilderPersistPayload } from "../storage/builder-persist";
import {
  BUILDER_CHARACTER_JSON_KIND,
  BUILDER_CHARACTER_JSON_VERSION,
  BUILDER_SNAPSHOT_VERSION,
  type BuilderCharacterJson,
} from "./builder-character.types";

/** Builds the typed envelope from live builder state (sync, no side effects). */
export function buildBuilderCharacterJson(
  builder: CharacterBuilderContextValue,
  inventory: { items: CartEntry[] },
): BuilderCharacterJson {
  const payload = buildBuilderPersistPayload(builder, inventory);
  return {
    kind: BUILDER_CHARACTER_JSON_KIND,
    version: BUILDER_CHARACTER_JSON_VERSION,
    snapshotVersion: BUILDER_SNAPSHOT_VERSION,
    identity: payload.identity,
    core: payload.core,
    multiclass: payload.multiclass,
    snapshot: payload.snapshot,
  };
}

/** Slugifies a string segment for use in a filename. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Builds the filename: raintdm-builder-{species}-{class}-{subclass}-{name}-{level}.json */
function buildFilename(data: BuilderCharacterJson): string {
  const parts: string[] = ["raintdm-builder"];
  const species = data.identity.species?.name;
  const className = data.identity.class?.name;
  const subclass = data.identity.subclass?.name;
  const name = data.core.name;
  const level = data.core.level;

  if (species) parts.push(slugify(species));
  if (className) parts.push(slugify(className));
  if (subclass) parts.push(slugify(subclass));
  parts.push(slugify(name) || "character");
  parts.push(String(level));

  return `${parts.join("-")}.json`;
}

/** Triggers a browser download of the Builder character JSON. */
export function downloadBuilderCharacterJson(data: BuilderCharacterJson): void {
  const filename = buildFilename(data);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
