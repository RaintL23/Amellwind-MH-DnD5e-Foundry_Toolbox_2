import type {
  RpgbotRating,
  RpgbotRatingLookupEntry,
  RpgbotRatingsData,
} from "./rpgbot-ratings.types";

export const RPGBOT_CLASS_SLUGS = new Set([
  "artificer",
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "warlock",
  "wizard",
]);

const SUBCLASS_SPELL_GUIDES = new Set(["arcane-trickster", "eldritch-knight"]);

export interface RpgbotLookupContext {
  classSlug: string;
  guideKey: string;
  category: string;
}

export function slugifyRpgbotKey(text: string | null | undefined): string {
  if (text == null || text === "") return "";
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function toRpgbotClassSlug(
  className: string | null | undefined,
): string | null {
  if (!className) return null;
  const slug = slugifyRpgbotKey(className);
  return RPGBOT_CLASS_SLUGS.has(slug) ? slug : null;
}

export function resolveSpellGuideKey(
  _classSlug: string,
  subclassSlug: string | null,
): string {
  if (subclassSlug && SUBCLASS_SPELL_GUIDES.has(subclassSlug)) {
    return `subclass-spells/${subclassSlug}`;
  }
  return "spells";
}

export function resolveRpgbotContext(params: {
  className: string | null | undefined;
  guideKey: string;
  category: string;
}): RpgbotLookupContext | null {
  if (!params.className) return null;
  const classSlug = toRpgbotClassSlug(params.className);
  if (!classSlug) return null;
  return {
    classSlug,
    guideKey: params.guideKey,
    category: params.category,
  };
}

function collectSources(
  source?: string | null,
  variantSources?: Array<string | null | undefined>,
): string[] {
  const sources = new Set<string>();
  if (source) sources.add(source);
  for (const variant of variantSources ?? []) {
    if (variant) sources.add(variant);
  }
  return [...sources];
}

export function findRpgbotRating(
  byClass: RpgbotRatingsData["byClass"],
  context: RpgbotLookupContext,
  name: string | null | undefined,
  source?: string | null,
  variantSources?: Array<string | null | undefined>,
): RpgbotRatingLookupEntry | null {
  if (!name) return null;

  const classGuides = byClass[context.classSlug];
  if (!classGuides) return null;

  const guideBucket = classGuides[context.guideKey];
  if (!guideBucket) return null;

  const categoryBucket = guideBucket[context.category];
  if (!categoryBucket) return null;

  const nameKey = slugifyRpgbotKey(name);
  if (!nameKey) return null;

  const sources = collectSources(source, variantSources);

  for (const src of sources) {
    const key = `${nameKey}|${slugifyRpgbotKey(src)}`;
    if (categoryBucket[key]) return categoryBucket[key];
  }

  if (sources.length === 0) {
    const key = `${nameKey}|unknown`;
    if (categoryBucket[key]) return categoryBucket[key];
  }

  for (const [key, entry] of Object.entries(categoryBucket)) {
    if (key.startsWith(`${nameKey}|`)) return entry;
  }

  for (const entry of Object.values(categoryBucket)) {
    if (entry.name && slugifyRpgbotKey(entry.name) === nameKey) return entry;
  }

  return null;
}

export type RpgbotLookupFn = (
  name: string | null | undefined,
  source?: string | null,
  variantSources?: Array<string | null | undefined>,
) => RpgbotRatingLookupEntry | null;

export function createRpgbotLookupFn(
  data: RpgbotRatingsData | null,
  context: RpgbotLookupContext | null,
): RpgbotLookupFn | null {
  if (!data || !context) return null;
  return (name, source, variantSources) => {
    if (!name) return null;
    return findRpgbotRating(
      data.byClass,
      context,
      name,
      source,
      variantSources,
    );
  };
}

export function compareRpgbotScore(
  scoreA: number | undefined,
  scoreB: number | undefined,
  nameA: string,
  nameB: string,
): number {
  const a = scoreA ?? 0;
  const b = scoreB ?? 0;
  if (a !== b) return b - a;
  return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
}

export function sortByRpgbotRating<T>(
  items: T[],
  getRating: (
    item: T,
  ) => Pick<RpgbotRatingLookupEntry, "score"> | null | undefined,
  getName: (item: T) => string | null | undefined,
): T[] {
  return [...items].sort((a, b) => {
    const ratingA = getRating(a);
    const ratingB = getRating(b);
    return compareRpgbotScore(
      ratingA?.score,
      ratingB?.score,
      getName(a) ?? "",
      getName(b) ?? "",
    );
  });
}

export const RPGBOT_RATING_LABELS: Record<RpgbotRating, string> = {
  blue: "Excellent",
  green: "Good",
  orange: "Acceptable",
  red: "Weak",
};

export const RPGBOT_RATING_SHORT: Record<RpgbotRating, string> = {
  blue: "E",
  green: "G",
  orange: "A",
  red: "W",
};

export function resolveOptionalFeatureRpgbotContext(params: {
  className: string;
  progressionName: string;
  featureTypes?: string[];
  catalog?: string;
  isFightingStyle: boolean;
}): RpgbotLookupContext | null {
  const classSlug = toRpgbotClassSlug(params.className);
  if (!classSlug) return null;

  if (params.isFightingStyle || params.catalog === "feat") {
    return {
      classSlug,
      guideKey: "class",
      category: "fighting-style",
    };
  }

  const types = params.featureTypes ?? [];
  const nameLower = params.progressionName.toLowerCase();

  if (
    types.includes("EB") ||
    nameLower.includes("invocation") ||
    nameLower.includes("eldritch")
  ) {
    return {
      classSlug,
      guideKey: "invocations",
      category: "invocation",
    };
  }

  if (types.includes("MM") || nameLower.includes("metamagic")) {
    return {
      classSlug,
      guideKey: "class",
      category: "metamagic",
    };
  }

  return null;
}
