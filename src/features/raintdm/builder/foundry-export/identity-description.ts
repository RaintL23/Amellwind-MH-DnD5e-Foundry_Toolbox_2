/**
 * Builds Plutonium-style identity item descriptions for Foundry export:
 * fluff art/lore + class progression table + leveled features / race traits.
 */

import type {
  Class,
  ClassFeatureEntry,
  ClassTableGroup,
  Subclass,
} from "@/shared/types";
import type { SpeciesTrait } from "@/shared/types/species.types";
import { escapeHtml, foundryDividerHtml } from "@/shared/foundry";
import {
  renderFiveToolsEntries,
  type FluffArtResult,
} from "./fluff-description";

function proficiencyBonus(level: number): string {
  return `+${Math.ceil(level / 4) + 1}`;
}

function ordinalLevel(level: number): string {
  const v = level % 100;
  if (v >= 11 && v <= 13) return `${level}th`;
  switch (level % 10) {
    case 1:
      return `${level}st`;
    case 2:
      return `${level}nd`;
    case 3:
      return `${level}rd`;
    default:
      return `${level}th`;
  }
}

function featureNamesForLevel(
  features: ClassFeatureEntry[],
  subclassTitle?: string,
): string {
  const names: string[] = [];
  for (const f of features) {
    if (f.gainSubclassFeature) {
      names.push(subclassTitle?.trim() || "Subclass");
      continue;
    }
    const name = (f.displayName || f.name).trim();
    if (name) names.push(name);
  }
  return names.join(", ");
}

function renderClassTableHtml(
  cls: Class,
  options?: { subclassTitle?: string },
): string {
  const groups: ClassTableGroup[] = cls.spellProgression ?? [];
  const extraHeaders = groups.flatMap((g) => g.colLabels);
  const headers = [
    "Level",
    "Proficiency Bonus",
    "Features",
    ...extraHeaders,
  ];

  const rowsHtml = cls.progression
    .map((row) => {
      const featureCol = featureNamesForLevel(
        row.features.filter((f) => !f.isSubclassFeature),
        options?.subclassTitle ?? cls.subclassTitle,
      );
      const cells = [
        ordinalLevel(row.level),
        proficiencyBonus(row.level),
        featureCol || "—",
        ...row.tableCells,
      ];
      // Pad if tableCells shorter than headers extras
      while (cells.length < headers.length) cells.push("—");
      return `<tr>${cells
        .slice(0, headers.length)
        .map((c) => `<td>${escapeHtml(c)}</td>`)
        .join("")}</tr>`;
    })
    .join("");

  const head = `<thead><tr>${headers
    .map((h) => `<th>${escapeHtml(h)}</th>`)
    .join("")}</tr></thead>`;

  return [
    `<h2>${escapeHtml(cls.name)}</h2>`,
    `<table style="width:100%;border-collapse:collapse;margin:1em 0;font-size:0.9em">${head}<tbody>${rowsHtml}</tbody></table>`,
  ].join("");
}

function renderFeatureBlock(feature: ClassFeatureEntry): string {
  if (feature.gainSubclassFeature) return "";
  const name = (feature.displayName || feature.name).trim();
  if (!name) return "";
  const heading = `<h2>Level ${feature.level}: ${escapeHtml(name)}</h2>`;
  const body = feature.rawEntries?.length
    ? renderFiveToolsEntries(feature.rawEntries)
    : (feature.description ?? [])
        .map((line) => {
          const t = line.trim();
          return t ? `<p>${t}</p>` : "";
        })
        .join("");
  return `${heading}${body}`;
}

function renderFeaturesHtml(
  progression: Class["progression"] | Subclass["progression"],
  options?: { onlySubclass?: boolean },
): string {
  const blocks: string[] = [];
  for (const row of progression) {
    for (const feature of row.features) {
      if (feature.gainSubclassFeature) continue;
      if (options?.onlySubclass && !feature.isSubclassFeature) continue;
      if (!options?.onlySubclass && feature.isSubclassFeature) continue;
      const html = renderFeatureBlock(feature);
      if (html) blocks.push(html);
    }
  }
  return blocks.join("");
}

