import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

export const STAGING_DIR = path.join(ROOT, "public/data/gtmh-patreon");
export const RAW_DUMP_FILE = path.join(
  ROOT,
  "public/data/gtmh-patreon/gtmh-patreon.md",
);
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

export function readRawDumpSection(startHeading, endHeading) {
  const source = readUtf8(RAW_DUMP_FILE).replace(/\r\n/g, "\n");
  const startIdx = source.indexOf(`\n${startHeading}\n`);
  if (startIdx === -1) return "";
  const from = startIdx + startHeading.length + 2;
  const endIdx = source.indexOf(`\n${endHeading}\n`, from);
  const to = endIdx === -1 ? source.length : endIdx;
  return source.slice(from, to).trim();
}
