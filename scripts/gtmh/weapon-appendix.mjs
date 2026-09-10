/**
 * Parse Appendix B weapons from the GMBinder/Patreon dump into 5etools-shaped
 * HW items + optionalfeature rows (local-wins overlay).
 */
import { readRawDumpSection, toParagraphs } from "./common.mjs";

export const APPENDIX_WEAPON_NAMES = [
  "Accel Axe",
  "Charge Blade",
  "Dual Blades",
  "Great Sword",
  "Gunlance",
  "Hammer",
  "Hunting Horn",
  "Insect Glaive",
  "Lance",
  "Longsword",
  "Magnet Spike",
  "Magus Staff",
  "Splint Rapier",
  "Switch Axe",
  "Sword and Shield",
  "Tonfas",
  "Wire Knuckles",
  "Wyvern Boomerang",
  "Bow",
  "Dual Repeaters",
  "Heavy Bowgun",
  "Light Bowgun",
];

const RARITY_ORDER = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"];
const RARITY_SLOTS = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  "Very Rare": 4,
  Legendary: 5,
};

const RARITY_HEADER_RX =
  /^(Nonmagical|Common|Uncommon|Rare|Very Rare|Legendary|All Rarities|All Rarites)\s*$/i;

const BONUS_RX =
  /You gain a \+(\d+) bonus on attacks and damage rolls(?:;\s*and \+(\d+) AC(?: while[^.]*)?)?/i;

const STAT_LINE_RX =
  /(?:(\d+)\s*gp,?\s*)?(\d+d\d+)\s+(slashing|piercing|bludgeoning)\b/i;

const WEIGHT_RX = /(\d+(?:\.\d+)?)\s*lb\.?/i;

const DMG_TYPE = {
  slashing: "S",
  piercing: "P",
  bludgeoning: "B",
};

const PROPERTY_MAP = [
  [/two-handed/i, "2H"],
  [/\bheavy\b/i, "H"],
  [/\blight\b/i, "L"],
  [/\bfinesse\b/i, "F"],
  [/\breach\b/i, "R"],
  [/\bthrown\b/i, "T"],
  [/\bammunition\b/i, "A"],
  [/\bspecial\b/i, "S"],
  [/\bloading\b/i, "MHL"],
  [/\bversatile\b/i, "V"],
];

const SKIP_FEATURE_PREFIXES = [
  /^this weapon retains/i,
  /^you gain a \+/i,
  /^gm'?s? note/i,
  /^coatings available\.?$/i,
  /^available ammo\.?$/i,
  /^additional coatings available\.?$/i,
];

function normalizeRarity(raw) {
  const key = String(raw ?? "").trim().toLowerCase();
  if (key === "nonmagical" || key === "common") return "Common";
  if (key === "uncommon") return "Uncommon";
  if (key === "rare") return "Rare";
  if (key === "very rare") return "Very Rare";
  if (key === "legendary") return "Legendary";
  if (key === "all rarities" || key === "all rarites") return "All Rarities";
  return null;
}

function splitWeaponBlocks(section) {
  const nameSet = new Set(APPENDIX_WEAPON_NAMES.map((n) => n.toLowerCase()));
  const lines = String(section ?? "").split("\n");
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (nameSet.has(trimmed.toLowerCase())) {
      if (current) blocks.push(current);
      current = { name: trimmed, body: [] };
      continue;
    }
    if (current) current.body.push(line);
  }
  if (current) blocks.push(current);
  return blocks;
}

