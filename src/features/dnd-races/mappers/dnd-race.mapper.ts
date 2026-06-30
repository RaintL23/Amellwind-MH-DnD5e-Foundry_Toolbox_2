import type {
  AbilityBonus,
  AbilityBonusFixed,
  AbilityBonusChoose,
  SpeciesTrait,
  SpeciesTable,
  AbilityKey,
  DamageType,
  DndRace,
  DndRaceKind,
  DndRaceSize,
  SpeciesNamedSpellGroup,
} from "@/shared/types";
import { ABILITY_LABELS as LABELS } from "@/shared/types";
import { ABILITY_KEYS } from "@/shared/constants/dnd";
import { SIZE_MAP } from "@/shared/utils/cr.utils";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import {
  parseSkillProficiencyBlocks,
  parseSkillAdvantagesFromTraits,
} from "@/shared/utils/skill-proficiency.parser";
import { parseNamedProficiencyBlocks } from "@/shared/utils/named-proficiency.parser";
import {
  mergeLanguageGrants,
  parseLanguageGrantsFromTraits,
} from "@/shared/utils/language-grant.parser";
import { parseDefenseBlocks } from "@/shared/utils/defense-grant.parser";
import { parseOriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function raceId(raw: Raw): string {
  const parent = raw.raceName ? `::${raw.raceName}` : "";
  return `${raw.name}::${raw.source}${parent}`;
}

function inferKind(raw: Raw): DndRaceKind {
  if (raw.raceName) {
    const name = String(raw.name ?? "");
    if (/lineage|variant/i.test(name)) return "lineage";
    return "subrace";
  }
  if (raw.lineage) return "lineage";
  return "species";
}

function mapSizes(size: unknown): DndRaceSize[] {
  if (!Array.isArray(size)) return ["Medium"];
  return size.map((s) => (SIZE_MAP[String(s)] ?? String(s)) as DndRaceSize);
}

function formatSpeed(speed: unknown): string {
  if (typeof speed === "number") return `${speed} ft.`;
  if (typeof speed === "string") return speed;
  if (typeof speed !== "object" || speed === null) return "—";
  const s = speed as Raw;
  const parts: string[] = [];
  if (typeof s.walk === "number") parts.push(`${s.walk} ft.`);
  if (typeof s.fly === "number") parts.push(`fly ${s.fly} ft.`);
  if (typeof s.swim === "number") parts.push(`swim ${s.swim} ft.`);
  if (typeof s.climb === "number") parts.push(`climb ${s.climb} ft.`);
  if (typeof s.burrow === "number") parts.push(`burrow ${s.burrow} ft.`);
  return parts.length ? parts.join(", ") : "—";
}

function mapAbilityBonuses(ability: unknown): AbilityBonus[] {
  if (!Array.isArray(ability)) return [];
  const result: AbilityBonus[] = [];
  for (const block of ability) {
    if (typeof block !== "object" || block === null) continue;
    const b = block as Raw;
    const fixed: Partial<Record<AbilityKey, number>> = {};
    for (const key of ABILITY_KEYS) {
      if (typeof b[key] === "number") fixed[key] = b[key];
    }
    if (Object.keys(fixed).length) {
      result.push({ kind: "fixed", bonuses: fixed } satisfies AbilityBonusFixed);
    }
    if (b.choose) {
      const choose = b.choose as Raw;
      result.push({
        kind: "choose",
        from: (Array.isArray(choose.from) ? choose.from : []).map(String) as AbilityKey[],
        amount: Number(choose.amount ?? 1),
        count: typeof choose.count === "number" ? choose.count : undefined,
      } satisfies AbilityBonusChoose);
    }
  }
  return result;
}

export function formatAbilitySummary(bonuses: AbilityBonus[]): string {
  if (!bonuses.length) return "—";
  return bonuses
    .map((b) => {
      if (b.kind === "fixed") {
        return Object.entries(b.bonuses)
          .map(([k, v]) => `${LABELS[k as AbilityKey]} +${v}`)
          .join(", ");
      }
      if (b.kind === "weightedDistribution") {
        const opts = b.from.map((k) => LABELS[k]).join(" / ");
        const modes = b.modes.map((mode) => mode.label).join(" or ");
        return `${opts}: ${modes}`;
      }
      const opts = b.from.map((k) => LABELS[k]).join(" / ");
      const count = b.count && b.count > 1 ? `${b.count}× ` : "";
      return `${count}+${b.amount} ${opts}`;
    })
    .join(" · ");
}

function mapTable(raw: Raw): SpeciesTable {
  const rows = Array.isArray(raw.rows)
    ? (raw.rows as unknown[][]).map((row) =>
        row.map((cell) =>
          typeof cell === "string" ? parseFiveToolsMarkup(cell) : String(cell ?? ""),
        ),
      )
    : [];
  return {
    caption: typeof raw.caption === "string" ? raw.caption : undefined,
    colLabels: Array.isArray(raw.colLabels) ? raw.colLabels.map(String) : [],
    rows,
  };
}

function collectTraitContent(entries: unknown[]): {
  texts: string[];
  tables: SpeciesTable[];
} {
  const texts: string[] = [];
  const tables: SpeciesTable[] = [];
  for (const entry of entries) {
    if (typeof entry === "string") {
      texts.push(parseFiveToolsMarkup(entry));
      continue;
    }
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Raw;
    if (e.type === "table") {
      tables.push(mapTable(e));
      continue;
    }
    if (Array.isArray(e.entries)) {
      const nested = collectTraitContent(e.entries as unknown[]);
      texts.push(...nested.texts);
      tables.push(...nested.tables);
    }
  }
  return { texts, tables };
}

function mapTraits(entries: unknown[]): SpeciesTrait[] {
  if (!Array.isArray(entries)) return [];
  const traits: SpeciesTrait[] = [];
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Raw;
    const name = String(e.name ?? "").trim();
    if (!name) continue;
    const { texts, tables } = collectTraitContent(
      Array.isArray(e.entries) ? (e.entries as unknown[]) : [],
    );
    traits.push({ name, entries: texts, tables: tables.length ? tables : undefined });
  }
  return traits;
}

