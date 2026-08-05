import type {
  BuilderOptionalFeatureSelection,
  CartEntry,
  EquippedWeapon,
} from "@/shared/types";
import type { CharacterBuilderContextValue } from "../context/character-builder.types";
import type { BuilderChoiceSnapshot } from "./builder-snapshot";

/** Minimal inventory surface needed to restore the snapshot's loose items. */
export interface ApplyBuilderSnapshotInventory {
  clearInventory: () => void;
  addToInventory: (entry: CartEntry) => void;
}

/**
 * Restores the full builder-choice state from a lossless snapshot. Assumes the
 * identity (class/subclass/species/background) and level have already been set,
 * so the synchronous reset effects those setters trigger have already run.
 *
 * Shared by the Foundry import (`useFoundryImport`) and the local autosave
 * rehydration so both paths reconstruct a build identically.
 */
export function applyBuilderSnapshot(
  builder: CharacterBuilderContextValue,
  inventory: ApplyBuilderSnapshotInventory,
  snap: BuilderChoiceSnapshot,
): void {
  // ── Global toggles (homebrew is applied earlier, before identity) ──
  builder.setAbilityScoreMethod(snap.abilityScoreMethod);
  builder.setUseUnarmedStrike(snap.useUnarmedStrike);
  builder.setAttacksPerTurnOverride(snap.attacksPerTurnOverride);
  builder.setFaction(snap.faction);
  builder.setPersonality(snap.personality);

  // ── Ability score origin choices ──
  builder.setUseTashaOrigin(snap.useTashaOrigin);
  builder.setTashaPlus2(snap.tashaPlus2);
  builder.setTashaPlus1(snap.tashaPlus1);
  snap.speciesAbilityChoices.forEach((ability, index) =>
    builder.setSpeciesAbilityChoice(index, ability),
  );
  builder.setBackgroundAsiMode(snap.backgroundAsiMode);
  builder.setBackgroundAsiPlus2(snap.backgroundAsiPlus2);
  builder.setBackgroundAsiPlus1(snap.backgroundAsiPlus1);

  // ── Feats & origin feats ──
  snap.featSelections.forEach((feat, index) =>
    builder.setFeatAtIndex(index, feat),
  );
  builder.setSpeciesOriginFeat(snap.speciesOriginFeat);
  builder.setBackgroundOriginFeat(snap.backgroundOriginFeat);
  snap.optionalFeatureOriginFeats.forEach((feat, index) =>
    builder.setOptionalFeatureOriginFeatAtIndex(index, feat),
  );
  builder.setOriginFeatSkillChoices(snap.originFeatSkillChoices);
  for (const [index, choices] of Object.entries(
    snap.optionalFeatureOriginFeatSkillChoices,
  )) {
    builder.setOptionalFeatureOriginFeatSkillChoicesAtIndex(
      Number(index),
      choices,
    );
  }

  // ── Optional feature selections (fighting styles, invocations, …) ──
  for (const [progressionId, picks] of Object.entries(
    snap.optionalFeatureSelections,
  )) {
    builder.setOptionalFeaturesForProgression(
      progressionId,
      picks as BuilderOptionalFeatureSelection[],
    );
  }
  builder.setSpeciesSpellGroupChoice(snap.speciesSpellGroupChoice);

  // ── Proficiency choices ──
  for (const [index, choices] of Object.entries(snap.classSkillChoices)) {
    builder.setClassSkillChoicesAtIndex(Number(index), choices);
  }
  builder.setBackgroundSkillChoices(snap.backgroundSkillChoices);
  builder.setSpeciesSkillChoices(snap.speciesSkillChoices);
  for (const [index, choices] of Object.entries(snap.featSkillChoices)) {
    builder.setFeatSkillChoices(Number(index), choices);
  }
  for (const [grantId, choices] of Object.entries(snap.expertiseChoices)) {
    builder.setExpertiseChoices(grantId, choices);
  }
  for (const [index, choices] of Object.entries(snap.classToolChoices)) {
    builder.setClassToolChoicesAtIndex(Number(index), choices);
  }
  builder.setBackgroundToolChoices(snap.backgroundToolChoices);
  builder.setSpeciesToolChoices(snap.speciesToolChoices);
  for (const [index, choices] of Object.entries(snap.classLanguageChoices)) {
    builder.setClassLanguageChoicesAtIndex(Number(index), choices);
  }
  builder.setBackgroundLanguageChoices(snap.backgroundLanguageChoices);
  builder.setSpeciesLanguageChoices(snap.speciesLanguageChoices);
  for (const [index, choices] of Object.entries(snap.speciesDefenseChoices)) {
    builder.setSpeciesDefenseChoicesAtIndex(Number(index), choices);
  }

  // ── Spells ──
  builder.clearSpells();
  for (const [level, spells] of Object.entries(snap.spellSelections)) {
    for (const spell of spells) builder.addSpell(Number(level), spell);
  }

  // ── Equipment (lossless: preserves properties/tags, rarity, runes) ──
  const eq = snap.equipment;
  const restoreWeapon = (
    slot: "mainHand" | "offHand",
    entry: EquippedWeapon | null,
  ) => {
    if (!entry) return;
    builder.equipWeapon(slot, entry.weapon, entry.rarity);
    const legacy = entry as EquippedWeapon & { useVersatile?: boolean };
    const modeIndex =
      typeof entry.activeModeIndex === "number"
        ? entry.activeModeIndex
        : legacy.useVersatile
          ? 1
          : 0;
    if (modeIndex > 0) builder.setWeaponMode(slot, modeIndex);
    entry.runes.forEach((rune, index) => {
      if (rune) builder.assignWeaponRune(slot, index, rune);
    });
  };
  restoreWeapon("mainHand", eq.mainHand);
  restoreWeapon("offHand", eq.offHand);

  if (eq.armor) {
    builder.equipArmor(eq.armor.armor);
    builder.setArmorRarity(eq.armor.rarity);
    eq.armor.runes.forEach((rune, index) => {
      if (rune) builder.assignArmorRune(index, rune);
    });
  }
  if (eq.shield) builder.equipShield(eq.shield);

  if (eq.trinket1) {
    builder.equipTrinket("trinket1", eq.trinket1.name);
    if (eq.trinket1.rune) {
      builder.assignTrinketRune(
        "trinket1",
        eq.trinket1.rune,
        eq.trinket1.runeMaterialEffect,
      );
    }
  }
  if (eq.trinket2) {
    builder.equipTrinket("trinket2", eq.trinket2.name);
    if (eq.trinket2.rune) {
      builder.assignTrinketRune(
        "trinket2",
        eq.trinket2.rune,
        eq.trinket2.runeMaterialEffect,
      );
    }
  }

  inventory.clearInventory();
  for (const item of eq.inventory) inventory.addToInventory(item);
}
