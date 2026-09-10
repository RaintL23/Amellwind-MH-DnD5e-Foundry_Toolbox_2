/**
 * Build Factions guide sections from the formatted chapter 1 slice.
 * Writes structured GuideSection JSON consumed by the Factions page.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  STAGING_DIR,
  headingBlocks,
  readUtf8,
  toParagraphs,
} from "./common.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CHAPTER1 = path.join(STAGING_DIR, "gtmh-patreon-chapter1.md");
const OUT_FILE = path.join(
  ROOT,
  "src/features/amellwind/factions/data/factions.generated.json",
);

const BACKGROUND_NAMES = new Set([
  "Helix Agent",
  "Helix Field Scout",
  "Hunter Initiate",
  "Apprentice Guild Knight",
  "Handler Initiate",
  "Scrivener",
  "Poacher",
  "Infiltrator",
  "Wycademy Student",
  "Wycademy Researcher",
]);

const MAJOR_FACTIONS = [
  {
    title: "The Helix Commission",
    id: "helix-commission",
    page: 24,
  },
  {
    title: "The Hunter's Guild",
    id: "hunters-guild",
    page: 28,
  },
  {
    title: "Royal Paleontology Scriveners",
    id: "royal-scrivener",
    page: 34,
  },
  {
    title: "The Talon Society",
    id: "talon-society",
    page: 38,
  },
  {
    title: "The Wycademy",
    id: "wycademy",
    page: 42,
  },
];

function extractFactionsSection(markdown) {
  const text = String(markdown ?? "").replace(/\r\n/g, "\n");
  const start = text.indexOf("## Factions & PC Backgrounds");
  if (start === -1) return "";
  const end = text.indexOf("Additional Factions will be added", start);
  return text.slice(start, end === -1 ? text.length : end).trim();
}

function parseTables(body) {
  const lines = String(body ?? "").replace(/\r\n/g, "\n").split("\n");
  const tables = [];
  let i = 0;
  while (i < lines.length) {
    if (!/^\|.+\|$/.test(lines[i].trim())) {
      i += 1;
      continue;
    }
    const sep = lines[i + 1];
    if (!sep || !/^\|[\s:|-]+\|$/.test(sep.trim())) {
      i += 1;
      continue;
    }
    const colLabels = lines[i]
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    const rows = [];
    i += 2;
    while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
      rows.push(
        lines[i]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim()),
      );
      i += 1;
    }
    if (colLabels.length && rows.length) tables.push({ colLabels, rows });
  }
  return tables;
}

function isSpellTableLabel(colLabels) {
  const joined = colLabels.map((c) => c.toLowerCase()).join(" ");
  return joined.includes("spell");
}

function isCharacteristicTable(colLabels) {
  const label = String(colLabels[1] ?? "").toLowerCase();
  return (
    label.includes("personality") ||
    label.includes("ideal") ||
    label.includes("bond") ||
    label.includes("flaw")
  );
}

function parseSpellTableFromText(body) {
  // Free-text spell tables: "Cantrip produce flame, resistance"
  const lines = String(body ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const m = line.match(
      /^(Cantrip|1st|2nd|3rd|4th|5th|Sth)\s+(.+)$/i,
    );
    if (!m) continue;
    const level = m[1].replace(/^Sth$/i, "5th");
    rows.push([level, m[2].trim()]);
  }
  if (!rows.length) return undefined;
  return { colLabels: ["Spell Level", "Spells"], rows };
}

function stripTables(body) {
  return String(body ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !/^\|/.test(line.trim()))
    .join("\n");
}

function paragraphsFrom(body) {
  return toParagraphs(stripTables(body)).filter(
    (p) =>
      !/^Skill Proficienc/i.test(p) &&
      !/^Tool Proficienc/i.test(p) &&
      !/^Languages?\b/i.test(p) &&
      !/^Equipment:/i.test(p) &&
      !/^Group Research$/i.test(p) &&
      !/^(Cantrip|1st|2nd|3rd|4th|5th|Sth)\s+/i.test(p) &&
      !/^Spell Level\b/i.test(p) &&
      !/Spells$/i.test(p) &&
      !/^Prerequisite:/i.test(p),
  );
}

function buildOverview(factionsMd) {
  const firstMajor = MAJOR_FACTIONS[0].title;
  const idx = factionsMd.indexOf(`### ${firstMajor}`);
  const head = idx === -1 ? factionsMd : factionsMd.slice(0, idx);
  const blocks = headingBlocks(head, 3);
  const introParas = paragraphsFrom(
    head.replace(/^## Factions & PC Backgrounds\n+/, ""),
  );

  // First bullets before subsections
  const bulletList = [];
  const paragraphs = [];
  for (const p of introParas) {
    if (
      /^(A central governing body|A corporation|Two research|A poachers|A cult of)/i.test(
        p,
      )
    ) {
      bulletList.push(p);
    } else if (!/^The denizens of the Old World/i.test(p)) {
      paragraphs.push(p);
    }
  }

  const living = introParas.find((p) =>
    /^The denizens of the Old World/i.test(p),
  );

  const subsections = [];
  if (living) {
    subsections.push({
      name: "Living Among Factions",
      paragraphs: [living],
    });
  }

  for (const block of blocks) {
    if (/^Faction Membership$/i.test(block.title)) {
      subsections.push({
        name: "Faction Membership",
        paragraphs: paragraphsFrom(block.body),
        subsections: blocks
          .filter((b) =>
            /^(Faction Spells|Additional Rules|Contacts|Renown|Benefits of Renown|Losing Renown|Changing Factions)$/i.test(
              b.title,
            ),
          )
          .map((b) => ({
            name: b.title,
            paragraphs: paragraphsFrom(b.body),
          })),
      });
      break;
    }
  }

  // Flatten nested membership helpers if Membership already collected children poorly
  const membershipKids = blocks.filter((b) =>
    /^(Faction Spells|Additional Rules|Contacts|Renown|Benefits of Renown|Losing Renown|Changing Factions)$/i.test(
      b.title,
    ),
  );
  if (membershipKids.length) {
    const membership = subsections.find((s) => s.name === "Faction Membership");
    if (membership) {
      membership.subsections = membershipKids.map((b) => ({
        name: b.title,
        paragraphs: paragraphsFrom(b.body),
      }));
    }
  }

  return {
    id: "overview",
    name: "Factions Overview",
    page: 24,
    paragraphs: paragraphs.length
      ? paragraphs.slice(0, 1)
      : [
          "There are many factions in the Monster Hunter Universe. Some of them make up the foundation of society, while others seek to destroy it.",
        ],
    bulletList: bulletList.length
      ? bulletList
      : [
          "A central governing body, the Hunter's Guild",
          "A corporation led by His Immenseness, the Elder Dragon Observation Team",
          "Two research institutions, Wycademy, and the Royal Paleontology Scriveners",
          "A poachers ring, the Talon Society",
          "A cult of fanatics, the Cult of Fatalis",
        ],
    subsections,
    footerNote:
      "Additional Factions will be added in future updates to Amellwind's Guide to Monster Hunting.",
  };
}

function convertBlock(block, { skipBackgrounds = true } = {}) {
  if (skipBackgrounds && BACKGROUND_NAMES.has(block.title)) {
    // Keep a short pointer instead of full characteristic tables
    const fluff = paragraphsFrom(block.body).slice(0, 1);
    return {
      name: block.title,
      paragraphs: [
        ...(fluff.length ? fluff : []),
        `{@background ${block.title}|AGMH}`,
      ],
    };
  }

  if (/^Skill Proficienc/i.test(block.title)) return null;

  const paragraphs = paragraphsFrom(block.body);
  const tables = parseTables(block.body).filter(
    (t) => !isCharacteristicTable(t.colLabels),
  );
  const spellTable =
    /spells$/i.test(block.title) || /spell/i.test(block.title)
      ? parseSpellTableFromText(block.body)
      : undefined;

  const subsection = {
    name: block.title,
  };
  if (paragraphs.length) subsection.paragraphs = paragraphs;
  if (spellTable) subsection.table = spellTable;
  else if (tables[0]) subsection.table = tables[0];
  if (tables.length > 1) {
    subsection.subsections = tables.slice(1).map((table, i) => ({
      name: table.colLabels[1] || `Table ${i + 1}`,
      table,
    }));
  }
  return subsection;
}

function buildFactionSection(factionsMd, meta) {
  const all = headingBlocks(factionsMd, 3);
  const startIdx = all.findIndex((b) => b.title === meta.title);
  if (startIdx === -1) {
    return {
      id: meta.id,
      name: meta.title,
      page: meta.page,
      paragraphs: ["Content unavailable."],
    };
  }
  const nextIdx = all.findIndex(
    (b, i) =>
      i > startIdx && MAJOR_FACTIONS.some((f) => f.title === b.title),
  );
  const slice = all.slice(startIdx, nextIdx === -1 ? undefined : nextIdx);
  const root = slice[0];
  const children = slice.slice(1);

  const subsections = [];
  for (const child of children) {
    // Skip characteristic-only promoted headings
    if (/^Skill Proficienc/i.test(child.title)) continue;
    const converted = convertBlock(child);
    if (converted) subsections.push(converted);
  }

  return {
    id: meta.id,
    name: meta.title,
    page: meta.page,
    paragraphs: paragraphsFrom(root.body).slice(0, 4),
    subsections,
  };
}

export function buildFactionSections() {
  const markdown = readUtf8(CHAPTER1);
  const factionsMd = extractFactionsSection(markdown);
  const overview = buildOverview(factionsMd);
  const factions = MAJOR_FACTIONS.map((meta) =>
    buildFactionSection(factionsMd, meta),
  );
  return {
    intro:
      "Factions shape how your hunter fits into the Old World. Membership ties into backgrounds, renown, contacts, and — for spellcasters — expanded spell lists. Rules below follow Amellwind's Guide to Monster Hunting (Chapter 1).",
    sections: [overview, ...factions],
  };
}

export function writeFactionSections(outPath = OUT_FILE) {
  const data = buildFactionSections();
  writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return data;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = writeFactionSections();
  console.log(
    `Wrote ${data.sections.length} faction sections → ${path.relative(ROOT, OUT_FILE)}`,
  );
}
