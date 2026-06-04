import type { Background, Species } from "@/shared/types";
import type { GeneratedNpc, NpcDraft, NpcTemplate } from "@/shared/types/npc.types";
import { getAbilityModifier } from "@/shared/utils/cr.utils";
import { assignAbilitiesFromArray, rollAttributeArray } from "./npc-abilities";
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
import {
  getNpcArmorClass,
  getNpcHitPoints,
  getNpcProficiencyBonus,
  parseSpeciesSpeed,
} from "./npc-stats";
import { resolveNpcPowerProfile } from "./npc-power-scaling";
import { buildNpcTraits, parseBackgroundSkills } from "./npc-traits";
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
  const abilities = assignAbilitiesFromArray(
    template.abilityPriority,
    scores,
    species,
  );
  const pb = getNpcProficiencyBonus(hitDiceCount, template.tier);
  const powerProfile = resolveNpcPowerProfile(template.tier, hitDiceCount);
  const cr = powerProfile.crLabel;

  const backgroundSkills = background
    ? parseBackgroundSkills(background.proficiencies.skills)
    : [];

  const skills = buildNpcSkills(template, abilities, pb, backgroundSkills);
  const prcMod = skills.prc ?? getAbilityModifier(abilities.wis);
  const passivePerception = 10 + prcMod;

  const size = species.sizes[0] ?? "Medium";
  const speed = parseSpeciesSpeed(species.speed);

  const damageResistances = species.resistances.map((r) => r);
  const rarityIndex = powerProfile.weaponRarityIndex;
  const armorClass = getNpcArmorClass(template, abilities);
  const shieldBonus = getPrimaryShieldAcBonus(
    template.attacks,
    weaponContext,
    rarityIndex,
  );
  if (shieldBonus && armorClass[0]) {
    armorClass[0] = {
      ...armorClass[0],
      ac: armorClass[0].ac + shieldBonus,
      from: [...(armorClass[0].from ?? []), `+${shieldBonus} MH shield`],
    };
  }

  if (powerProfile.acBonus > 0 && armorClass[0]) {
    armorClass[0] = {
      ...armorClass[0],
      ac: armorClass[0].ac + powerProfile.acBonus,
      from: [
        ...(armorClass[0].from ?? []),
        `+${powerProfile.acBonus} upgraded armor (${powerProfile.weaponRarityLabel})`,
      ],
    };
  }

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
    damageImmunities: [],
    damageResistances,
    damageVulnerabilities: [],
    conditionImmunities: [],
    languages: ["Common"],
    traits: buildNpcTraits(template, species, background, draft.hideFeatures),
    actions: buildNpcActions(
      template,
      abilities,
      pb,
      hitDiceCount,
      weaponContext,
    ),
    reactions: buildNpcReactions(template),
    source: "AGMH",
    cr,
    group: background ? [background.faction] : undefined,
  };
}
