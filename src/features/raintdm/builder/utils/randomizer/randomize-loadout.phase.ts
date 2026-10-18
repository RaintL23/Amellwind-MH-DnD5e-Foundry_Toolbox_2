/**
 * Loadout planning (after optional features, so Divine Order / Primal Order
 * proficiencies count) and equipping (D&D mode only).
 */
import { subclassesForClassVariant } from "@/features/dnd/classes/utils/class-subclass.utils";
import {
  armorItemToStandaloneShield,
} from "@/features/raintdm/builder/data/shield.data";
import { toRpgbotClassSlug } from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { resolveStartingEquipmentOffers } from "@/features/raintdm/builder/utils/amellwind-starting-equipment.utils";
import { resolveProficiencyItems } from "@/features/raintdm/builder/utils/equipment-proficiency.utils";
import {
  buildArmorInventoryBundle,
  buildShieldInventoryBundle,
  buildWeaponInventoryBundle,
} from "@/features/raintdm/builder/utils/equipment-inventory.utils";
import { computeAllClassEquipmentGrants } from "@/features/raintdm/builder/utils/feature-choice-grants.utils";
import type { AbilityKey, AbilityScores, CartEntry, Weapon } from "@/shared/types";
import {
  canWearArmor,
  findBasicWeapon,
  isBasicShield,
  pickLoadoutArmor,
  pickLoadoutWeapons,
  resolveArchetypeWeaponCandidates,
  scoreStartingEquipmentOption,
  type LoadoutContext,
} from "./loadout-randomizer.utils";
import { buildRandomStartingEquipmentEntries } from "./starting-equipment-randomizer.utils";
import type {
  RandomizeCharacterContext,
  RandomizerPipelineState,
} from "./randomize-context.types";

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/** Point-buy scores plus species / background bonuses. */
export function resolveOriginAbilityScores(
  state: Pick<RandomizerPipelineState, "abilityScores" | "originAbilityBonuses">,
): Partial<AbilityScores> {
  const scores: Partial<AbilityScores> = { ...state.abilityScores };
  for (const [key, bonus] of Object.entries(state.originAbilityBonuses) as [
    AbilityKey,
    number,
  ][]) {
    scores[key] = (scores[key] ?? 10) + bonus;
  }
  return scores;
}

export function planLoadoutPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): void {
  const { catalogs, preservedLevel, rpgbot, useAmellwindHomebrew } = ctx;
  const { classData, pickedSubclass, randomizedBackgroundDetail } = state;

  const activeSubclass = pickedSubclass
    ? (subclassesForClassVariant(classData).find(
        (sc) => sc.id === pickedSubclass.id,
      ) ?? null)
    : null;
  const featureGrants = computeAllClassEquipmentGrants(
    state.randomFeatureChoiceSelections,
    state.activeProgressions.map((row) => row.progression),
    classData,
    activeSubclass,
    preservedLevel,
    catalogs.allOptionalFeatures,
    catalogs.allFeatCatalog,
  );
  const weaponProficiencies = resolveProficiencyItems([
    ...classData.weaponGrants,
    ...featureGrants.weaponGrants,
  ]);
  const armorProficiencies = resolveProficiencyItems([
    ...classData.armorGrants,
    ...featureGrants.armorGrants,
  ]);

  const classSlug = toRpgbotClassSlug(classData.name);
  const weaponLookup = classSlug
    ? rpgbot.createLookup({ classSlug, guideKey: "class", category: "weapon" })
    : null;

  const loadoutCtx: LoadoutContext = {
    archetype: state.archetype.archetype,
    className: classData.name,
    subclassName: pickedSubclass?.name ?? null,
    abilities: resolveOriginAbilityScores(state),
    weaponProficiencies,
    armorProficiencies,
    weaponRatingOf: (name) => weaponLookup?.(name) ?? null,
  };
  const candidates = resolveArchetypeWeaponCandidates(loadoutCtx);

  const wearableArmorNames = new Set(
    catalogs.dndArmors
      .filter((armor) => canWearArmor(armor, loadoutCtx))
      .map((armor) => normalize(armor.name)),
  );
  // AGMH: MH weapons replace class/background starting weapons; only avoid gold-only packages.
  const scoreOption = (option: Parameters<typeof scoreStartingEquipmentOption>[0]) =>
    scoreStartingEquipmentOption(
      option,
      useAmellwindHomebrew ? null : candidates,
      (name) => wearableArmorNames.has(normalize(name)),
    );

  const startingEquipment: CartEntry[] = [
    ...buildRandomStartingEquipmentEntries(
      resolveStartingEquipmentOffers(
        classData.startingEquipmentOffers,
        useAmellwindHomebrew,
      ),
      { type: "class", id: classData.id, name: classData.name },
      scoreOption,
    ),
    ...(randomizedBackgroundDetail
      ? buildRandomStartingEquipmentEntries(
          resolveStartingEquipmentOffers(
            randomizedBackgroundDetail.startingEquipmentOffers,
            useAmellwindHomebrew,
          ),
          {
            type: "background",
            id: randomizedBackgroundDetail.id,
            name: randomizedBackgroundDetail.name,
          },
          scoreOption,
        )
      : []),
  ];

  const ownedNames = new Set(startingEquipment.map((entry) => normalize(entry.name)));
  const weapons = pickLoadoutWeapons(candidates, ownedNames, loadoutCtx);

  state.loadout = {
    candidates,
    ...weapons,
    armor: useAmellwindHomebrew
      ? null
      : pickLoadoutArmor(loadoutCtx, catalogs.dndArmors, ownedNames),
    weaponProficiencies,
    armorProficiencies,
    startingEquipment,
  };
}

/** Starting equipment for the cart; in D&D mode also equips the loadout. */
export function applyLoadoutPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): void {
  const { loadout } = state;
  if (!loadout) return;
  const { addEquipmentBundle, setters, catalogs, useAmellwindHomebrew } = ctx;

  const ownedNames = new Set(
    loadout.startingEquipment.map((entry) => normalize(entry.name)),
  );
  const extras: CartEntry[] = [];
  const addIfMissing = (name: string, bundle: CartEntry[]) => {
    if (ownedNames.has(normalize(name))) return;
    ownedNames.add(normalize(name));
    extras.push(...bundle);
  };

  if (!useAmellwindHomebrew) {
    const equipWeapon = (slot: "mainHand" | "offHand", weapon: Weapon | null) => {
      if (!weapon) return;
      setters.equipWeapon(slot, weapon, weapon.itemRarityLabel ?? "Standard");
      addIfMissing(weapon.name, buildWeaponInventoryBundle(weapon));
    };

    equipWeapon("mainHand", findBasicWeapon(catalogs.dndWeapons, loadout.mainHand));
    equipWeapon("offHand", findBasicWeapon(catalogs.dndWeapons, loadout.offHand));

    const backup = findBasicWeapon(catalogs.dndWeapons, loadout.backup);
    if (backup) addIfMissing(backup.name, buildWeaponInventoryBundle(backup));

    if (loadout.useShield) {
      const shieldItem = catalogs.dndArmors.find(isBasicShield);
      if (shieldItem) {
        const shield = armorItemToStandaloneShield(shieldItem);
        setters.equipShield(shield);
        addIfMissing(shield.name, buildShieldInventoryBundle(shield));
      }
    }

    if (loadout.armor) {
      setters.equipArmor(loadout.armor);
      addIfMissing(loadout.armor.name, buildArmorInventoryBundle(loadout.armor));
    }
  }

  const bundle = [...loadout.startingEquipment, ...extras];
  if (bundle.length > 0) addEquipmentBundle(bundle);
}
