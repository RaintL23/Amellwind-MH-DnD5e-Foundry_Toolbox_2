import { memo, useCallback, useMemo, useState } from "react";
import { cn } from "@/shared/utils/cn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type {
  ListFilterOption,
  ListFilterOptionGroup,
} from "./list-filter.types";
import {
  isFilterOptionSelected,
  optionFilterValues,
  toggleMultiFilterOption,
} from "./list-filter.utils";

/** Max pills rendered per large flat section when the dialog search is empty. */
export const LARGE_FILTER_SECTION_PILL_CAP = 36;

export const ListFilterPill = memo(function ListFilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs font-medium",
        active
          ? "border-primary/50 bg-primary/20 text-primary"
          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
});

function filterOptionsByQuery(
  options: ListFilterOption[],
  normalizedQuery: string,
  sectionMatches: boolean,
): ListFilterOption[] {
  if (!normalizedQuery || sectionMatches) return options;
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(normalizedQuery) ||
      option.value.toLowerCase().includes(normalizedQuery) ||
      (option.aliases ?? []).some((alias) =>
        alias.toLowerCase().includes(normalizedQuery),
      ),
  );
}

function capOptions(
  matched: ListFilterOption[],
  selectedSet: Set<string>,
  normalizedQuery: string,
): { visibleOptions: ListFilterOption[]; hiddenCount: number } {
  if (normalizedQuery || matched.length <= LARGE_FILTER_SECTION_PILL_CAP) {
    return { visibleOptions: matched, hiddenCount: 0 };
  }

  const selectedOptions = matched.filter((option) =>
    isFilterOptionSelected(option, selectedSet),
  );
  const unselected = matched.filter(
    (option) => !isFilterOptionSelected(option, selectedSet),
  );
  const remainingSlots = Math.max(
    0,
    LARGE_FILTER_SECTION_PILL_CAP - selectedOptions.length,
  );

  return {
    visibleOptions: [
      ...selectedOptions,
      ...unselected.slice(0, remainingSlots),
    ],
    hiddenCount: matched.length - selectedOptions.length - remainingSlots,
  };
}

function OptionPillRow({
  options,
  selectedSet,
  onToggle,
}: {
  options: ListFilterOption[];
  selectedSet: Set<string>;
  onToggle: (option: ListFilterOption) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <ListFilterPill
          key={option.value}
          label={option.label}
          active={isFilterOptionSelected(option, selectedSet)}
          onClick={() => onToggle(option)}
        />
      ))}
    </div>
  );
}

const YearAccordionGroup = memo(function YearAccordionGroup({
  group,
  selectedSet,
  onToggle,
  forceOpen,
}: {
  group: { id: string; label: string; options: ListFilterOption[] };
  selectedSet: Set<string>;
  onToggle: (option: ListFilterOption) => void;
  forceOpen: boolean;
}) {
  const selectedInGroup = useMemo(
    () =>
      group.options.filter((option) =>
        isFilterOptionSelected(option, selectedSet),
      ),
    [group.options, selectedSet],
  );

  const openValue = forceOpen ? group.id : undefined;
  const [manualOpen, setManualOpen] = useState<string>("");

  const value = forceOpen ? openValue : manualOpen || undefined;

  return (
    <Accordion
      type="single"
      collapsible
      value={value}
      onValueChange={(next) => {
        if (!forceOpen) setManualOpen(next);
      }}
      className="w-full"
    >
      <AccordionItem value={group.id} className="border-border/60">
        <AccordionTrigger className="py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground hover:no-underline hover:text-foreground">
          <span className="flex items-center gap-2">
            {group.label}
            {selectedInGroup.length > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                {selectedInGroup.length}
              </span>
            )}
          </span>
        </AccordionTrigger>

        {!forceOpen && !manualOpen && selectedInGroup.length > 0 && (
          <div className="pb-2">
            <OptionPillRow
              options={selectedInGroup}
              selectedSet={selectedSet}
              onToggle={onToggle}
            />
          </div>
        )}

        <AccordionContent className="pb-2 pt-0">
          <OptionPillRow
            options={group.options}
            selectedSet={selectedSet}
            onToggle={onToggle}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
});

