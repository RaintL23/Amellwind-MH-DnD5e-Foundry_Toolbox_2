import type { FeatSection } from "@/shared/types";

export function FeatParagraphList({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const isInset = line.startsWith("»");
        const isBullet = line.startsWith("•");
        return (
          <p
            key={i}
            className={
              isInset
                ? "text-sm text-amber-200/80 italic border-l-2 border-amber-800/40 pl-3 py-1"
                : isBullet
                  ? "text-sm text-muted-foreground leading-relaxed pl-2"
                  : "text-sm text-muted-foreground leading-relaxed"
            }
          >
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function FeatSectionBlock({ section }: { section: FeatSection }) {
  return (
    <div className="mt-3">
      {section.name && (
        <h4 className="text-sm font-semibold text-foreground mb-1.5">
          {section.name}
        </h4>
      )}
      <FeatParagraphList lines={section.paragraphs} />
    </div>
  );
}
