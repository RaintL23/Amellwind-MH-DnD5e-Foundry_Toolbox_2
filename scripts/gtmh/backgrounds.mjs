/**
 * Parse GTMH Patreon faction backgrounds from the formatted chapter 1 slice.
 * Emits 5etools-shaped background[] rows for local-wins merge.
 */
import path from "node:path";
import {
  STAGING_DIR,
  headingBlocks,
  readUtf8,
  toParagraphs,
} from "./common.mjs";

export const BACKGROUNDS_SOURCE_FILE = path.join(
  STAGING_DIR,
  "gtmh-patreon-chapter1.md",
);

const PAGE_FACTIONS = 24;

const FACTION_BY_SECTION = [
  { match: /helix commission/i, faction: "helix-commission", label: "Helix Commission" },
  { match: /hunter'?s guild/i, faction: "hunters-guild", label: "Hunter's Guild" },
  { match: /scrivener/i, faction: "royal-scrivener", label: "Royal Paleontology Scriveners" },
  { match: /talon society/i, faction: "talon-society", label: "Talon Society" },
  { match: /wycademy/i, faction: "wycademy", label: "Wycademy" },
];

const KNOWN_BACKGROUND_NAMES = new Set([
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

function skillKey(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/\s+/g, " ");
}

function splitSkillNames(text) {
  return String(text ?? "")
    .replace(/\.$/, "")
    .split(/,(?![^(]*\))| and /i)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^as appropriate/i.test(s));
}

function parseSkillLine(line) {
  const text = line.replace(/^Skill Proficienc(?:y|ies):\s*/i, "").trim();
  if (!text) return undefined;

  const chooseTwo = text.match(/^Choose two from:?\s*(.+)$/i);
  if (chooseTwo) {
    return [
      {
        choose: {
          from: splitSkillNames(chooseTwo[1]).map(skillKey),
          count: 2,
        },
      },
    ];
  }

  const chooseMatch = text.match(/^([^;]+);\s*Choose one from\s+(.+)$/i);
  const plusChoose = text.match(
    /^([^,]+),\s*plus one from among\s+(.+?)(?:,\s*as appropriate.*)?$/i,
  );

  if (chooseMatch) {
    const fixed = splitSkillNames(chooseMatch[1]);
    const from = splitSkillNames(chooseMatch[2]);
    const block = {};
    for (const skill of fixed) block[skillKey(skill)] = true;
    block.choose = { from: from.map(skillKey), count: 1 };
    return [block];
  }

  if (plusChoose) {
    const fixed = plusChoose[1].trim();
    const from = splitSkillNames(plusChoose[2]);
    return [
      {
        [skillKey(fixed)]: true,
        choose: { from: from.map(skillKey), count: 1 },
      },
    ];
  }

  const skills = splitSkillNames(text);
  if (!skills.length) return undefined;
  const block = {};
  for (const skill of skills) block[skillKey(skill)] = true;
  return [block];
}

function parseToolLine(line) {
  const text = line
    .replace(/^Tool Proficienc(?:y|ies):\s*/i, "")
    .trim();
  if (!text || /^none$/i.test(text)) return undefined;

  if (/^one type of artisan'?s tools$/i.test(text)) {
    return [{ choose: { from: ["anyArtisansTool"], count: 1 } }];
  }

  const orChoice = text.match(/^(.+?)\s+or\s+(.+)$/i);
  if (orChoice && !/,/.test(text) && !/;/.test(text)) {
    return [
      {
        choose: {
          from: [orChoice[1].trim(), orChoice[2].trim()],
          count: 1,
        },
      },
    ];
  }

  const chooseOne = text.match(/^Choose one from:?\s*(.+)$/i);
  if (chooseOne) {
    const from = chooseOne[1]
      .split(/,| and /i)
      .map((s) => s.replace(/\.$/, "").trim())
      .filter(Boolean);
    return [{ choose: { from, count: 1 } }];
  }

  const dual = text.match(/^([^;]+);\s*Choose one from\s+(.+)$/i);
  if (dual) {
    const fixedParts = dual[1]
      .split(/,| and /i)
      .map((s) => s.trim())
      .filter(Boolean);
    const from = dual[2]
      .split(/,| and /i)
      .map((s) => s.replace(/\.$/, "").trim())
      .filter(Boolean);
    const block = { choose: { from, count: 1 } };
    for (const tool of fixedParts) {
      block[tool] = true;
    }
    return [block];
  }

  const andChoose = text.match(
    /^(.+?),\s*and one artisan tool of your choice$/i,
  );
  if (andChoose) {
    return [
      {
        [andChoose[1].trim()]: true,
        choose: { from: ["anyArtisansTool"], count: 1 },
      },
    ];
  }

  const parts = text
    .split(/,| and /i)
    .map((s) => s.replace(/\.$/, "").trim())
    .filter(Boolean);
  if (!parts.length) return undefined;
  const block = {};
  for (const tool of parts) block[tool] = true;
  return [block];
}

function parseLanguageLine(line) {
  const text = line.replace(/^Languages?:?\s*/i, "").trim();
  if (!text) return undefined;
  if (/one of your choice/i.test(text)) return [{ anyStandard: 1 }];
  if (/two of your choice/i.test(text)) return [{ anyStandard: 2 }];
  const langs = text
    .split(/,| and /i)
    .map((s) => s.replace(/\.$/, "").trim())
    .filter(Boolean);
  if (!langs.length) return undefined;
  const block = {};
  for (const lang of langs) block[lang.toLowerCase()] = true;
  return [block];
}

function parseMarkdownTables(body) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const tables = [];
  let i = 0;
  while (i < lines.length) {
    const header = lines[i];
    if (!/^\|.+\|$/.test(header.trim())) {
      i += 1;
      continue;
    }
    const sep = lines[i + 1];
    if (!sep || !/^\|[\s:|-]+\|$/.test(sep.trim())) {
      i += 1;
      continue;
    }
    const colLabels = header
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    const rows = [];
    i += 2;
    while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
      const cells = lines[i]
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.some((c) => c.length)) rows.push(cells);
      i += 1;
    }
    if (colLabels.length && rows.length) {
      tables.push({ type: "table", colLabels, rows });
    }
  }
  return tables;
}

