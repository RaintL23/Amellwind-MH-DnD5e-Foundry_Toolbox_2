import { beforeEach, describe, expect, it, vi } from "vitest";

const getById = vi.fn();
const getByName = vi.fn();
const loadSourceOnDemand = vi.fn();
const getLoadedBestiarySources = vi.fn(() => [] as string[]);

vi.mock("@/shared/services/create-on-demand-entity-service", () => ({
  createOnDemandEntityService: () => ({
    getAll: vi.fn(),
    getList: vi.fn(),
    getById,
    getByName,
    preloadSources: vi.fn(),
    loadSourceOnDemand,
    getSourceCatalog: vi.fn(),
    clearCache: vi.fn(),
  }),
}));

vi.mock("../utils/bestiary-list-builder.utils", () => ({
  clearBestiaryBuilderCache: vi.fn(),
  getAllRawMonsters: vi.fn(() => []),
  getAvailableSources: vi.fn(() => []),
  getBestiaryIndex: vi.fn(async () => ({})),
  getLoadedBestiarySources: () => getLoadedBestiarySources(),
  loadBestiarySource: vi.fn(),
  loadBestiarySources: vi.fn(),
}));

vi.mock("@/shared/data/fivetools-fetch", () => ({
  clearFiveToolsJsonCache: vi.fn(),
}));

vi.mock("./fluff-lair.service", () => ({
  clearFluffLairCache: vi.fn(),
  getLairFromFluff: vi.fn(),
}));

vi.mock("./legendary-group.service", () => ({
  clearLegendaryCache: vi.fn(),
  getLegendaryGroupForMonster: vi.fn(),
}));

vi.mock("../mappers/bestiary.mapper", () => ({
  mapBestiaryCreature: vi.fn(),
}));

vi.mock("../utils/bestiary-dedupe.utils", () => ({
  dedupeCreaturesByName: vi.fn((c: unknown) => c),
}));

vi.mock("../utils/bestiary-variant.utils", () => ({
  sortCreatureVariants: vi.fn((c: unknown) => c),
}));

describe("getBestiaryCreatureById on-demand source", () => {
  beforeEach(() => {
    getById.mockReset();
    getByName.mockReset();
    loadSourceOnDemand.mockReset();
    getLoadedBestiarySources.mockReset();
    getLoadedBestiarySources.mockReturnValue([]);
  });

  it("loads the route source when it is not already cached", async () => {
    const creature = {
      id: "Drake%20Companion_FTD",
      name: "Drake Companion",
      source: "FTD",
    };

    getById
      .mockResolvedValueOnce(undefined) // direct
      .mockResolvedValueOnce(undefined) // canonical before load
      .mockResolvedValueOnce(undefined) // direct after load
      .mockResolvedValueOnce(creature); // canonical after load
    loadSourceOnDemand.mockResolvedValue([creature]);

    const { getBestiaryCreatureById } = await import("./bestiary.service");
    const found = await getBestiaryCreatureById("Drake%20Companion_FTD");

    expect(loadSourceOnDemand).toHaveBeenCalledWith("FTD");
    expect(found).toEqual(creature);
  });
});
