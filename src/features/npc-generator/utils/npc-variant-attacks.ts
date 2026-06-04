import type { AbilityKey, AbilityScores, Entry, OptionalFeature } from "@/shared/types";
import type { NpcAttackDefinition } from "@/shared/types/npc.types";
import type { Weapon } from "@/shared/types";
import { getAbilityModifier, formatModifier } from "@/shared/utils/cr.utils";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { getAccumulatedUnlocks } from "@/features/weapons/utils/weapon-feature-chains.utils";
import {
  NPC_AMMO_ATTACKS,
  NPC_AMMO_PRIORITY,
  NPC_MAX_VARIANT_ATTACKS,
  NPC_MELODY_NOTE_PRIORITY,
  type NpcAmmoAttackSpec,
} from "../data/npc-ammo-attacks.data";
import type { NpcWeaponContext } from "./npc-weapon.utils";
import { resolveNpcAttackFromWeapon } from "./npc-weapon.utils";

export { isVariantPrimaryWeapon } from "../data/npc-ammo-attacks.data";

export function normalizeAmmoKey(rawName: string): string {
  let name = rawName.trim();
  name = name.replace(/\s*\(\d+\)\s*$/, "");
  name = name.replace(/\s+Ammo\s*$/i, "");
  return name.toLowerCase();
}

function rollAverage(dice: string): number {
  const match = dice.match(/(\d+)d(\d+)/);
  if (!match) return 0;
  const count = Number(match[1]);
  const sides = Number(match[2]);
  return count * (Math.floor(sides / 2) + 1);
}

function scaleDiceAboveRare(baseDice: string, rarityIndex: number): string {
  const extraSteps = Math.max(0, rarityIndex - 2);
  if (extraSteps === 0) return baseDice;

  const match = baseDice.match(/(\d+)d(\d+)/);
  if (!match) return baseDice;

  const count = Number(match[1]) + extraSteps;
  const sides = Number(match[2]);
  return `${count}d${sides}`;
}

