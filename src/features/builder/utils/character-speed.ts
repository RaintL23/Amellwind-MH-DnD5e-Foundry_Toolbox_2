import type {
  Class,
  EquippedArmor,
  EquippedTrinket,
  EquippedWeapon,
  Feat,
  Rune,
  Speed,
  Subclass,
} from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { mergeProgressionWithSubclass } from "@/features/classes/mappers/class.mapper";
import { getFeaturesUpToLevel } from "./builder-class.utils";

export interface SpeedBonus {
  label: string;
  source: string;
  type: keyof Omit<Speed, "hover">;
  amount: number;
  note?: string;
}

export interface CharacterSpeedBreakdown {
  speed: Speed;
  display: string;
  tooltip: string;
}

const SPEED_TYPES = ["walk", "fly", "swim", "climb", "burrow"] as const;
type SpeedType = (typeof SPEED_TYPES)[number];

export type BuilderCreatureSize = "M" | "S";

export function getBaseWalkSpeedForSize(size: BuilderCreatureSize): number {
  return size === "S" ? 25 : 30;
}

export function normalizeBuilderCreatureSize(size: string): BuilderCreatureSize {
  return size === "S" ? "S" : "M";
}

function getBaseSpeedFromCreatureSize(creatureSize: BuilderCreatureSize): Speed {
  return { walk: getBaseWalkSpeedForSize(creatureSize) };
}

function mergeSpeciesSpeedWithSizeBase(
  speciesSpeedText: string | null | undefined,
  creatureSize: BuilderCreatureSize,
): Speed {
  const base = getBaseSpeedFromCreatureSize(creatureSize);
  if (!speciesSpeedText) return base;

  const parsed = parseSpeciesSpeedText(speciesSpeedText);
  return {
    ...parsed,
    walk: base.walk,
  };
}

export function parseSpeciesSpeedText(speedText: string): Speed {
  const walkMatch = speedText.match(/(?:walk\s+)?(\d+)\s*ft/i);
  const flyMatch = speedText.match(/fly\s+(\d+)\s*ft/i);
  const swimMatch = speedText.match(/swim(?:ming)?\s+(\d+)\s*ft/i);
  const climbMatch = speedText.match(/climb(?:ing)?\s+(\d+)\s*ft/i);
  const burrowMatch = speedText.match(/burrow(?:ing)?\s+(\d+)\s*ft/i);

  const speed: Speed = {};
  if (walkMatch) speed.walk = Number(walkMatch[1]);
  if (flyMatch) speed.fly = Number(flyMatch[1]);
  if (swimMatch) speed.swim = Number(swimMatch[1]);
  if (climbMatch) speed.climb = Number(climbMatch[1]);
  if (burrowMatch) speed.burrow = Number(burrowMatch[1]);
  if (!speed.walk && /^\d+\s*ft/i.test(speedText.trim())) {
    speed.walk = Number(speedText.match(/(\d+)/)?.[1] ?? 30);
  }
  if (!speed.walk) speed.walk = 30;
  return speed;
}

export function formatSpeedDisplay(speed: Speed): string {
  const parts: string[] = [];
  if (speed.walk) parts.push(`${speed.walk} ft.`);
  if (speed.fly) parts.push(`fly ${speed.fly} ft.${speed.hover ? " (hover)" : ""}`);
  if (speed.swim) parts.push(`swim ${speed.swim} ft.`);
  if (speed.burrow) parts.push(`burrow ${speed.burrow} ft.`);
  if (speed.climb) parts.push(`climb ${speed.climb} ft.`);
  return parts.join(", ") || "—";
}

function getFeatText(feat: Feat): string {
  return [
    ...feat.paragraphs,
    ...feat.sections.flatMap((section) => section.paragraphs),
  ].join(" ");
}

function addBonus(
  bonuses: SpeedBonus[],
  bonus: SpeedBonus | null,
): void {
  if (!bonus || bonus.amount <= 0) return;
  bonuses.push(bonus);
}

