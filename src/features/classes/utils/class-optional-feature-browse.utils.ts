import type {
  Class,
  DndFeat,
  DndOptionalFeature,
  OptionalFeatureProgression,
  Subclass,
} from "@/shared/types";
import type { RichTextPhraseLink } from "@/shared/utils/dnd-rich-text.utils";
import {
  collectOptionPoolRefs,
  dndFeatToCatalogItem,
  featureChoiceToCatalogItem,
  filterCatalogForProgression,
  filterFeatsForProgression,
  isFeatureChoiceProgression,
  isWeaponMasteryProgression,
  optionalFeatureToCatalogItem,
  progressionDisplayName,
  type OptionalFeatureCatalogItem,
} from "@/features/builder/utils/class-optional-features.utils";
import {
  getFeatPrerequisiteSummary,
  getPrerequisiteSummary,
} from "@/features/builder/utils/optional-feature-prerequisites.utils";
import { WEAPON_MASTERY_OPTIONS } from "@/features/builder/data/weapon-mastery.data";
import { getAllDndOptionalFeatures } from "@/features/dnd-optionalfeatures/services/dnd-optionalfeature.service";
import { getAllDndFeats } from "@/features/dnd-feats/services/dnd-feat.service";

/**
 * Extra prose aliases keyed by normalized progression display name.
 * Covers every optionalfeatureProgression / feat Fighting Style / Weapon Mastery
 * found across official class JSON (see 5etools class-*.json).
 */
const PROGRESSION_PHRASE_ALIASES: Record<string, string[]> = {
  "arcane shots": ["arcane shot", "arcane shot options", "arcane shot option"],
  "eldritch invocations": [
    "eldritch invocation",
    "eldritch invocation options",
    "eldritch invocation option",
  ],
  "elemental disciplines": [
    "elemental discipline",
    "extra elemental discipline",
  ],
  "fighting style": ["fighting styles"],
  infusions: ["infusion", "infusions known", "artificer infusion"],
  maneuvers: [
    "maneuver",
    "maneuver options",
    "maneuver option",
    "additional maneuvers",
  ],
  metamagic: ["metamagic options", "metamagic option"],
  "pact boon": ["pact boons"],
  runes: ["rune", "rune carver", "additional rune known", "master of runes"],
  "epic boon": ["epic boons"],
  "weapon mastery": ["weapon masteries"],
};

