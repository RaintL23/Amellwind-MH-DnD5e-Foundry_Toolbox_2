/**
 * Async pre-pass run on a parsed Builder JSON before it is restored (Builder
 * import) or compiled (Character Sheet roster import). Context-free.
 *
 * 1. Loads the on-demand UA / brew catalogs the build's ids depend on.
 * 2. Re-links identity, feat, spell and optional-feature refs: exact id first,
 *    then name (preferring the saved source). Unresolved refs are kept as saved.
 * 3. Re-links equipped weapons / armor / runes to the current catalog, keeping
 *    the player's rarity, grip mode and rune slots; the embedded object stays as
 *    a lossless fallback when the item is not in the catalog.
 *
 * Every change or miss is reported as a human-readable warning.
 */
import type {
  BuilderFeatSelection,
  BuilderSpellSelections,
  CharacterSelectionRef,
  Class,
  EquippedArmor,
  EquippedWeapon,
  Rune,
} from "@/shared/types";
import {
  ensureClassUaSourcesLoaded,
  getClassById,
  getClassesByName,
} from "@/features/dnd/classes/services/class.service";
import { subclassesForClassVariant } from "@/features/dnd/classes/utils/class-subclass.utils";
import {
  ensureDndRaceUaSourcesLoaded,
  getDndRaceById,
  getDndRacesByName,
} from "@/features/dnd/races/services/dnd-race.service";
import {
  getSpeciesById,
  getSpeciesByName,
} from "@/features/amellwind/species/services/species.service";
import {
  getDndBackgroundById,
  getDndBackgroundsByName,
} from "@/features/dnd/backgrounds/services/dnd-background.service";
import {
  getAllBackgrounds,
  getBackgroundById,
} from "@/features/amellwind/backgrounds/services/background.service";
import {
  ensureDndFeatUaSourcesLoaded,
  getAllDndFeats,
  resolveDndFeatForRef,
} from "@/features/dnd/feats/services/dnd-feat.service";
import { getAllFeats, getFeatById } from "@/features/amellwind/feats/services/feat.service";
import {
  ensureSpellUaSourcesLoaded,
  getSpellById,
  getSpellsByName,
} from "@/features/dnd/spells/services/spell.service";
import { getAllDndOptionalFeatures } from "@/features/dnd/optionalfeatures/services/dnd-optionalfeature.service";
import { getAllWeapons } from "@/features/amellwind/weapons/services/weapon.service";
import { getAllForgeWeapons } from "@/features/raintdm/weapon-forge/services/weapon-forge.service";
import {
  AMELLWIND_UNARMED_ITEM,
  isAmellwindUnarmedItem,
} from "../data/unarmed-item.data";
import {
  getDndArmors,
  getDndWeaponVariantsByName,
} from "@/features/dnd/items/services/dnd-equipment.service";
import { getRuneByName, getRunesByMonster } from "@/features/amellwind/runes/services/rune.service";
import { BASE_ARMORS } from "../data/armor.data";
import type { BuilderChoiceSnapshot } from "../foundry-export/builder-snapshot";
import type { BuilderCharacterJson } from "./builder-character.types";
import {
  collectBuildSources,
  sourceFromLeadingId,
  sourceFromTrailingId,
} from "./builder-character-sources";

export interface PrepareBuilderCharacterImportResult {
  data: BuilderCharacterJson;
  warnings: string[];
}

type Warn = (message: string) => void;

interface Named {
  id: string;
  name: string;
  source: string;
}

/** Same-source match first, then XPHB (2024 default), then the first one. */
function pickByName<T extends { source: string }>(
  candidates: T[],
  preferredSource: string | null,
): T | undefined {
  return (
    (preferredSource ? candidates.find((c) => c.source === preferredSource) : undefined) ??
    candidates.find((c) => c.source === "XPHB") ??
    candidates[0]
  );
}