function parseWalkBonusFromText(
  text: string,
  label: string,
  source: string,
): SpeedBonus | null {
  const normalized = text.toLowerCase();

  const walkIncrease = normalized.match(
    /(?:your )?(?:base )?walking speed (?:is )?increas(?:ed|es) by (\d+) feet/,
  );
  if (walkIncrease) {
    const note = /while you are not wearing heavy armor/.test(normalized)
      ? "while not wearing heavy armor"
      : /while you are not wearing armor or wielding a shield/.test(normalized)
        ? "while not wearing armor or wielding a shield"
        : undefined;
    return {
      label,
      source,
      type: "walk",
      amount: Number(walkIncrease[1]),
      note,
    };
  }

  const genericIncrease = normalized.match(
    /your speed increases by (\d+) feet/,
  );
  if (genericIncrease && !/flying|swim|climb|burrow/.test(normalized)) {
    const note = /while you are not wearing heavy armor/.test(normalized)
      ? "while not wearing heavy armor"
      : /while you are not wearing armor or wielding a shield/.test(normalized)
        ? "while not wearing armor or wielding a shield"
        : undefined;
    return {
      label,
      source,
      type: "walk",
      amount: Number(genericIncrease[1]),
      note,
    };
  }

  return null;
}

function parseGrantedSpeedFromText(
  text: string,
  label: string,
  source: string,
): SpeedBonus[] {
  const bonuses: SpeedBonus[] = [];
  const normalized = text.toLowerCase();

  const patterns: Array<{ regex: RegExp; type: SpeedType }> = [
    { regex: /flying speed of (\d+) feet/, type: "fly" },
    { regex: /fly(?:ing)? speed of (\d+) feet/, type: "fly" },
    { regex: /swim(?:ming)? speed of (\d+) feet/, type: "swim" },
    { regex: /climb(?:ing)? speed of (\d+) feet/, type: "climb" },
    { regex: /burrow(?:ing)? speed of (\d+) feet/, type: "burrow" },
  ];

  for (const { regex, type } of patterns) {
    const match = normalized.match(regex);
    if (match) {
      bonuses.push({
        label,
        source,
        type,
        amount: Number(match[1]),
      });
    }
  }

  const typedIncreases: Array<{ regex: RegExp; type: SpeedType }> = [
    {
      regex: /swim(?:ming)? speed (?:is )?increas(?:ed|es) by (\d+) feet/,
      type: "swim",
    },
    {
      regex: /climb(?:ing)? speed (?:is )?increas(?:ed|es) by (\d+) feet/,
      type: "climb",
    },
  ];

  for (const { regex, type } of typedIncreases) {
    const match = normalized.match(regex);
    if (match) {
      bonuses.push({
        label,
        source,
        type,
        amount: Number(match[1]),
      });
    }
  }

  if (/swim(?:ming)? speed equal to your walking speed/.test(normalized)) {
    bonuses.push({
      label,
      source,
      type: "swim",
      amount: -1,
      note: "equal to walking speed",
    });
  }

  if (/climb(?:ing)? speed equal to your walking speed/.test(normalized)) {
    bonuses.push({
      label,
      source,
      type: "climb",
      amount: -1,
      note: "equal to walking speed",
    });
  }

  return bonuses;
}

function normalizeEffectText(text: string): string {
  return parseFiveToolsMarkup(text).replace(/\s+/g, " ").trim();
}

function isPassiveRuneSpeedEffect(text: string): boolean {
  const normalized = text.toLowerCase();

  if (
    /\b(?:use an action|use a bonus action|use your reaction|expend \d+|when you hit|creature hit|target creature|a creature hit|the target|command word)\b/.test(
      normalized,
    )
  ) {
    return false;
  }

  if (/\bfor \d+ (?:minute|hour|round|turn)s?\b/.test(normalized)) return false;
  if (
    /reduce(?:s|d)? your (?:movement|walking) speed|movement speed is reduced|speed is reduced to 0|is doubled whenever/.test(
      normalized,
    )
  ) {
    return false;
  }

  if (
    !/(?:walking )?speed|movement speed|swim(?:ming)? speed|climb(?:ing)? speed|fly(?:ing)? speed|burrow/.test(
      normalized,
    )
  ) {
    return false;
  }

  if (
    /\bwhile (?:wearing|you wear|attuned|wielding|holding)\b/.test(normalized)
  ) {
    return true;
  }

  if (/you have a (?:flying|swimming|climbing|burrowing) speed/.test(normalized)) {
    return true;
  }

  if (/(?:walking )?speed increases by \d+/.test(normalized)) return true;
  if (/(?:swim(?:ming)?|climb(?:ing)?) speed (?:is )?increased by/.test(normalized)) {
    return true;
  }

  return false;
}

