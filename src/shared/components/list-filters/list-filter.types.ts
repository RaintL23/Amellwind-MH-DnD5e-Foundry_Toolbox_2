export interface ListFilterOption {
  value: string;
  label: string;
}

export type ListFilterSectionMode = "multi" | "single";

export interface ListFilterSectionConfig {
  id: string;
  title: string;
  mode: ListFilterSectionMode;
  options: ListFilterOption[];
}

/** Dialog filter values: multi sections use string[], single sections use string ("" = none). */
export type ListFilterValues = Record<string, string | string[]>;

export interface ListFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  sections: ListFilterSectionConfig[];
  applied: ListFilterValues;
  defaults: ListFilterValues;
  onApply: (values: ListFilterValues) => void;
}
