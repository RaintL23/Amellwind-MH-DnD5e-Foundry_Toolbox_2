import type {
  DndBackground,
  DndBackgroundEdition,
  DndBackgroundFeatRef,
  AbilityBonus,
  AbilityKey,
} from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { formatAbilitySummary } from "@/features/dnd/races/mappers/dnd-race.mapper";
import { parseOriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { parseSkillProficiencyBlocks } from "@/shared/utils/skill-proficiency.parser";
import { parseNamedProficiencyBlocks } from "@/shared/utils/named-proficiency.parser";
import { parseBackgroundStartingEquipment } from "@/shared/utils/starting-equipment.parser";
import {
  applyDnd2024BackgroundLanguageGrants,
  DND_2024_BACKGROUND_LANGUAGE_SUMMARY,
  isDnd2024Background,
} from "@/features/dnd/backgrounds/utils/dnd-2024-background-language.utils";
import { mapFluffEntriesToText } from "@/shared/utils/fluff.utils";
import {
  collectSectionContent,
  mapListProficiencies,
  mapProficiencyBlock,
  splitEntries,
  titleCase,
} from "@/shared/mappers/background-entries.mapper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function backgroundId(raw: Raw): string {
  return `${raw.name}::${raw.source}`;
}

function inferEdition(raw: Raw): DndBackgroundEdition | undefined {
  if (raw.edition === "one") return "2024";
  if (raw.source === "XPHB") return "2024";
  return undefined;
}

function mapSkillSummary(raw: Raw): string {
  const blocks = Array.isArray(raw.skillProficiencies)
    ? (raw.skillProficiencies as Raw[])
    : [];
  const parts = blocks.flatMap((block) =>
    mapProficiencyBlock(block, { extended: true }),
  );
  return parts.length ? parts.join("; ") : "—";
}

function mapToolSummary(raw: Raw): string {
  const blocks = Array.isArray(raw.toolProficiencies)
    ? (raw.toolProficiencies as Raw[])
    : [];
  const parts = blocks.flatMap((block) =>
    mapProficiencyBlock(block, { extended: true }),
  );
  return parts.length ? parts.join("; ") : "—";
}

function mapLanguageSummary(raw: Raw): string {
  const blocks = Array.isArray(raw.languageProficiencies)
    ? (raw.languageProficiencies as Raw[])
    : [];
  const parts = blocks.flatMap((block) =>
    mapProficiencyBlock(block, { extended: true }),
  );
  return parts.length ? parts.join("; ") : "—";
}

function formatWeightsLabel(weights: number[]): string {
  return weights.map((w) => `+${w}`).join("/");
}

function sameAbilitySet(a: AbilityKey[], b: AbilityKey[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

function mapAbilityBonuses(ability: unknown): AbilityBonus[] {
  if (!Array.isArray(ability)) return [];

  const weightedBlocks: Array<{ from: AbilityKey[]; weights: number[] }> = [];
  const result: AbilityBonus[] = [];

  for (const block of ability) {
    if (typeof block !== "object" || block === null) continue;
    const b = block as Raw;
    const choose = b.choose as Raw | undefined;

    if (choose?.weighted) {
      const weighted = choose.weighted as Raw;
      weightedBlocks.push({
        from: (Array.isArray(weighted.from) ? weighted.from : []).map(
          String,
        ) as AbilityKey[],
        weights: Array.isArray(weighted.weights)
          ? weighted.weights.map((weight) => Number(weight))
          : [],
      });
      continue;
    }

    if (choose && Array.isArray(choose.from)) {
      result.push({
        kind: "choose",
        from: choose.from.map(String) as AbilityKey[],
        amount: Number(choose.amount ?? 1),
        count: typeof choose.count === "number" ? choose.count : undefined,
      });
    }
  }

  if (weightedBlocks.length >= 2) {
    const from = weightedBlocks[0].from;
    if (
      from.length > 0 &&
      weightedBlocks.every((block) => sameAbilitySet(block.from, from))
    ) {
      return [
        {
          kind: "weightedDistribution",
          from,
          modes: weightedBlocks.map((block) => ({
            weights: block.weights,
            label: formatWeightsLabel(block.weights),
          })),
        },
      ];
    }
  }

  for (const block of weightedBlocks) {
    const plusTwoCount = block.weights.filter((weight) => weight === 2).length;
    const plusOneCount = block.weights.filter((weight) => weight === 1).length;
    result.push({
      kind: "choose",
      from: block.from,
      amount: 1,
      count: plusTwoCount > 0 ? plusTwoCount + plusOneCount : plusOneCount,
    });
  }

  return result;
}

function titleCaseFeatName(name: string): string {
  return titleCase(name);
}

function parseFeatKey(key: string): {
  name: string;
  source: string;
  qualifier?: string;
} {
  const pipe = key.lastIndexOf("|");
  if (pipe === -1) {
    return { name: titleCaseFeatName(key.trim()), source: "" };
  }
  const beforePipe = key.slice(0, pipe).trim();
  const source = key.slice(pipe + 1).trim().toUpperCase();
  const semi = beforePipe.indexOf(";");
  if (semi !== -1) {
    return {
      name: titleCaseFeatName(beforePipe.slice(0, semi).trim()),
      qualifier: titleCaseFeatName(beforePipe.slice(semi + 1).trim()),
      source,
    };
  }
  return { name: titleCaseFeatName(beforePipe), source };
}

function buildFeatRef(key: string): DndBackgroundFeatRef {
  const parsed = parseFeatKey(key);
  const displayLabel = parsed.qualifier
    ? `${parsed.name} (${parsed.qualifier})`
    : parsed.name;
  return {
    id: `${parsed.name}::${parsed.source}`,
    name: parsed.name,
    source: parsed.source,
    qualifier: parsed.qualifier,
    displayLabel,
  };
}

function mapFeatRefs(raw: Raw): DndBackgroundFeatRef[] {
  const refs: DndBackgroundFeatRef[] = [];
  const seen = new Set<string>();

  if (Array.isArray(raw.feats)) {
    for (const block of raw.feats) {
      if (typeof block !== "object" || block === null) continue;
      for (const [key, val] of Object.entries(block as Raw)) {
        if (val !== true) continue;
        const ref = buildFeatRef(key);
        if (!seen.has(ref.id)) {
          seen.add(ref.id);
          refs.push(ref);
        }
      }
    }
  }

  return refs;
}

function mapFeatSummary(raw: Raw, refs: DndBackgroundFeatRef[]): string {
  if (refs.length) return refs.map((r) => r.displayLabel).join("; ");

  if (!Array.isArray(raw.feats)) return "";
  const parts: string[] = [];
  for (const block of raw.feats) {
    if (typeof block !== "object" || block === null) continue;
    for (const [key, val] of Object.entries(block as Raw)) {
      if (val === true) {
        parts.push(parseFiveToolsMarkup(`{@feat ${key}}`));
      }
    }
  }
  return parts.join("; ");
}

function parseFeatRefsFromMarkup(text: string): DndBackgroundFeatRef[] {
  const refs: DndBackgroundFeatRef[] = [];
  const seen = new Set<string>();
  const pattern = /\{@feat\s+([^|}]+)(?:\|([^|}]+))?(?:\|([^}]+))?\}/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const name = titleCaseFeatName(match[1].trim());
    const source = (match[2] ?? match[3] ?? "").trim().toUpperCase();
    if (!source) continue;
    const ref: DndBackgroundFeatRef = {
      id: `${name}::${source}`,
      name,
      source,
      displayLabel: name,
    };
    if (!seen.has(ref.id)) {
      seen.add(ref.id);
      refs.push(ref);
    }
  }

  return refs;
}

