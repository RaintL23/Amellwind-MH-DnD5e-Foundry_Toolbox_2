import { memo, useMemo } from "react";
import {
  ClassFeatureEntry,
  ClassLevelRow,
  ClassTableGroup,
} from "@/shared/types";
import { ClassFeatureChip } from "./ClassFeatureChip";
import { ClassLevelList } from "./ClassLevelList";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClassLevelTableProps {
  progression: ClassLevelRow[];
  tableGroups: ClassTableGroup[];
  hiddenFeatureUids: Set<string>;
  classSource?: string;
  onSelectFeature: (uid: string) => void;
  onToggleFeatureVisible: (uid: string) => void;
}

/**
 * Container width at which the full table replaces the stacked list. Wider
 * tables (casters with slot columns) need more room before they fit without
 * horizontal scroll, which would also break the sticky header.
 */
function tableBreakpointClasses(dataColumns: number): {
  list: string;
  table: string;
} {
  if (dataColumns <= 4) {
    return {
      list: "@2xl/classdetail:hidden",
      table: "hidden @2xl/classdetail:block",
    };
  }
  if (dataColumns <= 7) {
    return {
      list: "@4xl/classdetail:hidden",
      table: "hidden @4xl/classdetail:block",
    };
  }
  return {
    list: "@6xl/classdetail:hidden",
    table: "hidden @6xl/classdetail:block",
  };
}

const STICKY_HEAD =
  "sticky top-[var(--class-nav-h,0px)] z-[5] h-auto bg-background px-2 py-2 font-semibold text-muted-foreground shadow-[inset_0_-1px_0_hsl(var(--border))]";

export const ClassLevelTable = memo(function ClassLevelTable({
  progression,
  tableGroups,
  hiddenFeatureUids,
  classSource,
  onSelectFeature,
  onToggleFeatureVisible,
}: ClassLevelTableProps) {
  const flatLabels = useMemo(
    () => tableGroups.flatMap((g) => g.colLabels),
    [tableGroups],
  );
  const breakpoints = tableBreakpointClasses(flatLabels.length);

  return (
    <>
      <ClassLevelList
        className={breakpoints.list}
        progression={progression}
        colLabels={flatLabels}
        hiddenFeatureUids={hiddenFeatureUids}
        classSource={classSource}
        onSelectFeature={onSelectFeature}
        onToggleFeatureVisible={onToggleFeatureVisible}
      />

      {/* Native <table>: the shadcn Table wrapper sets overflow, which disables sticky headers. */}
      <div className={`${breakpoints.table} rounded-md border border-border`}>
        <table className="w-full caption-bottom text-xs">
          <TableHeader className="[&_tr]:border-0">
            <TableRow className="hover:bg-transparent">
              <TableHead className={`${STICKY_HEAD} w-12 rounded-tl-md pl-4`}>
                Lvl
              </TableHead>
              {flatLabels.map((label, i) => (
                <TableHead
                  key={`${label}-${i}`}
                  className={`${STICKY_HEAD} text-center leading-tight`}
                >
                  {label}
                </TableHead>
              ))}
              <TableHead className={`${STICKY_HEAD} min-w-[14rem] rounded-tr-md pr-4`}>
                Features
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {progression.map((row) => (
              <TableRow
                key={row.level}
                className="border-b border-border/50 last:border-0 even:bg-muted/15 hover:bg-muted/30"
              >
                <TableCell className="py-2 pl-4 pr-2 align-top font-semibold tabular-nums text-foreground">
                  {row.level}
                </TableCell>
                {row.tableCells.map((cell, j) => (
                  <TableCell
                    key={j}
                    className="px-2 py-2 text-center align-top tabular-nums text-muted-foreground"
                  >
                    {cell}
                  </TableCell>
                ))}
                <TableCell className="py-1.5 pl-2 pr-4 align-top">
                  <div className="flex flex-wrap gap-1">
                    {row.features.map((feature: ClassFeatureEntry) => (
                      <ClassFeatureChip
                        key={feature.uid}
                        feature={feature}
                        hidden={hiddenFeatureUids.has(feature.uid)}
                        classSource={classSource}
                        onSelect={onSelectFeature}
                        onToggleVisible={onToggleFeatureVisible}
                      />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>
    </>
  );
});
