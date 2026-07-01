import { memo, useMemo } from "react";
import {
  ClassFeatureEntry,
  ClassLevelRow,
  ClassTableGroup,
} from "@/shared/types";
import { ClassFeatureChip } from "./ClassFeatureChip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/20 hover:bg-transparent">
            <TableHead className="h-auto w-10 px-2 py-2 font-semibold text-muted-foreground">
              Lvl
            </TableHead>
            {flatLabels.map((label, i) => (
              <TableHead
                key={`${label}-${i}`}
                className="h-auto px-2 py-2 text-center font-semibold text-muted-foreground whitespace-nowrap"
              >
                {label}
              </TableHead>
            ))}
            <TableHead className="h-auto min-w-[180px] px-2 py-2 font-semibold text-muted-foreground">
              Features
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {progression.map((row) => (
            <TableRow
              key={row.level}
              className="border-b border-border/50 last:border-0 hover:bg-transparent"
            >
              <TableCell className="px-2 py-2 font-medium text-foreground align-top">
                {row.level}
              </TableCell>
              {row.tableCells.map((cell, j) => (
                <TableCell
                  key={j}
                  className="px-2 py-2 text-center text-muted-foreground align-top"
                >
                  {cell}
                </TableCell>
              ))}
              <TableCell className="px-2 py-2 align-top">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
