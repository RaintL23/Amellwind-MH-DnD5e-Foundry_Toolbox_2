import { LOCAL_5ETOOLS_BASE } from "@/shared/constants/api.constants";

const jsonCache = new Map<string, unknown>();

function isLocalFiveToolsData(): boolean {
  return import.meta.env.VITE_5ETOOLS_DATA === "local";
}

/** Production default: remote GitHub mirror. Local public/5etools only when VITE_5ETOOLS_DATA=local. */
export function resolveFiveToolsUrl(
  remoteUrl: string,
  localFileName: string,
): string {
  if (isLocalFiveToolsData()) {
    return `${LOCAL_5ETOOLS_BASE}/${localFileName}`;
  }
  return remoteUrl;
}

export async function fetchFiveToolsJson<T>(
  remoteUrl: string,
  localFileName: string,
): Promise<T> {
  const url = resolveFiveToolsUrl(remoteUrl, localFileName);
  const cached = jsonCache.get(url);
  if (cached !== undefined) return cached as T;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const data = (await res.json()) as T;
  jsonCache.set(url, data);
  return data;
}

export function clearFiveToolsJsonCache(): void {
  jsonCache.clear();
}
