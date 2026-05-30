import { DiceRoll, DamageBreakdown, DamageSource, CombatCalculation, EquippedWeapon, CritRune } from "@/shared/types";
import { Character } from "../models/Character";

/**
 * Parses a dice notation string like "1d8", "2d6", "1d12" into structured data.
 */
export function parseDiceNotation(notation: string): DiceRoll {
  const match = notation.match(/^(\d+)d(\d+)$/i);
  if (!match) {
    return { count: 0, sides: 0, average: 0, notation };
  }
  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const average = count * ((sides + 1) / 2);
  return { count, sides, average, notation };
}

/**
 * Extracts crit-range information from a rune's weapon effect text.
 * Returns null if the effect doesn't affect critical hit range.
 *
 * Patterns handled:
 *   - "critical hit range is increased by N"  → permanent +N expansion
 *   - "critical hit on a roll of N or higher" → conditional (Critical Draw family)
 */
function extractCritInfo(
  weaponEffect: string,
  runeName: string,
  monsterName: string,
): CritRune | null {
  // Permanent range expansion: "critical hit range is increased by N"
  const permanentMatch = weaponEffect.match(
    /critical hit range is increased by (\d+)/i,
  );
  if (permanentMatch) {
    const bonus = parseInt(permanentMatch[1], 10);
    return {
      name: runeName,
      monsterName,
      rangeBonus: bonus,
      conditional: false,
      description: permanentMatch[0],
    };
  }

  // Conditional range: "critical hit on a roll of N or higher" (Critical Draw)
  const conditionalMatch = weaponEffect.match(
    /critical hit on a roll of (\d+) or higher/i,
  );
  if (conditionalMatch) {
    const minRoll = parseInt(conditionalMatch[1], 10);
    const bonus = 20 - minRoll; // e.g. 17 → +3
    return {
      name: runeName,
      monsterName,
      rangeBonus: bonus,
      conditional: true,
      description: conditionalMatch[0],
    };
  }

  return null;
}

/**
 * Extracts extra damage dice from rune weapon effects.
 * Looks for patterns like "+1d6 fire damage" in the weaponEffect text.
 */
function extractRuneDamageDice(weaponEffect: string | null): DiceRoll[] {
  if (!weaponEffect) return [];
  const dice: DiceRoll[] = [];
  const pattern = /(\d+d\d+)/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(weaponEffect)) !== null) {
    const parsed = parseDiceNotation(match[1]);
    if (parsed.count > 0) dice.push(parsed);
  }
  return dice;
}

/**
 * Calculates damage breakdown for a single equipped weapon.
 */
function calculateWeaponDamage(
  character: Character,
  equipped: EquippedWeapon,
  attacksPerTurn: number,
  isOffHand: boolean,
): DamageBreakdown {
  // Use versatile (dmg2) dice if weapon is in two-handed mode and has dmg2
  const useTwoHandedDice = equipped.useVersatile && equipped.weapon.dmg2;
  const diceNotation = useTwoHandedDice ? equipped.weapon.dmg2! : equipped.weapon.dmg1;
  const weaponDice = parseDiceNotation(diceNotation);

  const abilityUsed = character.getAttackAbility(equipped.weapon.properties);
  // Off-hand doesn't add ability modifier to damage (standard 5e rule)
  const abilityModifier = isOffHand ? 0 : character.getModifier(abilityUsed);
  const attackBonus = character.getAttackBonus(abilityUsed);

  // Build detailed sources
  const sources: DamageSource[] = [];

  // Source: weapon dice
  sources.push({
    source: equipped.weapon.name + (useTwoHandedDice ? " (two-handed)" : ""),
    type: "weapon",
    dice: weaponDice,
    flatBonus: 0,
    average: weaponDice.average,
  });

  // Source: ability modifier
  if (abilityModifier !== 0) {
    sources.push({
      source: `${abilityUsed.toUpperCase()} modifier`,
      type: "ability",
      dice: null,
      flatBonus: abilityModifier,
      average: abilityModifier,
    });
  }

  // Collect rune damage dice with source tracking
  const runeDice: DiceRoll[] = [];
  const critRunes: CritRune[] = [];

  for (const rune of equipped.runes) {
    if (rune) {
      const dice = extractRuneDamageDice(rune.weaponEffect);
      for (const d of dice) {
        runeDice.push(d);
        sources.push({
          source: `${rune.name} (${rune.monsterName})`,
          type: "rune",
          dice: d,
          flatBonus: 0,
          average: d.average,
        });
      }

      const crit = rune.weaponEffect
        ? extractCritInfo(rune.weaponEffect, rune.name, rune.monsterName)
        : null;
      if (crit) critRunes.push(crit);
    }
  }

  // Sum permanent crit range bonuses (conditional ones don't change base critRange)
  const permanentCritBonus = critRunes
    .filter((c) => !c.conditional)
    .reduce((sum, c) => sum + c.rangeBonus, 0);
  const critRange = Math.max(1, 20 - permanentCritBonus);

  const runeAverage = runeDice.reduce((sum, d) => sum + d.average, 0);
  const totalPerHit = weaponDice.average + abilityModifier + runeAverage;

  // Off-hand uses bonus action = 1 attack only
  const effectiveAttacks = isOffHand ? 1 : attacksPerTurn;
  const totalPerTurn = totalPerHit * effectiveAttacks;

  // Build dice expression
  const parts: string[] = [weaponDice.notation];
  if (runeDice.length > 0) {
    parts.push(...runeDice.map((d) => d.notation));
  }
  if (abilityModifier !== 0) {
    parts.push(abilityModifier > 0 ? `+${abilityModifier}` : `${abilityModifier}`);
  }
  const diceExpression = parts.join(" + ");

  return {
    weaponDice,
    abilityModifier,
    abilityUsed,
    runeDice,
    totalPerHit,
    attacksPerTurn: effectiveAttacks,
    attackBonus,
    totalPerTurn,
    diceExpression,
    sources,
    critRange,
    critRunes,
  };
}

/**
 * Checks if dual-wielding is valid (both weapons must have Light property).
 */
function canDualWield(mainHand: EquippedWeapon | null, offHand: EquippedWeapon | null): boolean {
  if (!mainHand || !offHand) return false;
  return (
    mainHand.weapon.properties.includes("L") &&
    offHand.weapon.properties.includes("L")
  );
}

/**
 * Calculates full combat DPS for the character's current equipment.
 */
export function calculateCombat(
  character: Character,
  mainHand: EquippedWeapon | null,
  offHand: EquippedWeapon | null,
  attacksPerTurn: number,
): CombatCalculation {
  let mainHandBreakdown: DamageBreakdown | null = null;
  let offHandBreakdown: DamageBreakdown | null = null;

  if (mainHand) {
    mainHandBreakdown = calculateWeaponDamage(character, mainHand, attacksPerTurn, false);
  }

  if (offHand && canDualWield(mainHand, offHand)) {
    offHandBreakdown = calculateWeaponDamage(character, offHand, 1, true);
  }

  const totalDPT =
    (mainHandBreakdown?.totalPerTurn ?? 0) + (offHandBreakdown?.totalPerTurn ?? 0);

  return {
    mainHand: mainHandBreakdown,
    offHand: offHandBreakdown,
    totalDPT,
  };
}
