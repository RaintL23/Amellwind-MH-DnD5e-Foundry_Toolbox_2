import { Swords, Wand2 } from "lucide-react";
import type { BuilderOptionalFeatureSelections } from "@/shared/types";
import { GridElementSlot } from "../shared/GridElementSlot";
import type { BuilderSlotSelection } from "../../hooks/useBuilderSlotSelection";
import {
  getProgressionPicks,
  isFightingStyleProgression,
  isOptionalFeatureSlot,
  progressionDisplayName,
  toOptionalFeatureSlot,
  type ResolvedOptionalFeatureProgression,
} from "../../utils/class-optional-features.utils";

interface OptionalFeatureGridPanelProps {
  progressions: ResolvedOptionalFeatureProgression[];
  selections: BuilderOptionalFeatureSelections;
  selectedSlot: BuilderSlotSelection;
  onSelectSlot: (slot: BuilderSlotSelection) => void;
  onUnequipSlot: (slot: BuilderSlotSelection) => void;
}

const PROGRESSION_COLORS: Record<string, string> = {
  EI: "text-violet-400",
  MM: "text-fuchsia-400",
  "MV:B": "text-orange-400",
  PB: "text-indigo-400",
  FS: "text-amber-400",
  "FS:F": "text-amber-400",
  "FS:R": "text-amber-300",
  "FS:P": "text-amber-200",
  "FS:B": "text-amber-300",
};

function progressionColor(progression: ResolvedOptionalFeatureProgression["progression"]): string {
  if (isFightingStyleProgression(progression)) {
    return "text-amber-400";
  }
  for (const type of progression.featureTypes) {
    const color = PROGRESSION_COLORS[type];
    if (color) return color;
  }
  for (const cat of progression.featCategories ?? []) {
    const color = PROGRESSION_COLORS[cat];
    if (color) return color;
  }
  return "text-amber-400";
}

function progressionIcon(
  progression: ResolvedOptionalFeatureProgression["progression"],
  colorClass: string,
) {
  if (isFightingStyleProgression(progression)) {
    return <Swords className={`h-5 w-5 ${colorClass}`} />;
  }
  return <Wand2 className={`h-5 w-5 ${colorClass}`} />;
}

export function OptionalFeatureGridPanel({
  progressions,
  selections,
  selectedSlot,
  onSelectSlot,
  onUnequipSlot,
}: OptionalFeatureGridPanelProps) {
  if (progressions.length === 0) return null;

  const rows: ResolvedOptionalFeatureProgression[][] = [];
  for (let i = 0; i < progressions.length; i += 5) {
    rows.push(progressions.slice(i, i + 5));
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
          }}
        >
          {row.map(({ progression, slotCount }) => {
            const slot = toOptionalFeatureSlot(progression.id);
            const label = progressionDisplayName(progression.name);
            const colorClass = progressionColor(progression);
            const picks = getProgressionPicks(selections, progression.id);
            const pickedCount = picks.length;
            const pickedNames = picks.map((p) => p.name).join(", ");
            const countDetail = `${pickedCount}/${slotCount}`;
            const detail = pickedNames
              ? `${countDetail} — ${pickedNames}`
              : countDetail;
            const isSelected =
              isOptionalFeatureSlot(selectedSlot) && selectedSlot === slot;

            return (
              <GridElementSlot
                key={slot}
                label={label}
                icon={progressionIcon(progression, colorClass)}
                equipped={
                  pickedCount > 0
                    ? {
                        name: picks[0]?.name ?? label,
                        detail,
                      }
                    : null
                }
                onClickEquip={() => onSelectSlot(slot)}
                onClickDetails={() => onSelectSlot(slot)}
                onUnequip={
                  pickedCount > 0 ? () => onUnequipSlot(slot) : undefined
                }
                isSelected={isSelected}
                emptyTitle={`Elegir ${progression.name} (${countDetail})`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
