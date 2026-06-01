import type { DowntimeContent, DowntimeTable } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

function ActivityTable({ table }: { table: DowntimeTable }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      {table.caption && (
        <p className="px-3 py-2 text-xs font-semibold text-amber-400/90 border-b border-border bg-muted/30">
          {table.caption}
        </p>
      )}
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
          {table.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border/60 last:border-0"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "px-3 py-2 text-foreground align-top",
                    cellIndex === 0 && "font-medium whitespace-nowrap",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.footnotes?.map((note, i) => (
        <p
          key={i}
          className="px-3 py-2 text-xs italic text-muted-foreground border-t border-border bg-muted/20"
        >
          {note}
        </p>
      ))}
    </div>
  );
}

function ContentBlock({
  block,
  depth = 0,
}: {
  block: DowntimeContent;
  depth?: number;
}) {
  if (block.type === "paragraph") {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">
        {block.text}
      </p>
    );
  }

  if (block.type === "table") {
    return (
      <div className="my-3">
        <ActivityTable table={block.table} />
      </div>
    );
  }

  const Heading = depth === 0 ? "h3" : depth === 1 ? "h4" : "h5";

  return (
    <div
      className={cn(
        depth > 0 && "ml-0 sm:ml-2 border-l-2 border-border pl-4 mt-4",
      )}
    >
      <Heading
        className={cn(
          "font-semibold text-foreground",
          depth === 0 ? "text-base mb-2" : "text-sm mb-1.5",
        )}
      >
        {block.name}
      </Heading>
      <div className="space-y-2">
        {block.children.map((child, i) => (
          <ContentBlock key={`${block.name}-${i}`} block={child} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}

export function DowntimeContentView({ content }: { content: DowntimeContent[] }) {
  return (
    <div className="space-y-4">
      {content.map((block, i) => {
        if (block.type === "section") {
          return (
            <div
              key={`${block.name}-${i}`}
              className="rounded-lg border border-border bg-card p-4"
            >
              <ContentBlock block={block} />
            </div>
          );
        }

        return <ContentBlock key={i} block={block} />;
      })}
    </div>
  );
}