function mapResistances(resist: unknown): { fixed: DamageType[]; summary: string } {
  if (!Array.isArray(resist)) return { fixed: [], summary: "" };
  const fixed: DamageType[] = [];
  const chooseParts: string[] = [];
  for (const item of resist) {
    if (typeof item === "string") {
      fixed.push(item as DamageType);
      continue;
    }
    if (typeof item !== "object" || item === null) continue;
    const r = item as Raw;
    if (r.choose && Array.isArray((r.choose as Raw).from)) {
      const from = ((r.choose as Raw).from as unknown[]).map(String);
      chooseParts.push(from.join(" / "));
    }
  }
  const summary = chooseParts.length ? `choose: ${chooseParts.join("; ")}` : "";
  return { fixed, summary };
}

/** Strip 5etools markup from a spell entry: "thaumaturgy|xphb#c" → "Thaumaturgy" */
function extractSpellName(raw: string): string {
  const base = raw.split("|")[0].split("#")[0].trim().toLowerCase();
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Extract cantrip names (entries ending with "#c") from a `known.1` list. */
function extractCantripsFromKnown(known: unknown): string[] {
  if (typeof known !== "object" || known === null) return [];
  const k = known as Raw;
  const level1 = k["1"];
  if (!Array.isArray(level1)) return [];
  return (level1 as unknown[])
    .filter((entry) => typeof entry === "string" && entry.includes("#c"))
    .map((entry) => extractSpellName(String(entry)));
}

/**
 * Build a map of legacy name → resistance from _versions metadata.
 * _versions items have names like "Tiefling; Abyssal Legacy" and carry their own `resist` array.
 */
function buildVersionResistanceMap(versions: unknown): Map<string, DamageType> {
  const map = new Map<string, DamageType>();
  if (!Array.isArray(versions)) return map;
  for (const v of versions) {
    if (typeof v !== "object" || v === null) continue;
    const ver = v as Raw;
    const fullName = String(ver.name ?? "");
    const resist = ver.resist;
    if (!Array.isArray(resist) || resist.length === 0) continue;
    const firstResist = String(resist[0]) as DamageType;
    // Match like "Tiefling; Abyssal Legacy" → key "abyssal"
    const semicolonPart = fullName.includes(";") ? fullName.split(";")[1] : fullName;
    const legacyName = semicolonPart.replace(/legacy/i, "").trim().toLowerCase();
    if (legacyName) map.set(legacyName, firstResist);
  }
  return map;
}

interface ParsedAdditionalSpells {
  namedSpellGroups: SpeciesNamedSpellGroup[];
  universalCantrips: string[];
  namedSpellGroupsLabel?: string;
}

/** "Gnome; Forest Gnome Lineage" → "Forest Gnome", "Tiefling; Abyssal Legacy" → "Abyssal". */
function parseVersionGroupDisplayName(fullName: string): string {
  const part = fullName.includes(";") ? fullName.split(";")[1]! : fullName;
  return part.replace(/\s+lineage\s*$/i, "").replace(/\s+legacy\s*$/i, "").trim();
}

function extractInnateSpellGrants(innate: unknown): SpeciesNamedSpellGroup["innateSpells"] {
  if (typeof innate !== "object" || innate === null) return [];
  const grants: NonNullable<SpeciesNamedSpellGroup["innateSpells"]> = [];

  for (const [charLevelKey, block] of Object.entries(innate as Raw)) {
    const charLevel = parseInt(charLevelKey, 10);
    if (isNaN(charLevel)) continue;
    const daily = (block as Raw)?.daily;
    if (typeof daily !== "object" || daily === null) continue;

    for (const [dailyKey, value] of Object.entries(daily as Raw)) {
      if (!Array.isArray(value)) continue;
      const unlockLevel = dailyKey === "pb" ? 1 : charLevel;
      for (const spell of value) {
        if (typeof spell !== "string") continue;
        grants.push({
          name: extractSpellName(spell),
          unlockedAtCharacterLevel: unlockLevel,
        });
      }
    }
  }

  return grants;
}

function mapAdditionalSpellEntryToGroup(
  entry: Raw,
  groupName: string,
  versionResistMap: Map<string, DamageType>,
  universalSet: Set<string>,
): SpeciesNamedSpellGroup {
  const allGroupCantrips = extractCantripsFromKnown(entry.known);
  const uniqueCantrips = allGroupCantrips.filter((c) => !universalSet.has(c));
  const resistance = versionResistMap.get(groupName.toLowerCase());
  return {
    name: groupName,
    cantrips: uniqueCantrips,
    resistance,
    innateSpells: extractInnateSpellGrants(entry.innate),
  };
}

function parseNamedSpellGroupLabelFromEntries(entries: unknown[]): string | undefined {
  if (!Array.isArray(entries)) return undefined;

  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Raw;
    if (e.type !== "entries" || typeof e.name !== "string") continue;
    const traitName = String(e.name);
    if (!/legacy|lineage/i.test(traitName)) continue;

    const childEntries = Array.isArray(e.entries) ? (e.entries as unknown[]) : [];
    const hasChoiceList = childEntries.some((child) => {
      if (typeof child !== "object" || child === null) return false;
      const c = child as Raw;
      if (c.type !== "list" || c.style !== "list-hang-notitle") return false;
      const items = c.items;
      return (
        Array.isArray(items) &&
        items.length >= 2 &&
        items.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as Raw).name === "string",
        )
      );
    });
    const hasLegaciesTable = childEntries.some((child) => {
      if (typeof child !== "object" || child === null) return false;
      const c = child as Raw;
      return c.type === "table" && /legac/i.test(String(c.caption ?? ""));
    });

    if (hasChoiceList || hasLegaciesTable) return traitName;
  }

  return undefined;
}

