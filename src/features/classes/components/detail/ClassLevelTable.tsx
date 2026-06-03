import { memo, useMemo } from "react";
import {
  ClassFeatureEntry,
  ClassLevelRow,
  ClassTableGroup,
} from "@/shared/types";
import { ClassFeatureChip } from "./ClassFeatureChip";

interface ClassLevelTableProps {
  progression: ClassLevelRow[];
  tableGroups: ClassTableGroup[];
  enabledFeatureUids: Set<string>;
  onToggleFeature: (uid: string) => void;
}

export const ClassLevelTable = memo(function ClassLevelTable({
  progression,
  tableGroups,
  enabledFeatureUids,
  onToggleFeature,
}: ClassLevelTableProps) {
  const flatLabels = useMemo(
    () => tableGroups.flatMap((g) => g.colLabels),
    [tableGroups],
  );

  return (
    <div className="overflow-x-auto rounded-md border border-border px-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-10">
              Lvl
            </th>
            {flatLabels.map((label, i) => (
              <th
                key={`${label}-${i}`}
                className="px-2 py-2 text-center font-semibold text-muted-foreground whitespace-nowrap"
              >
                {label}
              </th>
            ))}
            <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[180px]">
              Features
            </th>
          </tr>
        </thead>
        <tbody>
          {progression.map((row) => (
            <tr
              key={row.level}
              className="border-b border-border/50 last:border-0"
            >
              <td className="px-2 py-2 font-medium text-foreground align-top">
                {row.level}
              </td>
              {row.tableCells.map((cell, j) => (
                <td
                  key={j}
                  className="px-2 py-2 text-center text-muted-foreground align-top"
                >
                  {cell}
                </td>
              ))}
              <td className="px-2 py-2 align-top">
                <div className="flex flex-wrap gap-1">
                  {row.features.map((feature: ClassFeatureEntry) => (
                    <ClassFeatureChip
                      key={feature.uid}
                      feature={feature}
                      enabled={enabledFeatureUids.has(feature.uid)}
                      onToggle={onToggleFeature}
                    />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
