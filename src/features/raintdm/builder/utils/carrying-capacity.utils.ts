export type BuilderCreatureSize = "S" | "M";

export interface CarryingCapacityResult {
  carryLb: number;
  dragLiftPushLb: number;
  sizeLabel: string;
  carryMultiplier: number;
  dragMultiplier: number;
}

const CAPACITY_BY_SIZE: Record<
  BuilderCreatureSize,
  { label: string; carry: number; drag: number }
> = {
  S: { label: "Small", carry: 15, drag: 30 },
  M: { label: "Medium", carry: 15, drag: 30 },
};

export function normalizeBuilderCreatureSize(size: string): BuilderCreatureSize {
  return size === "S" ? "S" : "M";
}

export function getCarryingCapacity(
  strength: number,
  size: BuilderCreatureSize,
): CarryingCapacityResult {
  const table = CAPACITY_BY_SIZE[size];
  const str = Math.max(0, strength);

  return {
    carryLb: str * table.carry,
    dragLiftPushLb: str * table.drag,
    sizeLabel: table.label,
    carryMultiplier: table.carry,
    dragMultiplier: table.drag,
  };
}

export function formatCarryingCapacityRuleTooltip(): string {
  return [
    "Carrying Capacity (XPHB)",
    "You can usually carry gear without tracking weight. For heavy loads, your size and Strength set the maximum weight you can carry.",
    "While dragging, lifting, or pushing weight above your carry limit, your Speed can be no more than 5 feet.",
    "",
    "Small/Medium: Carry Str × 15 lb. · Drag/Lift/Push Str × 30 lb.",
  ].join("\n");
}

export function formatCarryingCapacityCalcTooltip(
  strength: number,
  _size: BuilderCreatureSize,
  capacity: CarryingCapacityResult,
): string {
  return [
    "Capacity calculation",
    `Size: ${capacity.sizeLabel}`,
    `Strength: ${strength}`,
    `Carry: ${strength} × ${capacity.carryMultiplier} = ${capacity.carryLb} lb.`,
    `Drag/Lift/Push: ${strength} × ${capacity.dragMultiplier} = ${capacity.dragLiftPushLb} lb.`,
  ].join("\n");
}