function lower(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Exact id → found; otherwise name lookup. Returns the new ref (or the saved
 * one) and reports re-links / misses.
 */
async function relinkRef(
  label: string,
  ref: CharacterSelectionRef | null,
  byId: (id: string) => Promise<Named | undefined>,
  byName: (name: string) => Promise<Named[]>,
  sourceOf: (id: string) => string | null,
  warn: Warn,
): Promise<CharacterSelectionRef | null> {
  if (!ref) return null;
  if (await byId(ref.id)) return ref;
  const match = pickByName(await byName(ref.name), sourceOf(ref.id));
  if (match) {
    warn(`${label} "${ref.name}": id "${ref.id}" not found; matched by name (${match.id}).`);
    return { ...ref, id: match.id, name: match.name };
  }
  warn(`${label} "${ref.name}" (${ref.id}) is not in the catalog; kept as saved.`);
  return ref;
}

// ─── Identity ────────────────────────────────────────────────────────────────

async function relinkClass(
  label: string,
  ref: CharacterSelectionRef | null,
  warn: Warn,
): Promise<{ ref: CharacterSelectionRef | null; data: Class | null }> {
  const relinked = await relinkRef(label, ref, getClassById, getClassesByName, sourceFromLeadingId, warn);
  const data = relinked ? ((await getClassById(relinked.id)) ?? null) : null;
  return { ref: relinked, data };
}

function relinkSubclass(
  label: string,
  ref: CharacterSelectionRef | null,
  classData: Class | null,
  warn: Warn,
): CharacterSelectionRef | null {
  if (!ref || !classData) return ref;
  const subclasses = subclassesForClassVariant(classData);
  if (subclasses.some((sc) => sc.id === ref.id)) return ref;
  const match = pickByName(
    subclasses.filter((sc) => lower(sc.name) === lower(ref.name)),
    sourceFromLeadingId(ref.id),
  );
  if (match) {
    warn(`${label} "${ref.name}": id "${ref.id}" not found; matched by name (${match.id}).`);
    return { ...ref, id: match.id, name: match.name };
  }
  warn(`${label} "${ref.name}" is not available for ${classData.name}; kept as saved.`);
  return ref;
}

const speciesById = async (id: string) =>
  (await getSpeciesById(id)) ?? (await getDndRaceById(id));
const speciesByName = async (name: string): Promise<Named[]> => [
  ...(await getSpeciesByName(name)),
  ...(await getDndRacesByName(name)),
];

async function relinkSpecies(
  ref: CharacterSelectionRef | null,
  warn: Warn,
): Promise<CharacterSelectionRef | null> {
  const base = await relinkRef("Species", ref, speciesById, speciesByName, sourceFromTrailingId, warn);
  if (!base?.subraceId) return base;
  if (await speciesById(base.subraceId)) return base;
  const subraceName = base.subraceName ?? "";
  const match = subraceName
    ? pickByName(await speciesByName(subraceName), sourceFromTrailingId(base.subraceId))
    : undefined;
  if (match) {
    warn(`Subspecies "${subraceName}": id not found; matched by name (${match.id}).`);
    return { ...base, subraceId: match.id, subraceName: match.name };
  }
  warn(`Subspecies "${subraceName || base.subraceId}" is not in the catalog; kept as saved.`);
  return base;
}

const backgroundById = async (id: string) =>
  (await getDndBackgroundById(id)) ?? (await getBackgroundById(id));
const backgroundByName = async (name: string): Promise<Named[]> => [
  ...(await getDndBackgroundsByName(name)),
  ...(await getAllBackgrounds()).filter((bg) => lower(bg.name) === lower(name)),
];

// ─── Feats / spells / optional features ──────────────────────────────────────

async function relinkFeat(
  label: string,
  feat: BuilderFeatSelection | null,
  warn: Warn,
): Promise<BuilderFeatSelection | null> {
  if (!feat || feat.source === "asi") return feat;
  if (feat.source === "amellwind") {
    if (await getFeatById(feat.id)) return feat;
    const match = (await getAllFeats()).find((f) => lower(f.name) === lower(feat.name));
    if (match) {
      warn(`${label} "${feat.name}": id not found; matched by name (${match.id}).`);
      return { ...feat, id: match.id, name: match.name };
    }
    warn(`${label} "${feat.name}" is not in the catalog; kept as saved.`);
    return feat;
  }
  const match = await resolveDndFeatForRef({
    id: feat.id,
    name: feat.name,
    source: sourceFromTrailingId(feat.id) ?? "",
    displayLabel: feat.name,
  });
  if (!match) {
    warn(`${label} "${feat.name}" is not in the catalog; kept as saved.`);
    return feat;
  }
  if (match.id === feat.id) return feat;
  warn(`${label} "${feat.name}": id "${feat.id}" not found; matched by name (${match.id}).`);
  return { ...feat, id: match.id, name: match.name };
}

async function relinkSpells(
  selections: BuilderSpellSelections,
  warn: Warn,
): Promise<BuilderSpellSelections> {
  const out: BuilderSpellSelections = {};
  for (const [pool, spells] of Object.entries(selections)) {
    const relinked = [];
    for (const spell of spells) {
      if (await getSpellById(spell.id)) {
        relinked.push(spell);
        continue;
      }
      const match = pickByName(await getSpellsByName(spell.name), spell.source || null);
      if (match) {
        warn(`Spell "${spell.name}": id "${spell.id}" not found; matched by name (${match.id}).`);
        relinked.push({ ...spell, id: match.id, name: match.name, source: match.source });
      } else {
        warn(`Spell "${spell.name}" (${spell.id}) is not in the catalog; kept as saved.`);
        relinked.push(spell);
      }
    }
    out[Number(pool)] = relinked;
  }
  return out;
}

async function relinkOptionalFeatures(
  selections: BuilderChoiceSnapshot["optionalFeatureSelections"],
  warn: Warn,
): Promise<BuilderChoiceSnapshot["optionalFeatureSelections"]> {
  // Picks come from optional features or, for feat-based progressions (2024
  // Fighting Style feats), from the feat catalog.
  const all: Named[] = [...(await getAllDndOptionalFeatures()), ...(await getAllDndFeats())];
  const ids = new Set(all.map((f) => f.id));
  const out: BuilderChoiceSnapshot["optionalFeatureSelections"] = {};
  for (const [progressionId, picks] of Object.entries(selections)) {
    out[progressionId] = picks.map((pick) => {
      // Weapon-mastery and other synthetic picks are not catalog optional features.
      if (!pick || ids.has(pick.id) || !pick.featureTypes.length) return pick;
      const match = pickByName(
        all.filter((f) => lower(f.name) === lower(pick.name)),
        pick.source || null,
      );
      if (!match) {
        warn(`Optional feature "${pick.name}" is not in the catalog; kept as saved.`);
        return pick;
      }
      warn(`Optional feature "${pick.name}": id not found; matched by name (${match.id}).`);
      return { ...pick, id: match.id, name: match.name, source: match.source };
    });
  }
  return out;
}

// ─── Equipment ───────────────────────────────────────────────────────────────

async function findRune(rune: Rune): Promise<Rune | undefined> {
  if (rune.monsterName) {
    const match = (await getRunesByMonster(rune.monsterName)).find(
      (r) => lower(r.name) === lower(rune.name),
    );
    if (match) return match;
  }
  return getRuneByName(rune.name);
}

async function relinkRunes(
  label: string,
  runes: (Rune | null)[],
  warn: Warn,
): Promise<(Rune | null)[]> {
  return Promise.all(
    runes.map(async (rune) => {
      if (!rune) return null;
      const match = await findRune(rune);
      if (!match) warn(`${label}: rune "${rune.name}" is not in the catalog; kept the saved copy.`);
      return match ?? rune;
    }),
  );
}

async function relinkWeapon(
  label: string,
  equipped: EquippedWeapon | null,
  warn: Warn,
): Promise<EquippedWeapon | null> {
  if (!equipped) return null;
  const saved = equipped.weapon;
  const sameItem = (w: { id?: string; name: string; source: string }) =>
    (saved.id && w.id === saved.id) || (w.name === saved.name && w.source === saved.source);

  let match: EquippedWeapon["weapon"] | undefined;
  if (saved.contentSource === "dnd") {
    match = (await getDndWeaponVariantsByName(saved.name)).find(sameItem);
  } else {
    match =
      (isAmellwindUnarmedItem(saved) ? AMELLWIND_UNARMED_ITEM : undefined) ??
      (await getAllWeapons()).find(sameItem) ??
      ((await getAllForgeWeapons()) as EquippedWeapon["weapon"][]).find(sameItem);
  }
  if (!match) {
    warn(`${label} "${saved.name}" (${saved.source}) is not in the catalog; kept the saved copy.`);
  }
  return {
    ...equipped,
    // Catalog data wins; saved-only keys (variant groupings) are kept.
    weapon: match ? { ...saved, ...match } : saved,
    runes: await relinkRunes(label, equipped.runes, warn),
  };
}

async function relinkArmor(
  equipped: EquippedArmor | null,
  warn: Warn,
): Promise<EquippedArmor | null> {
  if (!equipped) return null;
  const saved = equipped.armor;
  const sameItem = (a: { name: string; source?: string }) =>
    a.name === saved.name && (!saved.source || !a.source || a.source === saved.source);
  const catalog =
    saved.contentSource === "dnd"
      ? [...(await getDndArmors(true)), ...(await getDndArmors(false))]
      : BASE_ARMORS;
  const match = catalog.find(sameItem);
  if (!match) warn(`Armor "${saved.name}" is not in the catalog; kept the saved copy.`);
  return {
    ...equipped,
    armor: match ? { ...saved, ...match } : saved,
    runes: await relinkRunes("Armor", equipped.runes, warn),
  };
}

async function relinkTrinketRune<T extends { name: string; rune: Rune | null }>(
  label: string,
  trinket: T | null,
  warn: Warn,
): Promise<T | null> {
  if (!trinket?.rune) return trinket;
  const [rune] = await relinkRunes(label, [trinket.rune], warn);
  return { ...trinket, rune: rune ?? null };
}

/** Runs one re-link step; a catalog/network failure keeps the saved value. */
async function attempt<T>(label: string, saved: T, step: () => Promise<T>, warn: Warn): Promise<T> {
  try {
    return await step();
  } catch (error) {
    warn(
      `${label}: could not check the catalog (${error instanceof Error ? error.message : "unknown error"}); kept as saved.`,
    );
    return saved;
  }
}

export async function prepareBuilderCharacterImport(
  input: BuilderCharacterJson,
): Promise<PrepareBuilderCharacterImportResult> {
  const warnings: string[] = [];
  const warn: Warn = (message) => warnings.push(message);
  const { identity, multiclass, snapshot } = input;

  const sources = [...new Set([...(input.meta?.sources ?? []), ...collectBuildSources(input)])];
  await attempt("UA / homebrew sources", undefined, async () => {
    await Promise.all([
      ensureClassUaSourcesLoaded(sources),
      ensureDndRaceUaSourcesLoaded(sources),
      ensureDndFeatUaSourcesLoaded(sources),
      ensureSpellUaSourcesLoaded(sources),
    ]);
  }, warn);

  const primary = await attempt(
    "Class",
    { ref: identity.class, data: null },
    () => relinkClass("Class", identity.class, warn),
    warn,
  );
  const subclass = relinkSubclass("Subclass", identity.subclass, primary.data, warn);
  const species = await attempt("Species", identity.species, () => relinkSpecies(identity.species, warn), warn);
  const background = await attempt(
    "Background",
    identity.background,
    () =>
      relinkRef(
        "Background",
        identity.background,
        backgroundById,
        backgroundByName,
        sourceFromTrailingId,
        warn,
      ),
    warn,
  );

  const entries = await attempt("Multiclass", multiclass.entries, async () =>
    Promise.all(
      multiclass.entries.map(async (entry, index) => {
        const label = `Multiclass #${index + 1}`;
        const cls = await relinkClass(`${label} class`, entry.classRef, warn);
        return {
          ...entry,
          classRef: cls.ref,
          subclass: relinkSubclass(`${label} subclass`, entry.subclass, cls.data, warn),
          ...(entry.spellSelections
            ? { spellSelections: await relinkSpells(entry.spellSelections, warn) }
            : {}),
        };
      }),
    ),
    warn,
  );

  const feat = (label: string) => (selection: BuilderFeatSelection | null) =>
    relinkFeat(label, selection, warn);
  const featSelections = await attempt("Feats", snapshot.featSelections, () =>
    Promise.all(snapshot.featSelections.map((f, i) => feat(`Feat slot #${i + 1}`)(f))),
    warn,
  );
  const speciesOriginFeat = await attempt("Origin feat", snapshot.speciesOriginFeat, () =>
    feat("Species origin feat")(snapshot.speciesOriginFeat), warn);
  const backgroundOriginFeat = await attempt("Origin feat", snapshot.backgroundOriginFeat, () =>
    feat("Background origin feat")(snapshot.backgroundOriginFeat), warn);
  const optionalFeatureOriginFeats = await attempt("Origin feats", snapshot.optionalFeatureOriginFeats, () =>
    Promise.all(snapshot.optionalFeatureOriginFeats.map((f) => feat("Optional-feature origin feat")(f))),
    warn,
  );

  const spellSelections = await attempt("Spells", snapshot.spellSelections, () =>
    relinkSpells(snapshot.spellSelections, warn), warn);
  const optionalFeatureSelections = await attempt(
    "Optional features",
    snapshot.optionalFeatureSelections,
    () => relinkOptionalFeatures(snapshot.optionalFeatureSelections, warn),
    warn,
  );

  const eq = snapshot.equipment;
  const equipment = {
    ...eq,
    mainHand: await attempt("Main hand", eq.mainHand, () => relinkWeapon("Main hand", eq.mainHand, warn), warn),
    offHand: await attempt("Off hand", eq.offHand, () => relinkWeapon("Off hand", eq.offHand, warn), warn),
    armor: await attempt("Armor", eq.armor, () => relinkArmor(eq.armor, warn), warn),
    trinket1: await attempt("Trinket 1", eq.trinket1, () => relinkTrinketRune("Trinket 1", eq.trinket1, warn), warn),
    trinket2: await attempt("Trinket 2", eq.trinket2, () => relinkTrinketRune("Trinket 2", eq.trinket2, warn), warn),
  };

  return {
    warnings,
    data: {
      ...input,
      identity: { class: primary.ref, subclass, species, background },
      multiclass: { ...multiclass, entries },
      snapshot: {
        ...snapshot,
        featSelections,
        speciesOriginFeat,
        backgroundOriginFeat,
        optionalFeatureOriginFeats,
        spellSelections,
        optionalFeatureSelections,
        equipment,
      },
    },
  };
}
