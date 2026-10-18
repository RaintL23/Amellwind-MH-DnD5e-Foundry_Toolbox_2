import type { Class, Subclass } from "@/shared/types";
import type { RpgbotRatingsData } from "@/features/raintdm/builder/data/rpgbot-ratings.types";
import {
  findRpgbotRating,
  toRpgbotClassSlug,
  type RpgbotLookupContext,
} from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { subclassesForClassVariant } from "@/features/dnd/classes/utils/class-subclass.utils";
import { pickByRpgbot, pickRandom } from "./character-randomizer.utils";
import type { RandomizerSourceFilter } from "./randomizer-sources.utils";
import {
  drawFromBag,
  excludeLastPick,
  getLastPick,
  rememberPick,
  type VarietyStorage,
} from "./randomizer-variety.utils";

const CLASS_BAG_CATEGORY = "class";

function buildSubclassContext(classSlug: string): RpgbotLookupContext {
  return {
    classSlug,
    guideKey: "class",
    category: "subclass",
  };
}

function classKey(cls: Pick<Class, "name">): string {
  return cls.name.trim().toLowerCase();
}

/** One entry per class name (XPHB first when a class exists in several 2024+ books). */
export function dedupeClassesByName(classes: Class[]): Class[] {
  const byName = new Map<string, Class>();
  for (const cls of classes) {
    const key = classKey(cls);
    const current = byName.get(key);
    if (!current || (cls.source === "XPHB" && current.source !== "XPHB")) {
      byName.set(key, cls);
    }
  }
  return [...byName.values()];
}

/**
 * Next class from the shuffled bag: every playable class comes out once
 * before any repeats (expects a catalog already limited to 2024+ sources).
 */
export function pickRandomClass(
  classes: Class[],
  storage?: VarietyStorage | null,
): Class | null {
  const playable = dedupeClassesByName(classes.filter((cls) => !cls.isSidekick));
  if (playable.length === 0) return null;

  const key = drawFromBag(CLASS_BAG_CATEGORY, playable.map(classKey), storage);
  return playable.find((cls) => classKey(cls) === key) ?? pickRandom(playable);
}

/** 2024+ subclasses for the class book, avoiding the subclass picked last time. */
export function pickBestSubclass(
  classData: Class,
  rpgbotData: RpgbotRatingsData | null,
  isAllowedSource: RandomizerSourceFilter,
  storage?: VarietyStorage | null,
): Subclass | null {
  const eligible = subclassesForClassVariant(classData).filter((subclass) =>
    isAllowedSource(subclass.source),
  );
  if (eligible.length === 0) return null;

  const category = `subclass:${classKey(classData)}`;
  const subclasses = excludeLastPick(
    eligible,
    (subclass) => subclass.id,
    getLastPick(category, storage),
  );

  const classSlug = toRpgbotClassSlug(classData.name);
  const picked =
    !classSlug || !rpgbotData
      ? pickRandom(subclasses)
      : pickByRpgbot(subclasses, (subclass) =>
          findRpgbotRating(
            rpgbotData.byClass,
            buildSubclassContext(classSlug),
            subclass.name,
            subclass.source,
            [subclass.classSource],
          ),
        );

  rememberPick(category, picked?.id, storage);
  return picked;
}
