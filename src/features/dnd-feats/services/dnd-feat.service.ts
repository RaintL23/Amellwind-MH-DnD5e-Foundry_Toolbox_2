import type { DndBackgroundFeatRef, DndFeat } from "@/shared/types";
import {
  FEATS_JSON_URL,
  FLUFF_FEATS_JSON_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import { attachFluffEntries } from "@/shared/utils/fluff.utils";
import {
  bySource,
  createEntityService,
} from "@/shared/services/create-entity-service";
import {
  getSourceCatalog,
  isOnDemandBrewSourceKind,
} from "@/shared/services/source-catalog.service";
import {
  collectUaPropEntries,
  loadUaBrewDocuments,
} from "@/shared/services/ua-brew.service";
import { mapDndFeat } from "../mappers/dnd-feat.mapper";
import { dedupeDndFeatsByName } from "../utils/dnd-feat-dedupe.utils";

type RawFeatEntry = Record<string, unknown>;

const loadedUaSources = new Set<string>();

const service = createEntityService<RawFeatEntry, DndFeat>({
  loadRaw: async () => {
    const [data, fluffData] = await Promise.all([
      fetchFiveToolsJson<{ feat?: RawFeatEntry[] }>(FEATS_JSON_URL, "feats.json"),
      fetchFiveToolsJson<{ featFluff?: RawFeatEntry[] }>(
        FLUFF_FEATS_JSON_URL,
        "fluff-feats.json",
      ),
    ]);

    const rawFeats = Array.isArray(data.feat) ? data.feat : [];
    const fluffEntries = Array.isArray(fluffData.featFluff)
      ? fluffData.featFluff
      : [];

    let withFluff = attachFluffEntries(rawFeats, fluffEntries);

    if (loadedUaSources.size > 0) {
      const docs = await loadUaBrewDocuments(loadedUaSources);
      const uaFeats = collectUaPropEntries<RawFeatEntry>(docs, "feat");
      withFluff = [...withFluff, ...uaFeats];
    }

    return resolveByNameSource(
      withFluff as (RawFeatEntry & { name: string; source: string })[],
    );
  },
  map: (raw) => mapDndFeat(raw),
  idOf: (feat) => feat.id,
  nameOf: (feat) => feat.name,
  dedupe: dedupeDndFeatsByName,
  sortVariants: bySource,
});

export const getAllDndFeats = service.getAll;
export const getListDndFeats = service.getList;
export const getDndFeatsByName = service.getByName;
export const getDndFeatById = service.getById;
export const clearDndFeatCache = service.clearCache;

export async function ensureDndFeatUaSourcesLoaded(
  sourceCodes: string[],
): Promise<boolean> {
  const catalog = await getSourceCatalog();
  const needed = sourceCodes.filter((code) => {
    const kind = catalog.get(code)?.kind;
    return isOnDemandBrewSourceKind(kind) && !loadedUaSources.has(code);
  });
  if (needed.length === 0) return false;
  for (const code of needed) loadedUaSources.add(code);
  service.clearCache();
  await service.getAll();
  return true;
}

export async function getDndFeatFilterSourceCodes(): Promise<string[]> {
  const [catalog, list] = await Promise.all([
    getSourceCatalog(),
    getListDndFeats(),
  ]);
  const codes = new Set(
    list.flatMap((f) => f.variantSources ?? [f.source]),
  );
  for (const [code, entry] of catalog) {
    if (
      entry.uaPath &&
      (entry.uaPath.startsWith("feat/") ||
        entry.uaPath.startsWith("collection/"))
    ) {
      codes.add(code);
    }
  }
  return [...codes];
}

export async function resolveDndFeatForRef(
  ref: DndBackgroundFeatRef,
): Promise<DndFeat | undefined> {
  const exact = await service.getById(ref.id);
  if (exact) return exact;

  if (ref.qualifier) {
    const variantName = `${ref.name}; ${ref.qualifier}`;
    const variantExact = await service.getById(`${variantName}::${ref.source}`);
    if (variantExact) return variantExact;

    const variantGroup = await service.getByName(variantName);
    if (variantGroup.length > 0) {
      return (
        variantGroup.find((f) => f.source === ref.source) ??
        variantGroup.find((f) => f.source === "XPHB") ??
        variantGroup[0]
      );
    }
  }

  const variants = await service.getByName(ref.name);
  if (variants.length === 0) return undefined;

  return (
    variants.find((f) => f.source === ref.source) ??
    variants.find((f) => f.source === "XPHB") ??
    variants[0]
  );
}
