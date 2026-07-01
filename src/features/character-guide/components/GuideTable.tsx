import type { GuideTable as GuideTableType } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GuideTableProps {
  table: GuideTableType;
  highlightRow?: string;
}

export function GuideTable({ table, highlightRow }: GuideTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table className="text-sm">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/40 hover:bg-transparent">
            {table.colLabels.map((label) => (
              <TableHead
                key={label}
                className="h-auto px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row, rowIndex) => {
            const isHighlighted = highlightRow != null && row[0] === highlightRow;
            return (
              <TableRow
                key={rowIndex}
                className={cn(
                  "border-b border-border/60 last:border-0 hover:bg-transparent",
                  isHighlighted && "bg-primary/10",
                )}
              >
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    className={cn(
                      "px-3 py-2 text-foreground align-top",
                      cellIndex === 0 && "font-medium whitespace-nowrap",
                      isHighlighted && cellIndex === 0 && "text-primary",
                    )}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {table.footnotes?.map((note, i) => (
        <p key={i} className="px-3 py-2 text-xs italic text-muted-foreground border-t border-border bg-muted/20">
          * {note}
        </p>
      ))}
    </div>
  );
}