function parseLineageOptionTextsFromTraitEntries(
  entries: unknown[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (typeof node !== "object" || node === null) continue;
      const obj = node as Raw;

      if (
        obj.type === "entries" &&
        typeof obj.name === "string" &&
        /legacy|lineage/i.test(obj.name)
      ) {
        const childEntries = Array.isArray(obj.entries)
          ? (obj.entries as unknown[])
          : [];

        for (const child of childEntries) {
          if (typeof child !== "object" || child === null) continue;
          const c = child as Raw;

          if (
            c.type === "list" &&
            c.style === "list-hang-notitle" &&
            Array.isArray(c.items)
          ) {
            for (const item of c.items) {
              if (typeof item !== "object" || item === null) continue;
              const listItem = item as Raw;
              const name = String(listItem.name ?? "").trim();
              if (!name) continue;
              const { texts } = collectTraitContent(
                Array.isArray(listItem.entries)
                  ? (listItem.entries as unknown[])
                  : [],
              );
              if (texts.length) map.set(name, texts);
            }
          }

          if (
            c.type === "table" &&
            /legac/i.test(String(c.caption ?? "")) &&
            Array.isArray(c.rows)
          ) {
            for (const row of c.rows as unknown[][]) {
              if (!Array.isArray(row) || row.length < 2) continue;
              const name = String(row[0] ?? "").trim();
              if (!name) continue;
              const texts = row
                .slice(1)
                .filter(
                  (cell): cell is string =>
                    typeof cell === "string" && cell.trim().length > 0,
                )
                .map((cell) => parseFiveToolsMarkup(cell));
              if (texts.length) map.set(name, texts);
            }
          }
        }
      }

      if (Array.isArray(obj.entries)) walk(obj.entries as unknown[]);
    }
  };

  walk(entries);
  return map;
}

