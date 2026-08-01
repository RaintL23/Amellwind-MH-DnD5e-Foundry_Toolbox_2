import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { ListFilterSectionConfig, ListFilterValues } from "./list-filter.types";
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
          compact ? "flex flex-row gap-2" : "flex flex-col sm:flex-row gap-2",
          className,
        )}
      >
        <div className="relative flex-1 min-w-0">
          <Search
            className={cn(
              "absolute left-2.5 text-muted-foreground pointer-events-none",
              compact
                ? "top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                : "top-2.5 h-4 w-4",
            )}
          />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "pl-8",
              compact && "h-8 text-xs",
              inputClassName,
            )}
          />
        </div>

        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            className={cn(
              "shrink-0 gap-2",
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
