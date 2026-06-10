import { DndRichText } from "./DndRichText";
import { cn } from "@/shared/utils/cn";

interface DescriptionLinesProps {
  lines: string[];
  /** Base text size class. Default: text-sm */
  sizeClass?: string;
  /** Accent class for inset lines border. Default: amber */
  insetAccent?: "amber" | "violet";
}

/**
 * Renders pre-formatted description lines (bullets, insets, bold headers)
 * with full D&D markup and keyword highlighting.
 */
export function DescriptionLines({
  lines,
  sizeClass = "text-sm",
  insetAccent = "amber",
}: DescriptionLinesProps) {
  const insetBorder =
    insetAccent === "violet" ? "border-violet-800/40" : "border-amber-800/40";
  const insetText =
    insetAccent === "violet" ? "text-violet-200/80" : "text-amber-200/80";

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const isInset = line.startsWith("»");
        const isBullet = line.startsWith("•");
        const isBold = /^\*\*.+\*\*/.test(line);

        if (isBold) {
          const text = line.replace(/\*\*/g, "");
          return (
            <p
              key={i}
              className={cn(sizeClass, "font-semibold text-foreground mt-3 mb-1")}
            >
              <DndRichText text={text} />
            </p>
          );
        }

        return (
          <p
            key={i}
            className={cn(
              sizeClass,
              "leading-relaxed",
              isInset
                ? cn("italic border-l-2 pl-3 py-1", insetBorder, insetText)
                : isBullet
                  ? "text-muted-foreground pl-3"
                  : "text-muted-foreground",
            )}
          >
            <DndRichText text={line.replace(/^[»•]\s*/, "")} />
          </p>
        );
      })}
    </div>
  );
}
