/**
 * Rewrites original-monster entries into Monstie Sidekick versions (AGMH Appendix C):
 * template attack, Signature Attack (uses, PB dice, area sizes), Creature and
 * Monstie Trait adjustments, and the Monstie save DC. Works on plain stat-block
 * text, so it rewrites both `entries` and structured `content` the same way.
 */
import type { AbilityKey, AbilityScores, Entry } from "@/shared/types";
import { formatModifier, getAbilityModifier } from "@/shared/utils/cr.utils";
import { entryToPlainText } from "@/shared/utils/entry-text.utils";
import { mapStatBlockContentText } from "@/shared/utils/statblock-entries.mapper";

export interface MonstieScalingContext {
  level: number;
  pb: number;
  abilities: AbilityScores;
  /** Extra damage dice on melee/ranged attacks (Extra Attack or Damage). */
  extraDice: number;
}

type TextTransform = (text: string) => string;

// ─── Text plumbing ──────────────────────────────────────────────────────────

/**
 * Applies a stateful transform to both text representations of an entry.
 * `makeTransform` is called once per representation so counters restart.
 */
function transformEntry(entry: Entry, makeTransform: () => TextTransform): Entry {
  const entriesFn = makeTransform();
  const contentFn = makeTransform();
  return {
    ...entry,
    entries: entry.entries.map(entriesFn),
    content: entry.content
      ? mapStatBlockContentText(entry.content, contentFn)
      : undefined,
  };
}

function appendParagraph(entry: Entry, text: string): Entry {
  return {
    ...entry,
    entries: [...entry.entries, text],
    content: entry.content
      ? [...entry.content, { type: "paragraph", text }]
      : undefined,
  };
}

// ─── Dice helpers ───────────────────────────────────────────────────────────

/** "45 (10d8)", "19 (3d8 + 6)", or the malformed "16 (3d6 - 6." seen in MHMM text. */
const DAMAGE_INSTANCE = /(\d+)\s*\(\s*(\d+)d(\d+)\s*(?:([+\-−–])\s*(\d+)\s*)?[).]/g;

const DIE_STEPS = [4, 6, 8, 10, 12];

function averageRoll(count: number, die: number, bonus: number): number {
  return Math.max(1, Math.floor((count * (die + 1)) / 2) + bonus);
}

function formatDamage(count: number, die: number, bonus: number): string {
  const bonusText =
    bonus === 0 ? "" : ` ${bonus > 0 ? "+" : "-"} ${Math.abs(bonus)}`;
  return `${averageRoll(count, die, bonus)} (${count}d${die}${bonusText})`;
}

function countDamageInstances(text: string): number {
  return [...text.matchAll(DAMAGE_INSTANCE)].length;
}

/** Splits `total` dice evenly between damage instances (remainder goes first). */
function splitDice(total: number, instances: number): number[] {
  if (instances <= 0) return [];
  const base = Math.floor(total / instances);
  const remainder = total % instances;
  return Array.from({ length: instances }, (_, i) =>
    Math.max(1, base + (i < remainder ? 1 : 0)),
  );
}

function stepDieDown(die: number): number {
  const index = DIE_STEPS.indexOf(die);
  if (index <= 0) return die;
  return DIE_STEPS[index - 1];
}

function isSingleTarget(text: string): boolean {
  if (/\beach creature\b|\bcreatures? in (?:that|the|a)\b/i.test(text)) {
    return false;
  }
  return /\bone (?:target|creature)\b|\ba target\b|\bthe target\b/i.test(text);
}

// ─── Save DC ────────────────────────────────────────────────────────────────

/** Most common save abilities from the Monstie rules (CON breath/poison/roars, STR prone/charge, CHA frightful presence). */
export function inferSaveAbility(text: string): AbilityKey {
  if (/frightful presence/i.test(text)) return "cha";
  if (/breath|poison|venom|toxin|disease|roar|blight|exhale|spit/i.test(text)) {
    return "con";
  }
  if (/prone|charge|grapple|shove|push|knock/i.test(text)) return "str";
  return "con";
}