function ammoSaveDc(abilities: AbilityScores, pb: number, ability: AbilityKey): number {
  return 8 + pb + getAbilityModifier(abilities[ability]);
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

function formatWeaponAttackLine(
  attack: NpcAttackDefinition,
  abilities: AbilityScores,
  pb: number,
  flatBonus = 0,
  damageType?: string,
): string {
  const abilityMod = getAbilityModifier(abilities[attack.ability]);
  const hit = pb + abilityMod;
  const flat = (attack.flatDamageBonus ?? 0) + flatBonus;
  const dice = attack.damageDice;
  const avgDamage = rollAverage(dice) + abilityMod + flat;
  const attackLabel =
    attack.kind === "mw" ? "Melee Weapon Attack" : "Ranged Weapon Attack";
  const distanceLabel = attack.kind === "mw" ? "reach" : "range";
  const type = damageType ?? attack.damageType;
  const damageExpr = formatDamageExpression(dice, abilityMod, flat);

  return `${attackLabel}: ${formatModifier(hit)} to hit, ${distanceLabel} ${attack.reachOrRange}, one target. Hit: ${avgDamage} (${damageExpr}) ${type} damage.`;
}

function findUnlockColumn(weapon: Weapon, pattern: RegExp): string | undefined {
  for (const row of weapon.rarityRows) {
    for (const label of Object.keys(row.columns)) {
      if (pattern.test(label)) return label;
    }
  }
  return undefined;
}

function getUnlockedItems(
  weapon: Weapon,
  columnPattern: RegExp,
  rarityIndex: number,
): string[] {
  const label = findUnlockColumn(weapon, columnPattern);
  if (!label) return [];
  return getAccumulatedUnlocks(weapon.rarityRows, label, rarityIndex);
}

function findFeatureByName(
  featuresMap: Map<string, OptionalFeature>,
  name: string,
): OptionalFeature | undefined {
  const lower = name.toLowerCase();
  const direct = featuresMap.get(lower);
  if (direct) return direct;

  for (const feat of featuresMap.values()) {
    if (feat.name.toLowerCase() === lower) return feat;
  }
  return undefined;
}

function noteToNpcText(text: string, roleLabel: string): string {
  let result = parseFiveToolsMarkup(text);
  result = result.replace(/\byour melody's radius\b/gi, "20 feet of the chanter");
  result = result.replace(/\byou and all allies\b/gi, `the ${roleLabel} and each ally`);
  result = result.replace(/\byou,\s*and all allies\b/gi, `the ${roleLabel} and each ally`);
  result = result.replace(/\ballies in your melody's radius\b/gi, `the ${roleLabel} and each ally within 20 feet`);
  result = result.replace(/\ballies within 20 feet of you\b/gi, `each ally within 20 feet of the ${roleLabel}`);
  result = result.replace(/\byou\b/gi, `the ${roleLabel}`);
  result = result.replace(/\byour\b/gi, `the ${roleLabel}'s`);
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function collapseTieredUnlocks(rawNames: string[]): string[] {
  const keys = new Set(rawNames.map(normalizeAmmoKey));
  const skip = new Set<string>();

  const tierGroups = [
    ["pierce lvl 3", "pierce lvl 2", "pierce lvl 1"],
    ["recover lvl 2", "recover lvl 1"],
  ];

  for (const levels of tierGroups) {
    const highest = levels.find((level) => keys.has(level));
    if (!highest) continue;
    for (const level of levels) {
      if (level !== highest) skip.add(level);
    }
  }

  const seen = new Set<string>();
  return rawNames.filter((raw) => {
    const key = normalizeAmmoKey(raw);
    if (skip.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function selectTopVariants<T>(
  items: T[],
  maxCount: number,
  score: (item: T, index: number) => number,
): T[] {
  return items
    .map((item, index) => ({ item, index, score: score(item, index) }))
    .sort((a, b) => b.score - a.score || b.index - a.index)
    .slice(0, maxCount)
    .sort((a, b) => a.index - b.index)
    .map(({ item }) => item);
}

function selectAmmoVariants(unlocked: string[]): string[] {
  const collapsed = collapseTieredUnlocks(unlocked);

  return selectTopVariants(collapsed, NPC_MAX_VARIANT_ATTACKS, (raw) => {
    const key = normalizeAmmoKey(raw);
    return NPC_AMMO_PRIORITY[key] ?? 25;
  });
}

function selectMelodyNotes(unlocked: string[], maxNotes: number): string[] {
  return selectTopVariants(unlocked, maxNotes, (name) => {
    return NPC_MELODY_NOTE_PRIORITY[name.toLowerCase()] ?? 30;
  });
}

function buildClusterBurstLine(rarityIndex: number): string {
  const dice = scaleDiceAboveRare("2d6", rarityIndex);
  const avg = rollAverage(dice);
  return `Cluster Burst: ${avg} (${dice}) fire damage to the target and each creature within 5 feet of it.`;
}

function buildAmmoActionEntry(
  spec: NpcAmmoAttackSpec,
  baseAttack: NpcAttackDefinition,
  abilities: AbilityScores,
  pb: number,
  rarityIndex: number,
  roleLabel: string,
): string {
  const saveAbility = spec.saveAbility ?? "dex";
  const dc = ammoSaveDc(abilities, pb, baseAttack.ability);

  if (spec.kind === "area-save" && spec.saveBaseDice) {
    const dice = scaleDiceAboveRare(spec.saveBaseDice, rarityIndex);
    const avg = rollAverage(dice);
    const type = spec.saveDamageType ?? "fire";
    return `${spec.displayName}. ${spec.effect ?? ""} Dexterity saving throw DC ${dc}; ${avg} (${dice}) ${type} damage on a failed save, or half as much on a success.`.trim();
  }

  if (spec.kind === "save" && spec.saveBaseDice) {
    const dice = scaleDiceAboveRare(spec.saveBaseDice, rarityIndex);
    const avg = rollAverage(dice);
    const type = spec.saveDamageType ?? "slashing";
    const saveName =
      saveAbility === "dex"
        ? "Dexterity"
        : saveAbility === "con"
          ? "Constitution"
          : "Strength";
    return `${spec.displayName}. ${spec.effect ?? ""} The target must succeed on a ${saveName} saving throw (DC ${dc}) or take ${avg} (${dice}) ${type} damage, or half as much on a success.`.trim();
  }

  const hitLine = formatWeaponAttackLine(
    baseAttack,
    abilities,
    pb,
    spec.flatDamageBonus ?? 0,
    spec.damageType,
  );

  if (spec.displayName === "Cluster Ammo") {
    return `${hitLine} ${buildClusterBurstLine(rarityIndex)}`;
  }

  if (spec.effect) {
    return `${hitLine} ${spec.effect.replace(/\bthe artillerist\b/gi, `the ${roleLabel}`)}`;
  }

  return hitLine;
}

function buildBowgunAmmoActions(
  weapon: Weapon,
  baseAttack: NpcAttackDefinition,
  abilities: AbilityScores,
  pb: number,
  rarityIndex: number,
  roleLabel: string,
): Entry[] {
  const unlocked = selectAmmoVariants(
    getUnlockedItems(weapon, /^ammo$/i, rarityIndex),
  );
  const actions: Entry[] = [];

  for (const rawName of unlocked) {
    const key = normalizeAmmoKey(rawName);
    const spec = NPC_AMMO_ATTACKS[key] ?? {
      displayName: rawName.replace(/\s*\(\d+\)\s*$/, ""),
      kind: "weapon" as const,
    };

    actions.push({
      name: `${weapon.name} — ${spec.displayName}`,
      entries: [
        buildAmmoActionEntry(spec, baseAttack, abilities, pb, rarityIndex, roleLabel),
      ],
    });
  }

  return actions;
}

function buildHuntingHornActions(
  weapon: Weapon,
  baseAttack: NpcAttackDefinition,
  abilities: AbilityScores,
  pb: number,
  rarityIndex: number,
  roleLabel: string,
  featuresMap: Map<string, OptionalFeature>,
): Entry[] {
  const actions: Entry[] = [];

  actions.push({
    name: `${weapon.name} Strike`,
    entries: [formatWeaponAttackLine(baseAttack, abilities, pb)],
  });

  actions.push({
    name: "Complete Melody",
    entries: [
      `When the ${roleLabel} hits a creature with its hunting horn, it can weave notes into a melody. As an action, it completes the melody; the ${roleLabel} and each ally within 20 feet that can hear it gain the benefits of each note in that melody for 1 minute. It can instead slam the horn into the ground to activate a single note for 1 minute.`,
    ],
  });

  const noteSlots = Math.max(1, NPC_MAX_VARIANT_ATTACKS - 2);
  const notes = selectMelodyNotes(
    getUnlockedItems(weapon, /^notes$/i, rarityIndex),
    noteSlots,
  );

  for (const noteName of notes) {
    const feat = findFeatureByName(featuresMap, noteName);
    const effectText = feat?.paragraphs[0]
      ? noteToNpcText(feat.paragraphs[0], roleLabel)
      : `When included in a completed melody, this note grants a hunting party buff (see ${noteName}).`;

    actions.push({
      name: `${noteName} (Melody Note)`,
      entries: [effectText],
    });
  }

  return actions;
}

export function buildVariantWeaponActions(
  primaryAttack: NpcAttackDefinition,
  weapon: Weapon,
  abilities: AbilityScores,
  pb: number,
  rarityIndex: number,
  roleLabel: string,
  weaponContext: NpcWeaponContext,
): Entry[] {
  const resolved = resolveNpcAttackFromWeapon(primaryAttack, weapon, rarityIndex);
  const weaponKey = weapon.name.toLowerCase();

  if (weaponKey === "hunting horn") {
    return buildHuntingHornActions(
      weapon,
      resolved,
      abilities,
      pb,
      rarityIndex,
      roleLabel,
      weaponContext.featuresMap,
    );
  }

  if (weaponKey === "heavy bowgun" || weaponKey === "light bowgun") {
    return buildBowgunAmmoActions(
      weapon,
      resolved,
      abilities,
      pb,
      rarityIndex,
      roleLabel,
    );
  }

  return [];
}

export function getVariantMultiattackText(
  weapon: Weapon,
  roleLabel: string,
): string | undefined {
  const key = weapon.name.toLowerCase();
  if (key === "heavy bowgun" || key === "light bowgun") {
    return `The ${roleLabel} makes two ${weapon.name.toLowerCase()} attacks using any ammunition it carries.`;
  }
  if (key === "hunting horn") {
    return `The ${roleLabel} makes two hunting horn attacks.`;
  }
  return undefined;
}
