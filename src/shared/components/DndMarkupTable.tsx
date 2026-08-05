import { cn } from "@/shared/utils/cn";

export interface DndMarkupTableProps {
  caption?: string;
  colLabels: string[];
  rows: string[][];
  captionClassName?: string;
}

export function DndMarkupTable({
  caption,
  colLabels,
  rows,
  captionClassName = "text-amber-400/90",
}: DndMarkupTableProps) {
  return (
    <div className="my-3 overflow-x-auto rounded-md border border-border">
      {caption && (
        <p
          className={cn(
            "px-3 py-2 text-xs font-semibold border-b border-border bg-muted/30",
            captionClassName,
          )}
        >
          {caption}
        </p>
      )}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {colLabels.map((label) => (
              <th
                key={label}
                className="px-3 py-2 text-left font-semibold text-muted-foreground"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-foreground/90">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
