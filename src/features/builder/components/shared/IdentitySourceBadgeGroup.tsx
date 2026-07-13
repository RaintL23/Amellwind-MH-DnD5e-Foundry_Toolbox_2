import { PillToggleGroup } from "./PillToggleGroup";

export type IdentityDataSource = "amellwind" | "dnd";

const SOURCES = [
  { id: "amellwind" as const, label: "Amellwind Monster Hunter" },
  { id: "dnd" as const, label: "Dungeons & Dragons" },
];

interface IdentitySourceBadgeGroupProps {
  value: IdentityDataSource;
  onChange: (source: IdentityDataSource) => void;
}

export function IdentitySourceBadgeGroup({
  value,
  onChange,
}: IdentitySourceBadgeGroupProps) {
  return <PillToggleGroup options={SOURCES} value={value} onChange={onChange} />;
}
