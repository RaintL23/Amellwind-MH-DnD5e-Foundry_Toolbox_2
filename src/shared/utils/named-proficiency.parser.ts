/**
 * Parser for 5etools-style toolProficiencies, languageProficiencies,
 * and class startingProficiencies (tools/languages).
 */
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import type { NamedProficiencyGrant, ProficiencySource } from "@/shared/types/proficiency.types";
import {
  getChooseableLanguages,
  STANDARD_LANGUAGES,
} from "@/shared/data/chooseable-languages";

export { STANDARD_LANGUAGES, getChooseableLanguages };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function titleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.includes("{@") ? parseFiveToolsMarkup(trimmed) : titleCase(trimmed);
}

function parseChooseCount(choose: Raw): number {
  if (typeof choose.count === "number") return choose.count;
  if (typeof choose.amount === "number") return choose.amount;
  return 1;
}

function pushAnyGrant(
  grants: NamedProficiencyGrant[],
  count: number,
  label: string,
  source: ProficiencySource,
  options?: string[],
): void {
  if (count > 0) {
    grants.push({ kind: "any", count, label, options, source });
  }
}

function parseProficiencyBlock(
  block: Raw,
  source: ProficiencySource,
  grants: NamedProficiencyGrant[],
): void {
  const fixedItems: string[] = [];

  for (const [key, value] of Object.entries(block)) {
    if (key === "choose" || key === "_") continue;

    if (value === true) {
      const label = formatLabel(key);
      if (label) fixedItems.push(label);
      continue;
    }

    if (key === "anyStandard" && typeof value === "number") {
      pushAnyGrant(
        grants,
        value,
        `Standard language${value > 1 ? "s" : ""}`,
        source,
        [...STANDARD_LANGUAGES],
      );
      continue;
    }

    if (key === "any" && typeof value === "number") {
      pushAnyGrant(grants, value, `Language${value > 1 ? "s" : ""}`, source, [
        ...getChooseableLanguages(),
      ]);
      continue;
    }

    if (
      (key === "anyArtisansTool" || key === "anyArtisanTool") &&
      typeof value === "number"
    ) {
      pushAnyGrant(
        grants,
        value,
        `Artisan's tool${value > 1 ? "s" : ""}`,
        source,
      );
      continue;
    }

    if (key === "anyMusicalInstrument" && typeof value === "number") {
      pushAnyGrant(
        grants,
        value,
        `Musical instrument${value > 1 ? "s" : ""}`,
        source,
      );
      continue;
    }

    if (key === "anyGamingSet" && typeof value === "number") {
      pushAnyGrant(grants, value, `Gaming set${value > 1 ? "s" : ""}`, source);
      continue;
    }

    if (key === "anyTool" && typeof value === "number") {
      pushAnyGrant(grants, value, `Tool${value > 1 ? "s" : ""}`, source);
    }
  }

  if (fixedItems.length) {
    grants.push({ kind: "fixed", items: fixedItems, source });
  }

  const choose = block.choose as Raw | undefined;
  if (choose && Array.isArray(choose.from) && choose.from.length) {
    const from = (choose.from as unknown[])
      .map((item) => formatLabel(String(item)))
      .filter(Boolean);
    if (from.length) {
      grants.push({
        kind: "choose",
        from,
        count: parseChooseCount(choose),
        source,
      });
    }
  }

  const weighted = choose?.weighted as Raw | undefined;
  if (weighted && Array.isArray(weighted.from) && weighted.from.length) {
    const from = (weighted.from as unknown[])
      .map((item) => formatLabel(String(item)))
      .filter(Boolean);
    if (from.length) {
      grants.push({ kind: "choose", from, count: 1, source });
    }
  }
}

function parseStringEntry(entry: string, source: ProficiencySource): NamedProficiencyGrant | null {
  const label = formatLabel(entry);
  return label ? { kind: "fixed", items: [label], source } : null;
}

/**
 * Parse tool/language proficiency blocks into structured grants.
 */
export function parseNamedProficiencyBlocks(
  blocks: unknown[],
  source: ProficiencySource,
): NamedProficiencyGrant[] {
  const grants: NamedProficiencyGrant[] = [];
  if (!Array.isArray(blocks)) return grants;

  for (const block of blocks) {
    if (typeof block === "string") {
      const grant = parseStringEntry(block, source);
      if (grant) grants.push(grant);
      continue;
    }

    if (typeof block !== "object" || block === null) continue;

    const raw = block as Raw;

    if (typeof raw.any === "number") {
      pushAnyGrant(grants, raw.any, "Proficiency", source);
      continue;
    }

    if (typeof raw.proficiency === "string") {
      const name = formatLabel(raw.proficiency);
      if (name) {
        const label = raw.optional ? `${name} (optional)` : name;
        grants.push({ kind: "fixed", items: [label], source });
      }
      continue;
    }

    const choose = raw.choose as Raw | undefined;
    if (choose && Array.isArray(choose.from) && choose.from.length) {
      const from = (choose.from as unknown[])
        .map((item) => formatLabel(String(item)))
        .filter(Boolean);
      if (from.length) {
        grants.push({
          kind: "choose",
          from,
          count: parseChooseCount(choose),
          source,
        });
      }
      continue;
    }

    parseProficiencyBlock(raw, source, grants);
  }

  return grants;
}

export function getPendingNamedChoiceGrants(
  grants: NamedProficiencyGrant[],
): Array<
  | { kind: "choose"; from: string[]; count: number; source: ProficiencySource }
  | {
      kind: "any";
      count: number;
      label: string;
      options?: string[];
      source: ProficiencySource;
    }
> {
  return grants.filter(
    (
      g,
    ): g is Extract<NamedProficiencyGrant, { kind: "choose" | "any" }> =>
      g.kind === "choose" || g.kind === "any",
  );
}

export function resolveFixedNamedGrants(
  grants: NamedProficiencyGrant[],
): Array<{ item: string; source: ProficiencySource }> {
  const result: Array<{ item: string; source: ProficiencySource }> = [];
  for (const grant of grants) {
    if (grant.kind === "fixed") {
      for (const item of grant.items) {
        result.push({ item, source: grant.source });
      }
    }
  }
  return result;
}