function parseLineageOptionTextsFromVersions(versions: unknown): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (!Array.isArray(versions)) return map;

  for (const version of versions) {
    if (typeof version !== "object" || version === null) continue;
    const ver = version as Raw;
    const groupName = parseVersionGroupDisplayName(String(ver.name ?? ""));
    if (!groupName) continue;

    const modEntries = (ver._mod as Raw | undefined)?.entries as Raw | undefined;
    const replacement = modEntries?.items as Raw | undefined;
    if (!replacement || !Array.isArray(replacement.entries)) continue;

    const { texts } = collectTraitContent(replacement.entries as unknown[]);
    if (texts.length) map.set(groupName, texts);
  }

  return map;
}

function lookupLineageText(
  map: Map<string, string[]>,
  groupName: string,
): string[] | undefined {
  const normalized = groupName.toLowerCase();
  for (const [key, texts] of map.entries()) {
    if (key.toLowerCase() === normalized) return texts;
  }
  return undefined;
}

function attachLineageDescriptions(
  groups: SpeciesNamedSpellGroup[],
  traitEntries: unknown[],
  versions: unknown,
): SpeciesNamedSpellGroup[] {
  const fromTraits = parseLineageOptionTextsFromTraitEntries(traitEntries);
  const fromVersions = parseLineageOptionTextsFromVersions(versions);

  return groups.map((group) => {
    const entries =
      lookupLineageText(fromVersions, group.name) ??
      lookupLineageText(fromTraits, group.name);
    return entries?.length ? { ...group, entries } : group;
  });
}

function parseNamedSpellGroupsFromVersions(versions: unknown): ParsedAdditionalSpells {
  if (!Array.isArray(versions)) {
    return { namedSpellGroups: [], universalCantrips: [] };
  }

  const versionResistMap = buildVersionResistanceMap(versions);
  const draftGroups: SpeciesNamedSpellGroup[] = [];

  for (const version of versions) {
    if (typeof version !== "object" || version === null) continue;
    const ver = version as Raw;
    const additionalSpells = ver.additionalSpells;
    if (!Array.isArray(additionalSpells) || additionalSpells.length === 0) continue;

    const entry = additionalSpells[0] as Raw;
    const groupName = parseVersionGroupDisplayName(String(ver.name ?? ""));
    if (!groupName) continue;

    draftGroups.push(
      mapAdditionalSpellEntryToGroup(entry, groupName, versionResistMap, new Set()),
    );
  }

  if (draftGroups.length < 2) {
    return { namedSpellGroups: [], universalCantrips: [] };
  }

  const cantripSets = draftGroups.map((group) => new Set(group.cantrips));
  const universalCantrips = draftGroups[0]!.cantrips.filter((cantrip) =>
    cantripSets.every((set) => set.has(cantrip)),
  );
  const universalSet = new Set(universalCantrips);
  const namedSpellGroups = draftGroups.map((group) => ({
    ...group,
    cantrips: group.cantrips.filter((cantrip) => !universalSet.has(cantrip)),
  }));

  return { namedSpellGroups, universalCantrips };
}

function parseNamedGroupsFromAdditionalSpells(
  additionalSpells: unknown,
  versions: unknown,
): ParsedAdditionalSpells {
  if (!Array.isArray(additionalSpells) || additionalSpells.length === 0) {
    return { namedSpellGroups: [], universalCantrips: [] };
  }

  const versionResistMap = buildVersionResistanceMap(versions);

  const namedEntries = (additionalSpells as Raw[]).filter(
    (entry) => typeof entry === "object" && entry !== null && typeof entry.name === "string",
  );

  if (namedEntries.length < 2) {
    const single = additionalSpells[0] as Raw;
    return {
      namedSpellGroups: [],
      universalCantrips: extractCantripsFromKnown(single?.known),
    };
  }

  const cantripSets = namedEntries.map((entry) =>
    new Set(extractCantripsFromKnown(entry.known)),
  );
  const allCantrips = [...cantripSets[0]!];
  const universalCantrips = allCantrips.filter((c) =>
    cantripSets.every((set) => set.has(c)),
  );
  const universalSet = new Set(universalCantrips);

  const namedSpellGroups = namedEntries.map((entry) =>
    mapAdditionalSpellEntryToGroup(
      entry,
      String(entry.name),
      versionResistMap,
      universalSet,
    ),
  );

  return { namedSpellGroups, universalCantrips };
}

