/**
 * Validates an unknown JSON value as a BuilderCharacterJson envelope.
 * Returns the typed, normalized envelope on success, or a human-readable error.
 * Missing optional fields (from older exports) are filled with defaults.
 */
import { normalizeBuilderPersistedBuild } from "../storage/builder-autosave.storage";
import {
  BUILDER_CHARACTER_JSON_KIND,
  BUILDER_CHARACTER_JSON_VERSION,
  BUILDER_SNAPSHOT_VERSION,
  type BuilderCharacterArt,
  type BuilderCharacterJson,
} from "./builder-character.types";

export type ParseBuilderCharacterResult =
  | { ok: true; data: BuilderCharacterJson }
  | { ok: false; error: string };

function toImageDataUrl(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("data:image/") ? value : null;
}

function parseArt(value: unknown): BuilderCharacterArt | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const art = value as Record<string, unknown>;
  const portrait = toImageDataUrl(art.portrait);
  const token = toImageDataUrl(art.token);
  return portrait || token ? { portrait, token } : undefined;
}

export function parseBuilderCharacter(raw: unknown): ParseBuilderCharacterResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Invalid file: not a JSON object." };
  }

  const obj = raw as Record<string, unknown>;

  // Detect common mistake: uploading a Foundry VTT actor.
  if (
    obj["type"] === "character" &&
    typeof obj["system"] === "object" &&
    typeof obj["flags"] === "object"
  ) {
    return {
      ok: false,
      error:
        'This looks like a Foundry VTT actor JSON. Please upload a Builder JSON file instead (exported via "Download Builder JSON").',
    };
  }

  if (obj["kind"] !== BUILDER_CHARACTER_JSON_KIND) {
    return {
      ok: false,
      error: `Unrecognized file format (kind: "${String(obj["kind"] ?? "unknown")}"). Expected an Amellwind Builder JSON.`,
    };
  }

  if (obj["version"] !== BUILDER_CHARACTER_JSON_VERSION) {
    return {
      ok: false,
      error: `Unsupported Builder JSON version (${String(obj["version"])}). Please re-export from the current version of the app.`,
    };
  }

  if (obj["snapshotVersion"] !== BUILDER_SNAPSHOT_VERSION) {
    return {
      ok: false,
      error: `Incompatible snapshot version (${String(obj["snapshotVersion"])}). Re-export the character from the current version of the app.`,
    };
  }

  const build = normalizeBuilderPersistedBuild(obj);
  if (!build) {
    return { ok: false, error: "Invalid Builder JSON: missing or malformed required fields." };
  }

  const art = parseArt(obj["art"]);
  return {
    ok: true,
    data: {
      kind: BUILDER_CHARACTER_JSON_KIND,
      version: BUILDER_CHARACTER_JSON_VERSION,
      snapshotVersion: BUILDER_SNAPSHOT_VERSION,
      ...(typeof obj["exportedAt"] === "string" ? { exportedAt: obj["exportedAt"] } : {}),
      ...build,
      ...(art ? { art } : {}),
    },
  };
}
