import type { CartEntry } from "@/shared/types";
import { parseCostGp } from "@/features/shops/utils/cost.utils";
import type {
  BuilderOptionalFeatureSelections,
  Class,
  EquippedWeapon,
  OptionalFeatureProgression,
  Species,
  Spell,
  Subclass,
  Weapon,
} from "@/shared/types";
import { DMG_TYPE_LABELS } from "@/shared/types";
import { getOptionalFeatureCountAtLevel } from "@/features/classes/utils/optional-feature-progression.utils";
import { formatModifier } from "@/shared/utils/cr.utils";
import type { Character } from "../models/Character";
import { getWeaponAttackBreakdown } from "./combat.calculator";
import { makeWeaponSlot } from "./equipment.factory";
import type { CharacterSheetWeaponExport } from "./character-sheet-export.types";
import type { SpellcastingInfo } from "../hooks/useSpellcasting";
import type { SubclassSpellGrant } from "./subclass-spells.utils";
import { hasActiveIntegratedShield } from "@/features/weapons/utils/shield.utils";
import { isDamageCantrip, DAMAGE_TYPE_NAMES } from "./spell-damage.utils";

/** pdf-lib form fields use WinAnsi (Windows-1252); strip/replace unsupported Unicode. */
const PDF_TEXT_REPLACEMENTS: ReadonlyArray<[string, string]> = [
  ["\u2192", "->"],
  ["\u2190", "<-"],
  ["\u2194", "<->"],
  ["\u21D2", "=>"],
  ["\u2026", "..."],
  ["\u201C", '"'],
  ["\u201D", '"'],
  ["\u2018", "'"],
  ["\u2019", "'"],
  ["\u2013", "-"],
  ["\u2014", "-"],
  ["\u2264", "<="],
  ["\u2265", ">="],
  ["\u2260", "!="],
  ["\u2212", "-"],
  ["\u2022", "-"],
];

export function sanitizeTextForPdf(text: string): string {
  let sanitized = text;
  for (const [from, to] of PDF_TEXT_REPLACEMENTS) {
    sanitized = sanitized.split(from).join(to);
  }
  return sanitized.replace(/[^\t\n\r\u0020-\u007E\u00A0-\u00FF]/g, "");
}

const ORDINAL_LEVEL: Record<string, number> = {
  "1st": 1,
  "2nd": 2,
  "3rd": 3,
  "4th": 4,
  "5th": 5,
  "6th": 6,
  "7th": 7,
  "8th": 8,
  "9th": 9,
};

/** D&D 2024 sheet alignment grid (3×3 checkbox cluster). */
export const PDF_ALIGNMENT_CHECKBOX: Record<string, string> = {
  LG: "Check Box46",
  NG: "Check Box53",
  CG: "Check Box56",
  LN: "Check Box43",
  N: "Check Box45",
  CN: "Check Box58",
  LE: "Check Box44",
  NE: "Check Box54",
  CE: "Check Box57",
};

/** D&D 2024 sheet armor training row (Light → Shields, left to right). */
export const PDF_ARMOR_TRAINING_CHECKBOXES = {
  light: "Check Box33",
  medium: "Check Box34",
  heavy: "Check Box35",
  shields: "Check Box36",
} as const;

export type ArmorTrainingCategory = keyof typeof PDF_ARMOR_TRAINING_CHECKBOXES;

function normalizeArmorTrainingKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+armor$/, "");
}

export function getArmorTrainingProficiencies(
  armorItems: string[],
): Partial<Record<ArmorTrainingCategory, boolean>> {
  const keys = new Set(armorItems.map(normalizeArmorTrainingKey));
  const result: Partial<Record<ArmorTrainingCategory, boolean>> = {};
  if (keys.has("light")) result.light = true;
  if (keys.has("medium")) result.medium = true;
  if (keys.has("heavy")) result.heavy = true;
  if (keys.has("shield") || keys.has("shields")) result.shields = true;
  return result;
}

function cellToNumber(val: string): number {
  if (!val || val === "—") return 0;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? 0 : n;
}

