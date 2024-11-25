/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FilterParams } from "./query-params-list";

export const urlParamsContructorQuery = (
  search:
    | string
    | Record<string, string>
    | string[][]
    | URLSearchParams
    | undefined,
) => {
  const urlParams = new URLSearchParams(search);
  const filters: FilterParams[] = [];
  urlParams.forEach((value, key) => {
    filters.push({ propertyName: key, value: value });
  });
  return filters;
};

export const urlParamsContructorDataTable = (
  search:
    | string
    | Record<string, string>
    | string[][]
    | URLSearchParams
    | undefined,
) => {
  const urlParams = new URLSearchParams(search);
  const filters: { id: string; value: string }[] = [];
  urlParams.forEach((value, key) => {
    filters.push({ id: key, value: value });
  });
  return filters;
};
