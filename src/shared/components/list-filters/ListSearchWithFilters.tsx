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
          "flex flex-col sm:flex-row gap-2",
          className,
        )}
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn("pl-8", inputClassName)}
          />
        </div>

        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            className="shrink-0 gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
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