export function resolveAlignmentCode(alignment: string[]): string {
  const code = alignment[0] ?? "N";
  return PDF_ALIGNMENT_CHECKBOX[code] ? code : "N";
}

export function getAlignmentCheckboxField(alignment: string[]): string | undefined {
  return PDF_ALIGNMENT_CHECKBOX[resolveAlignmentCode(alignment)];
}

export function isGoldInventoryEntry(entry: CartEntry): boolean {
  const name = entry.name.trim();
  if (/^\d+(?:\.\d+)?\s*gp$/i.test(name)) return true;
  return (
    /\bgp\b/i.test(name) &&
    parseCostGp(entry.cost ?? "") > 0 &&
    !entry.linkedWeaponName
  );
}

export function getGoldFromInventoryEntry(entry: CartEntry): number {
  const fromCost = parseCostGp(entry.cost ?? "");
  if (fromCost > 0) return fromCost * entry.quantity;

  const nameMatch = entry.name.trim().match(/^(\d+(?:\.\d+)?)\s*gp$/i);
  if (nameMatch) return parseFloat(nameMatch[1]) * entry.quantity;

  return 0;
}

export function sumInventoryGoldGp(items: CartEntry[]): number {
  return items.reduce((sum, entry) => {
    if (!isGoldInventoryEntry(entry)) return sum;
    return sum + getGoldFromInventoryEntry(entry);
  }, 0);
}

export function formatGoldPiecesForPdf(gp: number): string | undefined {
  if (gp <= 0) return undefined;
  return gp % 1 === 0 ? String(gp) : gp.toFixed(2);
}

function formatWeaponDamageWithType(
  weapon: Weapon,
  diceExpression: string,
): string {
  const typeLabel = DMG_TYPE_LABELS[weapon.dmgType] ?? weapon.dmgType;
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
    damage: formatWeaponDamageWithType(
      equipped.weapon,
      breakdown.diceExpression,
    ),
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
    const key = entry.name.toLowerCase();
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

export function getSpellSlotTotals(
  classData: Class | null,
  subclassData: Subclass | null,
  characterLevel: number,
  spellcasting: SpellcastingInfo,
): Record<number, number> {
  const totals: Record<number, number> = {};

  if (!spellcasting.isSpellcaster) return totals;

  if (spellcasting.isPactMagic && spellcasting.pactSlotCount > 0) {
    totals[spellcasting.pactMaxSpellLevel] = spellcasting.pactSlotCount;
    return totals;
  }

  const spellProgression =
    subclassData?.spellProgression?.length &&
    spellcasting.spellcastingFromSubclass
      ? subclassData.spellProgression
      : classData?.spellProgression;

  if (!spellProgression?.length) return totals;

  const rowIndex = characterLevel - 1;
  for (const group of spellProgression) {
    const labels = group.colLabels ?? [];
    const row = group.rows[rowIndex];
    if (!row) continue;

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      if (label.toLowerCase().includes("slot level")) continue;

      const matched = Object.entries(ORDINAL_LEVEL).find(([key]) =>
        label.toLowerCase().includes(key.toLowerCase()),
      );
      if (!matched) continue;

      const spellLevel = matched[1];
      const slots = cellToNumber(row[i] ?? "—");
      if (slots > 0) totals[spellLevel] = slots;
    }
  }

  return totals;
}

/**
 * Features whose content is handled elsewhere (spell list, spell slots) and
 * should be omitted from the CLASS FEATURES text fields.
 */
const OMITTED_FEATURE_NAMES = new Set([
  "spellcasting",
  "pact magic",
]);

function isOmittedFeature(name: string): boolean {
  return OMITTED_FEATURE_NAMES.has(name.toLowerCase().trim());
}

function formatFeatureEntry(name: string, description: string[]): string {
  const desc = description.join("\n").trim();
  return desc ? `${name}\n${desc}` : name;
}

/**
 * Approximate character capacity for one CLASS FEATURES field at font size 7.
 * Used to decide where to cascade text from field 1 into field 2.
 */
const FIELD_CHAR_CAPACITY = 1200;

