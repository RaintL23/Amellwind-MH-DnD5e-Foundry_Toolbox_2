import { Link } from "react-router-dom";
import { Gem } from "lucide-react";
import type { GuideSection, GuideSubsection } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { DndRichText } from "@/shared/components/DndRichText";
import { GuideTable } from "@/features/amellwind/character-guide/components/GuideTable";
import {
  GUARDIAN_TEMPLATE_BEHAVIOR,
  GUARDIAN_TEMPLATE_INTRO,
  GUARDIAN_TEMPLATE_SECTIONS,
} from "../data/guardian-template.data";

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

function SubsectionBlock({
  subsection,
  depth = 0,
}: {
  subsection: GuideSubsection;
  depth?: number;
}) {
  const Heading = depth === 0 ? "h3" : "h4";

  return (
    <div
      className={cn(depth > 0 && "ml-0 sm:ml-2 border-l-2 border-border pl-4")}
    >
      <Heading
        className={cn(
          "font-semibold text-foreground",
          depth === 0 ? "text-base mb-2" : "text-sm mb-1.5 mt-4",
        )}
      >
        {subsection.name}
      </Heading>

      {subsection.paragraphs && <Paragraphs lines={subsection.paragraphs} />}

      {subsection.table && (
        <div className="mt-3">
          <GuideTable table={subsection.table} />
        </div>
      )}

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

function SectionCard({ section }: { section: GuideSection }) {
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

export function GuardianTemplatePage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Gem className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Guardian Template
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Rules for creating Guardian monsters from the Monster Hunter Monster
          Manual (MHMM p.619). Apply this template to turn a creature into an
          artificial construct fueled by wylk energy.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <Paragraphs
              lines={[GUARDIAN_TEMPLATE_INTRO, GUARDIAN_TEMPLATE_BEHAVIOR]}
            />
          </div>

          {GUARDIAN_TEMPLATE_SECTIONS.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}

          <div className="rounded-lg border border-border bg-card/50 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Pick a base monster from the bestiary, then apply the changes
              above to build its Guardian form.
            </p>
            <Link
              to="/monsters"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open Bestiary →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
