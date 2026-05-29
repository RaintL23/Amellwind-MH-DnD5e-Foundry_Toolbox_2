import { Rune, RuneSlot } from "@/shared/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

// ─── Slot parsing ─────────────────────────────────────────────────────────────

function parseSlots(slotsStr: string): RuneSlot[] {
  const slots: RuneSlot[] = [];
  if (slotsStr.includes("A")) slots.push("A");
  if (slotsStr.includes("W")) slots.push("W");
  return slots;
}

// ─── Effects indexer ──────────────────────────────────────────────────────────

function indexEffectsByName(items: unknown[]): Record<string, string> {
  const index: Record<string, string> = {};
  if (!Array.isArray(items)) return index;
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const i = item as Raw;
    const name = String(i.name ?? "");
    const entries = Array.isArray(i.entries) ? i.entries : [];
    index[name] = entries
      .map((e: unknown) => (typeof e === "string" ? e : ""))
      .filter(Boolean)
      .join(" ");
  }
  return index;
}

// ─── Tag extraction ───────────────────────────────────────────────────────────

const CLASS_PATTERNS: Array<[RegExp, string]> = [
  [/spellcaster only/i, "class:spellcaster"],
  [/Monk only/i, "class:monk"],
  [/\bDruid\b.*only/i, "class:druid"],
  [/\bSorcerer\b.*only/i, "class:sorcerer"],
  [/\bWarlock\b.*only/i, "class:warlock"],
  [/\bWizard\b.*only/i, "class:wizard"],
  [/\bCleric\b.*only/i, "class:cleric"],
  [/\bPaladin\b.*only/i, "class:paladin"],
  [/\bRanger\b.*only/i, "class:ranger"],
  [/artificer.*only/i, "class:artificer"],
  [/\bBard\b.*only/i, "class:bard"],
  [/\bBarbarian\b.*only/i, "class:barbarian"],
  [/\bFighter\b.*only/i, "class:fighter"],
  [/\bRogue\b.*only/i, "class:rogue"],
];

const WEAPON_TYPE_PATTERNS: Array<[RegExp, string]> = [
  [/Bladed Weapon only/i, "weapon-type:bladed"],
  [/Melee Weapon only/i, "weapon-type:melee"],
  [/Ranged weapon only/i, "weapon-type:ranged"],
  [/Insect Glaive only/i, "weapon-type:insect-glaive"],
  [/Greatsword.*only/i, "weapon-type:greatsword"],
  [/\bLance\b.*only/i, "weapon-type:lance"],
  [/Bow only/i, "weapon-type:bow"],
  [/Gunlance only/i, "weapon-type:gunlance"],
  [/Hammer.*only/i, "weapon-type:hammer"],
  [/[Cc]harge [Bb]lade.*only/i, "weapon-type:charge-blade"],
  [/switchaxe.*only/i, "weapon-type:switchaxe"],
];

