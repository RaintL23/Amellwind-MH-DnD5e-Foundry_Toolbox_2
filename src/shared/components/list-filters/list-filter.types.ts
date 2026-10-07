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
  /** Nested subgroups (e.g. years under Official / Partnered). */
  groups?: ListFilterOptionGroup[];
}

export type ListFilterSectionMode = "multi" | "single";

/** One-click selection shortcut for a multi section (e.g. "2024+ Official"). */
export interface ListFilterPreset {
  id: string;
  label: string;
  values: string[];
}

export interface ListFilterSectionConfig {
  id: string;
  title: string;
  mode: ListFilterSectionMode;
  options: ListFilterOption[];
  /** When set, options are rendered under labeled subgroups (e.g. source years). */
  groups?: ListFilterOptionGroup[];
  /**
   * Default values for Reset / initial apply.
   * Multi: full selected list (omitted → []). Single: first entry used
   * (omitted → ""). Also excluded from the Filters badge count when current
   * selection still matches these defaults.
   */
  defaultValues?: string[];
  /** When true, the section accordion starts expanded. */
  defaultExpanded?: boolean;
  /** Quick selection shortcuts shown above grouped (kind → year) sections. */
  presets?: ListFilterPreset[];
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
