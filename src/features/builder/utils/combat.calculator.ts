import {
  Class,
  DiceRoll,
  DamageBreakdown,
  DamageSource,
  CombatCalculation,
  EquippedWeapon,
  CritRune,
  Species,
} from "@/shared/types";
import { Character } from "../models/Character";
import {
  getActiveWeaponDamage,
  getActiveWeaponDamageLabel,
} from "@/features/weapons/utils/weapon-mode.utils";
import { blocksOffHand } from "@/features/weapons/utils/weapon-hands.utils";
import { getUnarmedStrikeProfile } from "./unarmed-strike.utils";

function hasLightProperty(equipped: EquippedWeapon): boolean {
  return equipped.weapon.properties.includes("L");
}

/**
 * Parses a dice notation string like "1d8", "2d6", "1d12" into structured data.
 */
function parseDiceNotation(notation: string): DiceRoll {
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
  useAmellwindHomebrew = true,
): DamageBreakdown {
  const diceNotation = getActiveWeaponDamage(equipped);
  const damageModeLabel = getActiveWeaponDamageLabel(equipped);
  const weaponDice = parseDiceNotation(diceNotation);

  const abilityUsed = character.getAttackAbility(equipped.weapon.properties);
  // Off-hand doesn't add ability modifier to damage (standard 5e rule)
  const abilityModifier = isOffHand ? 0 : character.getModifier(abilityUsed);
  const attackBonus = character.getAttackBonus(abilityUsed);

  // Build detailed sources
  const sources: DamageSource[] = [];

  // Source: weapon dice
  sources.push({
    source:
      equipped.weapon.name +
      (damageModeLabel !== "Damage" ? ` (${damageModeLabel})` : ""),
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

  const runesToApply = useAmellwindHomebrew ? equipped.runes : [];

  for (const rune of runesToApply) {
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
 * Whether off-hand weapon damage should be included in DPT.
 * Amellwind: both weapons must be Light.
 * D&D: any equipped off-hand weapon when main hand does not block the slot.
 */
function canIncludeOffHandDamage(
  mainHand: EquippedWeapon | null,
  offHand: EquippedWeapon | null,
  useAmellwindHomebrew: boolean,
): boolean {
  if (!mainHand || !offHand) return false;

  if (useAmellwindHomebrew) {
    return hasLightProperty(mainHand) && hasLightProperty(offHand);
  }

  return !blocksOffHand(mainHand);
}

/**
 * Calculates damage for an Unarmed Strike.
 * Base (XPHB 2024): 1 + Strength modifier.
 * Monk Martial Arts: martial arts die + Dexterity modifier.
 */
function calculateUnarmedStrikeDamage(
  character: Character,
  attacksPerTurn: number,
  className?: string | null,
  classData?: Class | null,
  speciesData?: Species | null,
): DamageBreakdown {
  const profile = getUnarmedStrikeProfile(
    character.level,
    character.abilities,
    className,
    classData,
    speciesData,
  );
  const abilityUsed = profile.abilityUsed;
  const abilityModifier = character.getModifier(abilityUsed);
  const attackBonus = character.getAttackBonus(abilityUsed);

  let weaponDice: DiceRoll;
  const sources: DamageSource[] = [];

  if (profile.diceSides > 0) {
    const average = profile.diceCount * ((profile.diceSides + 1) / 2);
    const notation =
      profile.diceCount === 1
        ? `1d${profile.diceSides}`
        : `${profile.diceCount}d${profile.diceSides}`;
    weaponDice = {
      count: profile.diceCount,
      sides: profile.diceSides,
      average,
      notation,
    };
    sources.push({
      source: profile.label,
      type: "weapon",
      dice: weaponDice,
      flatBonus: 0,
      average: weaponDice.average,
    });
  } else {
    weaponDice = {
      count: 0,
      sides: 0,
      average: profile.flatBase,
      notation: String(profile.flatBase),
    };
    sources.push({
      source: profile.label,
      type: "weapon",
      dice: null,
      flatBonus: profile.flatBase,
      average: profile.flatBase,
    });
  }

  if (abilityModifier !== 0) {
    sources.push({
      source: `${abilityUsed.toUpperCase()} modifier`,
      type: "ability",
      dice: null,
      flatBonus: abilityModifier,
      average: abilityModifier,
    });
  }

  const totalPerHit = weaponDice.average + abilityModifier;
  const totalPerTurn = totalPerHit * attacksPerTurn;

  const parts: string[] = [weaponDice.notation];
  if (abilityModifier !== 0) {
    parts.push(abilityModifier > 0 ? `+${abilityModifier}` : `${abilityModifier}`);
  }
  const diceExpression = parts.join(" ");

  return {
    weaponDice,
    abilityModifier,
    abilityUsed,
    runeDice: [],
    totalPerHit,
    attacksPerTurn,
    attackBonus,
    totalPerTurn,
    diceExpression,
    sources,
    critRange: 20,
    critRunes: [],
  };
}

/** Attack/damage breakdown for a single weapon (export, stat blocks, etc.). */
export function getWeaponAttackBreakdown(
  character: Character,
  equipped: EquippedWeapon,
  isOffHand: boolean,
  useAmellwindHomebrew = true,
): DamageBreakdown {
  return calculateWeaponDamage(
    character,
    equipped,
    1,
    isOffHand,
    useAmellwindHomebrew,
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
  useUnarmedStrike = false,
  className?: string | null,
  classData?: Class | null,
  speciesData?: Species | null,
  useAmellwindHomebrew = true,
): CombatCalculation {
  if (useUnarmedStrike) {
    const unarmedBreakdown = calculateUnarmedStrikeDamage(
      character,
      attacksPerTurn,
      className,
      classData,
      speciesData,
    );
    return {
      mainHand: unarmedBreakdown,
      offHand: null,
      totalDPT: unarmedBreakdown.totalPerTurn,
    };
  }

  let mainHandBreakdown: DamageBreakdown | null = null;
  let offHandBreakdown: DamageBreakdown | null = null;

  if (mainHand) {
    mainHandBreakdown = calculateWeaponDamage(
      character,
      mainHand,
      attacksPerTurn,
      false,
      useAmellwindHomebrew,
    );
  }

  if (offHand && canIncludeOffHandDamage(mainHand, offHand, useAmellwindHomebrew)) {
    offHandBreakdown = calculateWeaponDamage(
      character,
      offHand,
      1,
      true,
      useAmellwindHomebrew,
    );
  }

  const totalDPT =
    (mainHandBreakdown?.totalPerTurn ?? 0) + (offHandBreakdown?.totalPerTurn ?? 0);

  return {
    mainHand: mainHandBreakdown,
    offHand: offHandBreakdown,
    totalDPT,
  };
}

function formatSourceContribution(source: DamageSource): string {
  if (source.dice) {
    return `${source.dice.notation} (${source.average.toFixed(1)})`;
  }

  const sign = source.flatBonus >= 0 ? "+" : "";
  return `${sign}${source.flatBonus} ${source.source}`;
}

function formatBreakdownSection(
  breakdown: DamageBreakdown,
  label: string,
  offHandNote?: string,
): string[] {
  const contribution = breakdown.sources.map(formatSourceContribution).join(" + ");
  const lines = [
    `${label}:`,
    `  ${contribution} = ${breakdown.totalPerHit.toFixed(1)} avg/hit`,
  ];

  if (offHandNote) {
    lines.push(`  ${offHandNote}`);
  } else {
    const attackLabel = breakdown.attacksPerTurn === 1 ? "attack" : "attacks";
    lines.push(
      `  ${breakdown.totalPerTurn.toFixed(1)} avg/turn (${breakdown.totalPerHit.toFixed(1)} × ${breakdown.attacksPerTurn} ${attackLabel})`,
    );
  }

  return lines;
}

/** Explains how {@link CombatCalculation.totalDPT} was derived. */
export function formatDamagePerTurnTooltip(combat: CombatCalculation): string {
  if (!combat.mainHand && !combat.offHand) {
    return "Equip a weapon or enable Unarmed Strike to estimate damage.";
  }

  const lines = ["Damage per turn calculation", ""];
  const segmentTotals: string[] = [];

  if (combat.mainHand) {
    const weaponSource = combat.mainHand.sources.find((s) => s.type === "weapon");
    lines.push(
      ...formatBreakdownSection(
        combat.mainHand,
        weaponSource?.source ?? "Main hand",
      ),
    );
    segmentTotals.push(combat.mainHand.totalPerTurn.toFixed(1));
    lines.push("");
  }

  if (combat.offHand) {
    const weaponSource = combat.offHand.sources.find((s) => s.type === "weapon");
    lines.push(
      ...formatBreakdownSection(
        combat.offHand,
        `${weaponSource?.source ?? "Off hand"} (bonus)`,
        `${combat.offHand.totalPerTurn.toFixed(1)} avg/turn (1 bonus attack, no ability modifier to damage)`,
      ),
    );
    segmentTotals.push(combat.offHand.totalPerTurn.toFixed(1));
    lines.push("");
  }

  if (segmentTotals.length > 1) {
    lines.push(
      `Total: ${segmentTotals.join(" + ")} = ${combat.totalDPT.toFixed(1)} avg/turn`,
    );
    lines.push("");
  }

  lines.push(
    "Dice averages use (sides + 1) ÷ 2 per die. Critical hits are not included.",
  );

  return lines.join("\n");
}
