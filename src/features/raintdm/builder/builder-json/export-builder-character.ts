/**
 * Builds and downloads a BuilderCharacterJson file in the browser: the full
 * restorable build state, portrait/token art, and a read-only provenance block.
 */
import type { CartEntry } from "@/shared/types";
import type { CharacterBuilderContextValue } from "../context/character-builder.types";
import { buildBuilderPersistPayload } from "../storage/builder-persist";
import type { BuilderPersistedBuild } from "../storage/builder-autosave.storage";
import {
  BUILDER_CHARACTER_JSON_KIND,
  BUILDER_CHARACTER_JSON_VERSION,
  BUILDER_SNAPSHOT_VERSION,
  type BuilderCharacterJson,
  type BuilderCharacterProvenance,
} from "./builder-character.types";

/** Builds the typed envelope from a persisted autosave / import payload. */
export function builderCharacterJsonFromPersistedBuild(
  saved: BuilderPersistedBuild,
  options?: {
    art?: BuilderCharacterJson["art"];
    provenance?: BuilderCharacterProvenance;
  },
): BuilderCharacterJson {
  return {
    kind: BUILDER_CHARACTER_JSON_KIND,
    version: BUILDER_CHARACTER_JSON_VERSION,
    snapshotVersion: BUILDER_SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    identity: saved.identity,
    core: saved.core,
    multiclass: saved.multiclass,
    snapshot: saved.snapshot,
    ...(options?.art ? { art: options.art } : {}),
    ...(options?.provenance ? { provenance: options.provenance } : {}),
  };
}

/** Builds the typed envelope from live builder state (sync, no side effects). */
export function buildBuilderCharacterJson(
  builder: CharacterBuilderContextValue,
  inventory: { items: CartEntry[] },
  provenance?: BuilderCharacterProvenance,
): BuilderCharacterJson {
  const payload = buildBuilderPersistPayload(builder, inventory);
  const hasArt = Boolean(builder.portraitImage || builder.tokenImage);
  return builderCharacterJsonFromPersistedBuild(payload, {
    ...(hasArt
      ? {
          art: {
            portrait: builder.portraitImage,
            token: builder.tokenImage,
          },
        }
      : {}),
    ...(provenance ? { provenance } : {}),
  });
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