/**
 * Lookup map: optional feature / feat id → description lines.
 * Used to enrich the PDF with the actual description of each picked option.
 */
export type OptionalFeatureDescMap = Map<string, string[]>;

/**
 * Builds a display name for a progression, stripping the trailing " Options" suffix
 * that is common in 5etools data (e.g. "Fighting Style Options" → "Fighting Style").
 */
function progressionLabel(name: string): string {
  return name.replace(/ options$/i, "").trim();
}

/**
 * Returns a Set of lowercase feature names that are handled by the provided
 * optional-feature progressions. Class features whose names match will be
 * replaced in the PDF by the user's actual selections.
 */
function buildProgressionHandledNames(
  progressions: OptionalFeatureProgression[],
): Set<string> {
  const names = new Set<string>();
  for (const p of progressions) {
    const lower = p.name.toLowerCase();
    names.add(lower);
    // "Fighting Style Options" → also skip "Fighting Style"
    names.add(lower.replace(/ options$/i, "").trim());
  }
  return names;
}

/**
 * Formats the user's selections for a single progression into a PDF-ready
 * string. Returns null when no selections are available.
 */
function formatProgressionSelections(
  progression: OptionalFeatureProgression,
  selections: BuilderOptionalFeatureSelections,
  descMap: OptionalFeatureDescMap,
): string | null {
  const picks = (selections[progression.id] ?? []).filter(
    (s): s is NonNullable<typeof s> => s !== null,
  );

  if (picks.length === 0) return null;

  const label = progressionLabel(progression.name);

  if (progression.catalog === "feature-choice") {
    // For feature-choice progressions (Weapon Mastery, patron sub-type, etc.)
    // build a compact list: "Label\nOption1 (desc), Option2 (desc), ..."
    const optionMap = new Map(
      (progression.choiceOptions ?? []).map((o) => [o.id, o]),
    );
    const parts = picks.map((pick) => {
      const opt = optionMap.get(pick.id);
      const desc = opt?.entries[0] ?? "";
      return desc ? `${pick.name} (${desc})` : pick.name;
    });
    return picks.length === 1
      ? `${label}: ${parts[0]}`
      : `${label}\n${parts.join(", ")}`;
  }

  // Optional-feature / feat selections (Fighting Style, Eldritch Invocations, etc.)
  const selectionLines = picks.map((pick) => {
    const desc = descMap.get(pick.id) ?? [];
    // Truncate description to first two lines to keep the PDF compact.
    const shortDesc = desc.slice(0, 2).join(" ").trim();
    return shortDesc ? `${pick.name}: ${shortDesc}` : pick.name;
  });

  return picks.length === 1
    ? `${label}: ${selectionLines[0]}`
    : `${label}\n${selectionLines.join("\n")}`;
}