function parseAdditionalSpells(
  additionalSpells: unknown,
  versions: unknown,
  traitEntries?: unknown[],
): ParsedAdditionalSpells {
  const traitEntryList = traitEntries ?? [];
  const namedSpellGroupsLabel = parseNamedSpellGroupLabelFromEntries(traitEntryList);
  const fromBase = parseNamedGroupsFromAdditionalSpells(additionalSpells, versions);

  if (fromBase.namedSpellGroups.length >= 2) {
    return {
      ...fromBase,
      namedSpellGroups: attachLineageDescriptions(
        fromBase.namedSpellGroups,
        traitEntryList,
        versions,
      ),
      namedSpellGroupsLabel,
    };
  }

  const fromVersions = parseNamedSpellGroupsFromVersions(versions);
  if (fromVersions.namedSpellGroups.length >= 2) {
    return {
      ...fromVersions,
      namedSpellGroups: attachLineageDescriptions(
        fromVersions.namedSpellGroups,
        traitEntryList,
        versions,
      ),
      namedSpellGroupsLabel,
    };
  }

  return { ...fromBase, namedSpellGroupsLabel };
}

function mapFluff(fluff: unknown): string {
  if (typeof fluff !== "object" || fluff === null) return "";
  const f = fluff as Raw;
  if (!Array.isArray(f.entries)) return "";
  return f.entries
    .map((e: unknown) => {
      if (typeof e === "string") return parseFiveToolsMarkup(e);
      if (typeof e === "object" && e !== null) {
        const obj = e as Raw;
        if (Array.isArray(obj.entries)) {
          return obj.entries
            .filter((t: unknown) => typeof t === "string")
            .map((t: string) => parseFiveToolsMarkup(t))
            .join(" ");
        }
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDndRace(raw: any): DndRace {
  const abilityBonuses = mapAbilityBonuses(raw.ability);
  const { fixed: resistances, summary: resistanceSummary } = mapResistances(raw.resist);
  const traits = mapTraits(raw.entries);
  const raceSource = { type: "species" as const, name: String(raw.name ?? "Unknown") };
  const skillGrants = parseSkillProficiencyBlocks(
    Array.isArray(raw.skillProficiencies) ? raw.skillProficiencies : [],
    raceSource,
  );
  const skillAdvantages = parseSkillAdvantagesFromTraits(traits, raceSource);
  const languageGrants = mergeLanguageGrants(
    parseNamedProficiencyBlocks(
      Array.isArray(raw.languageProficiencies) ? raw.languageProficiencies : [],
      raceSource,
    ),
    parseLanguageGrantsFromTraits(traits, raceSource),
  );
  const defenseGrants = [
    ...parseDefenseBlocks(
      Array.isArray(raw.resist) ? raw.resist : [],
      "resistance",
      raceSource,
    ),
    ...parseDefenseBlocks(
      Array.isArray(raw.immune) ? raw.immune : [],
      "immunity",
      raceSource,
    ),
  ];

  const { namedSpellGroups, universalCantrips, namedSpellGroupsLabel } =
    parseAdditionalSpells(raw.additionalSpells, raw._versions, raw.entries);

  return {
    id: raceId(raw),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "PHB"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    kind: inferKind(raw),
    parentName: raw.raceName ? String(raw.raceName) : undefined,
    parentSource: raw.raceSource ? String(raw.raceSource) : undefined,
    sizes: mapSizes(raw.size),
    speed: formatSpeed(raw.speed),
    abilityBonuses,
    abilitySummary: formatAbilitySummary(abilityBonuses),
    darkvision: typeof raw.darkvision === "number" ? raw.darkvision : undefined,
    resistances,
    resistanceSummary,
    traitTags: Array.isArray(raw.traitTags) ? raw.traitTags.map(String) : [],
    traits,
    fluff: mapFluff(raw.fluff),
    skillGrants,
    skillAdvantages,
    originFeatGrant: parseOriginFeatGrant(raw.feats),
    languageGrants,
    defenseGrants,
    namedSpellGroups: namedSpellGroups.length > 0 ? namedSpellGroups : undefined,
    namedSpellGroupsLabel,
    universalCantrips: universalCantrips.length > 0 ? universalCantrips : undefined,
  };
}
