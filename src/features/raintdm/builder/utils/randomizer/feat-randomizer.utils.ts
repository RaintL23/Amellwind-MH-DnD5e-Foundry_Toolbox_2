import type {
  AbilityKey,
  AbilityScores,
  BuilderAsiChoices,
  BuilderFeatSelection,
  Class,
  DndFeat,
} from "@/shared/types";
import type { RpgbotRatingsData } from "@/features/raintdm/builder/data/rpgbot-ratings.types";
import { resolveDndFeatForRef } from "@/features/dnd/feats/services/dnd-feat.service";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import {
  findRpgbotRating,
  toRpgbotClassSlug,
} from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import {
  ABILITY_SCORE_IMPROVEMENT,
  getFeatSlotLevels,
} from "../builder-class.utils";
import { dndFeatToBuilderSelection } from "../origin-feat.constants";
import { isDnd2024Feat } from "../dnd-feat-edition.utils";
import { isRandomizerEligibleGeneralFeat } from "../feat-prerequisites.utils";
import {
  getFeatSpellListOptions,
  parseQualifierFromDisplayName,
} from "../feat-spell-list.utils";
import { pickByRpgbot, type RpgbotRatingGetter } from "./character-randomizer.utils";
import {
  isFeatBlockedForArchetype,
  preferredOriginFeatNames,
  matchesAnyName,
  signatureFeatRank,
  type BuildArchetype,
} from "./build-archetype.utils";

const ABILITY_CAP = 20;
const EPIC_BOON_CAP = 30;
const EPIC_BOON_LEVEL = 19;
const GOOD_RATING = 3;
const POLEARM_MASTER_WEAPONS = ["glaive", "halberd", "pike", "quarterstaff", "spear"];

function featRatingGetter(
  rpgbotData: RpgbotRatingsData | null,
  className: string,
): RpgbotRatingGetter<DndFeat> | null {
  const classSlug = toRpgbotClassSlug(className);
  if (!classSlug || !rpgbotData) return null;
  return (feat) =>
    findRpgbotRating(
      rpgbotData.byClass,
      { classSlug, guideKey: "class", category: "feat" },
      feat.name,
      feat.source,
      feat.variantSources,
    );
}

function pickFeat(
  pool: DndFeat[],
  getRating: RpgbotRatingGetter<DndFeat> | null,
): DndFeat | null {
  if (pool.length === 0) return null;
  return getRating
    ? pickByRpgbot(pool, getRating)
    : (pool[Math.floor(Math.random() * pool.length)] ?? null);
}

/**
 * Spell list for feats like Magic Initiate (Cleric / Druid / Wizard): a list
 * other than the character's own class when possible (more new spells).
 * The spells themselves come from the bonus spell pools in the spell phase.
 */
