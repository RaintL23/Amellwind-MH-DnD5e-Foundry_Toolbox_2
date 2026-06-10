import type { MonstieRulesContent } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { DndRichText } from "@/shared/components/DndRichText";
import { MonsterStatBlock } from "@/features/monsters/components/MonsterStatBlock";
function RulesBlock({
  block,
}: {
  block: MonstieRulesContent;
}) {
  if (block.type === "statblock") {
    return (
      <div className="my-4 rounded-lg border-2 border-amber-800/40 bg-gradient-to-b from-amber-950/20 to-card p-4">
        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">
          {block.monster.name}
        </h4>
        <MonsterStatBlock monster={block.monster} />
      </div>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">
        <DndRichText text={block.text} />
      </p>
    );
  }

  if (block.type === "table") {
    return (
      <div className="overflow-x-auto rounded-md border border-border my-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {block.table.colLabels.map((label) => (
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
            {block.table.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border/60 last:border-0"
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 text-foreground align-top">
                    <DndRichText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}

export function MonstieRulesContentView({
  content,
}: {
  content: MonstieRulesContent[];
}) {
  return (
    <div className="space-y-4">
      {content.map((block, i) => {
        if (block.type === "section") {
          return (
            <div
              key={`${block.name}-${i}`}
              className="rounded-lg border border-border bg-card p-4"
            >
              <SectionWithChildren block={block} />
            </div>
          );
        }

        return (
          <div key={i}>
            <RulesBlock block={block} />
          </div>
        );
      })}
    </div>
  );
}

function SectionWithChildren({
  block,
  depth = 0,
}: {
  block: Extract<MonstieRulesContent, { type: "section" }>;
  depth?: number;
}) {
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
      <div className="space-y-3">
        {block.children.map((child, i) => {
          if (child.type === "section") {
            return (
              <SectionWithChildren
                key={`${child.name}-${i}`}
                block={child}
                depth={depth + 1}
              />
            );
          }
          return <RulesBlock key={i} block={child} />;
        })}
      </div>
    </div>
  );
}