export const ListFilterSection = memo(function ListFilterSection({
  title,
  options,
  groups,
  selected,
  onChange,
  searchQuery,
  mode = "multi",
}: {
  title: string;
  options: ListFilterOption[];
  groups?: ListFilterOptionGroup[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchQuery: string;
  mode?: "multi" | "single";
}) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const sectionMatches =
    !normalizedQuery || title.toLowerCase().includes(normalizedQuery);
  const hasGroups = Boolean(groups && groups.length > 0);
  const forceOpenFromSearch = normalizedQuery.length > 0;

  const [sectionOpen, setSectionOpen] = useState("");

  const allOptions = useMemo(() => {
    if (groups && groups.length > 0) {
      return groups.flatMap((group) => group.options);
    }
    return options;
  }, [groups, options]);

  const matchedGroups = useMemo(() => {
    if (!groups || groups.length === 0) return [];

    const result: Array<{
      id: string;
      label: string;
      options: ListFilterOption[];
    }> = [];

    for (const group of groups) {
      const groupMatches =
        sectionMatches || group.label.toLowerCase().includes(normalizedQuery);
      const matched = filterOptionsByQuery(
        group.options,
        normalizedQuery,
        groupMatches || sectionMatches,
      );
      if (matched.length === 0) continue;
      result.push({ id: group.id, label: group.label, options: matched });
    }
    return result;
  }, [groups, normalizedQuery, sectionMatches]);

  const flatVisible = useMemo(() => {
    if (hasGroups) return null;
    const matched = filterOptionsByQuery(
      options,
      normalizedQuery,
      sectionMatches,
    );
    return capOptions(matched, selectedSet, normalizedQuery);
  }, [hasGroups, options, normalizedQuery, sectionMatches, selectedSet]);

  const selectedFlatOptions = useMemo(() => {
    return allOptions.filter((option) =>
      isFilterOptionSelected(option, selectedSet),
    );
  }, [allOptions, selectedSet]);

  const selectAll = useCallback(() => {
    const all = allOptions.flatMap((option) => optionFilterValues(option));
    onChange([...new Set(all)]);
  }, [allOptions, onChange]);

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const toggle = useCallback(
    (option: ListFilterOption) => {
      if (mode === "single") {
        onChange(
          isFilterOptionSelected(option, selectedSet)
            ? []
            : optionFilterValues(option),
        );
        return;
      }
      onChange(toggleMultiFilterOption(selected, option));
    },
    [mode, onChange, selected, selectedSet],
  );

  const hasContent =
    (flatVisible &&
      (flatVisible.visibleOptions.length > 0 || flatVisible.hiddenCount > 0)) ||
    matchedGroups.length > 0;

  if (!hasContent) return null;

  const useFlatAccordion =
    !hasGroups && (flatVisible?.visibleOptions.length ?? 0) > 16;
  const sectionExpanded =
    forceOpenFromSearch || sectionOpen === "section";

  const headerActions = (
    <div
      className="flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {mode === "multi" && (
        <>
          <button
            type="button"
            onClick={selectAll}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            All
          </button>
          <span className="text-muted-foreground/40">|</span>
        </>
      )}
      <button
        type="button"
        onClick={clearAll}
        className="text-[11px] text-muted-foreground hover:text-foreground"
      >
        Clear
      </button>
    </div>
  );

  if (hasGroups || useFlatAccordion) {
    const body = hasGroups ? (
      <div className="space-y-1">
        {matchedGroups.map((group) => (
          <YearAccordionGroup
            key={group.id}
            group={group}
            selectedSet={selectedSet}
            onToggle={toggle}
            forceOpen={forceOpenFromSearch}
          />
        ))}
      </div>
    ) : (
      <OptionPillRow
        options={flatVisible?.visibleOptions ?? []}
        selectedSet={selectedSet}
        onToggle={toggle}
      />
    );

    return (
      <section className="space-y-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0 [content-visibility:auto]">
        <Accordion
          type="single"
          collapsible
          value={forceOpenFromSearch ? "section" : sectionOpen || undefined}
          onValueChange={(next) => {
            if (!forceOpenFromSearch) setSectionOpen(next);
          }}
          className="w-full"
        >
          <AccordionItem value="section" className="border-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <AccordionTrigger className="flex-1 py-1.5 text-sm font-semibold text-foreground hover:no-underline">
                <span className="flex items-center gap-2">
                  {title}
                  {selectedFlatOptions.length > 0 && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                      {selectedFlatOptions.length}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              {headerActions}
            </div>

            {!sectionExpanded && selectedFlatOptions.length > 0 && (
              <div className="pb-2">
                <OptionPillRow
                  options={selectedFlatOptions}
                  selectedSet={selectedSet}
                  onToggle={toggle}
                />
              </div>
            )}

            <AccordionContent className="pb-0 pt-1">{body}</AccordionContent>
          </AccordionItem>
        </Accordion>
        {!hasGroups && (flatVisible?.hiddenCount ?? 0) > 0 && sectionExpanded && (
          <p className="text-[11px] text-muted-foreground">
            {flatVisible?.hiddenCount} more — use the search box above to narrow{" "}
            {title.toLowerCase()}.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-2.5 border-b border-border/60 pb-4 last:border-b-0 last:pb-0 [content-visibility:auto]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {headerActions}
      </div>
      <OptionPillRow
        options={flatVisible?.visibleOptions ?? []}
        selectedSet={selectedSet}
        onToggle={toggle}
      />
      {(flatVisible?.hiddenCount ?? 0) > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {flatVisible?.hiddenCount} more — use the search box above to narrow{" "}
          {title.toLowerCase()}.
        </p>
      )}
    </section>
  );
});
