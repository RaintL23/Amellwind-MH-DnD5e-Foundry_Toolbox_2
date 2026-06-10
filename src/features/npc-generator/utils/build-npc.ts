import type { Background, Species } from "@/shared/types";
import type { GeneratedNpc, NpcDraft, NpcTemplate } from "@/shared/types/npc.types";
import { getAbilityModifier } from "@/shared/utils/cr.utils";
import { assignAbilitiesFromArray, rollAttributeArray } from "./npc-abilities";
import { applyAbilityPowerScaling } from "./npc-attack.utils";
import {
  buildNpcActions,
  buildNpcReactions,
  buildNpcSavingThrows,
  buildNpcSkills,
} from "./npc-actions";
import {
  buildNpcDisplayName,
  buildNpcDescriptor,
} from "./npc-descriptor";
import { buildNpcSubjectRef } from "./npc-feature-text.utils";
import { buildNpcSpellcasting } from "./npc-spellcasting";
import {
  getNpcHitPoints,
  parseSpeciesSpeed,
} from "./npc-stats";
import { resolveNpcPowerProfile } from "./npc-power-scaling";
import { buildNpcTraits, parseBackgroundSkills } from "./npc-traits";
import { resolveNpcSize } from "./npc-size.utils";
import {
  resolveNpcArmorClass,
  resolveNpcDamageResistances,
  resolveNpcDamageImmunities,
} from "./npc-armor.utils";
import {
  getPrimaryShieldAcBonus,
  type NpcWeaponContext,
} from "./npc-weapon.utils";

export function buildNpcFromDraft(
  draft: NpcDraft,
  template: NpcTemplate,
  species: Species,
  background: Background | null,
  abilityScores?: number[],
  weaponContext: NpcWeaponContext | null = null,
): GeneratedNpc {
  const hitDiceCount = Math.min(20, Math.max(1, draft.hitDiceCount));
  const scores = abilityScores ?? rollAttributeArray(draft.attributeArray);
  const powerProfile = resolveNpcPowerProfile(template.tier, hitDiceCount);
  const abilities = applyAbilityPowerScaling(
    assignAbilitiesFromArray(template.abilityPriority, scores, species, draft.hitDie),
    template.abilityPriority,
    powerProfile,
  );
  const pb = powerProfile.proficiencyBonus;
  const cr = powerProfile.crLabel;

  const backgroundSkills = background
    ? parseBackgroundSkills(background.proficiencies.skills)
    : [];

  const skills = buildNpcSkills(
    template,
    abilities,
    pb,
    backgroundSkills,
    powerProfile,
  );
  const prcMod = skills.prc ?? getAbilityModifier(abilities.wis);
  const passivePerception = 10 + prcMod;

  const size = resolveNpcSize(draft.hitDie, species);
  const speed = parseSpeciesSpeed(species.speed);

  const rarityIndex = powerProfile.weaponRarityIndex;
  const shieldBonus = getPrimaryShieldAcBonus(
    template.attacks,
    weaponContext,
    rarityIndex,
  );
  const armorClass = resolveNpcArmorClass(
    template,
    abilities,
    species,
    shieldBonus,
    powerProfile.acBonus,
  );
  const damageResistances = resolveNpcDamageResistances(species);
  const damageImmunities = resolveNpcDamageImmunities(species);

  const subjectRef = buildNpcSubjectRef(draft.customName, species, template);
  const spellcasting = buildNpcSpellcasting(
    template,
    abilities,
    pb,
    powerProfile,
    subjectRef,
  );

  return {
    name: buildNpcDisplayName(draft.customName, species, template),
    descriptor: buildNpcDescriptor(
      draft.gender,
      species,
      template,
      background,
    ),
    size,
    type: {
      type: "humanoid",
      tags: [species.name.toLowerCase()],
    },
    alignment: ["A"],
    armorClass,
    hp: getNpcHitPoints(abilities, hitDiceCount, draft.hitDie),
    speed,
    initiative: getAbilityModifier(abilities.dex),
    proficiencyBonus: pb,
    abilities,
    savingThrows: buildNpcSavingThrows(template, abilities, pb),
    skills: skills as GeneratedNpc["skills"],
    passivePerception,
    senses: species.darkvision ? { darkvision: species.darkvision } : {},
    damageImmunities,
    damageResistances,
    damageVulnerabilities: [],
    conditionImmunities: [],
    languages: ["Common"],
    traits: buildNpcTraits(
      template,
      species,
      background,
      draft.hideFeatures,
      subjectRef,
    ),
    actions: buildNpcActions(
      template,
      abilities,
      pb,
      powerProfile,
      weaponContext,
      subjectRef,
    ),
    reactions: buildNpcReactions(template, subjectRef),
    spellcasting: spellcasting.length > 0 ? spellcasting : undefined,
    source: "AGMH",
    cr,
    group: background ? [background.faction] : undefined,
  };
}