function mergeContinuationTables(tables) {
  const merged = [];
  for (const table of tables) {
    const label = String(table.colLabels?.[1] ?? "");
    const cont = /cont\.?/i.test(label);
    if (cont && merged.length) {
      const prev = merged[merged.length - 1];
      prev.rows.push(...table.rows);
      continue;
    }
    const cleaned = {
      ...table,
      colLabels: table.colLabels.map((c) =>
        c.replace(/\s*Cont\.?/i, "").trim(),
      ),
    };
    merged.push(cleaned);
  }
  return merged;
}

function extractFieldLines(body) {
  const normalized = body.replace(/\r\n/g, "\n");
  // OCR sometimes promotes proficiency lines to ### headings
  const flat = normalized.replace(
    /^###\s+(Skill Proficienc(?:y|ies):.*)$/gim,
    "$1",
  );

  const field = {
    skills: undefined,
    tools: undefined,
    languages: undefined,
    equipment: undefined,
  };

  // Field lines are usually single lines (not blank-line paragraphs).
  const lines = flat.split("\n").map((l) => l.trim());
  const fluffLines = [];
  let seenField = false;
  let inTable = false;

  for (const line of lines) {
    if (!line) {
      inTable = false;
      continue;
    }
    if (/^\|/.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable) continue;

    if (/^Skill Proficienc/i.test(line)) {
      field.skills = line;
      seenField = true;
      continue;
    }
    if (/^Tool Proficienc/i.test(line)) {
      field.tools = line;
      seenField = true;
      continue;
    }
    if (/^Languages?\b/i.test(line)) {
      field.languages = line;
      seenField = true;
      continue;
    }
    if (/^Equipment:/i.test(line)) {
      field.equipment = line;
      seenField = true;
      continue;
    }
    if (
      /^Feature:/i.test(line) ||
      /^How do I/i.test(line) ||
      /^Guild Feature:/i.test(line)
    ) {
      break;
    }
    if (!seenField) fluffLines.push(line);
  }

  const fluff = toParagraphs(fluffLines.join("\n\n"));
  return { flat, field, fluff };
}

