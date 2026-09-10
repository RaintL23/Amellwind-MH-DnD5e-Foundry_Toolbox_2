import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookMarked } from "lucide-react";
import type { GuideSection, GuideSubsection } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DndRichText } from "@/shared/components/DndRichText";
import { GuideTable } from "@/features/amellwind/character-guide/components/GuideTable";
import { LORE_INTRO, LORE_SECTIONS } from "../data/lore.data";

type TabId = "tale" | "history" | "gods" | "races";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "tale", label: "Tale of the Five" },
  { id: "history", label: "History & Myths" },
  { id: "gods", label: "Gods" },
  { id: "races", label: "Races" },
];

const VALID_TAB_IDS = new Set<TabId>(TABS.map((tab) => tab.id));

function parseTabId(value: string | null): TabId {
  if (value && VALID_TAB_IDS.has(value as TabId)) {
    return value as TabId;
  }
  return "tale";
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

      {subsection.paragraphs && <Paragraphs lines={subsection.paragraphs} />}
      {subsection.bulletList && (
        <ul className="mt-3 list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          {subsection.bulletList.map((item, i) => (
            <li key={i} className="pl-1">
              <DndRichText text={item} />
            </li>
          ))}
        </ul>
      )}

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

function SectionContent({ section }: { section: GuideSection }) {
  return (
    <div className="space-y-5">
      {section.intro && <Paragraphs lines={section.intro} />}
      {section.paragraphs && <Paragraphs lines={section.paragraphs} />}
      {section.bulletList && (
        <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          {section.bulletList.map((item, i) => (
            <li key={i} className="pl-1">
              <DndRichText text={item} />
            </li>
          ))}
        </ul>
      )}

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

export function LorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    parseTabId(searchParams.get("tab")),
  );

  useEffect(() => {
    setActiveTab(parseTabId(searchParams.get("tab")));
  }, [searchParams]);

  const activeSection = useMemo(
    () => LORE_SECTIONS.find((s) => s.id === activeTab),
    [activeTab],
  );

  function handleTabChange(value: string) {
    const tab = parseTabId(value);
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "tale") {
          next.delete("tab");
        } else {
          next.set("tab", tab);
        }
        return next;
      },
      { replace: true },
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <BookMarked className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Lore</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Chapter 1 —{" "}
          <span className="text-foreground/80">
            Amellwind&apos;s Guide to Monster Hunting
          </span>
          . Myths, history, gods, and peoples of the Old World.
        </p>
        <p className="text-sm text-muted-foreground max-w-3xl mt-2">
          {LORE_INTRO}
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
              </div>
              <SectionContent section={activeSection} />
            </div>
          )}

          <div className="rounded-lg border border-border bg-card/50 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Playable species mechanics and faction membership live in Species,
              Backgrounds, and Factions.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/species"
                className="text-sm font-medium text-primary hover:underline"
              >
                Browse Species →
              </Link>
              <Link
                to="/factions"
                className="text-sm font-medium text-primary hover:underline"
              >
                Browse Factions →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
