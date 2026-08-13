import { useEffect, useState } from "react";
import {
  Crosshair,
  BookOpen,
  Settings2,
  Footprints,
  Package,
  Lock,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/shared/utils/cn";
import { useHuntState } from "../hooks/useHuntState";
import { loadHuntActiveTab, persistHuntActiveTab } from "../storage/hunt.storage";
import { HuntRulesTab } from "./HuntRulesTab";
import { HuntSetupPanel } from "./HuntSetupPanel";
import { HuntTrackerTab } from "./HuntTrackerTab";
import { HuntResourcesTab } from "./HuntResourcesTab";

type HuntTab = "rules" | "setup" | "tracker" | "resources";

const HUNT_TABS: readonly HuntTab[] = ["rules", "setup", "tracker", "resources"];

function loadInitialTab(): HuntTab {
  const saved = loadHuntActiveTab();
  return HUNT_TABS.includes(saved as HuntTab) ? (saved as HuntTab) : "setup";
}

export function HuntPage() {
  const [activeTab, setActiveTab] = useState<HuntTab>(loadInitialTab);
  const hunt = useHuntState();
  const huntTabsLocked = !hunt.setupComplete;

  // A locked tab may have been restored (e.g. tracker) before setup completes;
  // fall back to setup so the user is not stuck on a disabled panel.
  useEffect(() => {
    if (huntTabsLocked && (activeTab === "tracker" || activeTab === "resources")) {
      setActiveTab("setup");
    }
  }, [huntTabsLocked, activeTab]);

  useEffect(() => {
    persistHuntActiveTab(activeTab);
  }, [activeTab]);

  function handleTabChange(value: string) {
    const tab = value as HuntTab;
    if (huntTabsLocked && (tab === "tracker" || tab === "resources")) {
      return;
    }
    setActiveTab(tab);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Crosshair className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Hunt Planner</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Plan and simulate a monster hunt using Amellwind rules. Pick a target and
          environment, review generated prep tables, then start the hunt.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="sticky top-0 z-10 -mx-1 rounded-lg border border-border bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50">
                <TabsTrigger value="rules" className="gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Rules
                </TabsTrigger>
                <TabsTrigger value="setup" className="gap-1.5">
                  <Settings2 className="h-4 w-4" />
                  Setup
                </TabsTrigger>
                <TabsTrigger
                  value="tracker"
                  className={cn("gap-1.5", huntTabsLocked && "opacity-50")}
                  disabled={huntTabsLocked}
                >
                  <Footprints className="h-4 w-4" />
                  Tracker
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className={cn("gap-1.5", huntTabsLocked && "opacity-50")}
                  disabled={huntTabsLocked}
                >
                  <Package className="h-4 w-4" />
                  Resources
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {huntTabsLocked && (
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <Lock className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-muted-foreground">
                Complete setup (monster, environment, prep tables) and press{" "}
                <span className="font-medium text-foreground">Start Hunt</span>{" "}
                to unlock Tracker and Resources.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="pb-4">
            {activeTab === "rules" && <HuntRulesTab />}
            {activeTab === "setup" && <HuntSetupPanel hunt={hunt} />}
            {activeTab === "tracker" && hunt.setupComplete && (
              <HuntTrackerTab hunt={hunt} />
            )}
            {activeTab === "resources" && hunt.setupComplete && (
              <HuntResourcesTab hunt={hunt} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
