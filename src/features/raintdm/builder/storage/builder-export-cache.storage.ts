/**
 * Export-only blocks (provenance / derived / meta) of the active build, kept
 * next to the autosave so "Load from Builder" (Character Sheet roster) can
 * compile a complete sheet without mounting the Builder. Written by
 * `BuilderExportCacheSync`; only used when `buildKey` matches the autosave.
 */
import { readJson, writeJson } from "@/shared/utils/local-storage.utils";
import type {
  BuilderCharacterDerived,
  BuilderCharacterMeta,
  BuilderCharacterProvenance,
} from "../builder-json/builder-character.types";
import {
  normalizeBuilderPersistedBuild,
  type BuilderPersistedBuild,
} from "./builder-autosave.storage";

const STORAGE_KEY = "mh-builder-export-cache";

export interface BuilderExportCache {
  buildKey: string;
  provenance: BuilderCharacterProvenance;
  derived: BuilderCharacterDerived;
  meta: BuilderCharacterMeta;
}

/** FNV-1a 32-bit — enough to detect a stale cache, not a security hash. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/**
 * Stable key of a build's restorable state. Normalized first so a live payload
 * and the same build read back from the autosave produce the same key.
 */
export function builderBuildKey(build: BuilderPersistedBuild): string {
  const plain = JSON.parse(JSON.stringify(build)) as Record<string, unknown>;
  const normalized = normalizeBuilderPersistedBuild(plain) ?? build;
  return hash(JSON.stringify(normalized));
}

export function persistBuilderExportCache(cache: BuilderExportCache): void {
  writeJson(STORAGE_KEY, cache);
}

/** The cached blocks when they belong to `build`, otherwise null. */
export function loadBuilderExportCache(
  build: BuilderPersistedBuild,
): BuilderExportCache | null {
  const cache = readJson<BuilderExportCache | null>(STORAGE_KEY, null);
  if (!cache || typeof cache !== "object" || cache.buildKey !== builderBuildKey(build)) {
    return null;
  }
  return cache.provenance && cache.derived && cache.meta ? cache : null;
}
