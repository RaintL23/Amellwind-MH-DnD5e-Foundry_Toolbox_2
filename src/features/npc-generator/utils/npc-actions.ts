import type { AbilityKey, AbilityScores, Entry, SkillKey } from "@/shared/types";
import type { NpcTemplate } from "@/shared/types/npc.types";
import type { NpcPowerProfile } from "./npc-power-scaling";
import { getAbilityModifier, formatModifier } from "@/shared/utils/cr.utils";
import {
  formatAttackEntry,
  scaleNpcAttacks,
} from "./npc-attack.utils";
import {
  collectPrimaryWeaponFeatureActions,
  findWeaponByName,
  getPrimaryMhAttack,
  hasRapidFireFeature,
  type NpcWeaponContext,
  resolveAttacksWithWeapons,
} from "./npc-weapon.utils";
import {
  buildVariantWeaponActions,
  getVariantMultiattackText,
  isVariantPrimaryWeapon,
} from "./npc-variant-attacks";
import {
  formatSubjectAtSentenceStart,
  getTemplateRoleNouns,
  toNpcFeatureText,
} from "./npc-feature-text.utils";

export function buildNpcActions(
  template: NpcTemplate,
  abilities: AbilityScores,
  pb: number,
  powerProfile: NpcPowerProfile,
  weaponContext: NpcWeaponContext | null = null,
  subjectRef = "the creature",
): Entry[] {
  const rarityIndex = powerProfile.weaponRarityIndex;
  const resolvedAttacks = scaleNpcAttacks(
    resolveAttacksWithWeapons(
      template.attacks,
      weaponContext,
      rarityIndex,
    ),
    powerProfile,
  );
  const actions: Entry[] = [];
  const roleLabel = template.name.toLowerCase();
  const subject = formatSubjectAtSentenceStart(subjectRef);
  const hitDiceCount = powerProfile.hitDiceCount;

  const primaryAttack = resolvedAttacks[0];
  const secondaryAttacks = resolvedAttacks.slice(1);
  const primaryMh = getPrimaryMhAttack(template.attacks);
  const primaryMhWeapon =
    weaponContext && primaryMh?.mhWeaponName
      ? findWeaponByName(weaponContext.weapons, primaryMh.mhWeaponName)
      : undefined;
  const rapidFire =
    primaryMhWeapon &&
    weaponContext &&
    hasRapidFireFeature(primaryMhWeapon, weaponContext.featuresMap);
  const usesVariantPrimary =
    primaryMhWeapon && isVariantPrimaryWeapon(primaryMhWeapon.name);
  const variantMultiattack =
    usesVariantPrimary && primaryMhWeapon
      ? getVariantMultiattackText(primaryMhWeapon, roleLabel)
      : undefined;

  if (variantMultiattack && hitDiceCount >= template.multiattackAt) {
    actions.push({
      name: "Multiattack",
      entries: [variantMultiattack],
    });
  } else if (hitDiceCount >= template.multiattackAt && !rapidFire) {
    actions.push({
      name: "Multiattack",
      entries: [
        `${subject} makes two attacks with its ${primaryAttack.name.toLowerCase()}.`,
      ],
    });
  } else if (rapidFire && primaryAttack) {
    actions.push({
      name: "Multiattack",
      entries: [
        `${subject} makes two ranged attacks with its ${primaryAttack.name.toLowerCase()}.`,
      ],
    });
  }

  if (usesVariantPrimary && primaryAttack && primaryMhWeapon && weaponContext) {
    actions.push(
      ...buildVariantWeaponActions(
        primaryAttack,
        primaryMhWeapon,
        abilities,
        pb,
        rarityIndex,
        roleLabel,
        weaponContext,
      ),
    );
  } else if (primaryAttack) {
    actions.push({
      name: primaryAttack.name,
      entries: [formatAttackEntry(primaryAttack, abilities, pb)],
    });
  }

  for (const attack of secondaryAttacks) {
    actions.push({
      name: `${attack.name} (Secondary)`,
      entries: [formatAttackEntry(attack, abilities, pb)],
    });
  }

  actions.push(
    ...collectPrimaryWeaponFeatureActions(
      template.attacks,
      weaponContext,
      rarityIndex,
      subjectRef,
    ),
  );

  return actions;
}

export function buildNpcReactions(
  template: NpcTemplate,
  subjectRef = "the creature",
): Entry[] {
  const roleNouns = getTemplateRoleNouns(template);
  return (template.reactions ?? []).map((r) => ({
    name: r.name,
    entries: r.entries.map((e) => toNpcFeatureText(e, subjectRef, roleNouns)),
  }));
}

const SKILL_ABILITY: Record<SkillKey, AbilityKey> = {
  ath: "str",
  acr: "dex",
  slt: "dex",
  ste: "dex",
  arc: "int",
  his: "int",
  inv: "int",
  rel: "int",
  nat: "int",
  dec: "cha",
  itm: "cha",
  per: "cha",
  prf: "cha",
  prc: "wis",
  ins: "wis",
  med: "wis",
  sur: "wis",
  ani: "wis",
};

export function buildNpcSkills(
  template: NpcTemplate,
  abilities: AbilityScores,
  pb: number,
  backgroundSkillKeys: SkillKey[],
  powerProfile?: NpcPowerProfile,
): Partial<Record<SkillKey, number>> {
  const allSkills = new Set<SkillKey>([
    ...template.skillProficiencies,
    ...backgroundSkillKeys,
  ]);
  const skills: Partial<Record<SkillKey, number>> = {};
  const skillBoost = powerProfile?.skillBoost ?? 0;

  for (const key of allSkills) {
    const abilityKey = SKILL_ABILITY[key] ?? "wis";
    skills[key] = getAbilityModifier(abilities[abilityKey]) + pb + skillBoost;
  }

  return skills;
}

export function buildNpcSavingThrows(
  template: NpcTemplate,
  abilities: AbilityScores,
  pb: number,
): Partial<Record<AbilityKey, string>> {
  const saves: Partial<Record<AbilityKey, string>> = {};
  for (const key of template.saveProficiencies) {
    saves[key] = formatModifier(getAbilityModifier(abilities[key]) + pb);
  }
  return saves;
}
