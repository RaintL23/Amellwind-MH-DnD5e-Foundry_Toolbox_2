import type {
  AbilityKey,
  DndFeat,
  FeatPrerequisiteKind,
} from "@/shared/types";
import type {
  ListFilterSectionConfig,
  ListFilterValues,
} from "@/shared/components/list-filters";
import { ABILITY_ABBREVIATIONS, ABILITY_KEYS } from "@/shared/constants/dnd";
import { DND_FEAT_CATEGORY_LABELS } from "@/shared/types/dnd-feat.types";

export const DND_FEAT_LIST_MULTI_KEYS = [
  "kind",
  "cat",
  "abi",
  "prereq",
  "plvl",
  "src",
] as const;

export type DndFeatListMultiKey = (typeof DND_FEAT_LIST_MULTI_KEYS)[number];

export const DND_FEAT_CATEGORY_NONE = "none";

const PREREQUISITE_KIND_LABELS: Record<FeatPrerequisiteKind | "none", string> =
  {
    level: "Level",
    ability: "Ability Score",
    race: "Race",
    feat: "Feat",
    feature: "Class Feature",
    proficiency: "Proficiency",
    spellcasting: "Spellcasting",
    campaign: "Campaign",
    background: "Background",
    other: "Other",
    none: "No Prerequisites",
  };

const PREREQUISITE_KIND_ORDER: Array<FeatPrerequisiteKind | "none"> = [
  "none",
  "level",
  "ability",
  "race",
  "feat",
  "feature",
  "proficiency",
  "spellcasting",
  "background",
  "campaign",
  "other",
];

const CATEGORY_ORDER = ["O", "G", "EB", "D", "FS", "FS:R", "FS:P", DND_FEAT_CATEGORY_NONE];

export function isFightingStyleFeat(feat: Pick<DndFeat, "category">): boolean {
  const cat = feat.category?.toUpperCase() ?? "";
  return cat === "FS" || cat.startsWith("FS:");
}

export function featCategoryFilterValue(
  feat: Pick<DndFeat, "category">,
): string {
  return feat.category?.trim() || DND_FEAT_CATEGORY_NONE;
}

export function featAbilityFilterKeys(
  feat: Pick<DndFeat, "abilityIncreases">,
): AbilityKey[] {
  const keys = new Set<AbilityKey>();
  for (const increase of feat.abilityIncreases) {
    for (const ability of increase.abilities) keys.add(ability);
  }
  return ABILITY_KEYS.filter((key) => keys.has(key));
}

function asStringArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}

function matchesAny(selected: string[], values: string[]): boolean {
  if (selected.length === 0) return true;
  return values.some((v) => selected.includes(v));
}

export interface DndFeatPresentFacets {
  categories: Set<string>;
  abilities: Set<AbilityKey>;
  prereqKinds: Set<FeatPrerequisiteKind | "none">;
  prereqLevels: Set<number>;
}

export function collectDndFeatPresentFacets(
  feats: DndFeat[],
): DndFeatPresentFacets {
  const categories = new Set<string>();
  const abilities = new Set<AbilityKey>();
  const prereqKinds = new Set<FeatPrerequisiteKind | "none">();
  const prereqLevels = new Set<number>();

  for (const feat of feats) {
    categories.add(featCategoryFilterValue(feat));
    for (const ability of featAbilityFilterKeys(feat)) abilities.add(ability);
    if (feat.prerequisiteKinds.length === 0) {
      prereqKinds.add("none");
    } else {
      for (const kind of feat.prerequisiteKinds) prereqKinds.add(kind);
    }
    for (const level of feat.prerequisiteLevels) prereqLevels.add(level);
  }

  return { categories, abilities, prereqKinds, prereqLevels };
}

function optionsFromPresent(
  present: Iterable<string>,
  labels: Record<string, string>,
  preferredOrder: readonly string[],
): Array<{ value: string; label: string }> {
  const set = new Set(present);
  const ordered = preferredOrder.filter((v) => set.has(v));
  const rest = [...set]
    .filter((v) => !preferredOrder.includes(v))
    .sort((a, b) =>
      (labels[a] ?? a).localeCompare(labels[b] ?? b, undefined, {
        sensitivity: "base",
      }),
    );
  return [...ordered, ...rest].map((value) => ({
    value,
    label: labels[value] ?? value,
  }));
}

