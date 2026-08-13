import type { EquippedWeapon, Spell, Weapon } from "@/shared/types";
import { DMG_TYPE_LABELS } from "@/shared/types";
import { formatModifier } from "@/shared/utils/cr.utils";
import { getActiveWeaponDamageType } from "@/features/amellwind/weapons/utils/weapon-mode.utils";
import type { Character } from "@/features/raintdm/builder/models/Character";
import { getWeaponAttackBreakdown } from "@/features/raintdm/builder/utils/combat.calculator";
import { makeWeaponSlot } from "@/features/raintdm/builder/utils/equipment.factory";
import { isDamageCantrip, DAMAGE_TYPE_NAMES } from "@/features/raintdm/builder/utils/spell-damage.utils";
import type { SubclassSpellGrant } from "@/features/raintdm/builder/utils/subclass-spells.utils";
import type { SpellcastingInfo } from "@/features/raintdm/builder/hooks/useSpellcasting";
import type { CharacterSheetWeaponExport } from "./character-sheet-export.types";

function formatWeaponDamageWithType(
  equipped: EquippedWeapon,
  diceExpression: string,
): string {
  const dmgType = getActiveWeaponDamageType(equipped);
  const typeLabel = DMG_TYPE_LABELS[dmgType] ?? dmgType;
  return `${diceExpression} ${typeLabel}`.trim();
}

function buildEquippedWeaponExport(
  character: Character,
  equipped: EquippedWeapon,
  isOffHand: boolean,
  useAmellwindHomebrew: boolean,
): CharacterSheetWeaponExport {
  const breakdown = getWeaponAttackBreakdown(
    character,
    equipped,
    isOffHand,
    useAmellwindHomebrew,
  );
  return {
    name: equipped.weapon.name,
    attackBonus: formatModifier(breakdown.attackBonus),
    damage: formatWeaponDamageWithType(equipped, breakdown.diceExpression),
  };
}

function buildInventoryWeaponExport(
  character: Character,
  weapon: Weapon,
  useAmellwindHomebrew: boolean,
): CharacterSheetWeaponExport {
  const equipped = makeWeaponSlot(weapon, "Common");
  return buildEquippedWeaponExport(character, equipped, false, useAmellwindHomebrew);
}

function getCantripDiceMultiplier(characterLevel: number): number {
  if (characterLevel >= 17) return 4;
  if (characterLevel >= 11) return 3;
  if (characterLevel >= 5) return 2;
  return 1;
}

function scaleDiceNotation(notation: string, multiplier: number): string {
  const match = notation.match(/^(\d+)d(\d+)$/i);
  if (!match || multiplier <= 1) return notation;
  return `${parseInt(match[1], 10) * multiplier}d${match[2]}`;
}

function extractCantripDamageText(spell: Spell, characterLevel: number): string {
  const text = spell.description.join(" ");
  const damageMatch = text.match(
    new RegExp(
      `(\\d+d\\d+)\\s+(?:${DAMAGE_TYPE_NAMES})\\s+damage`,
      "i",
    ),
  );
  if (!damageMatch) return "";

  const multiplier = getCantripDiceMultiplier(characterLevel);
  const dice = scaleDiceNotation(damageMatch[1], multiplier);
  const type =
    damageMatch[0]
      .match(new RegExp(`(${DAMAGE_TYPE_NAMES})`, "i"))?.[1]
      ?.replace(/^\w/, (c) => c.toUpperCase()) ?? "";

  return type ? `${dice} ${type}` : dice;
}

function buildCantripWeaponExport(
  spell: Spell,
  characterLevel: number,
  spellSaveDc: string | undefined,
  spellAttackBonus: string | undefined,
): CharacterSheetWeaponExport {
  const text = spell.description.join(" ");
  const usesSave = /saving throw/i.test(text) && !/spell attack/i.test(text);
  const attackBonus = usesSave
    ? spellSaveDc
      ? `DC ${spellSaveDc}`
      : ""
    : (spellAttackBonus ?? "");

  return {
    name: spell.name,
    attackBonus,
    damage: extractCantripDamageText(spell, characterLevel),
    notes: usesSave ? "Save" : "Spell attack",
  };
}

