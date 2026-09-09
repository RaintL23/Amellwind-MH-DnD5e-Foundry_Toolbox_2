import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Lightbulb, Quote } from "lucide-react";
import type { GuideQuote, GuideSection, GuideSubsection } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DndRichText } from "@/shared/components/DndRichText";
import { GuideTable } from "@/features/amellwind/character-guide/components/GuideTable";
import {
  DND_CHARACTER_GUIDE_INTRO,
  DND_CHARACTER_GUIDE_SECTIONS,
} from "../data/dnd-character-guide.data";

type TabId = "creating" | "abilities" | "describe" | "equipment" | "tips";
type EditionId = "2014" | "2024";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "creating", label: "Creating a Character" },
  { id: "abilities", label: "Ability Scores" },
  { id: "describe", label: "Describe Your Character" },
  { id: "equipment", label: "Equipment & Higher Level" },
  { id: "tips", label: "Tips & Party Roles" },
];

const VALID_TAB_IDS = new Set<TabId>(TABS.map((tab) => tab.id));
const DEFAULT_EDITION: EditionId = "2024";

function parseTabId(value: string | null): TabId {
  if (value && VALID_TAB_IDS.has(value as TabId)) {
    return value as TabId;
  }
  return "creating";
}

function parseEditionId(value: string | null): EditionId {
  return value === "2014" ? "2014" : DEFAULT_EDITION;
}

function subsectionVisible(
  subsection: GuideSubsection,
  edition: EditionId,
): boolean {
  return subsection.edition == null || subsection.edition === edition;
}

function filterSubsections(
  subsections: GuideSubsection[] | undefined,
  edition: EditionId,
): GuideSubsection[] | undefined {
  if (!subsections) return undefined;
  const filtered = subsections
    .filter((sub) => subsectionVisible(sub, edition))
    .map((sub) => ({
      ...sub,
      subsections: filterSubsections(sub.subsections, edition),
    }));
  return filtered;
}

function filterSection(
  section: GuideSection,
  edition: EditionId,
): GuideSection {
  return {
    ...section,
    subsections: filterSubsections(section.subsections, edition),
  };
}

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

function QuoteBlock({ quote }: { quote: GuideQuote }) {
  return (
    <blockquote className="rounded-lg border-l-4 border-primary/40 bg-primary/5 px-4 py-3 my-4">
      <div className="flex items-start gap-2 mb-2">
        <Quote className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-2">
          {quote.paragraphs.map((line, i) => (
            <p
              key={i}
              className="text-sm text-foreground/90 leading-relaxed italic"
            >
              <DndRichText text={line} />
            </p>
          ))}
        </div>
      </div>
      {quote.attribution && (
        <footer className="text-xs text-muted-foreground text-right mt-2">
          — {quote.attribution}
        </footer>
      )}
    </blockquote>
  );
}

function GuideInset({
  inset,
}: {
  inset: NonNullable<GuideSubsection["inset"]>;
}) {
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

      {subsection.quote && <QuoteBlock quote={subsection.quote} />}
      {subsection.paragraphs && <Paragraphs lines={subsection.paragraphs} />}
      {subsection.bulletList && <BulletList items={subsection.bulletList} />}

      {subsection.table && (
        <div className="mt-3">
          <GuideTable table={subsection.table} />
        </div>
      )}

      {subsection.orderedList && (
        <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
          {subsection.orderedList.map((item, i) => (
            <li key={i} className="pl-1">
              <DndRichText text={item} />
            </li>
          ))}
        </ol>
      )}

      {subsection.inset && <GuideInset inset={subsection.inset} />}

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

function SectionContent({ section }: { section: GuideSection }) {
  return (
    <div className="space-y-5">
      {section.intro && <Paragraphs lines={section.intro} />}
      {section.quote && <QuoteBlock quote={section.quote} />}
      {section.paragraphs && <Paragraphs lines={section.paragraphs} />}
      {section.bulletList && <BulletList items={section.bulletList} />}

      {section.subsections?.map((subsection) => (
        <div
          key={subsection.name}
          className="rounded-lg border border-border bg-card p-4"
        >
          <SubsectionBlock subsection={subsection} />
        </div>
      ))}

      {section.footerNote && (
        <p className="text-sm text-muted-foreground italic border-t border-border pt-4">
          <DndRichText text={section.footerNote} />
        </p>
      )}
    </div>
  );
}

export function DndCharacterGuidePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    parseTabId(searchParams.get("tab")),
  );
  const [edition, setEdition] = useState<EditionId>(() =>
    parseEditionId(searchParams.get("edition")),
  );

  useEffect(() => {
    setActiveTab(parseTabId(searchParams.get("tab")));
    setEdition(parseEditionId(searchParams.get("edition")));
  }, [searchParams]);

  const activeSection = useMemo(() => {
    const raw = DND_CHARACTER_GUIDE_SECTIONS.find((s) => s.id === activeTab);
    return raw ? filterSection(raw, edition) : undefined;
  }, [activeTab, edition]);

  function updateSearchParams(nextTab: TabId, nextEdition: EditionId) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextTab === "creating") {
          next.delete("tab");
        } else {
          next.set("tab", nextTab);
        }
        if (nextEdition === DEFAULT_EDITION) {
          next.delete("edition");
        } else {
          next.set("edition", nextEdition);
        }
        return next;
      },
      { replace: true },
    );
  }

  function handleTabChange(value: string) {
    const tab = parseTabId(value);
    setActiveTab(tab);
    updateSearchParams(tab, edition);
  }

  function handleEditionChange(checked: boolean) {
    const nextEdition: EditionId = checked ? "2024" : "2014";
    setEdition(nextEdition);
    updateSearchParams(activeTab, nextEdition);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen className="h-6 w-6 text-primary shrink-0" />
            <h1 className="text-xl font-bold text-foreground">
              Character Creation Guide
            </h1>
          </div>
          <div
            className="flex items-center gap-2 shrink-0"
            role="group"
            aria-label="Player's Handbook edition"
          >
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                edition === "2014" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              2014
            </span>
            <Switch
              checked={edition === "2024"}
              onCheckedChange={handleEditionChange}
              aria-label={
                edition === "2024"
                  ? "Showing 2024 rules. Switch to 2014."
                  : "Showing 2014 rules. Switch to 2024."
              }
            />
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                edition === "2024" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              2024
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Showing advice for the{" "}
          <span className="text-foreground/80">
            Player&apos;s Handbook ({edition})
          </span>
          . Use the switch to compare with the other edition. Confirm which
          ruleset your table uses.
        </p>
        <p className="text-sm text-muted-foreground max-w-3xl mt-2">
          {DND_CHARACTER_GUIDE_INTRO}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto space-y-5">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="border-b border-border pb-3"
          >
            <TabsList className="flex flex-wrap justify-start gap-1.5 h-auto rounded-none bg-transparent p-0 text-muted-foreground">
              {TABS.map(({ id, label }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="px-3 py-1.5 h-auto rounded-md border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 data-[state=active]:shadow-none"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

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
                <span className="text-xs text-muted-foreground ml-auto">
                  PHB {edition}
                </span>
              </div>
              <SectionContent section={activeSection} />
            </div>
          )}

          <div className="rounded-lg border border-border bg-card/50 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Ready to build? Use the Character Builder with official 5e
              catalogs, or browse classes and options first.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/classes"
                className="text-sm font-medium text-primary hover:underline"
              >
                Browse Classes →
              </Link>
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
    </div>
  );
}
