import { Link } from "react-router-dom";
import { Hammer, ImportIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MAGIC_ITEM_PRICING_ATTRIBUTION } from "@/features/dnd/shop-generator/data/magic-item-pricing-attribution";
import {
  NAV_SECTIONS,
  type NavGroupDef,
  type NavItemDef,
  type NavSectionDef,
} from "@/shared/constants/nav-sections";

function navSectionById(id: string): NavSectionDef {
  const section = NAV_SECTIONS.find((s) => s.id === id);
  if (!section) throw new Error(`Missing nav section: ${id}`);
  return section;
}

const amellwindSection = navSectionById("amellwind");
const raintDmSection = navSectionById("amellwind-raintdm");
const dndSection = navSectionById("dnd5e");

function SectionCard({ item }: { item: NavItemDef }) {
  const Icon = item.icon;
  return (
    <Link to={item.to} className="group focus:outline-none">
      <Card className="h-full transition-colors hover:bg-accent hover:border-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader className="p-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <CardTitle className="text-sm">{item.label}</CardTitle>
            {item.badge && (
              <Badge variant="orange" className="ml-auto text-[10px] py-0">
                {item.badge}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs leading-snug">
            {item.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

function HomeSectionGroups({
  section,
}: {
  section: Pick<NavSectionDef, "groups">;
}) {
  return (
    <>
      {section.groups.map((group: NavGroupDef) => (
        <div key={group.label} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {group.label}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.items.map((item) => (
              <SectionCard key={item.to} item={item} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function HomePage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      {/* Hero */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <Hammer className="h-7 w-7 text-primary shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight">
            Amellwind MH DnD5e Toolbox
          </h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
          Web toolkit for{" "}
          <span className="text-foreground font-medium">Dungeon Masters</span>{" "}
          and players of the{" "}
          <span className="text-foreground font-medium">Amellwind</span>{" "}
          homebrew, combining{" "}
          <span className="text-foreground font-medium">Monster Hunter</span>{" "}
          with <span className="text-foreground font-medium">D&amp;D 5e</span>.
          All data is synchronized and cached in your browser for offline access
          between sessions.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="secondary">
            <ImportIcon className="h-3 w-3 mr-1" />
            Export / Import Foundry VTT
          </Badge>
          <Badge variant="secondary">Offline after initial load</Badge>
          <Badge variant="secondary">v0.1.23</Badge>
        </div>
      </section>

      <Separator />

      {/* Amellwind sections */}
      <section className="space-y-7">
        <div>
          <h2 className="text-lg font-semibold">Amellwind Homebrew</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Exclusive content from the Amellwind Monster Hunter D&amp;D 5e
            system.
          </p>
        </div>

        <HomeSectionGroups section={amellwindSection} />
      </section>

      <Separator />

      {/* Amellwind (RaintDM) sections */}
      <section className="space-y-7">
        <div>
          <h2 className="text-lg font-semibold">Amellwind (RaintDM)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            RaintDM variants on Amellwind&apos;s 2014 Monster Hunter homebrew —
            house-rule tweaks for my tables and campaigns.
          </p>
        </div>
        <HomeSectionGroups section={raintDmSection} />
      </section>

      <Separator />

      {/* D&D 5e sections */}
      <section className="space-y-7">
        <div>
          <h2 className="text-lg font-semibold">D&D 5e Compendium</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official reference data loaded from{" "}
            <a
              href="https://5e.tools"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              5etools
            </a>
            . Not homebrew content from Amellwind.
          </p>
        </div>
        <HomeSectionGroups section={dndSection} />
      </section>

      {/* Footer note */}
      <Separator />
      <div className="space-y-2 pb-2 text-xs text-muted-foreground">
        <p>
          Fan-made project. Homebrew content is created by{" "}
          <a
            href="https://www.patreon.com/cw/amellwind"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Amellwind
          </a>
          . Monster Hunter is property of Capcom; D&amp;D is property of Wizards
          of the Coast.
        </p>
        <p>
          Suggested magic-item prices follow the{" "}
          <a
            href={MAGIC_ITEM_PRICING_ATTRIBUTION.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {MAGIC_ITEM_PRICING_ATTRIBUTION.title}
          </a>{" "}
          spreadsheet by {MAGIC_ITEM_PRICING_ATTRIBUTION.author} (
          <a
            href={MAGIC_ITEM_PRICING_ATTRIBUTION.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            dumpstatadventures.com
          </a>
          ) — formulas and costs from that work, not original calculations from
          this app.
        </p>
      </div>
    </div>
  );
}
