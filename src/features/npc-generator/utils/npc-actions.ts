import type { AbilityKey, AbilityScores, Entry, SkillKey } from "@/shared/types";
import type { NpcAttackDefinition, NpcTemplate } from "@/shared/types/npc.types";
import { getAbilityModifier, formatModifier } from "@/shared/utils/cr.utils";
import {
  collectPrimaryWeaponFeatureActions,
  findWeaponByName,
  getPrimaryMhAttack,
  getWeaponRarityIndex,
  hasRapidFireFeature,
  type NpcWeaponContext,
  resolveAttacksWithWeapons,
} from "./npc-weapon.utils";
import {
  buildVariantWeaponActions,
  getVariantMultiattackText,
  isVariantPrimaryWeapon,
} from "./npc-variant-attacks";

function rollAverage(dice: string): number {
  const match = dice.match(/(\d+)d(\d+)/);
  if (!match) return 0;
  const count = Number(match[1]);
  const sides = Number(match[2]);
  return count * (Math.floor(sides / 2) + 1);
}

function formatDamageExpression(
  damageDice: string,
  abilityMod: number,
  flatBonus: number,
): string {
  const totalBonus = abilityMod + flatBonus;
  if (totalBonus === 0) return damageDice;
  return `${damageDice}${totalBonus >= 0 ? ` + ${totalBonus}` : ` ${totalBonus}`}`;
}

function formatAttackEntry(
  attack: NpcAttackDefinition,
  abilities: AbilityScores,
  pb: number,
): string {
  const abilityMod = getAbilityModifier(abilities[attack.ability]);
  const hit = pb + abilityMod;
  const flat = attack.flatDamageBonus ?? 0;
  const avgDamage = rollAverage(attack.damageDice) + abilityMod + flat;
  const attackLabel =
    attack.kind === "mw" ? "Melee Weapon Attack" : "Ranged Weapon Attack";
  const distanceLabel = attack.kind === "mw" ? "reach" : "range";
  const damageExpr = formatDamageExpression(attack.damageDice, abilityMod, flat);

  return `${attackLabel}: ${formatModifier(hit)} to hit, ${distanceLabel} ${attack.reachOrRange}, one target. Hit: ${avgDamage} (${damageExpr}) ${attack.damageType} damage.`;
}

export function buildNpcActions(
  template: NpcTemplate,
  abilities: AbilityScores,
  pb: number,
  hitDiceCount: number,
  weaponContext: NpcWeaponContext | null = null,
): Entry[] {
  const rarityIndex = getWeaponRarityIndex(hitDiceCount, template.tier);
  const resolvedAttacks = resolveAttacksWithWeapons(
    template.attacks,
    weaponContext,
    rarityIndex,
  );
  const actions: Entry[] = [];
  const roleLabel = template.name.toLowerCase();

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
        `The ${roleLabel} makes two attacks with its ${primaryAttack.name.toLowerCase()}.`,
      ],
    });
  } else if (rapidFire && primaryAttack) {
    actions.push({
      name: "Multiattack",
      entries: [
        `The ${roleLabel} makes two ranged attacks with its ${primaryAttack.name.toLowerCase()}.`,
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
    ),
  );

  return actions;
}

export function buildNpcReactions(
  template: NpcTemplate,
): Entry[] {
  return (template.reactions ?? []).map((r) => ({
    name: r.name,
    entries: r.entries,
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
): Partial<Record<SkillKey, number>> {
  const allSkills = new Set<SkillKey>([
    ...template.skillProficiencies,
    ...backgroundSkillKeys,
  ]);
  const skills: Partial<Record<SkillKey, number>> = {};

  for (const key of allSkills) {
    const abilityKey = SKILL_ABILITY[key] ?? "wis";
    skills[key] = getAbilityModifier(abilities[abilityKey]) + pb;
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
