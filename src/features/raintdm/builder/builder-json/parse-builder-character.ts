/**
 * Validates an unknown JSON value as a BuilderCharacterJson envelope.
 * Returns the typed envelope on success, or a human-readable error string.
 */
import {
  BUILDER_CHARACTER_JSON_KIND,
  BUILDER_CHARACTER_JSON_VERSION,
  BUILDER_SNAPSHOT_VERSION,
  type BuilderCharacterJson,
} from "./builder-character.types";

export type ParseBuilderCharacterResult =
  | { ok: true; data: BuilderCharacterJson }
  | { ok: false; error: string };

export function parseBuilderCharacter(raw: unknown): ParseBuilderCharacterResult {
  if (typeof raw !== "object" || raw === null) {
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

  if (
    typeof obj["identity"] !== "object" ||
    typeof obj["core"] !== "object" ||
    typeof obj["multiclass"] !== "object" ||
    typeof obj["snapshot"] !== "object"
  ) {
    return { ok: false, error: "Invalid Builder JSON: missing required fields." };
  }

  return { ok: true, data: raw as BuilderCharacterJson };
}
