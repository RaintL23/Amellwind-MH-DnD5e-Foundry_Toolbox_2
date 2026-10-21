import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";
import type { GuideSection, GuideSubsection } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { GuideTable } from "@/features/amellwind/character-guide/components/GuideTable";
import {
  ARTIFICER_FORGE_INTRO,
  ARTIFICER_FORGE_SECTIONS,
} from "../data/artificer-forge.data";
import { LinkedText } from "./MaterialEffectRef";
import { MaterialEffectLinkProvider } from "./MaterialEffectLinkProvider";
import { PlanListTable } from "./PlanListTable";

const PLAN_LIST_SECTION_ID = "plan-list";

function Paragraphs({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
          <LinkedText text={line} />
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
          <LinkedText text={item} />
        </li>
      ))}
    </ul>
  );
}

function SubsectionBlock({
  subsection,
  isPlanList,
}: {
  subsection: GuideSubsection;
  isPlanList: boolean;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground mb-2">
        {subsection.name}
      </h3>
      {subsection.paragraphs && <Paragraphs lines={subsection.paragraphs} />}
      {subsection.bulletList && <BulletList items={subsection.bulletList} />}
      {subsection.table && (
        <div className={cn(subsection.paragraphs && "mt-3")}>
          {isPlanList ? (
            <PlanListTable table={subsection.table} />
          ) : (
            <GuideTable table={subsection.table} />
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({ section }: { section: GuideSection }) {
  return (
    <section
      id={section.id}
      className="rounded-lg border border-border bg-card p-4 space-y-4"
    >
      <h2 className="text-lg font-semibold text-foreground">{section.name}</h2>
      {section.intro && <Paragraphs lines={section.intro} />}
      {section.paragraphs && <Paragraphs lines={section.paragraphs} />}
      {section.bulletList && <BulletList items={section.bulletList} />}
      {section.subsections?.map((subsection) => (
        <SubsectionBlock
          key={subsection.name}
          subsection={subsection}
          isPlanList={section.id === PLAN_LIST_SECTION_ID}
        />
      ))}
      {section.footerNote && (
        <p className="text-sm text-muted-foreground italic border-t border-border pt-4">
          <LinkedText text={section.footerNote} />
        </p>
      )}
    </section>
  );
}

export function ArtificerForgePage() {
  return (
    <MaterialEffectLinkProvider>
      <div className="flex flex-col h-full min-h-0">
        <div className="shrink-0 border-b border-border px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <Wrench className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">
              Artificer Forge
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">
            RaintDM adaptation of the 2024 Artificer for Amellwind: Replicate
            Magic Item becomes Replicate Material Effect, with plans that
            produce Material Effects instead of magic items.
          </p>
        </div>

        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="rounded-lg border border-border bg-card p-4">
              <Paragraphs lines={ARTIFICER_FORGE_INTRO} />
            </div>

            {ARTIFICER_FORGE_SECTIONS.map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}

            <div className="rounded-lg border border-border bg-card/50 p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Select any effect name to read its full Material Effect entry,
                or browse the whole catalog.
              </p>
              <Link
                to="/material-effects"
                className="text-sm font-medium text-primary hover:underline"
              >
                Open Material Effects →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MaterialEffectLinkProvider>
  );
}
