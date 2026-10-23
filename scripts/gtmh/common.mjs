import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

export const STAGING_DIR = path.join(ROOT, "public/data/gtmh-patreon");
export const FEATS_SOURCE_FILE = path.join(
  STAGING_DIR,
  "chapters/02-character-options/new-feats.md",
);
export const SKILLS_GUIDE_SOURCE_FILE = path.join(
  STAGING_DIR,
  "chapters/02-character-options/skills-guide.md",
);
export const DOWNTIME_SOURCE_FILE = path.join(
  STAGING_DIR,
  "chapters/02-downtime/downtime-activities.md",
);

export function readUtf8(filePath) {
  return readFileSync(filePath, "utf8");
}

export function toParagraphs(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function headingBlocks(markdown, level = 2) {
  const text = String(markdown ?? "").replace(/\r\n/g, "\n");
  const hashes = "#".repeat(level);
  const rx = new RegExp(`^${hashes}\\s+(.+?)$`, "gm");
  const starts = [];
  let match;
  while ((match = rx.exec(text)) !== null) {
    starts.push({
      title: match[1].trim(),
      start: match.index + match[0].length + 1,
      headerStart: match.index,
    });
  }
  const blocks = [];
  for (let i = 0; i < starts.length; i += 1) {
    const cur = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1].headerStart : text.length;
    blocks.push({
      title: cur.title,
      body: text.slice(cur.start, end).trim(),
    });
  }
  return blocks;
}

export function normalizeName(raw) {
  return String(raw ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[''`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Formatted chapter slices (`gtmh-patreon-<slice>.md`) are the source of
 * truth for GTMH extraction; the old single-file dump is not read anymore.
 */
export function sliceFile(slice) {
  return path.join(STAGING_DIR, `gtmh-patreon-${slice}.md`);
}

/** Slice markdown without frontmatter, the `#` title and its blockquote note. */
export function readSlice(slice) {
  const lines = readUtf8(sliceFile(slice)).replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  if (lines[0]?.trim() === "---") {
    i = lines.findIndex((line, idx) => idx > 0 && line.trim() === "---") + 1;
  }
  while (
    i < lines.length &&
    (!lines[i].trim() || /^#\s/.test(lines[i]) || lines[i].startsWith(">"))
  ) {
    i += 1;
  }
  return lines.slice(i).join("\n");
}

const MD_HEADING_RX = /^(#{2,6})\s+(.+?)\s*$/;

/**
 * Flattens slice markdown into the line format the GTMH parsers read:
 * `### Name` + its first paragraph becomes `Name. paragraph`, other headings
 * become bare title lines, and `\*` escapes are unescaped. Inline entries that
 * were never promoted to headings (`Name. text`) pass through untouched.
 *
 * `keepTitle(title, { level, afterLevel4 })` keeps a `###` heading standalone
 * (structural titles such as "Weapon Materials"); `afterLevel4` is true once a
 * `####` heading appeared since the last `##`.
 */
export function flattenSliceMarkdown(markdown, { keepTitle } = {}) {
  const lines = String(markdown ?? "").replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let afterLevel4 = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].replace(/\\([*_#|])/g, "$1");
    const heading = line.match(MD_HEADING_RX);
    if (!heading) {
      out.push(line);
      continue;
    }

    const level = heading[1].length;
    const title = heading[2].trim();
    if (level === 2) afterLevel4 = false;
    if (level === 4) afterLevel4 = true;

    let next = i + 1;
    while (next < lines.length && !lines[next].trim()) next += 1;
    const body = lines[next] ?? "";
    const bodyIsParagraph =
      next < lines.length &&
      !MD_HEADING_RX.test(body) &&
      !body.trimStart().startsWith("|");

    // Only `###` names an entry; `##` / `####` are structure (weapon, rarity).
    if (level === 3 && bodyIsParagraph) {
      if (keepTitle?.(title, { level, afterLevel4 })) {
        // Title line directly followed by its paragraph (no blank line).
        out.push(title, body.trim());
      } else {
        const sep = /[.:!?]$/.test(title) ? " " : ". ";
        out.push(`${title}${sep}${body.trim()}`);
      }
      i = next;
      continue;
    }
    out.push(title);
  }

  return out.join("\n");
}

/** Lines between two flattened title lines (end exclusive; to EOF if absent). */
export function sliceSection(flattened, startTitle, endTitle) {
  const source = `\n${flattened}\n`;
  const startIdx = source.indexOf(`\n${startTitle}\n`);
  if (startIdx === -1) return "";
  const from = startIdx + startTitle.length + 2;
  const endIdx = endTitle ? source.indexOf(`\n${endTitle}\n`, from) : -1;
  return source.slice(from, endIdx === -1 ? source.length : endIdx).trim();
}

/** Rows of the first markdown table whose header starts with `firstHeader`. */
export function readMarkdownTable(markdown, firstHeader) {
  const lines = String(markdown ?? "").replace(/\r\n/g, "\n").split("\n");
  const cells = (line) =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim());
  const start = lines.findIndex(
    (line) =>
      line.trimStart().startsWith("|") &&
      cells(line)[0].toLowerCase() === firstHeader.toLowerCase(),
  );
  if (start === -1) return [];
  const rows = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.trimStart().startsWith("|")) break;
    rows.push(cells(line));
  }
  return rows;
}