function compactMatchKey(value: string): string {
  let key = value
    .toLowerCase()
    .replace(/\b(additional|extra|bonus|options?|known)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");
  if (key.length > 4 && key.endsWith("s") && !key.endsWith("ss")) {
    key = key.slice(0, -1);
  }
  return key;
}

function singularizePhrase(phrase: string): string | null {
  if (/invocations$/i.test(phrase)) {
    return phrase.replace(/invocations$/i, "Invocation");
  }
  if (/maneuvers$/i.test(phrase)) {
    return phrase.replace(/maneuvers$/i, "Maneuver");
  }
  if (/disciplines$/i.test(phrase)) {
    return phrase.replace(/disciplines$/i, "Discipline");
  }
  if (/infusions$/i.test(phrase)) {
    return phrase.replace(/infusions$/i, "Infusion");
  }
  if (/shots$/i.test(phrase)) {
    return phrase.replace(/shots$/i, "Shot");
  }
  if (/runes$/i.test(phrase)) {
    return phrase.replace(/runes$/i, "Rune");
  }
  if (/boons$/i.test(phrase)) {
    return phrase.replace(/boons$/i, "Boon");
  }
  if (/styles$/i.test(phrase)) {
    return phrase.replace(/styles$/i, "Style");
  }
  if (/options$/i.test(phrase)) {
    return phrase.replace(/\s*options$/i, "").trim() || null;
  }
  if (/s$/i.test(phrase) && !/ss$/i.test(phrase) && phrase.includes(" ")) {
    return phrase.replace(/s$/i, "");
  }
  return null;
}

/** Build clickable phrase links for optional-feature progressions. */
export function buildOptionalFeaturePhraseLinks(
  progressions: OptionalFeatureProgression[],
): RichTextPhraseLink[] {
  const links: RichTextPhraseLink[] = [];
  const seen = new Set<string>();

  const push = (id: string, phrase: string) => {
    const trimmed = phrase.trim();
    if (trimmed.length < 3) return;
    const key = `${id}::${trimmed.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ id, phrase: trimmed });
  };

  for (const progression of progressions) {
    push(progression.id, progression.name);
    const display = progressionDisplayName(progression.name);
    push(progression.id, display);
    const singular = singularizePhrase(display);
    if (singular) push(progression.id, singular);

    const aliases =
      PROGRESSION_PHRASE_ALIASES[display.toLowerCase()] ??
      PROGRESSION_PHRASE_ALIASES[progression.name.toLowerCase()];
    if (aliases) {
      for (const alias of aliases) push(progression.id, alias);
    }
  }

  return links.sort((a, b) => b.phrase.length - a.phrase.length);
}

export function collectClassOptionalFeatureProgressions(
  classData: Class | null | undefined,
  subclass: Subclass | null | undefined,
): OptionalFeatureProgression[] {
  const list: OptionalFeatureProgression[] = [];
  if (classData?.optionalFeatureProgressions?.length) {
    list.push(...classData.optionalFeatureProgressions);
  }
  if (subclass?.optionalFeatureProgressions?.length) {
    list.push(...subclass.optionalFeatureProgressions);
  }
  return list;
}

/** Resolve browseable catalog options for a progression (read-only class detail). */
export async function loadOptionalFeatureCatalogItems(
  progression: OptionalFeatureProgression,
  classData: Class | null,
  subclass: Subclass | null,
  level = 20,
): Promise<OptionalFeatureCatalogItem[]> {
  if (isWeaponMasteryProgression(progression)) {
    return WEAPON_MASTERY_OPTIONS.map(featureChoiceToCatalogItem);
  }

  if (isFeatureChoiceProgression(progression)) {
    return (progression.choiceOptions ?? []).map(featureChoiceToCatalogItem);
  }

  const poolRefs = classData
    ? collectOptionPoolRefs(
        classData,
        subclass,
        level,
        progression.catalog ?? "optionalfeature",
      )
    : [];

  if (progression.catalog === "feat") {
    const feats: DndFeat[] = await getAllDndFeats();
    return filterFeatsForProgression(
      feats,
      poolRefs,
      progression.featCategories ?? ["FS"],
    ).map((feat) =>
      dndFeatToCatalogItem(feat, getFeatPrerequisiteSummary(feat)),
    );
  }

  const optionalFeatures: DndOptionalFeature[] =
    await getAllDndOptionalFeatures();
  return filterCatalogForProgression(
    optionalFeatures,
    poolRefs,
    progression.featureTypes,
  ).map((feature) =>
    optionalFeatureToCatalogItem(feature, getPrerequisiteSummary(feature)),
  );
}

export function findProgressionById(
  progressions: OptionalFeatureProgression[],
  id: string,
): OptionalFeatureProgression | null {
  return progressions.find((p) => p.id === id) ?? null;
}

export function findProgressionForFeatureName(
  progressions: OptionalFeatureProgression[],
  featureName: string,
): OptionalFeatureProgression | null {
  const target = featureName.trim().toLowerCase();
  if (!target) return null;
  const targetKey = compactMatchKey(target);

  for (const progression of progressions) {
    const name = progression.name.toLowerCase();
    const display = progressionDisplayName(progression.name).toLowerCase();
    if (name === target || display === target) return progression;

    const progKey = compactMatchKey(display);
    if (progKey && targetKey && (progKey === targetKey || targetKey.includes(progKey))) {
      return progression;
    }

    const aliases =
      PROGRESSION_PHRASE_ALIASES[display] ??
      PROGRESSION_PHRASE_ALIASES[name] ??
      [];
    if (aliases.some((alias) => alias.toLowerCase() === target)) {
      return progression;
    }
  }
  return null;
}
