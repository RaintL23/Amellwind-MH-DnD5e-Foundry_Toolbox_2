import { Check, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DEFAULT_OPEN_LANGUAGE_SOURCES,
  filterLanguageGroups,
} from "@/shared/data/chooseable-languages";
import type {
  ProficiencySource,
  ProficiencySourceType,
} from "@/shared/types/proficiency.types";
import {
  badgeStyleForSource,
  dominantSourceType,
  SOURCE_LABELS,
} from "../../utils/proficiency-source-styles";
import {
  PICKER_CONTAINER_CLASS,
  pickerPillClassName,
  pickerQuota,
  type PickerGrant,
} from "./picker-shared";
import { PickerPillHint } from "./PickerPillHint";

interface BuilderLanguagePickerProps {
  grants: PickerGrant[];
  chosen: string[];
  onChange: (items: string[]) => void;
  label?: string;
  pickerSourceType: ProficiencySourceType;
  /** Fixed languages from this same source — hidden from the catalog. */
  excluded?: string[];
  /** Languages from higher-priority sources — shown disabled in the catalog. */
  alreadyGranted?: Partial<Record<string, ProficiencySource[]>>;
}

export function BuilderLanguagePicker({
  grants,
  chosen,
  onChange,
  label,
  pickerSourceType,
  excluded = [],
  alreadyGranted = {},
}: BuilderLanguagePickerProps) {
  if (!grants.length) return null;

  const allowedSet = new Set<string>();

  for (const g of grants) {
    if (g.kind === "choose") {
      g.from.forEach((item) => allowedSet.add(item));
    } else if (g.options?.length) {
      g.options.forEach((item) => allowedSet.add(item));
    }
  }

  const sourceGroups = filterLanguageGroups(allowedSet, excluded);

  function grantedSources(item: string): ProficiencySource[] | undefined {
    return alreadyGranted[item.toLowerCase()];
  }

  const effectiveChosen = chosen.filter((item) => !grantedSources(item)?.length);
  const { totalCount, remainingPicks, canPickMore, grantSourceName } = pickerQuota(
    grants,
    effectiveChosen.length,
  );
  const pickerColor = badgeStyleForSource(pickerSourceType);

  // Primary sources (e.g. PHB 2024) are always visible; the rest are merged into
  // one collapsible, with names already listed above removed (Elvish, Orc, …).
  const primaryGroups = sourceGroups.filter((g) =>
    DEFAULT_OPEN_LANGUAGE_SOURCES.includes(g.sourceCode),
  );
  const seen = new Set(
    primaryGroups.flatMap((g) => g.languages.map((l) => l.toLowerCase())),
  );
  const otherGroups = sourceGroups
    .filter((g) => !DEFAULT_OPEN_LANGUAGE_SOURCES.includes(g.sourceCode))
    .map((g) => ({
      ...g,
      languages: g.languages.filter((l) => {
        const key = l.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    }))
    .filter((g) => g.languages.length > 0);
  const otherCount = otherGroups.reduce((n, g) => n + g.languages.length, 0);

  function handleToggle(
    item: string,
    isChosen: boolean,
    coveredByHigher: boolean,
  ) {
    if (isChosen) {
      onChange(chosen.filter((s) => s !== item));
      return;
    }
    if (!coveredByHigher && canPickMore && !chosen.includes(item)) {
      onChange([...chosen, item]);
    }
  }

  function renderPill(item: string, key: string) {
    const isChosen = chosen.includes(item);
    const grantedBy = grantedSources(item);
    const coveredByHigher = !!grantedBy?.length && !isChosen;
    const isDisabled = coveredByHigher || isChosen;
    const badgeColor = coveredByHigher
      ? badgeStyleForSource(dominantSourceType(grantedBy!))
      : isChosen
        ? pickerColor
        : undefined;
    const tooltip = coveredByHigher
      ? `Already granted from ${SOURCE_LABELS[dominantSourceType(grantedBy!)]} (${grantedBy!.map((s) => s.name).join(", ")})`
      : isChosen
        ? `Your ${SOURCE_LABELS[pickerSourceType]} choice`
        : undefined;

    const blockedReason = coveredByHigher ? tooltip : undefined;

    return (
      <PickerPillHint key={key} reason={blockedReason}>
        <button
          type="button"
          aria-disabled={coveredByHigher || undefined}
          title={blockedReason ? undefined : tooltip}
          onClick={() => handleToggle(item, isChosen, coveredByHigher)}
          className={pickerPillClassName({
            badgeColor,
            isDisabled,
            cursorDefault: coveredByHigher,
          })}
        >
          {item}
        </button>
      </PickerPillHint>
    );
  }

  const done = remainingPicks === 0;

  return (
    <div className={PICKER_CONTAINER_CLASS}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label ?? grantSourceName}
        </p>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            done
              ? "bg-primary/15 text-primary"
              : "bg-amber-500/20 text-amber-700 dark:text-amber-300",
          )}
        >
          {done && <Check className="h-3 w-3" aria-hidden />}
          {Math.min(effectiveChosen.length, totalCount)}/{totalCount} chosen
        </span>
      </div>

      {chosen.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {chosen.map((item) => (
            <button
              key={item}
              type="button"
              title={`Remove ${item}`}
              onClick={() => onChange(chosen.filter((s) => s !== item))}
              className={cn(
                pickerPillClassName({ badgeColor: pickerColor, isDisabled: false }),
                "inline-flex items-center gap-1",
              )}
            >
              {item}
              <X className="h-3 w-3 opacity-70" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {canPickMore &&
        (sourceGroups.length === 0 ? (
          <p className="py-2 text-center text-[10px] text-muted-foreground">
            No languages available to choose.
          </p>
        ) : (
          <div className="space-y-2.5 rounded-md border border-border/40 bg-background/50 p-2">
            {primaryGroups.map((group) => (
              <div key={group.sourceCode}>
                <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground/80">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1">
                  {group.languages.map((item) =>
                    renderPill(item, `${group.sourceCode}-${item}`),
                  )}
                </div>
              </div>
            ))}

            {otherGroups.length > 0 && (
              <Accordion
                type="single"
                collapsible
                defaultValue={primaryGroups.length === 0 ? "more" : undefined}
              >
                <AccordionItem value="more" className="border-0">
                  <AccordionTrigger className="gap-2 py-1 text-[10px] font-medium normal-case tracking-normal text-muted-foreground hover:no-underline">
                    <span className="flex items-center gap-2">
                      {primaryGroups.length === 0 ? "Languages" : "More sources"}
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-normal">
                        {otherCount}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2.5 pb-0 pt-1.5">
                    {otherGroups.map((group) => (
                      <div key={group.sourceCode}>
                        <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground/80">
                          {group.label}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {group.languages.map((item) =>
                            renderPill(item, `${group.sourceCode}-${item}`),
                          )}
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        ))}
    </div>
  );
}
