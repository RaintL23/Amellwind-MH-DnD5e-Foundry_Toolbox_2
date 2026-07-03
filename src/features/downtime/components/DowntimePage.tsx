import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import type { DowntimeActivity } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { getAllDowntimeActivities } from "../services/downtime.service";
import { DowntimeContentView } from "./DowntimeContent";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";

export function DowntimePage() {
  const [activities, setActivities] = useState<DowntimeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    getAllDowntimeActivities()
      .then((data) => {
        setActivities(data);
        if (data[0]) setActiveId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeActivity = useMemo(
    () => activities.find((a) => a.id === activeId) ?? activities[0] ?? null,
    [activities, activeId],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <CalendarClock className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Downtime Activities
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          New downtime options from{" "}
          <span className="text-foreground/80">
            Amellwind&apos;s Guide to Monster Hunting
          </span>{" "}
          (Chapter 2, p. 52). Use these between adventures to hunt solo, travel
          with Trenya, sell materials, or gather resources at the Palico Farm.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {loading ? (
          <ListAreaLoading message="Loading downtime activities…" />
        ) : !activities.length ? (
          <p className="text-sm text-muted-foreground">
            No downtime activities found in the guide data.
          </p>
        ) : (
        <div className="w-auto mx-auto space-y-5">
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
            {activities.map((activity) => (
              <button
                key={activity.id}
                type="button"
                onClick={() => setActiveId(activity.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeId === activity.id
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {activity.shortName}
              </button>
            ))}
          </div>

          {activeActivity && (
            <div>
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  {activeActivity.shortName}
                </h2>
                {activeActivity.page != null && (
                  <span className="text-xs text-muted-foreground">
                    p. {activeActivity.page}
                  </span>
                )}
              </div>
              <DowntimeContentView content={activeActivity.content} />
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