const MECHANIC_PATTERNS: Array<[RegExp, string]> = [
  [/\{@spell/i, "mechanic:spell"],
  [/\d+\s*runes?|runes?\s*\d+/i, "mechanic:rune-charges"],
  [/critical/i, "mechanic:critical"],
  [/extra \{@damage|extra \d+d\d+/i, "mechanic:extra-damage"],
  [/resistance to\s+\w/i, "mechanic:resistance"],
  [/immune to|immunity to/i, "mechanic:immunity"],
  [/bonus action/i, "mechanic:bonus-action"],
  [/\breaction\b/i, "mechanic:reaction"],
  [
    /saving throw.*(?:advantage|disadvantage)|(?:advantage|disadvantage).*saving throw/i,
    "mechanic:saving-throw",
  ],
  [/\+\d+\s*bonus\s+on.*\{@skill/i, "mechanic:skill-bonus"],
  [/\bAC\b|armor class/i, "mechanic:ac"],
  [/\{@condition/i, "mechanic:condition"],
  [/(?:movement|speed|jump)\s+(?:increase|by|\d+)/i, "mechanic:movement"],
  [/\badvantage\b(?!.*saving throw)/i, "mechanic:advantage"],
  [/(?:regain|restore)\s+\d+.*hit points/i, "mechanic:healing"],
  [/\bcantrip\b/i, "mechanic:cantrip"],
  [
    /wyvernfire|dragonpiercer|Guard AC|Mighty Weapon/i,
    "mechanic:class-feature",
  ],
];

function extractTags(effectText: string): string[] {
  const tags = new Set<string>();

  for (const [pattern, tag] of CLASS_PATTERNS) {
    if (pattern.test(effectText)) tags.add(tag);
  }
  for (const [pattern, tag] of WEAPON_TYPE_PATTERNS) {
    if (pattern.test(effectText)) tags.add(tag);
  }
  for (const [pattern, tag] of MECHANIC_PATTERNS) {
    if (pattern.test(effectText)) tags.add(tag);
  }

  return Array.from(tags);
}

// ─── Main mapper ─────────────────────────────────────────────────────────────

/** Busca recursivamente un objeto `{ type: "inset" }` dentro de un array de entries. */
function findInset(entries: unknown[]): Raw | undefined {
  for (const e of entries) {
    if (typeof e !== "object" || e === null) continue;
    const obj = e as Raw;
    if (obj.type === "inset") return obj;
    if (Array.isArray(obj.entries)) {
      const found = findInset(obj.entries as unknown[]);
      if (found) return found;
    }
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRunesFromMonster(rawMonster: any): Rune[] {
  const fluff = rawMonster?.fluff;
  if (!fluff || !Array.isArray(fluff.entries)) return [];

  const inset = findInset(fluff.entries as unknown[]);
  if (!inset || !Array.isArray(inset.entries)) return [];

  const tables = inset.entries.filter((e: Raw) => e.type === "table") as Raw[];
  const lootTable = tables.find((t) => t.colLabels?.[0] === "Carve Chance");
  const headerTable = tables.find((t) => !t.colLabels);

  if (!lootTable || !Array.isArray(lootTable.rows)) return [];

  const lists = inset.entries.filter((e: Raw) => e.type === "list") as Raw[];
  const armorList = lists.find((l) => l.name === "ARMOR MATERIAL EFFECTS");
  const weaponList = lists.find((l) => l.name === "WEAPON MATERIAL EFFECTS");

  const armorEffects = indexEffectsByName(armorList?.items ?? []);
  const weaponEffects = indexEffectsByName(weaponList?.items ?? []);

  const rolls = parseInt(String(headerTable?.rows?.[0]?.[3] ?? "0")) || 0;

  // Detectar si la tabla tiene 4 columnas (Carve, Capture, Material, Slots)
  // o 3 columnas (Carve, Material, Slots) — sin columna de captura.
  const hasCapture = (lootTable.colLabels as string[]).length >= 4;

  const runes: Rune[] = [];

  for (const row of lootTable.rows as unknown[][]) {
    let carveChance: string;
    let captureChance: string;
    let name: string;
    let slotsStr: string;

    if (hasCapture) {
      carveChance = String(row[0] ?? "-");
      captureChance = String(row[1] ?? "-");
      name = String(row[2] ?? "");
      slotsStr = String(row[3] ?? "");
    } else {
      carveChance = String(row[0] ?? "-");
      captureChance = "-";
      name = String(row[1] ?? "");
      slotsStr = String(row[2] ?? "");
    }

    if (!name) continue;

    const slots = parseSlots(slotsStr);
    const armorEffect = armorEffects[name] ?? null;
    const weaponEffect = weaponEffects[name] ?? null;

    const weaponTags = weaponEffect ? extractTags(weaponEffect) : [];
    const armorTags = armorEffect ? extractTags(armorEffect) : [];
    const tags = Array.from(new Set([...weaponTags, ...armorTags]));

    runes.push({
      name,
      monsterName: String(rawMonster.name ?? ""),
      monsterSource: String(rawMonster.source ?? ""),
      carveChance,
      captureChance,
      rolls,
      slots,
      armorEffect,
      weaponEffect,
      tags,
      weaponTags,
      armorTags,
    });
  }
  // console.log(runes);

  return runes;
}
