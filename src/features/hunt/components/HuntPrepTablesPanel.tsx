import { useState } from "react";
import { Dices, Plus, RotateCcw, Table2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/shared/utils/cn";
import {
  HUNT_PREP_TABLE_META,
  type HuntPrepTableKey,
} from "../data/hunt-prep-defaults.data";
import type { UseHuntStateResult } from "../hooks/useHuntState";

interface HuntPrepTablesPanelProps {
  hunt: UseHuntStateResult;
}

const TABLE_ACCENT: Record<HuntPrepTableKey, string> = {
  signs: "border-emerald-500/30",
  minorChallenges: "border-amber-500/30",
  majorChallenges: "border-rose-500/30",
  benefits: "border-violet-500/30",
};

const TABLE_BG: Record<HuntPrepTableKey, string> = {
  signs: "bg-emerald-500/5",
  minorChallenges: "bg-amber-500/5",
  majorChallenges: "bg-rose-500/5",
  benefits: "bg-violet-500/5",
};

export function HuntPrepTablesPanel({ hunt }: HuntPrepTablesPanelProps) {
  const [previewByTable, setPreviewByTable] = useState<
    Partial<Record<HuntPrepTableKey, string>>
  >({});

  function handlePreviewRoll(key: HuntPrepTableKey) {
    const entry = hunt.rollPrepTable(key);
    if (entry) {
      setPreviewByTable((prev) => ({ ...prev, [key]: entry }));
    }
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-4 pb-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Table2 className="h-4 w-4 text-primary" />
              Generated Prep Tables
              {hunt.selectedMonster && (
                <span className="font-normal text-muted-foreground">
                  — {hunt.selectedMonster.name}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Entries reference your quarry, local monsters from{" "}
              {hunt.selectedEnvironment?.name}, and NPC details where applicable.
              Difficulty: {hunt.encounterDifficulty}.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={hunt.regeneratePrepTables}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Regenerate
          </Button>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {HUNT_PREP_TABLE_META.map((meta) => {
          const entries = hunt.prepTables[meta.key];
          const preview = previewByTable[meta.key];

          return (
            <Card
              key={meta.key}
              className={cn(
                "shadow-none",
                TABLE_ACCENT[meta.key],
                TABLE_BG[meta.key],
              )}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
                    {meta.title}
                    <Badge variant="outline">{entries.length}</Badge>
                  </CardTitle>
                  <CardDescription>{meta.description}</CardDescription>
                </div>
                <TooltipProvider delayDuration={300}>
                  <div className="flex shrink-0 gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => hunt.addPrepEntry(meta.key)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add entry</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePreviewRoll(meta.key)}
                          disabled={entries.length === 0}
                        >
                          <Dices className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Preview random roll</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </CardHeader>

              <CardContent className="space-y-3 p-4 pt-0">
                {preview && (
                  <div className="rounded-md border border-border bg-background/80 px-3 py-2 text-xs text-foreground">
                    <span className="text-muted-foreground">Preview roll: </span>
                    {preview}
                  </div>
                )}

                {entries.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No entries generated.
                  </p>
                ) : (
                  <ScrollArea className="max-h-72 pr-3">
                    <ul className="space-y-2">
                      {entries.map((entry, index) => (
                        <li
                          key={entry.id}
                          className="flex items-start gap-2 rounded-md border border-border bg-background/70 p-2"
                        >
                          <span className="w-5 shrink-0 pt-2 text-[11px] text-muted-foreground">
                            {index + 1}.
                          </span>
                          <Textarea
                            value={entry.text}
                            onChange={(e) =>
                              hunt.updatePrepEntry(
                                meta.key,
                                entry.id,
                                e.target.value,
                              )
                            }
                            placeholder={`${meta.title} entry...`}
                            rows={Math.min(
                              4,
                              Math.max(2, Math.ceil(entry.text.length / 72)),
                            )}
                            className="min-h-[4rem] flex-1 resize-y text-xs"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-rose-400"
                            onClick={() =>
                              hunt.removePrepEntry(meta.key, entry.id)
                            }
                            aria-label={`Remove ${meta.title} entry`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