function findGuildFeature(h3Blocks, factionBody) {
  for (const block of h3Blocks) {
    if (/^Guild Feature:/i.test(block.title)) {
      return {
        name: block.title.replace(/^Guild Feature:\s*/i, "Feature: "),
        entries: toParagraphs(block.body),
      };
    }
  }

  // Hunter's Guild stores the shared feature as plain text, not a heading.
  const inline = String(factionBody ?? "").match(
    /Guild Feature:\s*([^\n]+)\n+([\s\S]*?)(?=\n### |\n*$)/i,
  );
  if (inline) {
    let text = inline[2]
      .replace(/^All .+ backgrounds have the same feature\s*/i, "")
      .trim();
    // Stop before the next background heading text if present in the capture
    for (const name of KNOWN_BACKGROUND_NAMES) {
      const cut = text.indexOf(`\n### ${name}`);
      if (cut !== -1) text = text.slice(0, cut);
      const cutPlain = text.indexOf(`\n${name}\n`);
      if (cutPlain !== -1) text = text.slice(0, cutPlain);
    }
    const entries = toParagraphs(text).filter(
      (p) => !KNOWN_BACKGROUND_NAMES.has(p),
    );
    return {
      name: `Feature: ${inline[1].trim()}`,
      entries: entries.length ? [entries[0]] : ["Guild membership benefits."],
    };
  }
  return null;
}

function findSharedSpecialtyFeature(h3Blocks) {
  // Scriveners: Feature: Specialty before the background list
  for (const block of h3Blocks) {
    if (/^Feature:\s*Specialty$/i.test(block.title)) {
      const tables = mergeContinuationTables(parseMarkdownTables(block.body));
      return {
        name: block.title,
        entries: [
          ...toParagraphs(block.body.replace(/\|[\s\S]*/m, "").trim()),
          ...tables,
        ],
      };
    }
  }
  return null;
}

function findPersonalFeatures(allH3, backgroundIndex) {
  const features = [];
  for (let i = backgroundIndex + 1; i < allH3.length; i += 1) {
    const title = allH3[i].title;
    if (KNOWN_BACKGROUND_NAMES.has(title)) break;
    if (/^Feature:/i.test(title)) {
      features.push({
        name: title,
        entries: toParagraphs(
          allH3[i].body
            .replace(/\r\n/g, "\n")
            .split("\n")
            .filter((line) => !/^\|/.test(line.trim()))
            .filter((line) => !/^Group Research$/i.test(line.trim()))
            .join("\n"),
        ),
        tables: mergeContinuationTables(parseMarkdownTables(allH3[i].body)),
      });
      continue;
    }
    if (
      /^Guild Feature:/i.test(title) ||
      /Backgrounds$/i.test(title) ||
      /^How do I/i.test(title) ||
      /^Joining /i.test(title) ||
      /^A .+ Party$/i.test(title) ||
      /Rank and Renown/i.test(title) ||
      /^The /i.test(title) ||
      /^Royal /i.test(title)
    ) {
      break;
    }
  }
  return features;
}

function detectFaction(sectionTitle) {
  for (const row of FACTION_BY_SECTION) {
    if (row.match.test(sectionTitle)) return row;
  }
  return { faction: "hunters-guild", label: "Hunter's Guild" };
}

function buildListEntries(field) {
  const items = [];
  if (field.skills) {
    items.push({
      type: "item",
      name: "Skill Proficiencies",
      entry: field.skills.replace(/^Skill Proficienc(?:y|ies):\s*/i, ""),
    });
  }
  if (field.tools) {
    items.push({
      type: "item",
      name: "Tool Proficiencies",
      entry: field.tools.replace(/^Tool Proficienc(?:y|ies):\s*/i, ""),
    });
  }
  if (field.languages) {
    items.push({
      type: "item",
      name: "Languages",
      entry: field.languages.replace(/^Languages?:?\s*/i, ""),
    });
  }
  if (field.equipment) {
    items.push({
      type: "item",
      name: "Equipment",
      entry: field.equipment.replace(/^Equipment:\s*/i, ""),
    });
  }
  return items.length ? [{ type: "list", style: "list-hang-notitle", items }] : [];
}

function extractFactionsSection(markdown) {
  const text = String(markdown ?? "").replace(/\r\n/g, "\n");
  const start = text.indexOf("## Factions & PC Backgrounds");
  if (start === -1) return "";
  const endMarker = "Additional Factions will be added";
  const end = text.indexOf(endMarker, start);
  return text.slice(start, end === -1 ? text.length : end).trim();
}

function factionSections(factionsMarkdown) {
  // Major factions start at ### The Helix / Hunter's / Royal / Talon / Wycademy
  const blocks = headingBlocks(factionsMarkdown, 3);
  const majors = [];
  for (const block of blocks) {
    if (
      /^The Helix Commission$/i.test(block.title) ||
      /^The Hunter'?s Guild$/i.test(block.title) ||
      /^Royal Paleontology Scriveners$/i.test(block.title) ||
      /^The Talon Society$/i.test(block.title) ||
      /^The Wycademy$/i.test(block.title)
    ) {
      majors.push(block);
    }
  }
  // Rebuild body to include nested ### until next major
  const all = headingBlocks(factionsMarkdown, 3);
  return majors.map((major) => {
    const startIdx = all.findIndex((b) => b.title === major.title);
    const nextMajorIdx = all.findIndex(
      (b, i) =>
        i > startIdx &&
        (/^The Helix Commission$/i.test(b.title) ||
          /^The Hunter'?s Guild$/i.test(b.title) ||
          /^Royal Paleontology Scriveners$/i.test(b.title) ||
          /^The Talon Society$/i.test(b.title) ||
          /^The Wycademy$/i.test(b.title)),
    );
    const slice = all.slice(
      startIdx,
      nextMajorIdx === -1 ? undefined : nextMajorIdx,
    );
    const body = slice
      .map((b, i) => (i === 0 ? b.body : `### ${b.title}\n\n${b.body}`))
      .join("\n\n");
    return { title: major.title, body, h3: slice.slice(1) };
  });
}

export function buildBackgrounds() {
  const markdown = readUtf8(BACKGROUNDS_SOURCE_FILE);
  const factionsMd = extractFactionsSection(markdown);
  if (!factionsMd) return [];

  const factions = factionSections(factionsMd);
  const out = [];

  for (const faction of factions) {
    const meta = detectFaction(faction.title);
    const h3 = headingBlocks(`### ${faction.title}\n\n${faction.body}`, 3);
    const sharedGuild = findGuildFeature(h3, faction.body);
    const specialty = findSharedSpecialtyFeature(h3);

    for (let i = 0; i < h3.length; i += 1) {
      const block = h3[i];
      if (!KNOWN_BACKGROUND_NAMES.has(block.title)) continue;

      // Prefer body that includes wrongly-promoted skill heading content
      let body = block.body;
      const next = h3[i + 1];
      if (next && /^Skill Proficienc/i.test(next.title)) {
        body = `${body}\n\n${next.title}\n\n${next.body}`;
      }

      const { field, fluff } = extractFieldLines(body);
      let tables = mergeContinuationTables(parseMarkdownTables(body));
      // Tables may live under the OCR skill heading that follows Poacher
      if (!tables.length && next && /^Skill Proficienc/i.test(next.title)) {
        tables = mergeContinuationTables(parseMarkdownTables(next.body));
      }

      const personalFeatures = findPersonalFeatures(h3, i);
      if (!tables.length) {
        for (const feature of personalFeatures) {
          if (feature.tables?.length) {
            tables = feature.tables.filter((t) => {
              const label = String(t.colLabels?.[1] ?? "").toLowerCase();
              return (
                label.includes("personality") ||
                label.includes("ideal") ||
                label.includes("bond") ||
                label.includes("flaw")
              );
            });
            if (tables.length) break;
          }
        }
      }

      const entries = [...buildListEntries(field)];

      if (specialty) {
        entries.push({
          type: "entries",
          name: specialty.name,
          data: { isFeature: true },
          entries: specialty.entries,
        });
      }
      if (sharedGuild) {
        entries.push({
          type: "entries",
          name: sharedGuild.name,
          data: { isFeature: true },
          entries: sharedGuild.entries,
        });
      }
      for (const personalFeature of personalFeatures) {
        entries.push({
          type: "entries",
          name: personalFeature.name,
          data: { isFeature: true },
          entries: [
            ...personalFeature.entries,
            // Keep non-characteristic tables (e.g. Group Research) on the feature
            ...(personalFeature.tables ?? []).filter((t) => {
              const label = String(t.colLabels?.[1] ?? "").toLowerCase();
              return !(
                label.includes("personality") ||
                label.includes("ideal") ||
                label.includes("bond") ||
                label.includes("flaw")
              );
            }),
          ],
        });
      }
      if (tables.length) {
        entries.push({
          type: "entries",
          name: "Suggested Characteristics",
          entries: tables,
        });
      }

      const row = {
        name: block.title,
        source: "AGMH",
        page: PAGE_FACTIONS,
        _faction: meta.faction,
        skillProficiencies: field.skills
          ? parseSkillLine(field.skills)
          : undefined,
        toolProficiencies: field.tools ? parseToolLine(field.tools) : undefined,
        languageProficiencies: field.languages
          ? parseLanguageLine(field.languages)
          : undefined,
        fluff: {
          entries: fluff.length
            ? fluff
            : toParagraphs(
                body
                  .split("\n")
                  .filter((l) => !/^\|/.test(l))
                  .join("\n\n"),
              ).slice(0, 1),
        },
        entries,
      };

      if (!row.skillProficiencies) delete row.skillProficiencies;
      if (!row.toolProficiencies) delete row.toolProficiencies;
      if (!row.languageProficiencies) delete row.languageProficiencies;

      out.push(row);
    }
  }

  // De-dupe by name (Poacher role vs background, etc.)
  const byName = new Map();
  for (const row of out) {
    const key = row.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, row);
      continue;
    }
    // Prefer the one with skill proficiencies
    if (!existing.skillProficiencies && row.skillProficiencies) {
      byName.set(key, row);
    }
  }
  return [...byName.values()];
}