function renderTraitsHtml(traits: SpeciesTrait[]): string {
  return traits
    .map((trait) => {
      const name = trait.name.trim();
      if (!name) return "";
      const body = (trait.entries ?? [])
        .map((line) => {
          const t = line.trim();
          return t ? `<p>${t}</p>` : "";
        })
        .join("");
      const tables = (trait.tables ?? [])
        .map((table) => {
          const caption = table.caption
            ? `<caption>${escapeHtml(table.caption)}</caption>`
            : "";
          const head = `<thead><tr>${table.colLabels
            .map((l) => `<th>${escapeHtml(l)}</th>`)
            .join("")}</tr></thead>`;
          const rows = table.rows
            .map(
              (row) =>
                `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`,
            )
            .join("");
          return `<table style="width:100%;border-collapse:collapse;margin:0.75em 0">${caption}${head}<tbody>${rows}</tbody></table>`;
        })
        .join("");
      return `<h2>${escapeHtml(name)}</h2>${body}${tables}`;
    })
    .filter(Boolean)
    .join("");
}

function joinParts(...parts: Array<string | undefined | null>): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(foundryDividerHtml());
}

/** Full class item description: fluff → table → leveled features. */
export function buildClassIdentityDescription(input: {
  fluff?: FluffArtResult | null;
  classData: Class;
}): string {
  const fluffHtml = input.fluff?.html ?? "";
  const tableHtml = renderClassTableHtml(input.classData);
  const featuresHtml = renderFeaturesHtml(input.classData.progression);
  return joinParts(fluffHtml, tableHtml, featuresHtml);
}

/** Full subclass item description: fluff → subclass features. */
export function buildSubclassIdentityDescription(input: {
  fluff?: FluffArtResult | null;
  subclassData: Subclass;
}): string {
  const fluffHtml = input.fluff?.html ?? "";
  // Subclass progression entries are already subclass-only; they are not flagged
  // with isSubclassFeature on the Subclass model itself.
  const featuresHtml = renderFeaturesHtml(
    input.subclassData.progression.map((row) => ({
      ...row,
      features: row.features.map((f) => ({ ...f, isSubclassFeature: true })),
    })),
    { onlySubclass: true },
  );
  return joinParts(fluffHtml, featuresHtml);
}

/** Full race/species item description: fluff → traits. */
export function buildRaceIdentityDescription(input: {
  fluff?: FluffArtResult | null;
  /** Plain mapped fluff text fallback when remote fluff HTML is empty. */
  fluffText?: string;
  traits: SpeciesTrait[];
}): string {
  const fluffHtml =
    input.fluff?.html ||
    (input.fluffText?.trim()
      ? input.fluffText
          .split(/\n\s*\n/)
          .map((b) => b.trim())
          .filter(Boolean)
          .map((b) => `<p>${b.replace(/\n/g, "<br/>")}</p>`)
          .join("")
      : "");
  const traitsHtml = renderTraitsHtml(input.traits);
  return joinParts(fluffHtml, traitsHtml);
}

/** Background description: fluff HTML (or plain text) + feature sections. */
export function buildBackgroundIdentityDescription(input: {
  fluff?: FluffArtResult | null;
  fluffText?: string;
  features: Array<{ name: string; description?: string }>;
}): string {
  const fluffHtml =
    input.fluff?.html ||
    (input.fluffText?.trim()
      ? input.fluffText
          .split(/\n\s*\n/)
          .map((b) => b.trim())
          .filter(Boolean)
          .map((b) => `<p>${b.replace(/\n/g, "<br/>")}</p>`)
          .join("")
      : "");
  const featuresHtml = input.features
    .map((f) => {
      const name = f.name.trim();
      if (!name) return "";
      const body = (f.description ?? "")
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean)
        .map((b) => `<p>${b.replace(/\n/g, "<br/>")}</p>`)
        .join("");
      return `<h2>${escapeHtml(name)}</h2>${body}`;
    })
    .filter(Boolean)
    .join("");
  return joinParts(fluffHtml, featuresHtml);
}
