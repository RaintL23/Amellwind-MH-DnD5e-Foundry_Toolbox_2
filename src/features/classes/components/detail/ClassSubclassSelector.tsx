import { memo, useMemo } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Subclass } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SourceBadge } from "@/features/spells/components/SourceBadge";
import {
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import { cn } from "@/shared/utils/cn";

interface ClassSubclassSelectorProps {
  subclasses: Subclass[];
  activeSubclassId: string;
  onSelect: (id: string) => void;
  subclassTitle?: string;
  bookNames: BookSourceNameMap;
}

type SubclassOptionMeta = {
  subclass: Subclass;
  sourceLabel: string;
  year: number | null;
  yearKey: string;
};

function editionYear(edition: Subclass["edition"]): number | null {
  if (edition === "one") return 2024;
  if (edition === "classic") return 2014;
  return null;
}

function resolveSubclassYear(
  subclass: Subclass,
  catalogYear: number | undefined,
): number | null {
  return catalogYear ?? editionYear(subclass.edition);
}

function formatSourceLine(
  sourceLabel: string,
  sourceCode: string,
  year: number | null,
): string {
  const label =
    sourceLabel && sourceLabel !== sourceCode ? sourceLabel : sourceCode;
  return year != null ? `${label} · ${year}` : label;
}

export const ClassSubclassSelector = memo(function ClassSubclassSelector({
  subclasses,
  activeSubclassId,
  onSelect,
  subclassTitle,
  bookNames,
}: ClassSubclassSelectorProps) {
  const catalog = useSourceCatalog();

  const options = useMemo((): SubclassOptionMeta[] => {
    return subclasses.map((subclass) => {
      const entry = catalog.get(subclass.source);
      const sourceLabel =
        entry?.name ?? resolveBookSourceName(bookNames, subclass.source);
      const year = resolveSubclassYear(subclass, entry?.year);
      return {
        subclass,
        sourceLabel,
        year,
        yearKey: year != null ? String(year) : "Unknown",
      };
    });
  }, [subclasses, catalog, bookNames]);

  const grouped = useMemo(() => {
    const byYear = new Map<string, SubclassOptionMeta[]>();
    for (const option of options) {
      const group = byYear.get(option.yearKey) ?? [];
      group.push(option);
      byYear.set(option.yearKey, group);
    }

    for (const group of byYear.values()) {
      group.sort((a, b) =>
        a.subclass.name.localeCompare(b.subclass.name, undefined, {
          sensitivity: "base",
        }),
      );
    }

    const yearKeys = [...byYear.keys()].sort((a, b) => {
      if (a === "Unknown") return 1;
      if (b === "Unknown") return -1;
      return Number(b) - Number(a);
    });

    return yearKeys.map((yearKey) => ({
      yearKey,
      items: byYear.get(yearKey) ?? [],
    }));
  }, [options]);

  if (subclasses.length === 0) return null;

  const active = options.find((o) => o.subclass.id === activeSubclassId);
  const triggerPrimary = active?.subclass.name ?? "— No subclass selected —";
  const triggerSecondary = active
    ? formatSourceLine(
        active.sourceLabel,
        active.subclass.source,
        active.year,
      )
    : null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {subclassTitle ?? "Subclass"}
      </p>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-auto w-full max-w-md justify-between gap-2 px-3 py-1.5 font-normal",
              !active && "text-muted-foreground",
            )}
          >
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm">{triggerPrimary}</span>
              {active && triggerSecondary && (
                <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <span className="truncate">{triggerSecondary}</span>
                  <Badge
                    variant="secondary"
                    className="h-4 shrink-0 px-1 text-[10px] font-normal"
                  >
                    {active.subclass.source}
                  </Badge>
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="max-h-80 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[20rem] overflow-y-auto"
        >
          <DropdownMenuItem
            className="cursor-pointer py-2"
            onSelect={() => onSelect("")}
          >
            <span className="text-sm text-muted-foreground">
              — No subclass selected —
            </span>
          </DropdownMenuItem>

          {grouped.map(({ yearKey, items }) => (
            <div key={yearKey}>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {yearKey === "Unknown" ? "Unknown year" : yearKey}
              </DropdownMenuLabel>
              {items.map((option) => {
                const { subclass, year } = option;
                const isActive = subclass.id === activeSubclassId;
                return (
                  <DropdownMenuItem
                    key={subclass.id}
                    className="cursor-pointer items-start gap-2 py-2"
                    onSelect={() => onSelect(subclass.id)}
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      {isActive ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block truncate text-sm font-medium">
                        {subclass.name}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <SourceBadge
                          source={subclass.source}
                          bookNames={bookNames}
                          className="max-w-[14rem] text-[10px]"
                        />
                        {year != null && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground"
                          >
                            {year}
                          </Badge>
                        )}
                      </span>
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