export function getClassFeaturesExport(
  classData: Class | null,
  subclassData: Subclass | null,
  level: number,
  optionalFeatureSelections?: BuilderOptionalFeatureSelections,
  descMap?: OptionalFeatureDescMap,
): { line1: string; line2: string } {
  const entries: string[] = [];

  const allProgressions: OptionalFeatureProgression[] = [
    ...(classData?.optionalFeatureProgressions ?? []),
    ...(subclassData?.optionalFeatureProgressions ?? []),
  ];

  // Names of class/subclass features that will be replaced by selection entries.
  const handledNames = buildProgressionHandledNames(allProgressions);

  // Collect standard (non-optional-catalog) class features.
  if (classData) {
    for (let i = 0; i < level; i++) {
      const row = classData.progression[i];
      if (!row) continue;
      for (const feature of row.features) {
        if (feature.isSubclassFeature || feature.gainSubclassFeature) continue;
        const name = feature.displayName || feature.name;
        if (isOmittedFeature(name)) continue;
        if (handledNames.has(name.toLowerCase())) continue;
        entries.push(formatFeatureEntry(name, feature.description));
      }
    }
  }

  // Collect standard subclass features.
  if (subclassData) {
    for (let i = 0; i < level; i++) {
      const row = subclassData.progression[i];
      if (!row) continue;
      for (const feature of row.features) {
        const name = feature.displayName || feature.name;
        if (isOmittedFeature(name)) continue;
        if (handledNames.has(name.toLowerCase())) continue;
        entries.push(formatFeatureEntry(name, feature.description));
      }
    }
  }

  // Append user's optional-feature selections (Fighting Style, Invocations, etc.)
  if (optionalFeatureSelections && descMap) {
    for (const progression of allProgressions) {
      const count = getOptionalFeatureCountAtLevel(progression.progression, level);
      if (count === 0) continue;

      const line = formatProgressionSelections(
        progression,
        optionalFeatureSelections,
        descMap,
      );
      if (line) entries.push(line);
    }
  }

  if (entries.length === 0) {
    return { line1: classData?.name ?? "", line2: "" };
  }

  const combined = entries.join("\n\n");

  if (combined.length <= FIELD_CHAR_CAPACITY) {
    return { line1: combined, line2: "" };
  }

  // Prefer splitting at a feature boundary (double newline) near the capacity limit.
  const searchFrom = Math.max(0, FIELD_CHAR_CAPACITY - 300);
  const featureBoundary = combined.indexOf("\n\n", searchFrom);
  if (featureBoundary !== -1 && featureBoundary <= FIELD_CHAR_CAPACITY + 300) {
    return {
      line1: combined.slice(0, featureBoundary).trim(),
      line2: combined.slice(featureBoundary).trim(),
    };
  }

  // A single feature is longer than the field: cascade at the nearest word boundary.
  let splitIdx = FIELD_CHAR_CAPACITY;
  while (splitIdx > 0 && combined[splitIdx] !== " " && combined[splitIdx] !== "\n") {
    splitIdx--;
  }
  if (splitIdx <= 0) splitIdx = FIELD_CHAR_CAPACITY;

  return {
    line1: combined.slice(0, splitIdx).trim(),
    line2: combined.slice(splitIdx).trim(),
  };
}

export function getSpeciesTraitsExport(speciesData: Species | null): string {
  if (!speciesData?.traits.length) return speciesData?.name ?? "";
  return speciesData.traits
    .map((trait) => formatFeatureEntry(trait.name, trait.entries))
    .join("\n\n");
}

export function buildEquipmentExport(options: {
  items: CartEntry[];
  mainHandName?: string | null;
  offHandName?: string | null;
  armorName?: string | null;
  shieldName?: string | null;
  trinket1Name?: string | null;
  trinket2Name?: string | null;
}): string {
  const {
    items,
    mainHandName,
    offHandName,
    armorName,
    shieldName,
    trinket1Name,
    trinket2Name,
  } = options;

  const lines: string[] = [];
  const seen = new Set<string>();

  function pushLine(line: string) {
    const key = line.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    lines.push(line);
  }

  if (mainHandName) pushLine(`${mainHandName} (main hand)`);
  if (offHandName) pushLine(`${offHandName} (off hand)`);
  if (armorName) pushLine(`${armorName} (armor)`);
  if (shieldName) pushLine(`${shieldName} (shield)`);
  if (trinket1Name) pushLine(`${trinket1Name} (trinket)`);
  if (trinket2Name) pushLine(`${trinket2Name} (trinket)`);

  const equippedNames = new Set(
    [mainHandName, offHandName, armorName, shieldName, trinket1Name, trinket2Name]
      .filter(Boolean)
      .map((name) => name!.toLowerCase()),
  );

  for (const entry of items) {
    if (equippedNames.has(entry.name.toLowerCase())) continue;
    if (isGoldInventoryEntry(entry)) continue;
    const label =
      entry.quantity > 1 ? `${entry.name} ×${entry.quantity}` : entry.name;
    pushLine(label);
  }

  return lines.join("\n");
}

export function hasShieldEquipped(options: {
  equippedShield: { name: string } | null;
  mainHand: EquippedWeapon | null;
}): boolean {
  if (options.equippedShield) return true;
  return hasActiveIntegratedShield(options.mainHand);
}
