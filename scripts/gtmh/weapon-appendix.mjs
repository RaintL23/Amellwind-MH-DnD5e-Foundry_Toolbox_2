/**
 * Parse Appendix B weapons from the formatted slice
 * (`public/data/gtmh-patreon/gtmh-patreon-appendixB.md`, source of truth) into
 * 5etools-shaped HW items + optionalfeature rows (local-wins overlay). Each
 * `## Weapon` heading is one weapon; cost/weight come from the chapter 3
 * "Armor & Weapon Pricing" table.
 */
import {
  flattenSliceMarkdown,
  headingBlocks,
  readMarkdownTable,
  readSlice,
  toParagraphs,
} from "./common.mjs";

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
  /(?:You gain a )?\+(\d+) bonus on attacks and damage rolls(?:;\s*and \+(\d+) AC(?: while[^.]*)?)?/i;

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

/**
 * Abbreviations used to disambiguate optfeature names shared by several
 * weapons (e.g. "Ammo (HBG)" vs "Ammo (LBG)"). Matches the GitHub feed
 * convention where it exists.
 */
const WEAPON_ABBREVIATIONS = {
  "Accel Axe": "AA",
  "Charge Blade": "CB",
  "Dual Blades": "DB",
  "Great Sword": "GS",
  Gunlance: "GL",
  Hammer: "H",
  "Hunting Horn": "HH",
  "Insect Glaive": "IG",
  Lance: "L",
  Longsword: "LS",
  "Magnet Spike": "MS",
  "Magus Staff": "MGS",
  "Splint Rapier": "SR",
  "Switch Axe": "SA",
  "Sword and Shield": "SnS",
  Tonfas: "T",
  "Wire Knuckles": "WK",
  "Wyvern Boomerang": "WB",
  Bow: "B",
  "Dual Repeaters": "DR",
  "Heavy Bowgun": "HBG",
  "Light Bowgun": "LBG",
};

const SKIP_FEATURE_PREFIXES = [
  /^this weapon retains/i,
  /^you gain a \+/i,
  /^\+\d+ bonus on attacks/i,
];

/** Weapon resource columns (Forge-style): unlockable types, not rules. */
const RESOURCE_MARKER_RX =
  /^(?:(?:additional\s+)?(ammo|coatings|notes)\s+available|available\s+(ammo|coatings|notes))\s*[.:]?$/i;

const RESOURCE_COLUMN_BY_MARKER = {
  ammo: "Ammo",
  coatings: "Coatings",
  notes: "Notes",
};

/** Kinsect essences (Insect Glaive) are resources, not standalone features. */
const KINSECT_ESSENCE_NAMES = new Set(["red", "white", "orange", "green"]);

const PHIAL_RESOURCE_RX = /\bPhial \(Costs \d+\)$/i;

