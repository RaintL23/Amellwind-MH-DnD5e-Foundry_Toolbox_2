import { PillToggleGroup } from "./PillToggleGroup";
import type { BuilderFeatSource } from "@/shared/types";

export type FeatDataSource = Exclude<BuilderFeatSource, "asi">;

const SOURCES = [
  { id: "amellwind" as const, label: "Amellwind Monster Hunter" },
  { id: "dnd2014" as const, label: "D&D 2014" },
  { id: "dnd2024" as const, label: "D&D 2024" },
];

interface FeatSourceBadgeGroupProps {
  value: FeatDataSource;
  onChange: (source: FeatDataSource) => void;
  hideAmellwind?: boolean;
}

export function FeatSourceBadgeGroup({
  value,
  onChange,
  hideAmellwind = false,
}: FeatSourceBadgeGroupProps) {
  const options = hideAmellwind
    ? SOURCES.filter((source) => source.id !== "amellwind")
    : SOURCES;

  return <PillToggleGroup options={options} value={value} onChange={onChange} />;
}
