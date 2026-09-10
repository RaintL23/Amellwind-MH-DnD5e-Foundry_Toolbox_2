import { FEATS_SOURCE_FILE, headingBlocks, readUtf8 } from "./common.mjs";

const ABILITY_CODE = {
  Strength: "str",
  Dexterity: "dex",
  Constitution: "con",
  Intelligence: "int",
  Wisdom: "wis",
  Charisma: "cha",
};

const PAGE_NEW_FEATS = 67;

const ABILITY_NAME =
  "Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma";

function stripPrerequisiteLine(line) {
  return String(line ?? "")
    .replace(/^Prerequisite:\s*/i, "")
    .replace(/\.+$/, "")
    .trim();
}

function parsePrerequisite(lines) {
  const line = lines.find((entry) => /^Prerequisite:/i.test(entry));
  if (!line) return undefined;
  const text = stripPrerequisiteLine(line);
  if (!text) return undefined;

  const levelMatch = text.match(/^(\d+)(?:st|nd|rd|th)? level or higher$/i);
  if (levelMatch) {
    return [{ level: Number(levelMatch[1]) }];
  }
  if (/^druid$/i.test(text)) {
    return [{ otherSummary: { entry: "Druid" } }];
  }
  const abilityMatch = text.match(
    new RegExp(`^(${ABILITY_NAME})\\s+(\\d+)\\s+or higher$`, "i"),
  );
  if (abilityMatch) {
    const key = ABILITY_CODE[abilityMatch[1]];
    return [{ ability: [{ [key]: Number(abilityMatch[2]) }] }];
  }
  return [{ otherSummary: { entry: text } }];
}

function parseAbilityIncrease(text) {
  const dual = text.match(
    new RegExp(
      `Increase your (${ABILITY_NAME}) or (${ABILITY_NAME}) score by 1`,
      "i",
    ),
  );
  if (dual) {
    const a = ABILITY_CODE[dual[1]];
    const b = ABILITY_CODE[dual[2]];
    if (a && b) {
      return [{ choose: { from: [a, b], amount: 1 } }];
    }
  }

  const single = text.match(
    new RegExp(
      `Increase your (${ABILITY_NAME})(?: score)? by 1`,
      "i",
    ),
  );
  if (!single) return undefined;
  const code = ABILITY_CODE[single[1]];
  return code ? [{ [code]: 1 }] : undefined;
}

function italicToFiveTools(text) {
  return String(text ?? "").replace(
    /\*([^*]+)\*/g,
    (_m, inner) => `{@i ${inner}}`,
  );
}

/**
 * Convert curated feat body markdown into 5etools-shaped entries.
 * Preserves blank-line paragraphs, `-` bullet lists, and nested `###` sections.
 */
function parseFeatEntries(body) {
  const text = String(body ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const nested = headingBlocks(text, 3);
  if (nested.length > 0) {
    const firstHeader = text.search(/^###\s+/m);
    const lead = firstHeader > 0 ? text.slice(0, firstHeader).trim() : "";
    const entries = [...parseFeatEntriesFlat(lead)];
    for (const block of nested) {
      entries.push({
        type: "entries",
        name: block.title,
        entries: parseFeatEntriesFlat(block.body),
      });
    }
    return entries;
  }

  return parseFeatEntriesFlat(text);
}

function parseFeatEntriesFlat(body) {
  const blocks = String(body ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const entries = [];
  for (const block of blocks) {
    if (/^Prerequisite:/i.test(block)) continue;

    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) continue;

    const allBullets = lines.every((line) => /^[-*•]\s+/.test(line));
    if (allBullets) {
      entries.push({
        type: "list",
        items: lines.map((line) =>
          italicToFiveTools(line.replace(/^[-*•]\s+/, "").trim()),
        ),
      });
      continue;
    }

    // Mixed block: keep non-bullets as prose, collect trailing bullets as a list.
    const prose = [];
    const bullets = [];
    for (const line of lines) {
      if (/^[-*•]\s+/.test(line)) {
        bullets.push(italicToFiveTools(line.replace(/^[-*•]\s+/, "").trim()));
      } else {
        prose.push(italicToFiveTools(line));
      }
    }
    if (prose.length) {
      // Soft-wrapped consecutive prose lines become separate paragraphs when
      // they were authored as distinct rules (single newlines without bullets).
      for (const paragraph of prose) {
        if (paragraph) entries.push(paragraph);
      }
    }
    if (bullets.length) {
      entries.push({ type: "list", items: bullets });
    }
  }

  return entries;
}

function collectBodyLines(body) {
  return String(body ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s+/, "").trim())
    .filter(Boolean);
}

export function buildFeats() {
  const markdown = readUtf8(FEATS_SOURCE_FILE);
  const blocks = headingBlocks(markdown, 2);

  return blocks.map((block) => {
    const bodyLines = collectBodyLines(block.body);
    const prerequisite = parsePrerequisite(bodyLines);
    const ability = parseAbilityIncrease(block.body);
    const entries = parseFeatEntries(block.body);
    return {
      name: block.title,
      source: "AGMH",
      page: PAGE_NEW_FEATS,
      prerequisite,
      ability,
      repeatable: /select this feat multiple times/i.test(block.body),
      entries,
    };
  });
}