function splitRaritySections(bodyLines) {
  const sections = [];
  let current = { rarity: "Intro", lines: [] };

  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (RARITY_HEADER_RX.test(trimmed)) {
      sections.push(current);
      current = { rarity: normalizeRarity(trimmed) ?? trimmed, lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  sections.push(current);
  return sections;
}

function parseFeatureParagraphs(units) {
  const features = [];
  let bonus = null;
  let acBonus = null;
  let current = null;
  let acceptingSuboptions = false;

  for (const paragraph of units) {
    if (SKIP_FEATURE_PREFIXES.some((rx) => rx.test(paragraph))) {
      const bonusMatch = paragraph.match(BONUS_RX);
      if (bonusMatch) {
        bonus = `+${bonusMatch[1]}`;
        if (bonusMatch[2]) acBonus = `+${bonusMatch[2]}`;
      }
      continue;
    }

    const featureMatch = paragraph.match(
      /^([A-Z][\w'’/+() -]{0,80}?)\.\s+(.+)$/s,
    );
    if (featureMatch) {
      const name = featureMatch[1].trim();
      const text = featureMatch[2].trim();
      // Skip prose that only looks like "Name. …" (ammo tables / sentences).
      if (
        /^(You|The|This|When|If|A|An|At|On|While|Once|Additionally)\b/i.test(
          name,
        ) ||
        name.split(/\s+/).length > 6
      ) {
        if (current) {
          current.text = `${current.text} ${paragraph}`.trim();
        }
        continue;
      }
      // Keep option bullets (Forced Movement / Directed Attack / …) inside the
      // parent feature; start a new row when the name looks like a real upgrade.
      if (
        current &&
        acceptingSuboptions &&
        !/\bUpgrade\b/i.test(name) &&
        !/\bGauge\b/i.test(name)
      ) {
        current.text = `${current.text}\n\n${name}. ${text}`.trim();
        continue;
      }
      current = { name, text };
      features.push(current);
      acceptingSuboptions =
        /following (effects|options)|change as follows|choose one of the following/i.test(
          text,
        ) || /:\s*$/.test(text);
      continue;
    }

    if (current) {
      current.text = `${current.text} ${paragraph}`.trim();
      if (
        /following (effects|options)|change as follows|choose one of the following/i.test(
          paragraph,
        )
      ) {
        acceptingSuboptions = true;
      } else if (acceptingSuboptions) {
        acceptingSuboptions = false;
      }
    }
  }

  return { features, bonus, acBonus };
}

function sectionUnits(lines) {
  // Prefer line units so single-newline feature lists stay separate.
  return String(lines?.join("\n") ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseBaseStats(paragraphs) {
  const joined = paragraphs.join(" ");
  const stats = {
    value: 0,
    dmg1: "",
    dmgType: "",
    weight: 0,
    property: [],
    range: undefined,
    ac: undefined,
  };

  const statMatch = joined.match(STAT_LINE_RX);
  if (statMatch) {
    if (statMatch[1]) stats.value = Number(statMatch[1]) * 100;
    stats.dmg1 = statMatch[2];
    stats.dmgType = DMG_TYPE[statMatch[3].toLowerCase()] ?? "";
  }

  const weightMatch = joined.match(WEIGHT_RX);
  if (weightMatch) stats.weight = Number(weightMatch[1]);

  const rangeMatch = joined.match(/range\s+(\d+\s*\/\s*\d+)/i);
  if (rangeMatch) stats.range = rangeMatch[1].replace(/\s+/g, "");

  const acMatch = joined.match(/\+(\d+)\s*AC/i);
  if (acMatch) stats.ac = Number(acMatch[1]);

  const props = [];
  for (const [rx, code] of PROPERTY_MAP) {
    if (rx.test(joined) && !props.includes(code)) props.push(code);
  }
  stats.property = props;

  // Dual-mode lines: capture second damage die as dmg2 when present.
  const allDice = [...joined.matchAll(/(\d+d\d+)\s+(slashing|piercing|bludgeoning)/gi)];
  if (allDice.length >= 2) {
    stats.dmg2 = allDice[1][1];
    // Prefer sword/shield (lighter) as primary when Charge Blade style.
    if (/sword/i.test(joined) && /axe/i.test(joined)) {
      const sword = allDice.find((m) => {
        const idx = joined.toLowerCase().indexOf(m[0].toLowerCase());
        const before = joined.slice(Math.max(0, idx - 40), idx).toLowerCase();
        return before.includes("sword");
      });
      const axe = allDice.find((m) => {
        const idx = joined.toLowerCase().indexOf(m[0].toLowerCase());
        const before = joined.slice(Math.max(0, idx - 40), idx).toLowerCase();
        return before.includes("axe");
      });
      if (sword) {
        stats.dmg1 = sword[1];
        stats.dmgType = DMG_TYPE[sword[2].toLowerCase()] ?? stats.dmgType;
      }
      if (axe) stats.dmg2 = axe[1];
    }
  }

  return stats;
}

function optfeatureTag(name, displayName = name) {
  const safe = String(name).replace(/\|/g, "/");
  const safeDisplay = String(displayName).replace(/\|/g, "/");
  if (safe === safeDisplay) return `{@optfeature ${safe}|AGMH}`;
  return `{@optfeature ${safe}|AGMH|${safeDisplay}}`;
}

function buildWeaponRecord(block) {
  const sections = splitRaritySections(block.body);
  const intro = sections.find((s) => s.rarity === "Intro");
  const introParagraphs = toParagraphs(intro?.lines.join("\n") ?? "");
  const description = introParagraphs[0] ?? "";

  const baseStats = { value: 0, dmg1: "", dmgType: "", weight: 0, property: [] };
  const rarityBuckets = new Map();
  const allRarityFeatures = [];
  const optionalFeatures = [];
  const usedFeatureNames = new Map();

  function registerFeature(displayName, rarityLabel, text) {
    const base = String(displayName).trim();
    const seen = usedFeatureNames.get(base.toLowerCase()) ?? 0;
    usedFeatureNames.set(base.toLowerCase(), seen + 1);
    const uniqueName = seen === 0 ? base : `${base} (${rarityLabel})`;

    optionalFeatures.push({
      name: uniqueName,
      source: "AGMH",
      featureType: ["HWF"],
      prerequisite: [
        {
          otherSummary: {
            entry:
              rarityLabel === "All"
                ? block.name
                : `${block.name} (${rarityLabel})`,
            entrySummary:
              rarityLabel === "All"
                ? block.name
                : `${block.name} (${rarityLabel[0]})`,
          },
        },
      ],
      entries: [text],
    });

    return { uniqueName, displayName: base };
  }

  for (const section of sections) {
    if (section.rarity === "Intro") continue;
    const units = sectionUnits(section.lines);
    if (section.rarity === "Common") {
      Object.assign(baseStats, parseBaseStats(units));
    }

    const { features, bonus, acBonus } = parseFeatureParagraphs(units);

    if (section.rarity === "All Rarities") {
      for (const feature of features) {
        const registered = registerFeature(feature.name, "All", feature.text);
        allRarityFeatures.push(registered);
      }
      continue;
    }

    const rarity = section.rarity;
    if (!RARITY_ORDER.includes(rarity)) continue;

    const existing = rarityBuckets.get(rarity) ?? {
      rarity,
      bonus: "-",
      acBonus: null,
      features: [],
    };
    if (bonus) existing.bonus = bonus;
    if (acBonus) existing.acBonus = acBonus;

    for (const feature of features) {
      const registered = registerFeature(feature.name, rarity, feature.text);
      existing.features.push(registered);
    }
    rarityBuckets.set(rarity, existing);
  }

  // Ensure Common exists even when dump only has Nonmagical stats.
  if (!rarityBuckets.has("Common")) {
    rarityBuckets.set("Common", {
      rarity: "Common",
      bonus: "-",
      acBonus: null,
      features: [],
    });
  }

  const hasAcColumn = [...rarityBuckets.values()].some((row) => row.acBonus);
  const colLabels = hasAcColumn
    ? ["Rarity", "Slots", "Bonus", "AC Bonus", "Features"]
    : ["Rarity", "Slots", "Bonus", "Features"];

  const rows = RARITY_ORDER.map((rarity) => {
    const bucket = rarityBuckets.get(rarity) ?? {
      rarity,
      bonus: "-",
      acBonus: null,
      features: [],
    };
    const featureRefs = [
      ...(rarity === "Common" ? allRarityFeatures : []),
      ...bucket.features,
    ].map((f) => optfeatureTag(f.uniqueName, f.displayName));
    const featuresCell = featureRefs.length > 0 ? featureRefs.join(", ") : "--";
    const slots = String(RARITY_SLOTS[rarity] ?? 1);
    if (hasAcColumn) {
      return [
        rarity,
        slots,
        bucket.bonus || "-",
        bucket.acBonus || "-",
        featuresCell,
      ];
    }
    return [rarity, slots, bucket.bonus || "-", featuresCell];
  });

  const insetEntries = [];
  if (allRarityFeatures.length > 0) {
    insetEntries.push(
      allRarityFeatures
        .map((f) => optfeatureTag(f.uniqueName, f.displayName))
        .join(", "),
    );
  }
  insetEntries.push({
    type: "table",
    colLabels,
    rows,
  });

  const item = {
    name: block.name,
    source: "AGMH",
    type: "HW",
    rarity: "none",
    weight: baseStats.weight || 0,
    value: baseStats.value || 0,
    property: baseStats.property || [],
    dmg1: baseStats.dmg1 || "",
    dmgType: baseStats.dmgType || "",
    entries: [
      description ? `{@i ${description}}` : `{@i ${block.name}.}`,
      {
        type: "inset",
        name: block.name,
        entries: insetEntries,
      },
    ],
  };

  if (baseStats.dmg2) item.dmg2 = baseStats.dmg2;
  if (baseStats.range) item.range = baseStats.range;
  if (typeof baseStats.ac === "number") item.ac = baseStats.ac;

  return { item, optionalFeatures };
}

let cached = null;

export function parseWeaponAppendix() {
  if (cached) return cached;

  const section = readRawDumpSection(
    "Appendix B: Monster Hunter Weapons",
    "Appendix C: Old World Bestiary",
  );
  const blocks = splitWeaponBlocks(section);
  const items = [];
  const optionalFeatures = [];

  for (const block of blocks) {
    const parsed = buildWeaponRecord(block);
    items.push(parsed.item);
    optionalFeatures.push(...parsed.optionalFeatures);
  }

  cached = { items, optionalFeatures };
  return cached;
}