/** Appendix trailers after the rarity list (vendor tables, GM notes, variants). */
const WEAPON_TRAILER_RX = /^(?:ammo vendor|gm'?s? note|variant:)/i;

const CHORD_LENGTH_RX = /chord length:\s*(\d+)/i;

/** "Power Shot When you hit…" / "Power Phial Upgrade You can…" (missing period). */
const UNPUNCTUATED_FEATURE_RX =
  /^((?:[A-Z][\w'’+-]*\s){1,4}?)(When|Whenever|You|Your|As|If|This|On)\s(.+)$/s;

const FEATURES_COLUMN = "Features";

function lastWord(name) {
  const words = name.trim().split(/\s+/);
  return words[words.length - 1].toLowerCase();
}

/**
 * Sub-option runs like Empowered Boost's "Blaze Ammo. … Cryo Ammo. …" share a
 * trailing noun; a name that breaks the pattern ("Modifications") starts a new
 * feature instead of being swallowed by the previous one.
 */
function breaksSuboptionRun(suboptionNames, name) {
  if (suboptionNames.length < 3) return false;
  const shared = lastWord(suboptionNames[0]);
  if (!suboptionNames.every((n) => lastWord(n) === shared)) return false;
  return lastWord(name) !== shared;
}

function matchFeatureLine(paragraph) {
  const featureMatch = paragraph.match(/^([A-Z][\w'’/+() -]{0,80}?)\.\s+(.+)$/s);
  if (featureMatch) {
    return { name: featureMatch[1].trim(), text: featureMatch[2].trim() };
  }
  const loose = paragraph.match(UNPUNCTUATED_FEATURE_RX);
  if (loose) {
    return {
      name: loose[1].trim(),
      text: `${loose[2]} ${loose[3]}`.trim(),
    };
  }
  return null;
}

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

/**
 * One block per `## Weapon` heading. `###` headings before the first
 * `####` rarity (Insect Glaive "The Kinsect") stay as intro titles.
 */
function readWeaponBlocks() {
  return headingBlocks(readSlice("appendixB"), 2).map((block) => ({
    name: block.title,
    body: flattenSliceMarkdown(block.body, {
      keepTitle: (_title, { level, afterLevel4 }) => level === 3 && !afterLevel4,
    }).split("\n"),
  }));
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

/**
 * Resource column for a feature name inside a rarity section, or Features.
 * `markerColumn` is set after "Ammo Available." / "Coatings Available." / …
 */
function resolveFeatureColumn(weaponName, name, markerColumn) {
  if (/\bUpgrade\b/i.test(name)) return FEATURES_COLUMN;
  if (PHIAL_RESOURCE_RX.test(name)) return "Phials";
  // Nonmagical tiers list starter ammo/coatings without an "Available" marker.
  if (/.\sAmmo$/i.test(name)) return "Ammo";
  if (/.\sCoating(?:\s\+\d+)?$/i.test(name)) return "Coatings";
  if (
    weaponName === "Insect Glaive" &&
    KINSECT_ESSENCE_NAMES.has(name.toLowerCase())
  ) {
    return "Essences";
  }
  return markerColumn ?? FEATURES_COLUMN;
}

/** Continuation prose belongs to the last sub-option when one is open. */
function appendFeatureText(feature, paragraph) {
  const target = feature.suboptions.at(-1) ?? feature;
  target.text = `${target.text} ${paragraph}`.trim();
}

function composeFeatureText(feature) {
  return [
    feature.text,
    ...feature.suboptions.map((s) => `${s.name}. ${s.text}`),
  ].join("\n\n");
}

/**
 * Sub-options that later get their own "X Upgrade" (Tonfas Propel / Earth
 * Style) are real features: split them out so the upgrade chain has a root.
 */
function promoteUpgradedSuboptions(features, upgradeBases, weaponName) {
  return features.flatMap((feature) => {
    const promoted = feature.suboptions.filter((s) =>
      upgradeBases.has(s.name.toLowerCase()),
    );
    if (promoted.length === 0) return [feature];
    return [
      {
        ...feature,
        suboptions: feature.suboptions.filter((s) => !promoted.includes(s)),
      },
      ...promoted.map((s) => ({
        name: s.name,
        text: s.text,
        rarityLabel: feature.rarityLabel,
        column: resolveFeatureColumn(weaponName, s.name, null),
        suboptions: [],
      })),
    ];
  });
}

function parseFeatureParagraphs(units, weaponName) {
  const features = [];
  let bonus = null;
  let acBonus = null;
  let chordLength = null;
  let current = null;
  let acceptingSuboptions = false;
  let suboptionNames = [];
  let markerColumn = null;

  for (const paragraph of units) {
    if (SKIP_FEATURE_PREFIXES.some((rx) => rx.test(paragraph))) {
      const bonusMatch = paragraph.match(BONUS_RX);
      if (bonusMatch) {
        bonus = `+${bonusMatch[1]}`;
        if (bonusMatch[2]) acBonus = `+${bonusMatch[2]}`;
      }
      continue;
    }

    const marker = paragraph.match(RESOURCE_MARKER_RX);
    if (marker) {
      markerColumn =
        RESOURCE_COLUMN_BY_MARKER[(marker[1] ?? marker[2]).toLowerCase()];
      acceptingSuboptions = false;
      continue;
    }

    const chord = paragraph.match(CHORD_LENGTH_RX);
    if (chord && /^Hunting Horn chord length/i.test(paragraph)) {
      chordLength = chord[1];
      continue;
    }

    const featureMatch = matchFeatureLine(paragraph);
    if (featureMatch) {
      const { name, text } = featureMatch;
      // Skip prose that only looks like "Name. …" (ammo tables / sentences).
      if (
        /^(You|The|This|When|If|A|An|At|On|While|Once|Additionally)\b/i.test(
          name,
        ) ||
        name.split(/\s+/).length > 6
      ) {
        if (current) appendFeatureText(current, paragraph);
        continue;
      }
      // Keep option bullets (Forced Movement / Directed Attack / …) inside the
      // parent feature; start a new row when the name looks like a real upgrade.
      if (
        current &&
        acceptingSuboptions &&
        !/\bUpgrade\b/i.test(name) &&
        !/\bGauge\b/i.test(name) &&
        !breaksSuboptionRun(suboptionNames, name)
      ) {
        current.suboptions.push({ name, text });
        suboptionNames.push(name);
        continue;
      }
      current = {
        name,
        text,
        column: resolveFeatureColumn(weaponName, name, markerColumn),
        suboptions: [],
      };
      features.push(current);
      suboptionNames = [];
      acceptingSuboptions =
        /following (effects|options|modifications)|change as follows|choose one of the following|modifications are available/i.test(
          text,
        ) || /:\s*$/.test(text);
      continue;
    }

    if (current) {
      appendFeatureText(current, paragraph);
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

  return { features, bonus, acBonus, chordLength };
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

/** Drops vendor tables / GM notes / variants that follow the Legendary tier. */
function stripWeaponTrailers(bodyLines) {
  const end = bodyLines.findIndex((line) => WEAPON_TRAILER_RX.test(line.trim()));
  return end >= 0 ? bodyLines.slice(0, end) : bodyLines;
}

/**
 * Intro prose after the first paragraph (e.g. Insect Glaive "The Kinsect"
 * rules). A short title line becomes a bold lead-in.
 */
function introSupplementaryEntries(introLines) {
  const blocks = String(introLines.join("\n"))
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks.slice(1).map((block) => {
    const [first, ...rest] = block.split("\n");
    const isTitle =
      rest.length > 0 &&
      !/[.:!?]$/.test(first.trim()) &&
      first.trim().split(/\s+/).length <= 5;
    const body = (isTitle ? rest : [first, ...rest])
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    return isTitle ? `{@b ${first.trim()}.} ${body}` : body;
  });
}

/** First pass: sections → stats, bonuses and labelled features per rarity. */
function parseWeaponBlock(block) {
  const sections = splitRaritySections(stripWeaponTrailers(block.body));
  const intro = sections.find((s) => s.rarity === "Intro");
  const introParagraphs = toParagraphs(intro?.lines.join("\n") ?? "");

  const baseStats = { value: 0, dmg1: "", dmgType: "", weight: 0, property: [] };
  const rarityBuckets = new Map();
  const allRarityFeatures = [];

  for (const section of sections) {
    if (section.rarity === "Intro") continue;
    const units = sectionUnits(section.lines);
    if (section.rarity === "Common") {
      Object.assign(baseStats, parseBaseStats(units));
    }

    const { features, bonus, acBonus, chordLength } = parseFeatureParagraphs(
      units,
      block.name,
    );

    if (section.rarity === "All Rarities") {
      allRarityFeatures.push(
        ...features.map((f) => ({ ...f, rarityLabel: "All" })),
      );
      continue;
    }

    const rarity = section.rarity;
    if (!RARITY_ORDER.includes(rarity)) continue;

    const existing = rarityBuckets.get(rarity) ?? {
      rarity,
      bonus: "-",
      acBonus: null,
      chordLength: null,
      features: [],
    };
    if (bonus) existing.bonus = bonus;
    if (acBonus) existing.acBonus = acBonus;
    if (chordLength) existing.chordLength = chordLength;
    existing.features.push(
      ...features.map((f) => ({ ...f, rarityLabel: rarity })),
    );
    rarityBuckets.set(rarity, existing);
  }

  const upgradeBases = new Set(
    [...allRarityFeatures, ...[...rarityBuckets.values()].flatMap((b) => b.features)]
      .filter((f) => /\bUpgrade\b/i.test(f.name))
      .map((f) => f.name.replace(/\s+Upgrade\b.*/i, "").trim().toLowerCase()),
  );
  const finalize = (features) =>
    promoteUpgradedSuboptions(features, upgradeBases, block.name).map((f) => ({
      name: f.name,
      column: f.column,
      rarityLabel: f.rarityLabel,
      text: composeFeatureText(f),
    }));
  for (const bucket of rarityBuckets.values()) {
    bucket.features = finalize(bucket.features);
  }

  return {
    name: block.name,
    description: introParagraphs[0] ?? "",
    supplementary: introSupplementaryEntries(intro?.lines ?? []),
    baseStats,
    rarityBuckets,
    allRarityFeatures: finalize(allRarityFeatures),
  };
}

function featureLabelsOf(parsed) {
  return [
    ...parsed.allRarityFeatures,
    ...[...parsed.rarityBuckets.values()].flatMap((b) => b.features),
  ].map((f) => f.name.trim().toLowerCase());
}

/**
 * Optfeature names must be unique across the whole supplement (5etools keys
 * them by name). Labels shared by several weapons get the weapon abbreviation;
 * repeats inside one weapon get the rarity. The table tag keeps the plain label
 * as display text, e.g. {@optfeature Ammo (HBG)|AGMH|Ammo}.
 */
function createFeatureNamer(sharedLabels) {
  const usedNames = new Set();
  return (weaponName, label, rarityLabel, seenInWeapon) => {
    const qualifiers = [];
    if (sharedLabels.has(label.toLowerCase())) {
      qualifiers.push(WEAPON_ABBREVIATIONS[weaponName] ?? weaponName);
    }
    if (seenInWeapon > 0 && rarityLabel !== "All") qualifiers.push(rarityLabel);
    let name =
      qualifiers.length > 0 ? `${label} (${qualifiers.join(", ")})` : label;
    for (let n = 2; usedNames.has(name.toLowerCase()); n++) {
      name = `${label} (${[...qualifiers, n].join(", ")})`;
    }
    usedNames.add(name.toLowerCase());
    return name;
  };
}

function emptyRarityBucket(rarity) {
  return { rarity, bonus: "-", acBonus: null, chordLength: null, features: [] };
}

/** Second pass: unique optfeature names + 5etools item with resource columns. */
function buildWeaponRecord(parsed, nameFeature) {
  const optionalFeatures = [];
  const usedLabels = new Map();

  function registerFeature(feature) {
    const label = String(feature.name).trim();
    const key = label.toLowerCase();
    const seen = usedLabels.get(key) ?? 0;
    usedLabels.set(key, seen + 1);
    const uniqueName = nameFeature(parsed.name, label, feature.rarityLabel, seen);
    const isAll = feature.rarityLabel === "All";

    optionalFeatures.push({
      name: uniqueName,
      source: "AGMH",
      featureType: ["HWF"],
      prerequisite: [
        {
          otherSummary: {
            entry: isAll
              ? parsed.name
              : `${parsed.name} (${feature.rarityLabel})`,
            entrySummary: isAll
              ? parsed.name
              : `${parsed.name} (${feature.rarityLabel[0]})`,
          },
        },
      ],
      entries: [feature.text],
    });

    return { uniqueName, displayName: label, column: feature.column };
  }

  const allRarityFeatures = parsed.allRarityFeatures.map(registerFeature);
  const rarityBuckets = new Map(
    [...parsed.rarityBuckets.entries()].map(([rarity, bucket]) => [
      rarity,
      { ...bucket, features: bucket.features.map(registerFeature) },
    ]),
  );

  // Ensure Common exists even when dump only has Nonmagical stats.
  if (!rarityBuckets.has("Common")) {
    rarityBuckets.set("Common", emptyRarityBucket("Common"));
  }

  const buckets = [...rarityBuckets.values()];
  const hasAcColumn = buckets.some((row) => row.acBonus);
  const hasChordColumn = buckets.some((row) => row.chordLength);
  const resourceColumns = [
    ...new Set(
      buckets
        .flatMap((row) => row.features.map((f) => f.column))
        .filter((column) => column !== FEATURES_COLUMN),
    ),
  ];

  const colLabels = [
    "Rarity",
    "Slots",
    "Bonus",
    ...(hasAcColumn ? ["AC Bonus"] : []),
    ...(hasChordColumn ? ["Chord Length"] : []),
    FEATURES_COLUMN,
    ...resourceColumns,
  ];

  const featureCell = (features, column) => {
    const refs = features
      .filter((f) => f.column === column)
      .map((f) => optfeatureTag(f.uniqueName, f.displayName));
    return refs.length > 0 ? refs.join(", ") : "--";
  };

  // All-rarity features live only in the inset text (Base tier in the UI);
  // repeating them on Common duplicated every Base feature.
  const rows = RARITY_ORDER.map((rarity) => {
    const bucket = rarityBuckets.get(rarity) ?? emptyRarityBucket(rarity);
    return [
      rarity,
      String(RARITY_SLOTS[rarity] ?? 1),
      bucket.bonus || "-",
      ...(hasAcColumn ? [bucket.acBonus || "-"] : []),
      ...(hasChordColumn ? [bucket.chordLength || "-"] : []),
      featureCell(bucket.features, FEATURES_COLUMN),
      ...resourceColumns.map((column) => featureCell(bucket.features, column)),
    ];
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

  const { baseStats, description } = parsed;
  const item = {
    name: parsed.name,
    source: "AGMH",
    type: "HW",
    rarity: "none",
    weight: baseStats.weight || 0,
    value: baseStats.value || 0,
    property: baseStats.property || [],
    dmg1: baseStats.dmg1 || "",
    dmgType: baseStats.dmgType || "",
    entries: [
      description ? `{@i ${description}}` : `{@i ${parsed.name}.}`,
      ...parsed.supplementary,
      {
        type: "inset",
        name: parsed.name,
        entries: insetEntries,
      },
    ],
  };

  if (baseStats.dmg2) item.dmg2 = baseStats.dmg2;
  if (baseStats.range) item.range = baseStats.range;
  if (typeof baseStats.ac === "number") item.ac = baseStats.ac;

  return { item, optionalFeatures };
}

// The chapter 3 "Armor & Weapon Pricing" table is the only place with the full
// cost/weight of every weapon (Appendix B omits prices or lists only one piece,
// e.g. "Lance: 20 gp" + "Shield: 20 gp").
const PRICING_NAME_ALIASES = {
  "wired knuckles": "wire knuckles",
  "sword & shield": "sword and shield",
};

function parseGp(value) {
  const match = String(value).replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*gp/i);
  return match ? Math.round(Number(match[1]) * 100) : undefined;
}

function parseWeaponPricingTable() {
  const byName = new Map();
  for (const [weapon, cost, , , weight] of readMarkdownTable(
    readSlice("chapter3"),
    "Weapon",
  )) {
    const value = parseGp(cost);
    const lb = String(weight ?? "").match(/(\d+(?:\.\d+)?)\s*lb/i);
    if (value === undefined || !lb) continue;
    const name = weapon.trim().toLowerCase();
    byName.set(PRICING_NAME_ALIASES[name] ?? name, {
      value,
      weight: Number(lb[1]),
    });
  }
  return byName;
}

let cached = null;

export function parseWeaponAppendix() {
  if (cached) return cached;

  const pricing = parseWeaponPricingTable();

  const parsedBlocks = readWeaponBlocks().map(parseWeaponBlock);
  const weaponsByLabel = new Map();
  for (const parsed of parsedBlocks) {
    for (const label of new Set(featureLabelsOf(parsed))) {
      weaponsByLabel.set(label, (weaponsByLabel.get(label) ?? 0) + 1);
    }
  }
  const sharedLabels = new Set(
    [...weaponsByLabel].filter(([, count]) => count > 1).map(([label]) => label),
  );
  const nameFeature = createFeatureNamer(sharedLabels);
  const items = [];
  const optionalFeatures = [];

  for (const block of parsedBlocks) {
    const parsed = buildWeaponRecord(block, nameFeature);
    const price = pricing.get(block.name.toLowerCase());
    if (price) Object.assign(parsed.item, price);
    items.push(parsed.item);
    optionalFeatures.push(...parsed.optionalFeatures);
  }

  cached = { items, optionalFeatures };
  return cached;
}
