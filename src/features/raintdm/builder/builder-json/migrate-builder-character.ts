/**
 * Upgrades older Builder JSON envelopes to the current version, one step at a
 * time, before validation. Each step only reshapes the envelope; content
 * repairs belong to the normalizers.
 *
 * v1 → v2: root `exportedAt` moves to `meta.exportedAt`; `meta` is created
 * (complete = false: v1 files never recorded the creation checks).
 */
import {
  BUILDER_CHARACTER_JSON_APP,
  BUILDER_CHARACTER_JSON_VERSION,
} from "./builder-character.types";

type UnknownRecord = Record<string, unknown>;

export type MigrateBuilderCharacterResult =
  | { ok: true; data: UnknownRecord; migratedFrom: number | null }
  | { ok: false; error: string };

const MIGRATIONS: Record<number, (raw: UnknownRecord) => UnknownRecord> = {
  1: (raw) => {
    const { exportedAt, ...rest } = raw;
    return {
      ...rest,
      version: 2,
      meta: {
        exportedAt: typeof exportedAt === "string" ? exportedAt : null,
        app: BUILDER_CHARACTER_JSON_APP,
        sources: [],
        complete: false,
        pendingChoices: [],
      },
    };
  },
};

export function migrateBuilderCharacterJson(raw: UnknownRecord): MigrateBuilderCharacterResult {
  const startVersion = raw.version;
  if (typeof startVersion !== "number" || !Number.isInteger(startVersion) || startVersion < 1) {
    return {
      ok: false,
      error: `Unsupported Builder JSON version (${String(startVersion)}).`,
    };
  }
  if (startVersion > BUILDER_CHARACTER_JSON_VERSION) {
    return {
      ok: false,
      error: `This file was exported by a newer version of the app (Builder JSON v${startVersion}; this app reads up to v${BUILDER_CHARACTER_JSON_VERSION}). Reload the page to update.`,
    };
  }

  let data = raw;
  let version = startVersion;
  while (version < BUILDER_CHARACTER_JSON_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) {
      return { ok: false, error: `No migration from Builder JSON v${version}.` };
    }
    data = step(data);
    version += 1;
  }
  return {
    ok: true,
    data,
    migratedFrom: startVersion === BUILDER_CHARACTER_JSON_VERSION ? null : startVersion,
  };
}
