export { buildFoundryActor } from "./actor.builder";
export type { FoundryExportInput, FeatureInput } from "./actor.builder";
export type { FoundryActor } from "./foundry.types";
export {
  TOOLBOX_FLAG_NAMESPACE,
  BUILDER_SNAPSHOT_VERSION,
  readBuilderSnapshot,
  toBuilderSnapshotFlags,
} from "./builder-snapshot";
export type {
  BuilderChoiceSnapshot,
  BuilderSnapshotEquipment,
} from "./builder-snapshot";

/** Serializes and downloads a Foundry actor JSON in the browser. */
export function downloadFoundryActor(
  actor: unknown,
  filename: string,
): void {
  const json = JSON.stringify(actor, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
