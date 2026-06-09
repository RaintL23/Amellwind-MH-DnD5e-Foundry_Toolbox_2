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

type ChooseGrant = {
  kind: "choose";
  from: string[];
  count: number;
  source: ProficiencySource;
};

type AnyGrant = {
  kind: "any";
  count: number;
  label: string;
  options?: string[];
  source: ProficiencySource;
};

interface BuilderLanguagePickerProps {
  grants: Array<ChooseGrant | AnyGrant>;
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

  const totalCount = grants.reduce((acc, g) => acc + g.count, 0);
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
  const remainingPicks = Math.max(0, totalCount - effectiveChosen.length);
  const canPickMore = remainingPicks > 0;
  const grantSourceName = grants[0]?.source.name ?? "";
  const pickerColor = badgeStyleForSource(pickerSourceType);

  const defaultOpen = DEFAULT_OPEN_LANGUAGE_SOURCES.filter((code) =>
    sourceGroups.some((g) => g.sourceCode === code),
  );

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

  return (
    <div className="mt-2 rounded-md border border-border/50 bg-muted/30 p-2">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label ?? grantSourceName} — choose {totalCount}
        {remainingPicks > 0 && remainingPicks < totalCount && (
          <span className="normal-case text-muted-foreground/80">
            {" "}
            (pick {remainingPicks} more)
          </span>
        )}
        {remainingPicks === 0 && chosen.length >= totalCount && (
          <span className="normal-case text-muted-foreground/80"> (done)</span>
        )}
      </p>

      {chosen.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground/80">
            Selected
          </p>
          <div className="flex flex-wrap gap-1">
            {chosen.map((item) => (
              <button
                key={item}
                type="button"
                title={`Remove ${item}`}
                onClick={() => onChange(chosen.filter((s) => s !== item))}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  pickerColor,
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {canPickMore &&
        (sourceGroups.length === 0 ? (
          <p className="py-2 text-center text-[10px] text-muted-foreground">
            No languages available to choose.
          </p>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={[...defaultOpen]}
            className="rounded-md border border-border/40 bg-background/50"
          >
            {sourceGroups.map((group) => (
              <AccordionItem
                key={group.sourceCode}
                value={group.sourceCode}
                className="border-border/40 px-2 last:border-b-0"
              >
                <AccordionTrigger className="gap-2 py-2 text-[10px] font-medium normal-case tracking-normal text-foreground hover:no-underline">
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span className="truncate">{group.label}</span>
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-normal text-muted-foreground">
                      {group.languages.length}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2 pt-0">
                  <div className="flex flex-wrap gap-1">
                    {group.languages.map((item) => {
                      const isChosen = chosen.includes(item);
                      const grantedBy = grantedSources(item);
                      const coveredByHigher =
                        !!grantedBy?.length && !isChosen;
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

                      return (
                        <button
                          key={`${group.sourceCode}-${item}`}
                          type="button"
                          disabled={isDisabled && !isChosen}
                          title={tooltip}
                          onClick={() =>
                            handleToggle(item, isChosen, coveredByHigher)
                          }
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                            badgeColor,
                            coveredByHigher && "cursor-default",
                            !badgeColor &&
                              !isDisabled &&
                              "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50 hover:text-foreground",
                            !badgeColor &&
                              isDisabled &&
                              "cursor-not-allowed border-border/40 text-muted-foreground/40",
                          )}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ))}
    </div>
  );
}