function extractListField(listEntries: unknown[], field: string): string {
  for (const entry of listEntries) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Raw;
    if (e.type !== "list" || !Array.isArray(e.items)) continue;
    for (const item of e.items as Raw[]) {
      if (item.type !== "item" || !item.name) continue;
      if (String(item.name).toLowerCase().includes(field)) {
        return typeof item.entry === "string"
          ? parseFiveToolsMarkup(item.entry)
          : "";
      }
    }
  }
  return "";
}

function mapDndBackgroundFluff(fluff: unknown): string {
  return mapFluffEntriesToText(
    fluff,
    { nested: true, sectionNested: true },
    (entries) => collectSectionContent(entries).texts.join(" "),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDndBackground(raw: any): DndBackground {
  const { listEntries, features, suggested } = splitEntries(raw);
  const listProf = mapListProficiencies(listEntries);
  const abilityBonuses = mapAbilityBonuses(raw.ability);
  const abilityFromList = extractListField(listEntries, "ability");
  const featFromList = extractListField(listEntries, "feat");
  const featRefsFromRaw = mapFeatRefs(raw);
  const featRefsFromList = featFromList
    ? parseFeatRefsFromMarkup(featFromList)
    : [];
  const featRefs = featRefsFromRaw.length
    ? featRefsFromRaw
    : featRefsFromList.length
      ? featRefsFromList
      : undefined;
  const abilitySummary =
    abilityFromList ||
    (abilityBonuses.length ? formatAbilitySummary(abilityBonuses) : undefined);
  const featSummary =
    featFromList ||
    mapFeatSummary(raw, featRefsFromRaw) ||
    undefined;

  const languages =
    listProf.languages !== "—"
      ? listProf.languages
      : mapLanguageSummary(raw);

  const bgSource = { type: "background" as const, name: String(raw.name ?? "Unknown") };
  const skillGrants = parseSkillProficiencyBlocks(
    Array.isArray(raw.skillProficiencies) ? raw.skillProficiencies : [],
    bgSource,
  );
  const toolGrants = parseNamedProficiencyBlocks(
    Array.isArray(raw.toolProficiencies) ? raw.toolProficiencies : [],
    bgSource,
  );
  let languageGrants = parseNamedProficiencyBlocks(
    Array.isArray(raw.languageProficiencies) ? raw.languageProficiencies : [],
    bgSource,
  );
  const edition = inferEdition(raw);
  let languagesDisplay = languages;

  if (isDnd2024Background(edition)) {
    const applied = applyDnd2024BackgroundLanguageGrants(
      languageGrants,
      bgSource,
    );
    languageGrants = applied.grants;
    if (applied.appliedDefaults && languagesDisplay === "—") {
      languagesDisplay = DND_2024_BACKGROUND_LANGUAGE_SUMMARY;
    }
  }

  return {
    id: backgroundId(raw),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "PHB"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    edition,
    srd: raw.srd === true,
    basicRules: raw.basicRules === true,
    fluff: mapDndBackgroundFluff(raw.fluff),
    proficiencies: {
      skills:
        listProf.skills !== "—" ? listProf.skills : mapSkillSummary(raw),
      tools: listProf.tools !== "—" ? listProf.tools : mapToolSummary(raw),
      languages: languagesDisplay !== "—" ? languagesDisplay : "—",
      equipment: listProf.equipment,
    },
    abilityBonuses,
    abilitySummary: abilitySummary || undefined,
    featSummary,
    featRefs,
    originFeatGrant: parseOriginFeatGrant(raw.feats),
    features,
    suggestedCharacteristics: suggested,
    skillGrants,
    toolGrants,
    languageGrants,
    startingEquipmentOffers: parseBackgroundStartingEquipment(
      raw.startingEquipment,
    ),
  };
}
