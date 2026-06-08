import type { DowntimeTable } from "@/shared/types";
import type {
  StatBlockContent,
  StatBlockListItem,
} from "@/shared/types/statblock-content.types";
import { DndKeywordText } from "@/shared/components/DndKeywordText";
import { cn } from "@/shared/utils/cn";

function ContentTable({ table }: { table: DowntimeTable }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border my-2">
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

function ListItemView({ item }: { item: StatBlockListItem }) {
  if (item.type === "text") {
    return (
      <li className="text-sm text-muted-foreground">
        <DndKeywordText text={item.text} />
      </li>
    );
  }

  return (
    <li className="text-sm text-muted-foreground">
      <strong className="text-foreground">{item.name}.</strong>{" "}
      <StatBlockInlineContent content={item.children} />
    </li>
  );
}

export function StatBlockInlineContent({
  content,
  className,
}: {
  content: StatBlockContent[];
  className?: string;
}) {
  if (content.length === 0) return null;

  return (
    <span className={cn("inline", className)}>
      {content.map((block, i) => (
        <StatBlockContentBlock key={i} block={block} inline />
      ))}
    </span>
  );
}

function StatBlockContentBlock({
  block,
  depth = 0,
  inline = false,
}: {
  block: StatBlockContent;
  depth?: number;
  inline?: boolean;
}) {
  if (block.type === "paragraph") {
    const Tag = inline ? "span" : "p";
    return (
      <Tag
        className={cn(
          "text-sm text-muted-foreground leading-relaxed",
          !inline && "mb-0",
        )}
      >
        <DndKeywordText text={block.text} />
      </Tag>
    );
  }

  if (block.type === "table") {
    return <ContentTable table={block.table} />;
  }

  if (block.type === "list") {
    const hang = block.style?.includes("hang");
    return (
      <ul
        className={cn(
          "text-sm text-muted-foreground space-y-1.5 my-2",
          hang ? "list-none pl-0" : "list-disc pl-5",
        )}
      >
        {block.items.map((item, i) => (
          <ListItemView key={i} item={item} />
        ))}
      </ul>
    );
  }

  const Heading = depth === 0 ? "h4" : "h5";

  return (
    <div className={cn(!inline && "my-2", depth > 0 && "ml-2 border-l border-border pl-3")}>
      <Heading className="text-sm font-semibold text-foreground mb-1">
        {block.name}
      </Heading>
      <div className="space-y-1">
        {block.children.map((child, i) => (
          <StatBlockContentBlock key={i} block={child} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}

export function StatBlockContentView({
  content,
}: {
  content: StatBlockContent[];
}) {
  if (content.length === 0) return null;

  return (
    <div className="space-y-3">
      {content.map((block, i) => (
        <StatBlockContentBlock key={i} block={block} />
      ))}
    </div>
  );
}
