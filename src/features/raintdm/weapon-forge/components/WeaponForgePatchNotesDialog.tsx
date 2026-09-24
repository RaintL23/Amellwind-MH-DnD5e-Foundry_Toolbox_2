import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ScrollText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/shared/utils/cn";
import { loadWeaponForgePatchNotes } from "../services/weapon-forge-patch-notes.service";
import type {
  WeaponForgePatchChange,
  WeaponForgePatchChangeKind,
  WeaponForgePatchNotesDay,
  WeaponForgePatchWeapon,
} from "../types/weapon-forge-patch-notes.types";

type DayWeaponGroup = {
  weapon: WeaponForgePatchWeapon;
  blocks: { summary: string; commit: string; changes: WeaponForgePatchChange[] }[];
};

const KIND_META: Record<
  WeaponForgePatchChangeKind,
  { label: string; className: string }
> = {
  "weapon-added": {
    label: "Added",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  "weapon-removed": {
    label: "Removed",
    className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  field: {
    label: "Field",
    className: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
  "feature-added": {
    label: "Feature +",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  "feature-removed": {
    label: "Feature −",
    className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  "feature-renamed": {
    label: "Renamed",
    className: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  "feature-text": {
    label: "Text",
    className: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  dice: {
    label: "Dice",
    className: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  },
  "rarity-table": {
    label: "Rarity",
    className: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
};

function formatPatchDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function groupWeaponsForDay(day: WeaponForgePatchNotesDay): DayWeaponGroup[] {
  const byFile = new Map<string, DayWeaponGroup>();
  for (const entry of day.entries) {
    for (const weapon of entry.weapons) {
      const existing = byFile.get(weapon.file);
      const block = {
        summary: entry.summary,
        commit: entry.commit,
        changes: weapon.changes,
      };
      if (existing) {
        existing.blocks.push(block);
      } else {
        byFile.set(weapon.file, { weapon, blocks: [block] });
      }
    }
  }
  return [...byFile.values()].sort((a, b) =>
    a.weapon.name.localeCompare(b.weapon.name),
  );
}

/** Colorize quoted names, dice, and action verbs in change blurbs. */
function colorizeInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re =
    /("[^"]+")|(\b\d+d\d+(?:[+-]\d+)?\b)|(\b(?:Added|Removed|Renamed|Rewrote|Updated)\b)|(\s→\s)/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const [full, quoted, dice, verb, arrow] = match;
    if (quoted) {
      parts.push(
        <span key={key++} className="font-medium text-sky-300">
          {quoted}
        </span>,
      );
    } else if (dice) {
      parts.push(
        <span key={key++} className="font-semibold text-amber-200">
          {dice}
        </span>,
      );
    } else if (verb) {
      const lower = verb.toLowerCase();
      const verbClass =
        lower === "added"
          ? "text-emerald-300"
          : lower === "removed"
            ? "text-rose-300"
            : lower === "renamed"
              ? "text-sky-300"
              : "text-violet-300";
      parts.push(
        <span key={key++} className={cn("font-medium", verbClass)}>
          {verb}
        </span>,
      );
    } else if (arrow) {
      parts.push(
        <span key={key++} className="font-medium text-amber-200/90">
          {arrow}
        </span>,
      );
    } else {
      parts.push(full);
    }
    last = match.index + full.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function ChangeDetail({ change }: { change: WeaponForgePatchChange }) {
  const meta = KIND_META[change.kind];
  const showSnippet =
    (change.kind === "feature-text" ||
      change.kind === "dice" ||
      change.kind === "rarity-table") &&
    (change.before || change.after);

  return (
    <li className="space-y-1.5">
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            meta.className,
          )}
        >
          {meta.label}
        </span>
        <p className="min-w-0 flex-1 leading-snug text-muted-foreground">
          {colorizeInline(change.text)}
        </p>
      </div>
      {showSnippet ? (
        <div className="space-y-1.5 rounded-md border border-border/50 bg-muted/30 px-2.5 py-2 text-xs leading-relaxed">
          {change.before ? (
            <p>
              <span className="font-semibold text-rose-300/90">Before: </span>
              <span className="text-rose-100/70">
                {colorizeInline(change.before)}
              </span>
            </p>
          ) : null}
          {change.after ? (
            <p>
              <span className="font-semibold text-emerald-300/90">After: </span>
              <span className="text-emerald-100/70">
                {colorizeInline(change.after)}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

type WeaponForgePatchNotesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WeaponForgePatchNotesDialog({
  open,
  onOpenChange,
}: WeaponForgePatchNotesDialogProps) {
  const [days, setDays] = useState<WeaponForgePatchNotesDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (days != null) return;
    let cancelled = false;
    setError(null);
    void loadWeaponForgePatchNotes()
      .then((loaded) => {
        if (!cancelled) setDays(loaded);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load patch notes.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, days]);

  const groupedByDay = useMemo(() => {
    if (!days) return [];
    return days.map((day) => ({
      day,
      weapons: groupWeaponsForDay(day),
    }));
  }, [days]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-amber-200" />
            Patch Notes
          </DialogTitle>
          <DialogDescription>
            Catalog weapon changes over time, grouped by date — including dice
            tweaks and feature text rewrites.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="text-sm">
          {error ? (
            <p className="text-muted-foreground">{error}</p>
          ) : days == null ? (
            <p className="text-muted-foreground">Loading patch notes…</p>
          ) : days.length === 0 ? (
            <p className="text-muted-foreground">No patch notes yet.</p>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={days[0] ? [days[0].date] : []}
              className="space-y-3"
            >
              {groupedByDay.map(({ day, weapons }) => (
                <Card key={day.date} className="overflow-hidden">
                  <AccordionItem value={day.date} className="border-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <span className="flex flex-col items-start gap-0.5 text-left">
                        <span className="font-medium text-foreground">
                          {formatPatchDate(day.date)}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {day.entries.length} update
                          {day.entries.length === 1 ? "" : "s"} ·{" "}
                          {weapons.length} weapon
                          {weapons.length === 1 ? "" : "s"}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <Accordion
                        type="multiple"
                        defaultValue={
                          weapons[0]
                            ? [`${day.date}:${weapons[0].weapon.file}`]
                            : []
                        }
                        className="space-y-2"
                      >
                        {weapons.map(({ weapon, blocks }) => {
                          const changeCount = blocks.reduce(
                            (n, b) => n + b.changes.length,
                            0,
                          );
                          const value = `${day.date}:${weapon.file}`;
                          return (
                            <Card
                              key={value}
                              className="overflow-hidden border-border/70 bg-muted/20"
                            >
                              <AccordionItem value={value} className="border-0">
                                <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
                                  <span className="flex flex-col items-start gap-0.5 text-left">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                                      {weapon.name}
                                    </span>
                                    <span className="text-[11px] font-normal normal-case tracking-normal text-muted-foreground">
                                      {changeCount} change
                                      {changeCount === 1 ? "" : "s"}
                                      {blocks.length > 1
                                        ? ` · ${blocks.length} updates`
                                        : ""}
                                    </span>
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3">
                                  <div className="space-y-3">
                                    {blocks.map((block) => (
                                      <div
                                        key={`${value}-${block.commit}`}
                                        className="space-y-2"
                                      >
                                        <p className="text-xs font-medium leading-snug text-foreground/90">
                                          {block.summary}
                                        </p>
                                        <ul className="space-y-2.5">
                                          {block.changes.map(
                                            (change, index) => (
                                              <ChangeDetail
                                                key={`${value}-${block.commit}-${index}`}
                                                change={change}
                                              />
                                            ),
                                          )}
                                        </ul>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Card>
                          );
                        })}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              ))}
            </Accordion>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
