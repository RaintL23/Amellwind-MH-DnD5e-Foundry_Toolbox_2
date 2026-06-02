import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PawPrint, BookOpen, Wand2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { MonstieSidekickGuide } from "@/shared/types";
import { getMonstieSidekickGuide } from "../services/monstie-sidekick.service";
import { MonstieCreatorProvider } from "../context/MonstieCreatorContext";
import { MonstieCreatorPanel } from "./MonstieCreatorPanel";
import { MonstieRulesContentView } from "./MonstieRulesContent";
import { MonstieProgressionTable } from "./MonstieProgressionTable";
import { MonstieClassFeaturesList } from "./MonstieClassFeaturesList";

type TabId = "rules" | "creator";

const TABS: Array<{ id: TabId; label: string; icon: typeof BookOpen }> = [
  { id: "rules", label: "Rules", icon: BookOpen },
  { id: "creator", label: "Monstie Creator", icon: Wand2 },
];

export function MonstieSidekickPage() {
  const [activeTab, setActiveTab] = useState<TabId>("creator");
  const [guide, setGuide] = useState<MonstieSidekickGuide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMonstieSidekickGuide()
      .then(setGuide)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <PawPrint className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Monstie Sidekick
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Monster companions for the Monstie Sidekick class (AGMH p.169). Create
          a sidekick based on a monster from the Monster Manual, with balanced
          rules and a custom template.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeTab === id
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === "rules" && (
            <div className="max-w-4xl space-y-6">
              {loading ? (
                <p className="text-sm text-muted-foreground">
                  Loading rules...
                </p>
              ) : !guide ? (
                <p className="text-sm text-muted-foreground">
                  No data found. Sync the AGMH guide.
                </p>
              ) : (
                <>
                  {guide.rules.length > 0 ? (
                    <MonstieRulesContentView content={guide.rules} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No Monstie Sidekicks variant found.
                    </p>
                  )}

                  {guide.sidekickClass && (
                    <MonstieProgressionTable
                      sidekickClass={guide.sidekickClass}
                    />
                  )}

                  <MonstieClassFeaturesList features={guide.classFeatures} />
                </>
              )}
            </div>
          )}

          {activeTab === "creator" && (
            <MonstieCreatorProvider>
              <MonstieCreatorPanel />
            </MonstieCreatorProvider>
          )}

          <div className="rounded-lg border border-border bg-card/50 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Consult the complete stat block of the base monster in the
              bestiary.
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
