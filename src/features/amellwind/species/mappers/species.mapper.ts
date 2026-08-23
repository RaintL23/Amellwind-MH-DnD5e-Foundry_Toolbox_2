import {
  Species,
  SpeciesCategory,
  SpeciesSize,
} from "@/shared/types";
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
import { mapFluffEntriesToText } from "@/shared/utils/fluff.utils";
import {
  formatAbilitySummary,
  formatSpeed,
  mapAbilityBonuses,
  mapResistances,
  mapSizes,
  mapTraits,
} from "@/shared/mappers/species-race-core.mapper";
import { parseRaceAdditionalSpells } from "@/features/dnd/races/mappers/dnd-race.mapper";

export { formatAbilitySummary };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const STANDARD_ANCESTRIES = new Set(["Lynian", "Troverian", "Wyverian"]);

function speciesId(raw: Raw): string {
  const parent = raw.raceName ? `::${raw.raceName}` : "";
  return `${raw.name}::${raw.source}${parent}`;
}

function inferCategory(raw: Raw): SpeciesCategory {
  if (raw.raceName) {
    const name = String(raw.name ?? "");
    if (/variant|lineage/i.test(name)) return "lineage";
    if (String(raw.raceName) === "Dragonborn") return "elder-dragon";
    return "subrace";
  }
  const name = String(raw.name ?? "");
  if (STANDARD_ANCESTRIES.has(name)) return "ancestry";
  if (/folk$/i.test(name)) return "folk";
  return "elder-dragon";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSpecies(raw: any): Species {
  const abilityBonuses = mapAbilityBonuses(raw.ability);
  const category = inferCategory(raw);
  const { fixed: resistances, summary: resistanceSummary } = mapResistances(
    raw.resist,
    { choosePrefix: "choose:" },
  );
  const traits = mapTraits(raw.entries);
  const speciesSource = {
    type: "species" as const,
    name: String(raw.name ?? "Unknown"),
  };
  const skillGrants = parseSkillProficiencyBlocks(
    Array.isArray(raw.skillProficiencies) ? raw.skillProficiencies : [],
    speciesSource,
  );
  const skillAdvantages = parseSkillAdvantagesFromTraits(traits, speciesSource);
  const languageGrants = mergeLanguageGrants(
    parseNamedProficiencyBlocks(
      Array.isArray(raw.languageProficiencies) ? raw.languageProficiencies : [],
      speciesSource,
    ),
    parseLanguageGrantsFromTraits(traits, speciesSource),
  );
  const defenseGrants = [
    ...parseDefenseBlocks(
      Array.isArray(raw.resist) ? raw.resist : [],
      "resistance",
      speciesSource,
    ),
    ...parseDefenseBlocks(
      Array.isArray(raw.immune) ? raw.immune : [],
      "immunity",
      speciesSource,
    ),
  ];
  const weaponProficiencyGrants = parseNamedProficiencyBlocks(
    Array.isArray(raw.weaponProficiencies) ? raw.weaponProficiencies : [],
    speciesSource,
  );
  const toolProficiencyGrants = parseNamedProficiencyBlocks(
    Array.isArray(raw.toolProficiencies) ? raw.toolProficiencies : [],
    speciesSource,
  );
  const { namedSpellGroups, universalCantrips } = parseRaceAdditionalSpells(
    raw.additionalSpells,
    raw._versions,
    raw.entries,
  );

  return {
    id: speciesId(raw),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "AGMH"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    category,
    isSubrace: Boolean(raw.raceName),
    parentSpecies: raw.raceName ? String(raw.raceName) : undefined,
    parentSource: raw.raceSource ? String(raw.raceSource) : undefined,
    sizes: mapSizes<SpeciesSize>(raw.size),
    speed: formatSpeed(raw.speed, { prefixWalk: true }),
    abilityBonuses,
    abilitySummary: formatAbilitySummary(abilityBonuses),
    darkvision: typeof raw.darkvision === "number" ? raw.darkvision : undefined,
    resistances,
    resistanceSummary,
    traitTags: Array.isArray(raw.traitTags) ? raw.traitTags.map(String) : [],
    traits,
    fluff: mapFluffEntriesToText(raw.fluff, { nested: true }),
    skillGrants,
    skillAdvantages,
    originFeatGrant: parseOriginFeatGrant(raw.feats),
    languageGrants,
    defenseGrants,
    weaponProficiencyGrants:
      weaponProficiencyGrants.length > 0 ? weaponProficiencyGrants : undefined,
    toolProficiencyGrants:
      toolProficiencyGrants.length > 0 ? toolProficiencyGrants : undefined,
    namedSpellGroups:
      namedSpellGroups.length > 0 ? namedSpellGroups : undefined,
    universalCantrips:
      universalCantrips.length > 0 ? universalCantrips : undefined,
  };
}
