import type { Class, Subclass } from "@/shared/types";
import type { RpgbotRatingsData } from "@/features/builder/data/rpgbot-ratings.types";
import {
  findRpgbotRating,
  toRpgbotClassSlug,
  type RpgbotLookupContext,
} from "@/features/builder/data/rpgbot-ratings.utils";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import { pickByRpgbot, pickRandom, prefer2024Edition } from "./character-randomizer.utils";

function buildSubclassContext(classSlug: string): RpgbotLookupContext {
  return {
    classSlug,
    guideKey: "class",
    category: "subclass",
  };
}

export function pickRandomClass(
  classes: Class[],
  _rpgbotData: RpgbotRatingsData | null,
): Class | null {
  const playable = classes.filter((cls) => !cls.isSidekick);
  const preferred = prefer2024Edition(playable);
  return pickRandom(preferred);
}

export function pickBestSubclass(
  classData: Class,
  rpgbotData: RpgbotRatingsData | null,
): Subclass | null {
  const subclasses = subclassesForClassVariant(classData);
  if (subclasses.length === 0) return null;

  const classSlug = toRpgbotClassSlug(classData.name);
  if (!classSlug || !rpgbotData) {
    return pickRandom(subclasses);
  }

  const context = buildSubclassContext(classSlug);
  return pickByRpgbot(subclasses, (subclass) =>
    findRpgbotRating(
      rpgbotData.byClass,
      context,
      subclass.name,
      subclass.source,
      [subclass.classSource],
    ),
  );
}
