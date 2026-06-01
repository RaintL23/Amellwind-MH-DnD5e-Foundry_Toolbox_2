import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Lightbulb } from "lucide-react";
import type { GuideSection, GuideSubsection } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import {
  CHARACTER_GUIDE_INTRO,
  CHARACTER_GUIDE_SECTIONS,
} from "../data/character-guide.data";
import { GuideTable } from "./GuideTable";

type TabId = "creating" | "higher-level" | "skills";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "creating", label: "Creating a Character" },
  { id: "higher-level", label: "Higher Level" },
  { id: "skills", label: "Skills" },
];

function Paragraphs({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  );
}

function GuideInset({ inset }: { inset: NonNullable<GuideSubsection["inset"]> }) {
  return (
    <div className="rounded-lg border-2 border-amber-700/50 bg-amber-900/10 p-4 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
        <h5 className="font-semibold text-amber-300">{inset.name}</h5>
      </div>
      <Paragraphs lines={inset.paragraphs} />
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
  const Heading = depth === 0 ? "h3" : depth === 1 ? "h4" : "h5";

  return (
    <div className={cn(depth > 0 && "ml-0 sm:ml-2 border-l-2 border-border pl-4")}>
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

      {subsection.orderedList && (
        <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
          {subsection.orderedList.map((item, i) => (
            <li key={i} className="pl-1">
              {item}
            </li>
          ))}
        </ol>
      )}

      {subsection.inset && <GuideInset inset={subsection.inset} />}

      {subsection.subsections?.map((child) => (
        <SubsectionBlock key={child.name} subsection={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function SectionContent({ section }: { section: GuideSection }) {
  if (section.skillEntries) {
    return (
      <div className="space-y-4">
        {section.intro && <Paragraphs lines={section.intro} />}
        <div className="grid gap-3 sm:grid-cols-2">
          {section.skillEntries.map((skill) => (
            <div
              key={skill.name}
              className="rounded-lg border border-border bg-card/50 p-3"
            >
              <h4 className="text-sm font-semibold text-primary mb-1">
                {skill.name}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {skill.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {section.paragraphs && <Paragraphs lines={section.paragraphs} />}
      {section.subsections?.map((subsection) => (
        <div
          key={subsection.name}
          className="rounded-lg border border-border bg-card p-4"
        >
          <SubsectionBlock subsection={subsection} />
        </div>
      ))}
    </div>
  );
}

export function CharacterGuidePage() {
  const [activeTab, setActiveTab] = useState<TabId>("creating");

  const activeSection = useMemo(
    () => CHARACTER_GUIDE_SECTIONS.find((s) => s.id === activeTab),
    [activeTab],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Character Creation Guide
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Chapter 2 recommendations from{" "}
          <span className="text-foreground/80">Amellwind&apos;s Guide to Monster Hunting</span>
          . All options require DM approval.
        </p>
        <p className="text-sm text-muted-foreground max-w-3xl mt-2">
          {CHARACTER_GUIDE_INTRO}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeTab === id
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {activeSection && (
            <div>
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  {activeSection.name}
                </h2>
                {activeSection.page != null && (
                  <span className="text-xs text-muted-foreground">
                    p. {activeSection.page}
                  </span>
                )}
              </div>
              <SectionContent section={activeSection} />
            </div>
          )}

          <div className="rounded-lg border border-border bg-card/50 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Ready to build? Use the Character Builder to equip gear and test damage.
            </p>
            <Link
              to="/builder"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open Character Builder →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