function collectCantripNames(
  spellSelections: Record<number, { id: string; name: string }[]>,
  spellcasting: SpellcastingInfo,
  allSpells: Spell[],
): string[] {
  const names = new Set<string>();

  for (const selection of spellSelections[0] ?? []) {
    names.add(selection.name);
  }

  for (const pool of spellcasting.bonusCantripPools) {
    for (const selection of spellSelections[pool.selectionLevel] ?? []) {
      names.add(selection.name);
    }
  }

  const cantripGrants: SubclassSpellGrant[] = [
    ...spellcasting.subclassAlwaysPrepared,
    ...spellcasting.subclassBonusKnown,
    ...spellcasting.optionalFeatureGranted,
  ];

  for (const grant of cantripGrants) {
    const spell = allSpells.find(
      (s) => s.name.toLowerCase() === grant.name.toLowerCase(),
    );
    if (spell?.level === 0) {
      names.add(spell.name);
    }
  }

  return Array.from(names);
}

export function buildWeaponsAndCantripsExport(options: {
  character: Character;
  mainHand: EquippedWeapon | null;
  offHand: EquippedWeapon | null;
  inventoryWeapons: Weapon[];
  spellSelections: Record<number, { id: string; name: string }[]>;
  spellcasting: SpellcastingInfo;
  allSpells: Spell[];
  spellSaveDc: string | undefined;
  spellAttackBonus: string | undefined;
  useAmellwindHomebrew: boolean;
  useUnarmedStrike: boolean;
  combatMainHandLabel?: string;
  combatMainHandBreakdown?: {
    attackBonus: number;
    diceExpression: string;
  } | null;
}): CharacterSheetWeaponExport[] {
  const {
    character,
    mainHand,
    offHand,
    inventoryWeapons,
    spellSelections,
    spellcasting,
    allSpells,
    spellSaveDc,
    spellAttackBonus,
    useAmellwindHomebrew,
    useUnarmedStrike,
    combatMainHandLabel,
    combatMainHandBreakdown,
  } = options;

  const entries: CharacterSheetWeaponExport[] = [];
  const seen = new Set<string>();

  function pushEntry(entry: CharacterSheetWeaponExport) {
    const name = entry.name.trim();
    if (!name || name.toLowerCase() === "weapon") return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push(entry);
  }

  if (useUnarmedStrike && combatMainHandBreakdown) {
    pushEntry({
      name: combatMainHandLabel ?? "Unarmed Strike",
      attackBonus: formatModifier(combatMainHandBreakdown.attackBonus),
      damage: combatMainHandBreakdown.diceExpression,
    });
  } else if (mainHand) {
    pushEntry(
      buildEquippedWeaponExport(
        character,
        mainHand,
        false,
        useAmellwindHomebrew,
      ),
    );
  }

  if (offHand) {
    pushEntry(
      buildEquippedWeaponExport(
        character,
        offHand,
        true,
        useAmellwindHomebrew,
      ),
    );
  }

  const equippedNames = new Set(
    [mainHand?.weapon.name, offHand?.weapon.name]
      .filter(Boolean)
      .map((name) => name!.toLowerCase()),
  );

  for (const weapon of inventoryWeapons) {
    if (equippedNames.has(weapon.name.toLowerCase())) continue;
    pushEntry(
      buildInventoryWeaponExport(character, weapon, useAmellwindHomebrew),
    );
  }

  for (const cantripName of collectCantripNames(
    spellSelections,
    spellcasting,
    allSpells,
  )) {
    const spell = allSpells.find(
      (s) => s.name.toLowerCase() === cantripName.toLowerCase(),
    );
    if (!spell || !isDamageCantrip(spell)) continue;
    pushEntry(
      buildCantripWeaponExport(
        spell,
        character.level,
        spellSaveDc,
        spellAttackBonus,
      ),
    );
  }

  return entries.slice(0, 6);
}