export function pickFeatSpellListClass(
  feat: DndFeat,
  className: string,
): string | null {
  const options = getFeatSpellListOptions(feat);
  if (options.length <= 1) return null;
  const own = className.trim().toLowerCase();
  const others = options.filter((option) => option.toLowerCase() !== own);
  const pool = others.length > 0 ? others : options;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

/** Builder selection for a randomizer feat pick, with spell list chosen when the feat needs one. */
function randomizedFeatSelection(
  feat: DndFeat,
  className: string,
  abilityPriority: readonly AbilityKey[],
): BuilderFeatSelection {
  const selection = dndFeatToBuilderSelection(feat, {
    randomizeAbilityIncreases: true,
    abilityPriority: [...abilityPriority],
  });
  const spellList = pickFeatSpellListClass(feat, className);
  return spellList ? { ...selection, spellListClassChoice: spellList } : selection;
}

function filterOriginFeats(feats: DndFeat[]): DndFeat[] {
  return feats.filter((feat) => feat.category === "O");
}

function pickRandomOriginFeat(
  feats: DndFeat[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
  excludeIds: ReadonlySet<string>,
  abilityPriority: AbilityKey[],
  archetype: BuildArchetype | null,
): BuilderFeatSelection | null {
  const pool = filterOriginFeats(feats).filter((feat) => !excludeIds.has(feat.id));
  if (pool.length === 0) return null;

  const getRating = featRatingGetter(rpgbotData, className);
  const preferred = archetype
    ? pool.filter((feat) =>
        matchesAnyName(feat.name, preferredOriginFeatNames(archetype)),
      )
    : [];
  const preferredIsGood =
    preferred.length > 0 &&
    (!getRating ||
      preferred.some((feat) => (getRating(feat)?.score ?? 0) >= GOOD_RATING));
  const picked = pickFeat(preferredIsGood ? preferred : pool, getRating);

  return picked ? randomizedFeatSelection(picked, className, abilityPriority) : null;
}

/**
 * Resolve the builder selection for a species/background origin-feat grant (fixed or choose).
 * `excludeIds` is shared across species → background → invocation slots so
 * non-repeatable origin feats are not taken twice. Expects a 2024+ feat catalog.
 */
export async function resolveOriginFeatSelectionForGrant(
  grant: OriginFeatGrant | null | undefined,
  feats: DndFeat[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
  excludeIds: ReadonlySet<string> = new Set(),
  abilityPriority: AbilityKey[] = [],
  archetype: BuildArchetype | null = null,
): Promise<BuilderFeatSelection | null> {
  if (!grant) return null;

  if (grant.kind === "choose") {
    return pickRandomOriginFeat(
      feats,
      rpgbotData,
      className,
      excludeIds,
      abilityPriority,
      archetype,
    );
  }

  if (grant.kind === "fixed" && grant.featRefs[0]) {
    const feat = await resolveDndFeatForRef(grant.featRefs[0]);
    if (!feat) return null;
    const name = grant.featRefs[0].displayLabel;
    // "Magic Initiate (Wizard)" already names its list; otherwise pick one.
    const spellList = parseQualifierFromDisplayName(name)
      ? null
      : pickFeatSpellListClass(feat, className);
    return {
      ...dndFeatToBuilderSelection(feat),
      name,
      ...(spellList ? { spellListClassChoice: spellList } : {}),
    };
  }

  return null;
}

// ─── Level feats (ASI slots) ─────────────────────────────────────────────────

export interface LevelFeatPlanContext {
  classData: Pick<Class, "name">;
  level: number;
  /** 2024+ feat catalog. */
  feats: DndFeat[];
  rpgbotData: RpgbotRatingsData | null;
  /** Scores before level feats: base + species + background. */
  abilities: Partial<AbilityScores>;
  /** Empty → no stat plan: feats are picked by rating only. */
  abilityPriority?: AbilityKey[];
  archetype?: BuildArchetype | null;
  hasSpellcasting?: boolean;
  armorProficiencies?: readonly string[];
  saveProficiencies?: readonly AbilityKey[];
  mainWeaponName?: string | null;
}

type RunningScores = Record<AbilityKey, number>;

function toRunningScores(abilities: Partial<AbilityScores>): RunningScores {
  return {
    str: abilities.str ?? 10,
    dex: abilities.dex ?? 10,
    con: abilities.con ?? 10,
    int: abilities.int ?? 10,
    wis: abilities.wis ?? 10,
    cha: abilities.cha ?? 10,
  };
}

/**
 * Where a +1 should go: the highest-priority ability under the cap,
 * preferring one that becomes even (odd score) among the top two.
 */
export function orderAbilityTargets(
  scores: RunningScores,
  priority: readonly AbilityKey[],
  cap = ABILITY_CAP,
): AbilityKey[] {
  const open = priority.filter((ability) => scores[ability] < cap);
  const [first, second, ...rest] = open;
  if (first && second && scores[first] % 2 === 0 && scores[second] % 2 === 1) {
    return [second, first, ...rest];
  }
  return open;
}

/** False when an increase can only land on abilities already at the cap. */
function fitsUnderCap(feat: DndFeat, scores: RunningScores, cap: number): boolean {
  return feat.abilityIncreases.every(
    (increase) =>
      increase.abilities.length === 0 ||
      increase.abilities.some((ability) => scores[ability] < cap),
  );
}

function featIncreasesAbility(feat: DndFeat, ability: AbilityKey): boolean {
  return feat.abilityIncreases.some((increase) =>
    increase.abilities.includes(ability),
  );
}

function isAsiFeat(feat: Pick<DndFeat, "name">): boolean {
  return feat.name === ABILITY_SCORE_IMPROVEMENT.name;
}

function buildAsiSelection(
  asiFeat: DndFeat | undefined,
  scores: RunningScores,
  priority: readonly AbilityKey[],
): BuilderFeatSelection {
  const [primary] = priority;
  let asiChoices: BuilderAsiChoices;
  if (primary && scores[primary] <= ABILITY_CAP - 2 && scores[primary] % 2 === 0) {
    asiChoices = { mode: "plus2", plus2: primary, plus1a: null, plus1b: null };
  } else {
    const targets = orderAbilityTargets(scores, priority);
    const plus1a = targets[0] ?? primary ?? "con";
    const plus1b =
      targets.find((ability) => ability !== plus1a) ??
      priority.find((ability) => ability !== plus1a) ??
      "con";
    asiChoices = { mode: "plus1plus1", plus2: null, plus1a, plus1b };
  }

  return asiFeat
    ? { id: asiFeat.id, name: asiFeat.name, source: "dnd2024", asiChoices }
    : {
        id: ABILITY_SCORE_IMPROVEMENT.id,
        name: ABILITY_SCORE_IMPROVEMENT.name,
        source: "asi",
        asiChoices,
      };
}

function applySelectionToScores(
  selection: BuilderFeatSelection,
  scores: RunningScores,
): void {
  const asi = selection.asiChoices;
  if (asi) {
    if (asi.mode === "plus2" && asi.plus2) scores[asi.plus2] += 2;
    if (asi.mode === "plus1plus1") {
      if (asi.plus1a) scores[asi.plus1a] += 1;
      if (asi.plus1b) scores[asi.plus1b] += 1;
    }
    return;
  }
  for (const pick of selection.abilityIncreaseChoices ?? []) {
    if (pick.ability) scores[pick.ability] += pick.amount;
  }
}

/** Resilient picks the first non-proficient save among CON → WIS → DEX. */
function increaseTargetsFor(
  feat: DndFeat,
  scores: RunningScores,
  priority: readonly AbilityKey[],
  saveProficiencies: readonly AbilityKey[],
  cap: number,
): AbilityKey[] {
  if (feat.name === "Resilient") {
    const save = (["con", "wis", "dex"] as AbilityKey[]).find(
      (ability) => !saveProficiencies.includes(ability) && scores[ability] < cap,
    );
    if (save) return [save, ...priority];
  }
  const ordered = orderAbilityTargets(scores, priority, cap);
  return ordered.length > 0 ? [...ordered, "con"] : [...priority, "con"];
}

function featSelectionFor(
  feat: DndFeat,
  className: string,
  scores: RunningScores,
  priority: readonly AbilityKey[],
  saveProficiencies: readonly AbilityKey[],
  cap: number,
): BuilderFeatSelection {
  return randomizedFeatSelection(
    feat,
    className,
    increaseTargetsFor(feat, scores, priority, saveProficiencies, cap),
  );
}

/**
 * Level feat slots (4, 8, 12, 16, 19; Fighter 6, 14) following a stat plan:
 * 1. Level 19: best Epic Boon whose +1 can go to the primary (cap 30).
 * 2. Primary below 20 and odd: a good half-feat for the archetype that raises
 *    the primary, else ASI +1 primary / +1 secondary.
 * 3. Primary below 20 and even: the archetype's signature feat if still
 *    missing, else ASI +2 primary.
 * 4. Primary at 20: best good feat for the archetype (+1 to the secondary).
 * Feats that clash with the archetype never come out; prerequisites use the
 * running scores (origin bonuses + earlier picks).
 */
export function buildFeatSelectionsForLevel(
  ctx: LevelFeatPlanContext,
): (BuilderFeatSelection | null)[] {
  const priority = ctx.abilityPriority ?? [];
  const archetype = ctx.archetype ?? null;
  const saveProficiencies = ctx.saveProficiencies ?? [];
  const slotLevels = getFeatSlotLevels(ctx.classData.name, ctx.level);
  const getRating = featRatingGetter(ctx.rpgbotData, ctx.classData.name);
  const scores = toRunningScores(ctx.abilities);
  const usedIds = new Set<string>();
  const asiFeat = ctx.feats.find((feat) => isDnd2024Feat(feat) && isAsiFeat(feat));
  const mainWeapon = ctx.mainWeaponName?.trim().toLowerCase() ?? null;
  const className = ctx.classData.name;

  const isCompatible = (feat: DndFeat) => {
    if (!archetype) return true;
    if (isFeatBlockedForArchetype(feat.name, archetype)) return false;
    if (feat.name === "Polearm Master" && mainWeapon) {
      return POLEARM_MASTER_WEAPONS.includes(mainWeapon);
    }
    return true;
  };
  const isGood = (feat: DndFeat) =>
    !getRating || (getRating(feat)?.score ?? 0) >= GOOD_RATING;

  return slotLevels.map((slotLevel) => {
    const eligible = ctx.feats.filter(
      (feat) =>
        isDnd2024Feat(feat) &&
        !isAsiFeat(feat) &&
        isRandomizerEligibleGeneralFeat(feat, {
          level: slotLevel,
          abilities: scores,
          hasSpellcasting: ctx.hasSpellcasting,
          armorProficiencies: ctx.armorProficiencies,
        }) &&
        isCompatible(feat),
    );
    const unique = eligible.filter((feat) => !usedIds.has(feat.id));
    const isEpicSlot = slotLevel >= EPIC_BOON_LEVEL;
    // Stat plan: no repeats of non-repeatable feats, and no +1 wasted past the cap.
    const pool = eligible.filter(
      (feat) =>
        (!usedIds.has(feat.id) || feat.repeatable) &&
        fitsUnderCap(
          feat,
          scores,
          isEpicSlot && feat.category?.toUpperCase() === "EB" ? EPIC_BOON_CAP : ABILITY_CAP,
        ),
    );

    const choose = (): BuilderFeatSelection | null => {
      const [primary] = priority;
      if (!primary) {
        const picked = pickFeat(unique.length > 0 ? unique : eligible, getRating);
        return picked ? randomizedFeatSelection(picked, className, []) : null;
      }

      if (isEpicSlot) {
        const boons = pool.filter((feat) => feat.category?.toUpperCase() === "EB");
        const raising = boons.filter(
          (feat) =>
            featIncreasesAbility(feat, primary) && scores[primary] < EPIC_BOON_CAP,
        );
        const goodRaising = raising.filter(isGood);
        const picked = pickFeat(
          goodRaising.length > 0 ? goodRaising : raising.length > 0 ? raising : boons,
          getRating,
        );
        if (picked) {
          return featSelectionFor(picked, className, scores, priority, saveProficiencies, EPIC_BOON_CAP);
        }
      }

      const signature = archetype
        ? pool
            .filter((feat) => signatureFeatRank(feat.name, archetype) >= 0)
            .sort(
              (a, b) =>
                signatureFeatRank(a.name, archetype) -
                signatureFeatRank(b.name, archetype),
            )
        : [];

      if (scores[primary] < ABILITY_CAP) {
        const halfFeats = pool.filter(
          (feat) => featIncreasesAbility(feat, primary) && isGood(feat),
        );
        if (scores[primary] % 2 === 1) {
          const signatureHalf = signature.filter((feat) =>
            featIncreasesAbility(feat, primary),
          );
          const picked =
            signatureHalf[0] ?? pickFeat(halfFeats, getRating);
          return picked
            ? featSelectionFor(picked, className, scores, priority, saveProficiencies, ABILITY_CAP)
            : buildAsiSelection(asiFeat, scores, priority);
        }
        const firstSignature = signature[0];
        return firstSignature
          ? featSelectionFor(firstSignature, className, scores, priority, saveProficiencies, ABILITY_CAP)
          : buildAsiSelection(asiFeat, scores, priority);
      }

      const good = pool.filter(isGood);
      const picked = signature[0] ?? pickFeat(good.length > 0 ? good : pool, getRating);
      return picked
        ? featSelectionFor(picked, className, scores, priority, saveProficiencies, ABILITY_CAP)
        : buildAsiSelection(asiFeat, scores, priority);
    };

    const selection = choose();
    if (selection) {
      usedIds.add(selection.id);
      applySelectionToScores(selection, scores);
    }
    return selection;
  });
}
