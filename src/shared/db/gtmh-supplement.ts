import { GTMH_PATREON_SUPPLEMENT_URL } from "@/shared/constants/api.constants";

export interface GtmhPatreonOverlay {
  item: unknown[];
  optionalfeature: unknown[];
  race: unknown[];
  subrace: unknown[];
  background: unknown[];
  feat: unknown[];
  variantrule: unknown[];
  classFeature: unknown[];
  class: unknown[];
  object: unknown[];
  bookData: Record<string, unknown>;
}

const EMPTY_OVERLAY: GtmhPatreonOverlay = {
  item: [],
  optionalfeature: [],
  race: [],
  subrace: [],
  background: [],
  feat: [],
  variantrule: [],
  classFeature: [],
  class: [],
  object: [],
  bookData: {},
};

function asOverlay(json: unknown): GtmhPatreonOverlay {
  if (typeof json !== "object" || json === null) return EMPTY_OVERLAY;
  const raw = json as Record<string, unknown>;

  return {
    item: Array.isArray(raw.item) ? raw.item : [],
    optionalfeature: Array.isArray(raw.optionalfeature) ? raw.optionalfeature : [],
    race: Array.isArray(raw.race) ? raw.race : [],
    subrace: Array.isArray(raw.subrace) ? raw.subrace : [],
    background: Array.isArray(raw.background) ? raw.background : [],
    feat: Array.isArray(raw.feat) ? raw.feat : [],
    variantrule: Array.isArray(raw.variantrule) ? raw.variantrule : [],
    classFeature: Array.isArray(raw.classFeature) ? raw.classFeature : [],
    class: Array.isArray(raw.class) ? raw.class : [],
    object: Array.isArray(raw.object) ? raw.object : [],
    bookData:
      raw.bookData && typeof raw.bookData === "object"
        ? (raw.bookData as Record<string, unknown>)
        : {},
  };
}

let overlayCache: GtmhPatreonOverlay | null = null;
let overlayPromise: Promise<GtmhPatreonOverlay> | null = null;

async function fetchPatreonOverlay(): Promise<GtmhPatreonOverlay> {
  try {
    const response = await fetch(GTMH_PATREON_SUPPLEMENT_URL);
    if (!response.ok) return EMPTY_OVERLAY;
    return asOverlay(await response.json());
  } catch {
    return EMPTY_OVERLAY;
  }
}

export async function loadGtmhPatreonOverlay(): Promise<GtmhPatreonOverlay> {
  if (overlayCache) return overlayCache;
  if (!overlayPromise) {
    overlayPromise = fetchPatreonOverlay()
      .then((overlay) => {
        overlayCache = overlay;
        return overlay;
      })
      .finally(() => {
        overlayPromise = null;
      });
  }
  return overlayPromise;
}

export function clearGtmhPatreonSupplementCache(): void {
  overlayCache = null;
  overlayPromise = null;
}
