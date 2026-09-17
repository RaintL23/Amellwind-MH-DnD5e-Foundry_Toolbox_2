import type { GuideSection, GuideSubsection } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { DndRichText } from "@/shared/components/DndRichText";
import { MONSTIE_APPENDIX_OVERVIEW } from "../data/monstie-appendix.data";

function Paragraphs({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
          <DndRichText text={line} />
        </p>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
      {items.map((item, i) => (
        <li key={i} className="pl-1">
          <DndRichText text={item} />
        </li>
      ))}
    </ul>
  );
}

function SubsectionBlock({
  subsection,
  depth = 0,
}: {
  subsection: GuideSubsection;
  depth?: number;
}) {
  const Heading = depth === 0 ? "h3" : depth === 1 ? "h4" : "h5";

  return (
    <div
      className={cn(depth > 0 && "ml-0 sm:ml-2 border-l-2 border-border pl-4 mt-4")}
    >
      <Heading
        className={cn(
          "font-semibold text-foreground",
          depth === 0 ? "text-base mb-2" : "text-sm mb-1.5",
        )}
      >
        {subsection.name}
      </Heading>

      {subsection.paragraphs && <Paragraphs lines={subsection.paragraphs} />}
      {subsection.bulletList && <BulletList items={subsection.bulletList} />}

      {subsection.subsections?.map((child) => (
        <SubsectionBlock
          key={child.name}
          subsection={child}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function MonstieAppendixOverview({
  section = MONSTIE_APPENDIX_OVERVIEW,
}: {
  section?: GuideSection;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{section.name}</h2>
      {section.intro && <Paragraphs lines={section.intro} />}
      {section.subsections?.map((subsection) => (
        <SubsectionBlock key={subsection.name} subsection={subsection} />
      ))}
    </div>
  );
}
