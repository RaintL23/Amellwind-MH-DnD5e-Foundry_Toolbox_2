import { ComboBoxOption } from "@/components/combo-box/combo-box";
import { DataTableFacetedFiltersOptions } from "@/components/data-table/components/data-table-faceted-filter";

export default class EnumResponse {
  name: string;
  value: number;
  constructor(name: string, value: number) {
    this.name = name;
    this.value = value;
  }

  public toDataTableFacetedFiltersOptions() {
    return {
      value: this.value,
      name: this.name,
    } as DataTableFacetedFiltersOptions;
  }

  public toComboBoxOption() {
    return {
      value: this.value.toString(),
      label: this.name,
    } as ComboBoxOption;
  }
}
