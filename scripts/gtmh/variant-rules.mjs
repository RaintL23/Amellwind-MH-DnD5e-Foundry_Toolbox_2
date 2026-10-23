import {
  DOWNTIME_SOURCE_FILE,
  SKILLS_GUIDE_SOURCE_FILE,
  headingBlocks,
  readUtf8,
  toParagraphs,
} from "./common.mjs";

const PAGE_HUNT_ROLES = 69;
const PAGE_DOWNTIME = 73;
/** Per-activity pages from the chapter 2 table of contents. */
const DOWNTIME_PAGES = {
  "Solo Hunt": 73,
  Trenya: 74,
  "Sell Materials": 75,
  "Palico Farm": 76,
};

const SKILLS = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];
const ABILITY_CHECK_RX =
  /\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) \(([^)]+)\)/g;
const SKILL_RX = new RegExp(`\\b(${SKILLS.join("|")})\\b`, "g");

function asEntries(paragraphs) {
  return paragraphs.length > 0 ? paragraphs : [""];
}

/** Markdown inline → 5etools tags (italic, bold, `Ability (Skill)` checks). */
function toFiveToolsText(text) {
  return text
    .replace(/\\\*/g, "*")
    .replace(/\*\*(.+?)\*\*/g, "{@b $1}")
    .replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, "$1{@i $2}")
    .replace(ABILITY_CHECK_RX, (_, ability, inner) =>
      `${ability} (${inner.replace(SKILL_RX, "{@skill $1}")})`,
    );
}

function tableCells(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => toFiveToolsText(cell.trim()));
}

/**
 * Paragraphs and markdown tables of one section body. A lone `**Caption**`
 * paragraph before a table becomes its caption; a `\*` paragraph right after
 * a table becomes its footnote.
 */
function markdownBlocksToEntries(body) {
  const entries = [];
  let pendingCaption;
  let lastTable;
  for (const chunk of body.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const text = chunk.trim();
    if (!text) continue;
    const lines = text.split("\n");
    if (lines.every((line) => line.trimStart().startsWith("|"))) {
      const table = {
        type: "table",
        ...(pendingCaption ? { caption: pendingCaption } : {}),
        colLabels: tableCells(lines[0]),
        rows: lines.slice(2).map(tableCells),
      };
      entries.push(table);
      lastTable = table;
      pendingCaption = undefined;
      continue;
    }
    const paragraph = text.replace(/\s+/g, " ");
    const caption = paragraph.match(/^\*\*(.+)\*\*$/);
    if (caption) {
      pendingCaption = caption[1];
      lastTable = undefined;
      continue;
    }
    if (lastTable && paragraph.startsWith("\\*")) {
      lastTable.footnotes = [`{@i ${toFiveToolsText(paragraph)}}`];
      lastTable = undefined;
      continue;
    }
    entries.push(toFiveToolsText(paragraph));
    lastTable = undefined;
  }
  return entries;
}

/** `###`+ headings become nested `{type: "entries", name}` blocks. */
function markdownToEntries(body, level = 3) {
  const hashes = "#".repeat(level);
  const firstHeading = body.search(new RegExp(`^${hashes}\\s`, "m"));
  const lead = firstHeading === -1 ? body : body.slice(0, firstHeading);
  const entries = markdownBlocksToEntries(lead);
  if (firstHeading === -1) return entries;
  for (const section of headingBlocks(body.slice(firstHeading), level)) {
    entries.push({
      type: "entries",
      name: section.title,
      entries: markdownToEntries(section.body, level + 1),
    });
  }
  return entries;
}

export function buildVariantRules() {
  const rules = [];

  const roles = headingBlocks(readUtf8(SKILLS_GUIDE_SOURCE_FILE), 2);
  for (const role of roles) {
    const entries = asEntries(toParagraphs(role.body));
    rules.push({
      name: `Hunt Role: ${role.title}`,
      source: "AGMH",
      page: PAGE_HUNT_ROLES,
      entries,
    });
  }

  const downtime = headingBlocks(readUtf8(DOWNTIME_SOURCE_FILE), 2);
  for (const block of downtime) {
    rules.push({
      name: `Downtime Activity: ${block.title}`,
      source: "AGMH",
      page: DOWNTIME_PAGES[block.title] ?? PAGE_DOWNTIME,
      entries: asEntries(markdownToEntries(block.body)),
    });
  }

  return rules;
}
