import type { DndBackground } from "@/shared/types";
import {
  BACKGROUNDS_JSON_URL,
  FLUFF_BACKGROUNDS_JSON_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import { attachFluffEntries } from "@/shared/utils/fluff.utils";
import {
  bySource,
  createEntityService,
} from "@/shared/services/create-entity-service";
import { mapDndBackground } from "../mappers/dnd-background.mapper";
import { dedupeDndBackgroundsByName } from "../utils/dnd-background-dedupe.utils";

type RawBackgroundEntry = Record<string, unknown>;

const service = createEntityService<RawBackgroundEntry, DndBackground>({
  loadRaw: async () => {
    const [data, fluffData] = await Promise.all([
      fetchFiveToolsJson<{ background?: RawBackgroundEntry[] }>(
        BACKGROUNDS_JSON_URL,
        "backgrounds.json",
      ),
      fetchFiveToolsJson<{ backgroundFluff?: RawBackgroundEntry[] }>(
        FLUFF_BACKGROUNDS_JSON_URL,
        "fluff-backgrounds.json",
      ),
    ]);

    const rawBackgrounds = Array.isArray(data.background) ? data.background : [];
    const fluffEntries = Array.isArray(fluffData.backgroundFluff)
      ? fluffData.backgroundFluff
      : [];

    const withFluff = attachFluffEntries(rawBackgrounds, fluffEntries);

    return resolveByNameSource(
      withFluff as (RawBackgroundEntry & { name: string; source: string })[],
    );
  },
  map: (raw) => mapDndBackground(raw),
  idOf: (bg) => bg.id,
  nameOf: (bg) => bg.name,
  dedupe: dedupeDndBackgroundsByName,
  sortVariants: bySource,
});

export const getAllDndBackgrounds = service.getAll;
export const getListDndBackgrounds = service.getList;
export const getDndBackgroundsByName = service.getByName;
export const getDndBackgroundById = service.getById;
export const clearDndBackgroundCache = service.clearCache;