export function detectRuneSpeedBonuses(
  rune: Rune,
  effectText: string,
): SpeedBonus[] {
  const text = normalizeEffectText(effectText);
  if (!isPassiveRuneSpeedEffect(text)) return [];

  const bonuses: SpeedBonus[] = [];
  addBonus(bonuses, parseWalkBonusFromText(text, rune.name, rune.name));
  bonuses.push(...parseGrantedSpeedFromText(text, rune.name, rune.name));
  return dedupeSpeedBonuses(bonuses);
}

export function collectEquippedRuneSpeedBonuses(options: {
  mainHand: EquippedWeapon | null;
  offHand: EquippedWeapon | null;
  armor: EquippedArmor | null;
  trinket1: EquippedTrinket | null;
  trinket2: EquippedTrinket | null;
}): SpeedBonus[] {
  const { mainHand, offHand, armor, trinket1, trinket2 } = options;
  const bonuses: SpeedBonus[] = [];

  const addFromRune = (rune: Rune | null, effect: string | null) => {
    if (!rune || !effect) return;
    bonuses.push(...detectRuneSpeedBonuses(rune, effect));
  };

  for (const rune of armor?.runes ?? []) {
    addFromRune(rune, rune?.armorEffect ?? null);
  }

  for (const rune of mainHand?.runes ?? []) {
    addFromRune(rune, rune?.weaponEffect ?? null);
  }

  for (const rune of offHand?.runes ?? []) {
    addFromRune(rune, rune?.weaponEffect ?? null);
  }

  for (const trinket of [trinket1, trinket2]) {
    if (!trinket?.rune) continue;
    addFromRune(trinket.rune, trinket.rune.armorEffect);
    addFromRune(trinket.rune, trinket.rune.weaponEffect);
  }

  return dedupeSpeedBonuses(bonuses);
}

function detectWalkBonusFromTableCells(cells: string[]): SpeedBonus | null {
  let maxBonus = 0;

  for (const cell of cells) {
    const match = cell.trim().match(/^\+(\d+)\s*ft\.?$/i);
    if (match) {
      maxBonus = Math.max(maxBonus, Number(match[1]));
    }
  }

  if (!maxBonus) return null;

  return {
    label: "Class feature",
    source: "Class",
    type: "walk",
    amount: maxBonus,
  };
}

export function detectClassSpeedBonuses(
  classData: Class | null,
  subclass: Subclass | null,
  level: number,
): SpeedBonus[] {
  if (!classData || level < 1) return [];

  const progression = mergeProgressionWithSubclass(
    classData.progression,
    subclass,
  );
  const row = progression[level - 1];
  const bonuses: SpeedBonus[] = [];

  const tableBonus = detectWalkBonusFromTableCells(row?.tableCells ?? []);
  if (tableBonus) {
    bonuses.push({
      ...tableBonus,
      source: classData.name,
    });
  }

  const features = getFeaturesUpToLevel(classData, subclass, level);
  for (const feature of features) {
    const text = feature.description.join(" ");
    if (!tableBonus) {
      addBonus(
        bonuses,
        parseWalkBonusFromText(text, feature.name, classData.name),
      );
    }
    bonuses.push(
      ...parseGrantedSpeedFromText(text, feature.name, classData.name),
    );
  }

  return dedupeSpeedBonuses(bonuses);
}

export function detectFeatSpeedBonuses(feat: Feat): SpeedBonus[] {
  const normalizedName = feat.name.trim().toLowerCase();
  const text = getFeatText(feat);
  const bonuses: SpeedBonus[] = [];

  if (normalizedName === "mobile") {
    bonuses.push({
      label: feat.name,
      source: feat.name,
      type: "walk",
      amount: 10,
    });
    return bonuses;
  }

  if (normalizedName === "squat nimbleness") {
    bonuses.push(
      {
        label: feat.name,
        source: feat.name,
        type: "walk",
        amount: 5,
      },
      {
        label: feat.name,
        source: feat.name,
        type: "climb",
        amount: 5,
      },
    );
    return bonuses;
  }

  addBonus(bonuses, parseWalkBonusFromText(text, feat.name, feat.name));
  bonuses.push(...parseGrantedSpeedFromText(text, feat.name, feat.name));

  const swimEqualsWalk = /swim(?:ming)? speed equal to your walking speed/i.test(
    text,
  );
  if (swimEqualsWalk) {
    bonuses.push({
      label: feat.name,
      source: feat.name,
      type: "swim",
      amount: -1,
      note: "equal to walking speed",
    });
  }

  return dedupeSpeedBonuses(bonuses);
}

