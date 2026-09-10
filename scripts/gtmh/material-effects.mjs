/**
 * Parse Material Effects lists from the Patreon dump into a minimal bookData
 * tree that `mapMaterialEffectsFromBookData` understands.
 */
import { readRawDumpSection } from "./common.mjs";

const RARITIES = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"];

const SECTION_HEADERS = [
  { title: "Common Weapon Material Effects", slot: "weapon", rarity: "Common" },
  {
    title: "Uncommon Weapon Material Effects",
    slot: "weapon",
    rarity: "Uncommon",
  },
  { title: "Rare Weapon Material Effects", slot: "weapon", rarity: "Rare" },
  {
    title: "Very Rare Weapon Material Effects",
    slot: "weapon",
    rarity: "Very Rare",
  },
  {
    title: "Legendary Weapon Material Effects",
    slot: "weapon",
    rarity: "Legendary",
  },
  { title: "Common Armor Material Effects", slot: "armor", rarity: "Common" },
  {
    title: "Uncommon Armor Material Effects",
    slot: "armor",
    rarity: "Uncommon",
  },
  { title: "Rare Armor Material Effects", slot: "armor", rarity: "Rare" },
  {
    title: "Very Rare Armor Material Effects",
    slot: "armor",
    rarity: "Very Rare",
  },
  {
    title: "Legendary Armor Material Effects",
    slot: "armor",
    rarity: "Legendary",
  },
];

function parseEffectLines(body) {
  const rows = [];
  const lines = String(body ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let current = null;
  for (const line of lines) {
    if (/^Name Material Effect$/i.test(line)) continue;
    if (/^(Weapon|Armor) Materials$/i.test(line)) continue;
    if (
      SECTION_HEADERS.some(
        (header) => header.title.toLowerCase() === line.toLowerCase(),
      )
    ) {
      continue;
    }

    const match = line.match(/^(.+?)\.\s+(.+)$/);
    if (match && /^[A-Z0-9]/.test(match[1]) && match[1].length <= 80) {
      current = {
        name: `${match[1].trim()}.`,
        effect: match[2].trim(),
      };
      rows.push(current);
      continue;
    }

    if (current) {
      current.effect = `${current.effect} ${line}`.trim();
    }
  }

  return rows.map((row) => [row.name, row.effect]);
}

function extractSectionBody(source, title, nextTitles) {
  const startToken = `\n${title}\n`;
  const startIdx = source.indexOf(startToken);
  if (startIdx === -1) {
    // First section may be at file start without leading newline.
    if (source.startsWith(`${title}\n`)) {
      const from = title.length + 1;
      let to = source.length;
      for (const next of nextTitles) {
        const idx = source.indexOf(`\n${next}\n`, from);
        if (idx !== -1) to = Math.min(to, idx);
      }
      return source.slice(from, to).trim();
    }
    return "";
  }

  const from = startIdx + startToken.length;
  let to = source.length;
  for (const next of nextTitles) {
    const idx = source.indexOf(`\n${next}\n`, from);
    if (idx !== -1) to = Math.min(to, idx);
  }
  return source.slice(from, to).trim();
}

export function buildMaterialEffectsBookData() {
  const source = readRawDumpSection(
    "Monster Hunter Monster Loot Table Material List",
    "Chapter 5",
  );
  if (!source) return {};

  const weaponEntries = [];
  const armorEntries = [];

  for (let i = 0; i < SECTION_HEADERS.length; i += 1) {
    const header = SECTION_HEADERS[i];
    const nextTitles = SECTION_HEADERS.slice(i + 1).map((h) => h.title);
    const body = extractSectionBody(source, header.title, nextTitles);
    const rows = parseEffectLines(body);
    if (rows.length === 0) continue;

    const entry = {
      type: "entries",
      name: header.title,
      entries: [
        {
          type: "table",
          colLabels: ["Name", "Material Effect"],
          rows,
        },
      ],
    };

    if (header.slot === "weapon") weaponEntries.push(entry);
    else armorEntries.push(entry);
  }

  // Keep rarity group order stable for the mapper.
  const sortByRarity = (entries) =>
    entries.sort(
      (a, b) =>
        RARITIES.findIndex((r) => a.name.startsWith(r)) -
        RARITIES.findIndex((r) => b.name.startsWith(r)),
    );

  sortByRarity(weaponEntries);
  sortByRarity(armorEntries);

  if (weaponEntries.length === 0 && armorEntries.length === 0) return {};

  return {
    0: {
      data: [
        {
          type: "section",
          name: "Chapter 4: Hunting Materials (Patreon overlay)",
          entries: [
            {
              type: "entries",
              name: "Monster Hunter Monster Loot Table Material List",
              entries: [
                {
                  type: "entries",
                  name: "Weapon Materials",
                  entries: [
                    "The list below is almost every weapon material effect found in the Monster Hunter Monster Loot Tables.",
                    ...weaponEntries,
                  ],
                },
                {
                  type: "entries",
                  name: "Armor Materials",
                  entries: [
                    "The list below is some of the armor material effect found in the Monster Hunter Monster Loot Tables.",
                    ...armorEntries,
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };
}
