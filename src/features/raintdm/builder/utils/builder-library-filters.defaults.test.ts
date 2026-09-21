import { describe, expect, it } from "vitest";
import {
  buildLibrarySourceFilterSections,
  buildLibrarySourceFilterSectionsFrom2024,
} from "./builder-library-filters";
import { buildSourcesFilterSection } from "@/shared/utils/compendium-source-filter.utils";
import type { SourceCatalogEntry } from "@/shared/services/source-catalog.service";
import { buildDefaultFilterValues } from "@/shared/components/list-filters/list-filter.utils";

function entry(
  code: string,
  name: string,
  kind: SourceCatalogEntry["kind"] = "official",
  year = 2024,
): [string, SourceCatalogEntry] {
  return [
    code,
    {
      code,
      name,
      kind,
      year,
    } as SourceCatalogEntry,
  ];
}

describe("buildLibrarySourceFilterSections defaults", () => {
  it("preselects official sources when given a Map.keys() iterator", () => {
    const catalog = new Map<string, SourceCatalogEntry>([
      entry("XPHB", "Player's Handbook (2024)"),
      entry("PHB", "Player's Handbook", "official", 2014),
      entry("UAFoo", "UA Something", "ua", 2023),
    ]);

    // Builder passes catalog.keys() — a single-pass iterator. Defaults must still work.
    const sections = buildLibrarySourceFilterSections(
      catalog.keys(),
      catalog,
      {},
    );
    expect(sections).toHaveLength(1);
    expect(sections[0].defaultValues?.length).toBeGreaterThan(0);
    expect(sections[0].defaultValues).toEqual(
      expect.arrayContaining(["XPHB", "PHB"]),
    );
    expect(sections[0].defaultValues).not.toEqual(
      expect.arrayContaining(["UAFoo"]),
    );

    const values = buildDefaultFilterValues(sections);
    expect(Array.isArray(values.src) && values.src.length).toBeGreaterThan(0);
  });

  it("buildSourcesFilterSection materializes iterators before computing defaults", () => {
    const catalog = new Map<string, SourceCatalogEntry>([
      entry("XPHB", "Player's Handbook (2024)"),
      entry("PHB", "Player's Handbook", "official", 2014),
    ]);
    const section = buildSourcesFilterSection(catalog.keys(), catalog, {});
    expect(section.options.length).toBe(2);
    expect(section.defaultValues?.length).toBe(2);
  });

  it("From2024 preselects official 2024+ and excludes UA, Partnered, and 2014", () => {
    const catalog = new Map<string, SourceCatalogEntry>([
      entry("XPHB", "Player's Handbook (2024)"),
      entry("FRHoF", "Forgotten Realms: Heroes of Faerûn"),
      entry("PHB", "Player's Handbook", "official", 2014),
      entry("UAFoo", "UA Something", "ua", 2024),
      entry("PartBar", "Partnered Book", "partnered", 2024),
    ]);

    const sections = buildLibrarySourceFilterSectionsFrom2024(
      catalog.keys(),
      catalog,
      {},
    );
    expect(sections).toHaveLength(1);
    expect(sections[0].defaultValues).toEqual(
      expect.arrayContaining(["XPHB", "FRHoF"]),
    );
    expect(sections[0].defaultValues).not.toEqual(
      expect.arrayContaining(["PHB", "UAFoo", "PartBar"]),
    );
    // Options still list UA / Partnered so Filters can opt them in.
    expect(sections[0].options.map((o) => o.value)).toEqual(
      expect.arrayContaining(["UAFoo", "PartBar", "PHB"]),
    );
  });
});
