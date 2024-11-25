import { PaginationState } from "node_modules/@tanstack/table-core/build/lib/features/RowPagination";
import { ComparisonOperators } from "./operators";

export interface QueryParamsList {
  filter?: FilterParams[];
  sort?: SortParams[];
  pagination?: PaginationState;
}

export interface FilterParams {
  propertyName: string;
  type?: string;
  value: string | string[];
  typeOfSearch?: ComparisonOperators;
}

export interface SortParams {
  propertyName: string;
  order?: "ASC" | "DESC";
}
