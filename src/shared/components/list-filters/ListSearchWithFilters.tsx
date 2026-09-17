import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { ListFilterSectionConfig, ListFilterValues } from "./list-filter.types";
import { ClearableSearchInput } from "./ClearableSearchInput";
import { ListFiltersDialog } from "./ListFiltersDialog";
import {
  buildDefaultFilterValues,
  countActiveListFilters,
  pickFilterValues,
} from "./list-filter.utils";

interface ListSearchWithFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sections: ListFilterSectionConfig[];
  filterValues: ListFilterValues;
  onFiltersApply: (values: ListFilterValues) => void;
  dialogTitle?: string;
  dialogDescription?: string;
  className?: string;
  inputClassName?: string;
  /** Narrow layouts (builder library): always horizontal, smaller controls. */
  compact?: boolean;
}

export function ListSearchWithFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  sections,
  filterValues,
  onFiltersApply,
  dialogTitle,
  dialogDescription,
  className,
  inputClassName,
  compact = false,
}: ListSearchWithFiltersProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const defaults = buildDefaultFilterValues(sections);
  const sectionIds = sections.map((section) => section.id);
  const dialogValues = pickFilterValues(filterValues, sectionIds);
  const activeFilterCount = countActiveListFilters(dialogValues, sections);
  const hasFilters = sections.some((section) => section.options.length > 0);

  function applyDialogFilters(values: ListFilterValues) {
    onFiltersApply(values);
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-row items-center gap-2",
          className,
        )}
      >
        <ClearableSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          compact={compact}
          inputClassName={inputClassName}
          className="min-w-0 flex-1"
        />

        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-9 shrink-0 gap-2 px-3",
              compact && "h-8 px-2.5 text-xs",
            )}
            onClick={() => setDialogOpen(true)}
          >
            <SlidersHorizontal
              className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")}
            />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="rounded-full px-1.5 min-w-5 justify-center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {dialogOpen && (
        <ListFiltersDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={dialogTitle}
          description={dialogDescription}
          sections={sections}
          applied={dialogValues}
          defaults={defaults}
          onApply={applyDialogFilters}
        />
      )}
    </>
  );
}
