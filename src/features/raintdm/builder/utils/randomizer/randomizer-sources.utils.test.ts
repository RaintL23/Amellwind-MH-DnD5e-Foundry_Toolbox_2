import { describe, expect, it } from "vitest";
import type { SourceCatalogEntry } from "@/shared/services/source-catalog.service";
import type { Class, DndFeat, Spell } from "@/shared/types";
import {
  createRandomizerSourceFilter,
  filterRandomizerCatalogs,
} from "./randomizer-sources.utils";
import type { RandomizerCatalogs } from "./randomize-context.types";
import { dedupeClassesByName, pickRandomClass } from "./class-randomizer.utils";

function entry(
  code: string,
  year: number,
  kind: SourceCatalogEntry["kind"] = "official",
): [string, SourceCatalogEntry] {
  return [code, { code, name: code, kind, year }];
}

const catalog = new Map<string, SourceCatalogEntry>([
  entry("PHB", 2014),
  entry("XGE", 2017),
  entry("TCE", 2020),
  entry("XPHB", 2024),
  entry("EFA", 2025),
  entry("FRHoF", 2025),
  entry("UA2024Test", 2024, "ua"),
]);

const SOURCES = ["PHB", "XGE", "TCE", "XPHB", "EFA", "FRHoF", "UA2024Test"];

function emptyCatalogs(): RandomizerCatalogs {
  return {
    classes: [],
    dndRaces: [],
    dndBackgrounds: [],
    amellwindSpecies: [],
    amellwindBackgrounds: [],
    dndFeats: [],
    allSpells: [],
    allOptionalFeatures: [],
    allFeatCatalog: [],
    resolvedLanguagePool: [],
    dndWeapons: [],
    dndArmors: [],
  };
}

describe("randomizer 2024+ source gate", () => {
  const isAllowed = createRandomizerSourceFilter(catalog, null);

  it("accepts official books from 2024 on and rejects 2014-era, UA and unknown codes", () => {
    expect(SOURCES.filter((source) => isAllowed(source))).toEqual([
      "XPHB",
      "EFA",
      "FRHoF",
    ]);
    expect(isAllowed(undefined)).toBe(false);
    expect(isAllowed("HOMEBREW")).toBe(false);
  });

  it("keeps every known 2024+ book when the source catalog failed to load", () => {
    const offline = createRandomizerSourceFilter(new Map(), null);
    for (const code of ["XPHB", "XDMG", "EFA", "FRHoF", "ABH", "LFL"]) {
      expect(offline(code)).toBe(true);
    }
    expect(offline("PHB")).toBe(false);
    expect(offline("TCE")).toBe(false);
  });

  it("remembers 2024+ codes from the last loaded catalog for offline runs", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
    const withFutureBook = new Map(catalog);
    withFutureBook.set("NEW2027", { code: "NEW2027", name: "New", kind: "official", year: 2027 });
    createRandomizerSourceFilter(withFutureBook, storage);

    const offline = createRandomizerSourceFilter(new Map(), storage);
    expect(offline("NEW2027")).toBe(true);
    expect(offline("PHB")).toBe(false);
    expect(offline("UA2024Test")).toBe(false);
  });

  it("never returns 2014 content from any D&D catalog", () => {
    const filtered = filterRandomizerCatalogs(
      {
        ...emptyCatalogs(),
        classes: SOURCES.map((source) => ({ id: source, name: `Class ${source}`, source }) as Class),
        dndFeats: SOURCES.map((source) => ({ id: source, name: "Alert", source }) as DndFeat),
        allSpells: SOURCES.map((source) => ({ id: source, name: "Fireball", source }) as Spell),
      },
      isAllowed,
    );
    for (const list of [filtered.classes, filtered.dndFeats, filtered.allSpells]) {
      expect(list.map((item) => item.source)).toEqual(["XPHB", "EFA", "FRHoF"]);
    }
  });

  it("includes the 2024 Artificer (EFA) in the class bag", () => {
    const classes = filterRandomizerCatalogs(
      {
        ...emptyCatalogs(),
        classes: [
          { id: "artificer-tce", name: "Artificer", source: "TCE" },
          { id: "artificer-efa", name: "Artificer", source: "EFA" },
          { id: "fighter-phb", name: "Fighter", source: "PHB" },
          { id: "fighter-xphb", name: "Fighter", source: "XPHB" },
        ] as Class[],
      },
      isAllowed,
    ).classes;
    expect(dedupeClassesByName(classes).map((cls) => cls.id).sort()).toEqual([
      "artificer-efa",
      "fighter-xphb",
    ]);
    expect(pickRandomClass(classes, null)?.source).not.toBe("PHB");
  });
});
