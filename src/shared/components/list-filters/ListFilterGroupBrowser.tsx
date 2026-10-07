/**
 * Two-pane browser for kind → year grouped filter sections (Sources).
 * Kind tabs on top, a year rail with tri-state checkboxes on the left and the
 * active year's pills on the right; collapses to a year chip row on mobile.
 * While the dialog search is active it shows every match flat, labeled by group.
 */
import { memo, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/shared/utils/cn";
import type {
  ListFilterOption,
  ListFilterOptionGroup,
  ListFilterPreset,
} from "./list-filter.types";
import {
  countSelectedOptions,
  filterGroupSelectionState,
  isSameFilterSelection,
  setFilterOptionsSelected,
} from "./list-filter.utils";
import { CountBadge, OptionPillRow } from "./ListFilterPill";

/** Kinds without year subgroups behave as a single "All" year. */
function kindYears(kind: ListFilterOptionGroup): ListFilterOptionGroup[] {
  if (kind.groups && kind.groups.length > 0) return kind.groups;
  return [{ id: `${kind.id}-all`, label: "All", options: kind.options }];
}

function pickInitial<T extends { options: ListFilterOption[] }>(
  items: T[],
  selectedSet: Set<string>,
): T | undefined {
  return (
    items.find((item) => countSelectedOptions(item.options, selectedSet) > 0) ??
    items[0]
  );
}

const YearRailItem = memo(function YearRailItem({
  year,
  active,
  selectedSet,
  onActivate,
  onToggleAll,
}: {
  year: ListFilterOptionGroup;
  active: boolean;
  selectedSet: Set<string>;
  onActivate: () => void;
  onToggleAll: (on: boolean) => void;
}) {
  const count = countSelectedOptions(year.options, selectedSet);
  const state = filterGroupSelectionState(year.options, selectedSet);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-md border px-2 py-1.5",
        active
          ? "border-primary/50 bg-primary/10"
          : "border-transparent hover:bg-muted/40",
      )}
    >
      <Checkbox
        checked={
          state === "all" ? true : state === "some" ? "indeterminate" : false
        }
        onCheckedChange={() => onToggleAll(state !== "all")}
        aria-label={`Select every option in ${year.label}`}
      />
      <button
        type="button"
        onClick={onActivate}
        aria-pressed={active}
        className={cn(
          "flex flex-1 items-center justify-between gap-3 text-left text-xs",
          active ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        <span className="whitespace-nowrap">{year.label}</span>
        <span className="tabular-nums text-[10px] font-normal text-muted-foreground">
          {count}/{year.options.length}
        </span>
      </button>
    </div>
  );
});

export const ListFilterGroupBrowser = memo(function ListFilterGroupBrowser({
  groups,
  selected,
  selectedSet,
  onChange,
  onToggle,
  presets,
  searchActive,
}: {
  /** Kind groups (already narrowed by the dialog search). */
  groups: ListFilterOptionGroup[];
  selected: string[];
  selectedSet: Set<string>;
  onChange: (next: string[]) => void;
  onToggle: (option: ListFilterOption) => void;
  presets?: ListFilterPreset[];
  searchActive: boolean;
}) {
  // Initial kind / year follow the selection once; later toggles never move focus.
  const initialYearFor = (kind: ListFilterOptionGroup) =>
    pickInitial(kindYears(kind), selectedSet)?.id;
  const [kindId, setKindId] = useState(
    () => pickInitial(groups, selectedSet)?.id ?? "",
  );
  const [yearByKind, setYearByKind] = useState<Record<string, string>>(() => {
    const kind = groups.find((g) => g.id === kindId) ?? groups[0];
    const yearId = kind ? initialYearFor(kind) : undefined;
    return kind && yearId ? { [kind.id]: yearId } : {};
  });

  const activeKind = groups.find((kind) => kind.id === kindId) ?? groups[0];
  const years = useMemo(
    () => (activeKind ? kindYears(activeKind) : []),
    [activeKind],
  );
  const activeYear =
    years.find((year) => year.id === yearByKind[activeKind?.id ?? ""]) ??
    years[0];

  const selectKind = (nextId: string) => {
    setKindId(nextId);
    const kind = groups.find((g) => g.id === nextId);
    if (!kind || yearByKind[nextId]) return;
    const yearId = initialYearFor(kind);
    if (yearId) setYearByKind((prev) => ({ ...prev, [nextId]: yearId }));
  };

  const toggleOptions = (options: ListFilterOption[], on: boolean) =>
    onChange(setFilterOptionsSelected(selected, options, on));

  const presetRow =
    presets && presets.length > 0 ? (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Presets
        </span>
        {presets.map((preset) => {
          const active = isSameFilterSelection(selected, preset.values);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.values)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                active
                  ? "border-primary/60 bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    ) : null;

  if (searchActive) {
    return (
      <div className="space-y-3">
        {groups.flatMap((kind) =>
          kindYears(kind).map((year) => (
            <div key={year.id} className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {kind.label} · {year.label}
              </p>
              <OptionPillRow
                options={year.options}
                selectedSet={selectedSet}
                onToggle={onToggle}
              />
            </div>
          )),
        )}
      </div>
    );
  }

  if (!activeKind) return presetRow;

  return (
    <div className="space-y-3">
      {presetRow}

      {groups.length > 1 && (
        <Tabs value={activeKind.id} onValueChange={selectKind}>
          <TabsList className="h-auto flex-wrap justify-start">
            {groups.map((kind) => (
              <TabsTrigger key={kind.id} value={kind.id} className="text-xs">
                {kind.label}
                <CountBadge
                  count={countSelectedOptions(kind.options, selectedSet)}
                />
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
        <div className="flex gap-1 overflow-x-auto overscroll-contain pb-1 sm:max-h-[45vh] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden sm:pb-0 sm:pr-1">
          {years.map((year) => (
            <YearRailItem
              key={year.id}
              year={year}
              active={year.id === activeYear?.id}
              selectedSet={selectedSet}
              onActivate={() =>
                setYearByKind((prev) => ({
                  ...prev,
                  [activeKind.id]: year.id,
                }))
              }
              onToggleAll={(on) => toggleOptions(year.options, on)}
            />
          ))}
        </div>

        {activeYear && (
          <div className="min-w-0 space-y-2.5 rounded-md border border-border/60 bg-muted/10 p-3 sm:max-h-[45vh] sm:overflow-y-auto sm:overscroll-contain">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
                {activeKind.label} · {activeYear.label}
                <CountBadge
                  count={countSelectedOptions(activeYear.options, selectedSet)}
                />
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleOptions(activeYear.options, true)}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Select year
                </button>
                <span className="text-muted-foreground/40">|</span>
                <button
                  type="button"
                  onClick={() => toggleOptions(activeYear.options, false)}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Clear year
                </button>
              </div>
            </div>
            <OptionPillRow
              options={activeYear.options}
              selectedSet={selectedSet}
              onToggle={onToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
});
