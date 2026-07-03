import type { ReactNode } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/shared/utils/cn";
import type { HuntRollEntry } from "../hooks/useHuntState";

interface HuntRollHistoryProps {
  title: string;
  entries: HuntRollEntry[];
  onClear: () => void;
  renderBadge?: (entry: HuntRollEntry) => ReactNode;
}

export function HuntRollHistory({
  title,
  entries,
  onClear,
  renderBadge,
}: HuntRollHistoryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-4 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>
            {entries.length === 0
              ? "No rolls recorded yet."
              : `${entries.length} roll${entries.length === 1 ? "" : "s"}`}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={entries.length === 0}
          className="shrink-0 text-xs"
        >
          Clear
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Rolls will appear here after you use the tracker or resource tools.
          </p>
        ) : (
          <ScrollArea className="max-h-80 pr-3">
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-md border border-border bg-muted/20 p-3 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{entry.createdAt.toLocaleTimeString()}</span>
                    {renderBadge?.(entry)}
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {entry.label}
                    {typeof entry.success === "boolean" && (
                      <span
                        className={cn(
                          "ml-2",
                          entry.success ? "text-emerald-400" : "text-rose-400",
                        )}
                      >
                        {entry.success ? "SUCCESS" : "FAIL"}
                      </span>
                    )}
                    {entry.signsGained != null && entry.signsGained > 0 && (
                      <span className="ml-2 text-sky-400">
                        +{entry.signsGained} sign(s)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.details}</p>
                  <p className="text-xs text-foreground">{entry.result}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
