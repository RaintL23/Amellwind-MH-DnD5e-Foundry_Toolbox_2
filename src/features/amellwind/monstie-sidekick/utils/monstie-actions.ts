import type { Entry, Monster } from "@/shared/types";
import { entryToPlainText } from "@/shared/utils/entry-text.utils";

const RECHARGE_PATTERN = /recharge/i;
const LIMITED_USE_PATTERN =
  /\b\d+\s*\/\s*(?:day|short rest|long rest)\b|\bper day\b|\brecharges? (?:after|when|on) (?:a|it finishes a) (?:short|long)/i;
const MULTIATTACK_PATTERN = /multiattack/i;
const DAMAGE_DICE_PATTERN = /\d+d\d+/;
const ATTACK_ROLL_PATTERN = /\b(?:melee|ranged)\b[^:.]{0,40}\battack\s*:/i;

function fullText(entry: Entry): string {
  return `${entry.name} ${entryToPlainText(entry)}`;
}

export function isRechargeEntry(entry: Entry): boolean {
  return RECHARGE_PATTERN.test(fullText(entry));
}

export function isLimitedUseEntry(entry: Entry): boolean {
  return LIMITED_USE_PATTERN.test(fullText(entry));
}

export function isAttackRollEntry(entry: Entry): boolean {
  const text = entryToPlainText(entry);
  return ATTACK_ROLL_PATTERN.test(text) && DAMAGE_DICE_PATTERN.test(text);
}

export function isSignatureAttackCandidate(entry: Entry): boolean {
  if (MULTIATTACK_PATTERN.test(entry.name)) return false;
  return isRechargeEntry(entry) || isLimitedUseEntry(entry);
}

/** Creature: any trait or action that isn't Multiattack, recharge or limited use. */
export function isCreatureFeatureCandidate(entry: Entry): boolean {
  if (MULTIATTACK_PATTERN.test(entry.name)) return false;
  return !isRechargeEntry(entry) && !isLimitedUseEntry(entry);
}

/** Monstie Trait: non-damage traits, except Legendary / Magic Resistance. */
export function isNonDamageTrait(entry: Entry): boolean {
  if (/legendary resistance|magic resistance/i.test(entry.name)) return false;
  if (/paragon/i.test(entry.name)) return false;
  const text = entryToPlainText(entry);
  return !DAMAGE_DICE_PATTERN.test(text) && !/\btakes? \d+\b[^.]*\bdamage\b/i.test(text);
}

/**
 * Signature Attack: the original's recharge action, or else a limited-use one.
 * When the original has neither, damaging actions are offered for DM adjudication.
 */
export function getSignatureAttackOptions(monster: Monster): Entry[] {
  const actions = monster.actions.filter(
    (a) => !MULTIATTACK_PATTERN.test(a.name),
  );
  const recharge = actions.filter(isRechargeEntry);
  if (recharge.length > 0) return recharge;
  const limited = actions.filter(isLimitedUseEntry);
  if (limited.length > 0) return limited;
  return actions.filter((a) => DAMAGE_DICE_PATTERN.test(entryToPlainText(a)));
}

/** True when the monster has a recharge or limited-use action (rules-as-written signature). */
export function hasRulesSignatureAttack(monster: Monster): boolean {
  return monster.actions.some(isSignatureAttackCandidate);
}

/** Template action: one attack of the original monster that deals damage. */
export function getBaseAttackOptions(monster: Monster): Entry[] {
  const attacks = monster.actions.filter(
    (a) =>
      !MULTIATTACK_PATTERN.test(a.name) &&
      isAttackRollEntry(a) &&
      !isRechargeEntry(a) &&
      !isLimitedUseEntry(a),
  );
  if (attacks.length > 0) return attacks;
  return monster.actions.filter(
    (a) =>
      !MULTIATTACK_PATTERN.test(a.name) &&
      isAttackRollEntry(a),
  );
}

export function getTraitOptions(monster: Monster): Entry[] {
  return monster.traits.filter(isNonDamageTrait);
}

export function getCreatureFeatureOptions(
  monster: Monster,
  excludeNames: string[] = [],
): Entry[] {
  const excluded = new Set(excludeNames.filter(Boolean));
  const seen = new Set<string>();
  return [
    ...monster.traits,
    ...monster.actions,
    ...(monster.bonusActions ?? []),
  ].filter((entry) => {
    if (excluded.has(entry.name) || seen.has(entry.name)) return false;
    if (!isCreatureFeatureCandidate(entry)) return false;
    seen.add(entry.name);
    return true;
  });
}

export function pickDefaultSignatureAttack(monster: Monster): string {
  return getSignatureAttackOptions(monster)[0]?.name ?? "";
}

export function pickDefaultBaseAttack(monster: Monster): string {
  return getBaseAttackOptions(monster)[0]?.name ?? "";
}
