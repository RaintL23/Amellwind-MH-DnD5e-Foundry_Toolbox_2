/**
 * Build Lore guide sections from chapter 1 (Campaigns → Races, before Factions).
 */
import { mkdirSync, writeFileSync } from "node:fs";
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
  "src/features/amellwind/lore/data/lore.generated.json",
);

const MAJOR_SECTIONS = [
  {
    title: "The Tale of the Five",
    id: "tale",
    page: 2,
    matchFirstOnly: true,
  },
  {
    title: "The History and Myths of the Old World",
    id: "history",
    page: 3,
  },
  {
    title: "The Gods of Monster Hunter",
    id: "gods",
    page: 8,
  },
  {
    title: "The Races of Monster Hunter",
    id: "races",
    page: 18,
  },
];

function extractLoreMarkdown(markdown) {
  const text = String(markdown ?? "").replace(/\r\n/g, "\n");
  const startMarkers = [
    "## The Tale of the Five",
    "## Campaigns in Monster Hunter",
    "## The History and Myths of the Old World",
  ];
  let start = -1;
  for (const marker of startMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1 && (start === -1 || idx < start)) start = idx;
  }
  if (start === -1) return "";
  const end = text.indexOf("## Factions & PC Backgrounds", start);
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

function stripTables(body) {
  return String(body ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !/^\|/.test(line.trim()))
    .join("\n");
}

function paragraphsFrom(body) {
  return toParagraphs(stripTables(body)).filter(Boolean);
}

function convertH3Block(block) {
  const paragraphs = paragraphsFrom(block.body);
  const tables = parseTables(block.body);
  const subsection = { name: block.title };
  if (paragraphs.length) subsection.paragraphs = paragraphs;
  if (tables[0]) subsection.table = tables[0];
  if (tables.length > 1) {
    subsection.subsections = tables.slice(1).map((table, i) => ({
      name: table.colLabels[1] || `Table ${i + 1}`,
      table,
    }));
  }
  return subsection;
}

function sliceBetweenH2(markdown, startTitle, endTitle) {
  const start = markdown.indexOf(`## ${startTitle}`);
  if (start === -1) return null;
  const from = start + `## ${startTitle}`.length;
  let end = markdown.length;
  if (endTitle) {
    const idx = markdown.indexOf(`## ${endTitle}`, from);
    if (idx !== -1) end = idx;
  }
  // For first Tale only, stop at History (not the duplicate Tale inside History)
  return {
    title: startTitle,
    body: markdown.slice(from, end).trim(),
  };
}

function buildSection(meta, loreMd, allH2Titles) {
  const idx = allH2Titles.findIndex((t) => t === meta.title);
  if (idx === -1) {
    return {
      id: meta.id,
      name: meta.title,
      page: meta.page,
      paragraphs: ["Content unavailable."],
    };
  }

  // History includes content until Gods; may contain a nested "## The Tale of the Five"
  // that format-raw promoted incorrectly — treat subsequent ## Tale as ### content.
  let endTitle = allH2Titles[idx + 1];
  if (meta.id === "history") {
    endTitle = "The Gods of Monster Hunter";
  } else if (meta.id === "tale") {
    endTitle = "The History and Myths of the Old World";
  } else if (meta.id === "gods") {
    endTitle = "The Races of Monster Hunter";
  } else if (meta.id === "races") {
    endTitle = null;
  }

  const sliced = sliceBetweenH2(loreMd, meta.title, endTitle);
  if (!sliced) {
    return {
      id: meta.id,
      name: meta.title,
      page: meta.page,
      paragraphs: ["Content unavailable."],
    };
  }

  // Normalize accidental ## Tale inside History into ### so headingBlocks(3) catches it
  let body = sliced.body;
  if (meta.id === "history") {
    body = body.replace(/^## The Tale of the Five\s*$/m, "### The Tale of the Five");
  }

  const h3 = headingBlocks(`### __root__\n\n${body}`, 3).filter(
    (b) => b.title !== "__root__",
  );
  // Root paragraphs = content before first ###
  const firstH3 = body.search(/^### /m);
  const rootBody = firstH3 === -1 ? body : body.slice(0, firstH3);
  const paragraphs = paragraphsFrom(rootBody);

  return {
    id: meta.id,
    name: meta.title,
    page: meta.page,
    paragraphs: paragraphs.length ? paragraphs : undefined,
    subsections: h3.map(convertH3Block),
  };
}

export function buildLoreSections() {
  const markdown = readUtf8(CHAPTER1);
  const loreMd = extractLoreMarkdown(markdown);
  const h2 = [...loreMd.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());

  const sections = MAJOR_SECTIONS.map((meta) =>
    buildSection(meta, loreMd, h2),
  );

  return {
    intro:
      "Lore of the Old World from Amellwind's Guide to Monster Hunting (Chapter 1): creation myths, history, the pantheon, and the peoples who inhabit the setting.",
    sections,
  };
}

export function writeLoreSections(outPath = OUT_FILE) {
  const data = buildLoreSections();
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return data;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const data = writeLoreSections();
  console.log(
    `Wrote ${data.sections.length} lore sections → ${path.relative(ROOT, OUT_FILE)}`,
  );
}
