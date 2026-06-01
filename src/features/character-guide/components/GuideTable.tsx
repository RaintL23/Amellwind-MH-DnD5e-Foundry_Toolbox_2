import type { GuideTable as GuideTableType } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface GuideTableProps {
  table: GuideTableType;
  highlightRow?: string;
}

export function GuideTable({ table, highlightRow }: GuideTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {table.colLabels.map((label) => (
              <th
                key={label}
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => {
            const isHighlighted = highlightRow != null && row[0] === highlightRow;
            return (
              <tr
                key={rowIndex}
                className={cn(
                  "border-b border-border/60 last:border-0",
                  isHighlighted && "bg-primary/10",
                )}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "px-3 py-2 text-foreground align-top",
                      cellIndex === 0 && "font-medium whitespace-nowrap",
                      isHighlighted && cellIndex === 0 && "text-primary",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {table.footnotes?.map((note, i) => (
        <p key={i} className="px-3 py-2 text-xs italic text-muted-foreground border-t border-border bg-muted/20">
          * {note}
        </p>
      ))}
    </div>
  );
}
