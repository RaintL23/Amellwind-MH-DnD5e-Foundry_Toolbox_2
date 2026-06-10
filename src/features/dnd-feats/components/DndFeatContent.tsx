import type { FeatSection } from "@/shared/types";
import { DescriptionLines } from "@/shared/components/DescriptionLines";

export function FeatParagraphList({ lines }: { lines: string[] }) {
  return <DescriptionLines lines={lines} />;
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
