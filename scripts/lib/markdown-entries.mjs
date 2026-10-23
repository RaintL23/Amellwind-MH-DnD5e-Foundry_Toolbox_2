/**
 * Markdown → 5etools `entries` for the readable data sheets (MHMM monsters,
 * conditions chapter). One parser so every surface that renders these entries
 * (bestiary fluff, condition / disease dialogs, Foundry export) gets the same
 * structure: paragraphs, `#`-headings as nested sections, `- **Name.** text`
 * as named list items.
 */

/** Windows checkouts (core.autocrlf) turn `\n\n` into `\r\n\r\n`. */
export function normalizeNewlines(text) {
  return String(text ?? "").replace(/\r\n?/g, "\n");
}

const AFFLICTION_HEADING = /^(Condition|Disease|Poison):\s*(.+)$/i;

/**
 * `Disease: Iceblight` → `{ kind: "disease", name: "Iceblight" }`.
 * Plain headings are conditions (the chapter convention).
 */
export function parseAfflictionHeading(heading) {
  const match = String(heading ?? "").trim().match(AFFLICTION_HEADING);
  if (!match) return null;
  return { kind: match[1].toLowerCase(), name: match[2].trim() };
}

function collapse(text) {
  return text.replace(/\s+/g, " ").trim();
}

function parseListItem(content) {
  const named = content.match(/^\*\*(.+?)\*\*\.?\s*(.*)$/);
  if (!named) return collapse(content);
  const body = collapse(named[2]);
  return {
    type: "item",
    name: named[1].trim().replace(/\.$/, ""),
    entries: body ? [body] : [""],
  };
}

/**
 * Parses markdown into 5etools entries. Headings (`##`–`######`) open a
 * `{ type: "entries", name }` section nested under any shallower heading.
 */
export function markdownToEntries(rawText) {
  const text = normalizeNewlines(rawText).trim();
  if (!text) return [];

  const root = { level: 0, entries: [] };
  const stack = [root];
  let paraLines = [];
  let listItems = [];

  const target = () => stack[stack.length - 1].entries;

  const flushPara = () => {
    const paragraph = collapse(paraLines.join(" "));
    if (paragraph) target().push(paragraph);
    paraLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    target().push({ type: "list", items: listItems });
    listItems = [];
  };

  for (const line of text.split("\n")) {
    const heading = line.match(/^(#{2,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flushList();
      flushPara();
      const level = heading[1].length;
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      const section = { type: "entries", name: heading[2].trim(), entries: [] };
      target().push(section);
      stack.push({ level, entries: section.entries });
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      flushPara();
      listItems.push(parseListItem(bullet[1].trim()));
      continue;
    }

    if (line.trim() === "") {
      flushList();
      flushPara();
      continue;
    }

    flushList();
    paraLines.push(line.trim());
  }

  flushList();
  flushPara();
  return root.entries;
}

/**
 * Pulls `Condition:` / `Disease:` / `Poison:` sections out of parsed entries
 * (any depth), so an affliction written inside a monster's lore is also
 * published as a standalone condition or disease.
 */
export function findAfflictionSections(entries) {
  const found = [];
  const walk = (list) => {
    for (const entry of list ?? []) {
      if (!entry || typeof entry !== "object") continue;
      const affliction =
        entry.type === "entries" ? parseAfflictionHeading(entry.name) : null;
      if (affliction) {
        found.push({ ...affliction, entries: entry.entries });
        continue;
      }
      if (Array.isArray(entry.entries)) walk(entry.entries);
    }
  };
  walk(entries);
  return found;
}

/** Drops the `Disease:` style prefix from section names for display. */
export function stripAfflictionPrefixes(entries) {
  return (entries ?? []).map((entry) => {
    if (!entry || typeof entry !== "object" || !Array.isArray(entry.entries)) {
      return entry;
    }
    const affliction =
      entry.type === "entries" ? parseAfflictionHeading(entry.name) : null;
    return {
      ...entry,
      ...(affliction ? { name: affliction.name } : {}),
      entries: stripAfflictionPrefixes(entry.entries),
    };
  });
}