export function getMonstieSaveDc(
  ctx: MonstieScalingContext,
  ability: AbilityKey,
): number {
  return 8 + ctx.pb + getAbilityModifier(ctx.abilities[ability]);
}

function makeDcTransform(dc: number): TextTransform {
  return (text) => text.replace(/\bDC\s*\d+/g, `DC ${dc}`);
}

function withDc(entry: Entry, ctx: MonstieScalingContext): Entry {
  const text = `${entry.name} ${entryToPlainText(entry)}`;
  if (!/\bDC\s*\d+/.test(text)) return entry;
  const dc = getMonstieSaveDc(ctx, inferSaveAbility(text));
  return transformEntry(entry, () => makeDcTransform(dc));
}

const PB_BONUS_PATTERN =
  /(?:\+\d+|\bbonus\b)[^.]*\b(?:AC|Armor Class|checks?|skill)\b|\b(?:AC|Armor Class|checks?)\b[^.]*\+\d+/i;

function withPbBonusNote(entry: Entry, ctx: MonstieScalingContext): Entry {
  if (!PB_BONUS_PATTERN.test(entryToPlainText(entry))) return entry;
  return appendParagraph(
    entry,
    `Monstie: any bonus this grants to AC or skill checks equals its proficiency bonus (${formatModifier(ctx.pb)}).`,
  );
}

// ─── Attack rolls ───────────────────────────────────────────────────────────

type AttackKind = "melee" | "ranged" | "both";

interface ParsedAttack {
  kind: AttackKind;
  label: string;
  range?: string;
  die: number;
  damageType: string;
}

function parseAttackKind(text: string): { kind: AttackKind; label: string } {
  const match = text.match(
    /\b(melee or ranged|melee|ranged)\s+((?:weapon|spell)\s+)?attack\b/i,
  );
  const raw = (match?.[1] ?? "melee").toLowerCase();
  const kind: AttackKind =
    raw === "melee or ranged" ? "both" : raw === "ranged" ? "ranged" : "melee";
  const label = match
    ? match[0].replace(/\b\w/g, (c) => c.toUpperCase())
    : "Melee Attack";
  return { kind, label };
}

function parseAttack(entry: Entry): ParsedAttack | null {
  const text = entryToPlainText(entry);
  const damage = text.match(
    /\(\s*\d+d(\d+)[^)]*\)\s*([a-z]+)(?:\s+or\s+[a-z]+)?\s+damage/i,
  );
  if (!damage) return null;
  const { kind, label } = parseAttackKind(text);
  const range = text.match(/\brange\s+(\d+(?:\s*\/\s*\d+)?)\s*(?:ft|feet)/i)?.[1];
  return {
    kind,
    label,
    range: range?.replace(/\s+/g, ""),
    die: Number(damage[1]),
    damageType: damage[2].toLowerCase(),
  };
}

function attackAbility(kind: AttackKind, abilities: AbilityScores): AbilityKey {
  if (kind === "ranged") return "dex";
  if (kind === "both") return abilities.dex > abilities.str ? "dex" : "str";
  return "str";
}

function reachText(attack: ParsedAttack): string {
  const range = attack.range ? `range ${attack.range} ft.` : undefined;
  if (attack.kind === "ranged") return range ?? "range 30 ft.";
  if (attack.kind === "both" && range) return `reach 5 ft. or ${range}`;
  return "reach 5 ft.";
}

/** Template action: +hit = mod + PB, damage 1d# (+extra dice), reach 5 ft. */
export function buildMonstieBaseAttack(
  entry: Entry,
  ctx: MonstieScalingContext,
): Entry {
  const attack = parseAttack(entry);
  if (!attack) return entry;
  const ability = attackAbility(attack.kind, ctx.abilities);
  const mod = getAbilityModifier(ctx.abilities[ability]);
  const dice = 1 + ctx.extraDice;
  const text = `${attack.label}: ${formatModifier(mod + ctx.pb)} to hit, ${reachText(attack)}, one target. Hit: ${formatDamage(dice, attack.die, mod)} ${attack.damageType} damage.`;
  return { name: entry.name, entries: [text] };
}

