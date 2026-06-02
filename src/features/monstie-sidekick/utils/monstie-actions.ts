import type { Entry, Monster } from "@/shared/types";

const RECHARGE_PATTERN = /recharge/i;
const LIMITED_USE_PATTERN = /\b(\d\/day|\/short rest|\/long rest|per day)\b/i;
const MULTIATTACK_PATTERN = /multiattack/i;
const DAMAGE_ONLY_PATTERN = /\d+d\d+/;

export function isSignatureAttackCandidate(entry: Entry): boolean {
  const text = entry.entries.join(" ");
  if (MULTIATTACK_PATTERN.test(entry.name)) return false;
  return (
    RECHARGE_PATTERN.test(text) ||
    RECHARGE_PATTERN.test(entry.name) ||
    LIMITED_USE_PATTERN.test(text)
  );
}

export function isCreatureFeatureCandidate(entry: Entry): boolean {
  const text = entry.entries.join(" ");
  if (MULTIATTACK_PATTERN.test(entry.name)) return false;
  if (RECHARGE_PATTERN.test(text) || LIMITED_USE_PATTERN.test(text)) return false;
  return true;
}

export function isNonDamageTrait(entry: Entry): boolean {
  const text = entry.entries.join(" ");
  if (/legendary resistance|magic resistance/i.test(entry.name)) return false;
  if (/paragon/i.test(entry.name)) return false;
  if (DAMAGE_ONLY_PATTERN.test(text) && !/bonus|advantage|disadvantage|immune|resist/i.test(text)) {
    return false;
  }
  return true;
}

export function getSignatureAttackOptions(monster: Monster): Entry[] {
  const fromActions = monster.actions.filter(isSignatureAttackCandidate);
  if (fromActions.length > 0) return fromActions;
  return monster.actions.filter(
    (a) => !MULTIATTACK_PATTERN.test(a.name) && DAMAGE_ONLY_PATTERN.test(a.entries.join(" ")),
  );
}

export function getTraitOptions(monster: Monster): Entry[] {
  return monster.traits.filter(isNonDamageTrait);
}

export function getCreatureFeatureOptions(monster: Monster): Entry[] {
  return [
    ...monster.traits.filter(isCreatureFeatureCandidate),
    ...monster.actions.filter(isCreatureFeatureCandidate),
  ];
}

export function pickDefaultSignatureAttack(monster: Monster): string {
  const options = getSignatureAttackOptions(monster);
  return options[0]?.name ?? monster.actions[0]?.name ?? "Attack";
}