function dedupeSpeedBonuses(bonuses: SpeedBonus[]): SpeedBonus[] {
  const seen = new Set<string>();
  return bonuses.filter((bonus) => {
    const key = `${bonus.source}|${bonus.type}|${bonus.amount}|${bonus.note ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyBonuses(base: Speed, bonuses: SpeedBonus[]): Speed {
  const result: Speed = { ...base, hover: base.hover };

  for (const bonus of bonuses) {
    if (bonus.type === "walk") {
      result.walk = (result.walk ?? 0) + bonus.amount;
      continue;
    }

    if (bonus.note === "equal to walking speed") {
      result[bonus.type] = result.walk;
      continue;
    }

    const current = result[bonus.type] ?? 0;
    result[bonus.type] = current + bonus.amount;
  }

  return result;
}

function formatBonusLine(bonus: SpeedBonus): string {
  const amount =
    bonus.note === "equal to walking speed"
      ? bonus.note
      : `+${bonus.amount} ft.`;
  const note = bonus.note && bonus.note !== "equal to walking speed"
    ? ` (${bonus.note})`
    : "";
  return `${bonus.label}: ${bonus.type} ${amount}${note}`;
}

function formatCreatureSizeLabel(creatureSize: BuilderCreatureSize): string {
  return creatureSize === "S" ? "Small" : "Medium";
}

function formatSpeedTooltip(parts: {
  baseLabel: string;
  base: Speed;
  classBonuses: SpeedBonus[];
  featBonuses: SpeedBonus[];
  runeBonuses: SpeedBonus[];
  total: Speed;
}): string {
  const { baseLabel, base, classBonuses, featBonuses, runeBonuses, total } =
    parts;
  const lines = [`${baseLabel}: ${formatSpeedDisplay(base)}`];

  for (const bonus of classBonuses) {
    lines.push(`Class (${bonus.source}): ${formatBonusLine(bonus)}`);
  }

  for (const bonus of featBonuses) {
    lines.push(`Feat (${bonus.source}): ${formatBonusLine(bonus)}`);
  }

  for (const bonus of runeBonuses) {
    lines.push(`Rune (${bonus.source}): ${formatBonusLine(bonus)}`);
  }

  lines.push(`Total: ${formatSpeedDisplay(total)}`);
  return lines.join("\n");
}

export function getCharacterSpeedBreakdown(options: {
  creatureSize?: BuilderCreatureSize;
  speciesSpeedText?: string | null;
  speciesName?: string | null;
  classData: Class | null;
  subclass: Subclass | null;
  level: number;
  featBonuses: SpeedBonus[];
  runeBonuses?: SpeedBonus[];
}): CharacterSpeedBreakdown {
  const {
    creatureSize = "M",
    speciesSpeedText,
    speciesName,
    classData,
    subclass,
    level,
    featBonuses,
    runeBonuses = [],
  } = options;

  const base = mergeSpeciesSpeedWithSizeBase(speciesSpeedText, creatureSize);
  const classBonuses = detectClassSpeedBonuses(classData, subclass, level);
  const total = applyBonuses(
    applyBonuses(applyBonuses(base, classBonuses), featBonuses),
    runeBonuses,
  );
  const sizeLabel = formatCreatureSizeLabel(creatureSize);
  const baseLabel = speciesName
    ? `Size (${sizeLabel}) + ${speciesName}`
    : `Size (${sizeLabel})`;

  return {
    speed: total,
    display: formatSpeedDisplay(total),
    tooltip: formatSpeedTooltip({
      baseLabel,
      base,
      classBonuses,
      featBonuses,
      runeBonuses,
      total,
    }),
  };
}