function makeToHitTransform(toHit: number): TextTransform {
  return (text) =>
    text.replace(/[+\-−–]\s*\d+\s+to hit/gi, `${formatModifier(toHit)} to hit`);
}

// ─── Signature Attack ───────────────────────────────────────────────────────

/** Lowest recharge roll (5 for "Recharge 5–6", 6 for "Recharge 6"), or null. */
export function parseRechargeMin(text: string): number | null {
  const tag = text.match(/\{@recharge\s*(\d)?\s*\}/i);
  if (tag) return tag[1] ? Number(tag[1]) : 6;
  const plain = text.match(/recharge\s*(\d)/i);
  if (plain) return Number(plain[1]);
  return /recharge/i.test(text) ? 6 : null;
}

export function getSignatureUses(rechargeMin: number | null, pb: number): number {
  if (rechargeMin === null) return pb;
  if (rechargeMin >= 6) return Math.max(1, Math.floor(pb / 2));
  return pb;
}

function stripRechargeLabel(name: string): string {
  return name
    .replace(/\s*\{@recharge[^}]*\}/gi, "")
    .replace(/\s*\(\s*recharges?[^)]*\)/gi, "")
    .replace(/,\s*recharges?\s*\d(?:\s*[-–]\s*\d)?/gi, "")
    .replace(/\s*\(\s*\)/g, "")
    .trim();
}

function roundDownToFive(value: number): number {
  return Math.max(5, Math.floor(value / 5) * 5);
}

function coneSize(level: number): number {
  if (level >= 16) return 60;
  if (level >= 11) return 45;
  if (level >= 6) return 30;
  return 15;
}

function lineSize(level: number): { length: number; width: number } {
  if (level >= 16) return { length: 90, width: 10 };
  if (level >= 11) return { length: 60, width: 5 };
  if (level >= 6) return { length: 45, width: 5 };
  return { length: 30, width: 5 };
}

function targetedRangeFraction(level: number): number {
  if (level >= 16) return 1;
  if (level >= 11) return 0.75;
  if (level >= 6) return 0.5;
  return 0.25;
}

function makeAreaTransform(level: number): TextTransform {
  return (text) => {
    let result = text.replace(/(\d+)-foot cone/gi, (_m, original: string) => {
      return `${Math.min(Number(original), coneSize(level))}-foot cone`;
    });

    const line = lineSize(level);
    result = result.replace(
      /(\d+)-foot(?:-long)? line that is (\d+) feet wide/gi,
      (_m, length: string, width: string) =>
        `${Math.min(Number(length), line.length)}-foot line that is ${Math.min(Number(width), line.width)} feet wide`,
    );
    result = result.replace(
      /(\d+)-foot(?:-long)? line(?! that is)/gi,
      (_m, length: string) => `${Math.min(Number(length), line.length)}-foot line`,
    );

    const fraction = targetedRangeFraction(level);
    result = result.replace(
      /(\b(?:one|a|an)\s+(?:target|creature|point|space)\b[^.]{0,60}?\bwithin\s+)(\d+)(\s*(?:feet|ft\.?))/gi,
      (_m, before: string, range: string, unit: string) =>
        `${before}${roundDownToFive(Number(range) * fraction)}${unit}`,
    );
    return result;
  };
}

/**
 * Re-dices each damage instance with `counts(originalCount, index)` dice of the
 * original die (flat bonus dropped); `null` keeps the instance unchanged.
 */
function makeDamageCountTransform(
  counts: (originalCount: number, index: number) => number | null,
): TextTransform {
  let index = 0;
  return (text) =>
    text.replace(DAMAGE_INSTANCE, (match, _avg: string, count: string, die: string) => {
      const next = counts(Number(count), index++);
      return next === null ? match : formatDamage(next, Number(die), 0);
    });
}

