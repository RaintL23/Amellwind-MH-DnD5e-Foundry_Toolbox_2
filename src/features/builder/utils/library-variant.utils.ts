import type {
  RpgbotRating,
  RpgbotRatingLookupEntry,
} from "@/features/builder/data/rpgbot-ratings.types";
import type { RpgbotLookupFn } from "@/features/builder/data/rpgbot-ratings.utils";
import {
  compareRpgbotScore,
  sortByRpgbotRating,
} from "@/features/builder/data/rpgbot-ratings.utils";

export interface SourceVariant {
  id: string;
  source: string;
  page?: number;
}

export interface LibraryListOption {
  id: string;
  name: string;
  source?: string;
  variantSources?: string[];
  searchText?: string;
  rpgbot?: RpgbotRatingLookupEntry | null;
}

export function formatVariantSourcesLabel(sources: string[]): {
  label: string;
  title?: string;
} {
  if (sources.length <= 2) {
    return {
      label: sources.join(", "),
      title: sources.length > 1 ? sources.join(", ") : undefined,
    };
  }
  return {
    label: `${sources[0]} +${sources.length - 1}`,
    title: sources.join(", "),
  };
}

export function entityToLibraryOption(entity: {
  id: string;
  name: string;
  source?: string;
  variantSources?: string[];
  searchText?: string;
}): LibraryListOption {
  return {
    id: entity.id,
    name: entity.name,
    source: entity.source,
    variantSources: entity.variantSources,
    searchText: entity.searchText,
  };
}

export function filterLibraryOptions(
  options: LibraryListOption[],
  query: string,
): LibraryListOption[] {
  const q = query.toLowerCase().trim();
  if (!q) return options;
  return options.filter((o) => {
    if (o.searchText?.includes(q)) return true;
    if (o.variantSources?.some((s) => s.toLowerCase().includes(q))) return true;
    if (o.source?.toLowerCase().includes(q)) return true;
    return o.name.toLowerCase().includes(q);
  });
}

export function dedupeByNameToListOptions<
  T extends { id: string; name: string; source: string },
>(items: T[], buildSearchText?: (group: T[]) => string): LibraryListOption[] {
  const byName = new Map<string, T[]>();
  for (const item of items) {
    const group = byName.get(item.name) ?? [];
    group.push(item);
    byName.set(item.name, group);
  }

  return Array.from(byName.values())
    .map((group) => {
      const canonical = [...group].sort((a, b) =>
        a.source.localeCompare(b.source),
      )[0];
      const variantSources = [...new Set(group.map((i) => i.source))].sort(
        (a, b) => a.localeCompare(b),
      );
      return {
        id: canonical.id,
        name: canonical.name,
        variantSources: variantSources.length > 1 ? variantSources : undefined,
        searchText:
          buildSearchText?.(group) ??
          group
            .flatMap((i) => [i.name, i.source])
            .join(" ")
            .toLowerCase(),
      };
    })
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
}

export function isLibraryOptionSelected(
  option: LibraryListOption,
  selectedId: string | null,
  selectedName: string | null,
): boolean {
  if (selectedName) return option.name === selectedName;
  return selectedId === option.id;
}

export function enrichLibraryOptionsWithRpgbot(
  options: LibraryListOption[],
  lookup: RpgbotLookupFn | null,
): LibraryListOption[] {
  if (!lookup) return options;
  return options.map((option) => ({
    ...option,
    rpgbot: option.name
      ? lookup(option.name, option.source, option.variantSources)
      : null,
  }));
}

export function sortLibraryOptionsByRpgbot(
  options: LibraryListOption[],
): LibraryListOption[] {
  return sortByRpgbotRating(
    options,
    (option) => option.rpgbot,
    (option) => option.name,
  );
}

export function prepareLibraryListOptions(
  options: LibraryListOption[],
  query: string,
  lookup: RpgbotLookupFn | null,
  ready = true,
): LibraryListOption[] {
  const filtered = filterLibraryOptions(options, query);
  if (!ready || !lookup) return sortLibraryOptionsByRpgbot(filtered);
  const enriched = enrichLibraryOptionsWithRpgbot(filtered, lookup);
  return sortLibraryOptionsByRpgbot(enriched);
}

export const RPGBOT_ROW_ACCENT: Record<RpgbotRating, string> = {
  blue: "border-l-sky-400",
  green: "border-l-emerald-400",
  orange: "border-l-amber-400",
  red: "border-l-rose-400",
};

export { compareRpgbotScore };
