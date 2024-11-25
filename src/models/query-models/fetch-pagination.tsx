import { KyInstance } from "ky";
import { QueryParamsList } from "./query-params-list";
import { xPagination } from "./pagination";
import UrlBuilder from "./url-builder";
import { ApprovableEntity } from "../audit/approvable-entity";
import { fromObject } from "@/lib/utils";

//no cambiar a ts

const fetchPagination = async <TData extends object>(
  urlbase: string,
  server: KyInstance,
  cls: new (...args: any[]) => TData,
  filters?: QueryParamsList,
) => {
  let url = urlbase;
  if (filters != null) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const urlBuilder = new UrlBuilder(urlbase, filters);
    url = urlBuilder.build();
  }
  const response = await server.get(url);
  const responseData = await response.json<object[]>();
  const paginationHeader =
    response.headers.get("x-pagination") ??
    response.headers.get("x-Pagination");
  let paginationData: xPagination | null = null;
  if (paginationHeader) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    paginationData = JSON.parse(paginationHeader);
  }

  const data = [] as TData[];
  responseData.forEach((x) => {
    const element = fromObject(cls, x);
    if (element instanceof ApprovableEntity) {
      element.responseConvert();
    }

    data.push(element);
  });

  return { data, paginationData };
};

export default fetchPagination;