export function buildMonstieSignatureAttack(
  entry: Entry,
  ctx: MonstieScalingContext,
): Entry {
  const plain = entryToPlainText(entry);
  const fullText = `${entry.name} ${plain}`;
  const rechargeMin = parseRechargeMin(fullText);
  const hasRechargeOrLimit =
    rechargeMin !== null ||
    /\d+\s*\/\s*(?:day|short rest|long rest)|per day/i.test(fullText);

  const instances = countDamageInstances(plain);
  const totalDice = ctx.pb + (isSingleTarget(plain) ? 1 : 0);
  const split = splitDice(totalDice, instances);

  let result = transformEntry(entry, () => {
    const damage = makeDamageCountTransform((_orig, i) => split[i] ?? null);
    const area = makeAreaTransform(ctx.level);
    return (text) => area(damage(text));
  });

  if (/\bto hit\b/i.test(plain)) {
    const attack = parseAttack(entry);
    const ability = attackAbility(attack?.kind ?? "melee", ctx.abilities);
    const toHit = getAbilityModifier(ctx.abilities[ability]) + ctx.pb;
    result = transformEntry(result, () => makeToHitTransform(toHit));
  }

  result = withDc(result, ctx);

  let name = entry.name;
  if (rechargeMin !== null || !hasRechargeOrLimit) {
    const uses = getSignatureUses(rechargeMin, ctx.pb);
    name = `${stripRechargeLabel(entry.name)} (${uses}/Long Rest)`;
  }

  return { ...result, name: `${name} (Signature)` };
}

// ─── Creature / Creature Improvement ────────────────────────────────────────

const AURA_PATTERN =
  /\baura\b|\b(?:starts|ends) (?:its|their) turn within\b|\bwithin \d+ (?:feet|ft\.?) of (?:it|the)\b/i;

export function buildMonstieCreatureFeature(
  entry: Entry,
  kind: "trait" | "action",
  ctx: MonstieScalingContext,
): Entry {
  const plain = entryToPlainText(entry);
  let result = entry;

  if (kind === "action" && /\bto hit\b/i.test(plain)) {
    // Attacks follow the template attack: mod + PB to hit, 1d# (+extra dice), reach 5 ft.
    const attack = parseAttack(entry);
    const ability = attackAbility(attack?.kind ?? "melee", ctx.abilities);
    const mod = getAbilityModifier(ctx.abilities[ability]);
    const dice = 1 + ctx.extraDice;
    result = transformEntry(result, () => {
      const toHit = makeToHitTransform(mod + ctx.pb);
      let index = 0;
      return (text) =>
        toHit(text)
          .replace(/\breach\s+\d+\s*ft\./gi, "reach 5 ft.")
          .replace(/(\bto hit,\s*)\d+\s*ft\./gi, "$1reach 5 ft.")
          .replace(DAMAGE_INSTANCE, (_match, _avg: string, count: string, die: string) => {
            const isPrimary = index++ === 0;
            const next = isPrimary ? dice : Math.min(Number(count), dice);
            return formatDamage(next, Number(die), isPrimary ? mod : 0);
          });
    });
  } else if (kind === "action" && countDamageInstances(plain) > 0) {
    // Lower of the original damage and the Signature Attack damage.
    const split = splitDice(
      ctx.pb + (isSingleTarget(plain) ? 1 : 0),
      countDamageInstances(plain),
    );
    result = transformEntry(result, () =>
      makeDamageCountTransform((orig, i) => {
        const cap = split[i] ?? orig;
        return orig > cap ? cap : null;
      }),
    );
  } else if (kind === "trait" && AURA_PATTERN.test(plain)) {
    // Aura damage is reduced by one die size.
    result = transformEntry(result, () => (text) =>
      text.replace(
        DAMAGE_INSTANCE,
        (_match, _avg: string, count: string, die: string, sign?: string, flat?: string) => {
          const bonus = flat ? Number(flat) * (sign === "+" ? 1 : -1) : 0;
          return formatDamage(Number(count), stepDieDown(Number(die)), bonus);
        },
      ),
    );
  }

  return withPbBonusNote(withDc(result, ctx), ctx);
}

// ─── Monstie Trait ──────────────────────────────────────────────────────────

export function buildMonstieTrait(entry: Entry, ctx: MonstieScalingContext): Entry {
  return withPbBonusNote(withDc(entry, ctx), ctx);
}
