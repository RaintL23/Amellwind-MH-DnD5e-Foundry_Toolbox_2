export interface ListFilterOption {
  value: string;
  label: string;
  /**
   * Extra identity codes that share this option's label.
   * Selecting the pill selects/deselects these together with `value`.
   */
  aliases?: string[];
}

export interface ListFilterOptionGroup {
  id: string;
  label: string;
  options: ListFilterOption[];
}

export type ListFilterSectionMode = "multi" | "single";

export interface ListFilterSectionConfig {
  id: string;
  title: string;
  mode: ListFilterSectionMode;
  options: ListFilterOption[];
  /** When set, options are rendered under labeled subgroups (e.g. source years). */
  groups?: ListFilterOptionGroup[];
  /**
   * Default multi values for Reset / initial apply.
   * When omitted, multi defaults to [] and single to "".
   */
  defaultValues?: string[];
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
