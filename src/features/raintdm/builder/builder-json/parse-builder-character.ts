/**
 * Validates an unknown JSON value as a BuilderCharacterJson envelope.
 * Pipeline: detect format → migrate older versions → normalize the restorable
 * build (dropping malformed entries) → sanitize the read-only blocks
 * (`meta` / `provenance` / `derived`). Every repair is reported in `warnings`.
 */
import { normalizeBuilderPersistedBuild } from "../storage/builder-autosave.storage";
import { isRecord } from "../foundry-export/builder-snapshot-validators";
import {
  BUILDER_CHARACTER_JSON_APP,
  BUILDER_CHARACTER_JSON_KIND,
  BUILDER_CHARACTER_JSON_VERSION,
  BUILDER_SNAPSHOT_VERSION,
  type BuilderCharacterArt,
  type BuilderCharacterJson,
} from "./builder-character.types";
import { collectBuildSources } from "./builder-character-sources";
import { migrateBuilderCharacterJson } from "./migrate-builder-character";
import {
  normalizeDerived,
  normalizeMeta,
  normalizeProvenance,
} from "./normalize-builder-character-summary";

export type ParseBuilderCharacterResult =
  | {
      ok: true;
      data: BuilderCharacterJson;
      /** Human-readable repairs (dropped / adjusted entries). */
      warnings: string[];
      /** Envelope version the file was upgraded from, or null when current. */
      migratedFrom: number | null;
    }
  | { ok: false; error: string };

function toImageDataUrl(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("data:image/") ? value : null;
}

function parseArt(value: unknown, warnings: string[]): BuilderCharacterArt | undefined {
  if (!isRecord(value)) return undefined;
  const portrait = toImageDataUrl(value.portrait);
  const token = toImageDataUrl(value.token);
  if (value.portrait && !portrait) warnings.push("Portrait: only embedded data:image URLs are supported; ignored.");
  if (value.token && !token) warnings.push("Token: only embedded data:image URLs are supported; ignored.");
  return portrait || token ? { portrait, token } : undefined;
}

export function parseBuilderCharacter(raw: unknown): ParseBuilderCharacterResult {
  if (!isRecord(raw)) {
    return { ok: false, error: "Invalid file: not a JSON object." };
  }

  // Detect common mistake: uploading a Foundry VTT actor.
  if (raw.type === "character" && isRecord(raw.system) && isRecord(raw.flags)) {
    return {
      ok: false,
      error:
        'This looks like a Foundry VTT actor JSON. Please upload a Builder JSON file instead (exported via "Download Builder JSON").',
    };
  }

  if (raw.kind !== BUILDER_CHARACTER_JSON_KIND) {
    return {
      ok: false,
      error: `Unrecognized file format (kind: "${String(raw.kind ?? "unknown")}"). Expected an Amellwind Builder JSON.`,
    };
  }

  const migrated = migrateBuilderCharacterJson(raw);
  if (!migrated.ok) return migrated;
  const obj = migrated.data;

  if (obj.snapshotVersion !== BUILDER_SNAPSHOT_VERSION) {
    return {
      ok: false,
      error: `Incompatible snapshot version (${String(obj.snapshotVersion)}). Re-export the character from the current version of the app.`,
    };
  }

  const warnings: string[] = [];
  const build = normalizeBuilderPersistedBuild(obj, warnings);
  if (!build) {
    return {
      ok: false,
      error:
        'Invalid Builder JSON: "identity", "core" and "snapshot" (with a matching "version") are required.',
    };
  }

  const meta = normalizeMeta(obj.meta) ?? {
    exportedAt: null,
    app: BUILDER_CHARACTER_JSON_APP,
    sources: [],
    complete: false,
    pendingChoices: [],
  };
  if (meta.sources.length === 0) meta.sources = collectBuildSources(build);

  const provenance = normalizeProvenance(
    obj.provenance,
    build.core.abilities,
    (message) => warnings.push(message),
  );
  const derived = normalizeDerived(obj.derived);
  const art = parseArt(obj.art, warnings);

  return {
    ok: true,
    warnings,
    migratedFrom: migrated.migratedFrom,
    data: {
      kind: BUILDER_CHARACTER_JSON_KIND,
      version: BUILDER_CHARACTER_JSON_VERSION,
      snapshotVersion: BUILDER_SNAPSHOT_VERSION,
      meta,
      ...build,
      ...(provenance ? { provenance } : {}),
      ...(derived ? { derived } : {}),
      ...(art ? { art } : {}),
    },
  };
}
