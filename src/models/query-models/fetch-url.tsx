import { KyInstance } from "ky";
import { QueryParamsList } from "./query-params-list";
import UrlBuilder from "./url-builder";

const fetchUrl = async (
  urlbase: string,
  server: KyInstance,
  filters?: QueryParamsList,
) => {
  let url = urlbase;
  if (filters != null) {
    const urlBuilder = new UrlBuilder(urlbase, filters);
    url = urlBuilder.build();
  }
  console.log(url);
  return await server.get(url);
};

export default fetchUrl;