export function buildDndFeatFilterSections(
  present: DndFeatPresentFacets,
  sourceSection: ListFilterSectionConfig,
): ListFilterSectionConfig[] {
  const categoryLabels: Record<string, string> = {
    ...DND_FEAT_CATEGORY_LABELS,
    [DND_FEAT_CATEGORY_NONE]: "Uncategorized",
  };

  const abilityLabels = Object.fromEntries(
    ABILITY_KEYS.map((key) => [key, ABILITY_ABBREVIATIONS[key]]),
  ) as Record<string, string>;

  const sections: ListFilterSectionConfig[] = [
    {
      id: "kind",
      title: "Kind",
      mode: "multi",
      options: [
        { value: "feat", label: "Feats" },
        { value: "fighting-style", label: "Fighting Styles" },
      ],
      defaultExpanded: true,
    },
    {
      id: "cat",
      title: "Category",
      mode: "multi",
      options: optionsFromPresent(
        present.categories,
        categoryLabels,
        CATEGORY_ORDER,
      ),
    },
    {
      id: "abi",
      title: "Ability Increase",
      mode: "multi",
      options: optionsFromPresent(
        present.abilities,
        abilityLabels,
        ABILITY_KEYS,
      ),
    },
    {
      id: "prereq",
      title: "Prerequisite",
      mode: "multi",
      options: optionsFromPresent(
        present.prereqKinds,
        PREREQUISITE_KIND_LABELS,
        PREREQUISITE_KIND_ORDER,
      ),
    },
  ];

  if (present.prereqLevels.size > 0) {
    sections.push({
      id: "plvl",
      title: "Prerequisite Level",
      mode: "multi",
      options: [...present.prereqLevels]
        .sort((a, b) => a - b)
        .map((level) => ({
          value: String(level),
          label: `Level ${level}+`,
        })),
      defaultExpanded: true,
    });
  }

  sections.push(
    {
      id: "repeat",
      title: "Repeatable",
      mode: "single",
      options: [
        { value: "yes", label: "Repeatable" },
        { value: "no", label: "Not Repeatable" },
      ],
    },
    sourceSection,
  );

  return sections;
}

export function dndFeatMatchesFacetFilters(
  feat: DndFeat,
  values: ListFilterValues,
  opts?: {
    sourceMatcher?: (feat: DndFeat, selected: string[]) => boolean;
  },
): boolean {
  const kinds = asStringArray(values.kind);
  if (kinds.length > 0) {
    const isFs = isFightingStyleFeat(feat);
    const matchesKind =
      (isFs && kinds.includes("fighting-style")) ||
      (!isFs && kinds.includes("feat"));
    if (!matchesKind) return false;
  }

  const categories = asStringArray(values.cat);
  if (
    categories.length > 0 &&
    !categories.includes(featCategoryFilterValue(feat))
  ) {
    return false;
  }

  const abilities = asStringArray(values.abi);
  if (abilities.length > 0 && !matchesAny(abilities, featAbilityFilterKeys(feat))) {
    return false;
  }

  const prereqs = asStringArray(values.prereq);
  if (prereqs.length > 0) {
    const featKinds: Array<FeatPrerequisiteKind | "none"> =
      feat.prerequisiteKinds.length === 0
        ? ["none"]
        : feat.prerequisiteKinds;
    if (!matchesAny(prereqs, featKinds)) return false;
  }

  const prereqLevels = asStringArray(values.plvl);
  if (
    prereqLevels.length > 0 &&
    !matchesAny(
      prereqLevels,
      feat.prerequisiteLevels.map((level) => String(level)),
    )
  ) {
    return false;
  }

  const repeat = typeof values.repeat === "string" ? values.repeat : "";
  if (repeat === "yes" && !feat.repeatable) return false;
  if (repeat === "no" && feat.repeatable) return false;

  const sources = asStringArray(values.src);
  if (sources.length > 0 && opts?.sourceMatcher) {
    if (!opts.sourceMatcher(feat, sources)) return false;
  }

  return true;
}
