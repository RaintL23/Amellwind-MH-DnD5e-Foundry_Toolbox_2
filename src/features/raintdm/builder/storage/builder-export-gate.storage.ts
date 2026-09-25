/**
 * Persists the Builder's export/send readiness so the Character Sheet roster
 * can gate "Load from Builder" without mounting CharacterBuilderProvider.
 */
import { readJson, writeJson, removeKey } from "@/shared/utils/local-storage.utils";

const STORAGE_KEY = "mh-builder-export-gate";

export interface BuilderExportGate {
  hasStarted: boolean;
  shouldBlockExport: boolean;
  issueCount: number;
  updatedAt: string;
}

export function persistBuilderExportGate(
  gate: Omit<BuilderExportGate, "updatedAt">,
): void {
  writeJson(STORAGE_KEY, {
    ...gate,
    updatedAt: new Date().toISOString(),
  } satisfies BuilderExportGate);
}

export function loadBuilderExportGate(): BuilderExportGate | null {
  const raw = readJson<unknown>(STORAGE_KEY, null);
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.hasStarted !== "boolean") return null;
  if (typeof record.shouldBlockExport !== "boolean") return null;
  if (typeof record.issueCount !== "number") return null;
  return {
    hasStarted: record.hasStarted,
    shouldBlockExport: record.shouldBlockExport,
    issueCount: record.issueCount,
    updatedAt:
      typeof record.updatedAt === "string"
        ? record.updatedAt
        : new Date(0).toISOString(),
  };
}

export function clearBuilderExportGate(): void {
  removeKey(STORAGE_KEY);
}

/** True when the Builder has a started, exportable (no blocking issues) build. */
export function isBuilderExportReady(
  gate: BuilderExportGate | null,
): boolean {
  return Boolean(gate?.hasStarted && !gate.shouldBlockExport);
}
