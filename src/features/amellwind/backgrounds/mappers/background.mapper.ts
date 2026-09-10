import {
  Background,
  BackgroundFaction,
} from "@/shared/types";
import { parseSkillProficiencyBlocks } from "@/shared/utils/skill-proficiency.parser";
import { parseNamedProficiencyBlocks } from "@/shared/utils/named-proficiency.parser";
import { AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT } from "../constants/origin-feat.constants";
import { mapFluffEntriesToText } from "@/shared/utils/fluff.utils";
import {
  mapListProficiencies,
  mapProficiencyBlock,
  splitEntries,
} from "@/shared/mappers/background-entries.mapper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function backgroundId(raw: Raw): string {
  return `${raw.name}::${raw.source}`;
}

function inferFaction(name: string, rawFaction?: unknown): BackgroundFaction {
  if (typeof rawFaction === "string") {
    const allowed: BackgroundFaction[] = [
      "helix-commission",
      "hunters-guild",
      "royal-scrivener",
      "talon-society",
      "wycademy",
      "handlers-guild",
    ];
    if (allowed.includes(rawFaction as BackgroundFaction)) {
      return rawFaction as BackgroundFaction;
    }
  }
  const n = name.toLowerCase();
  if (n.includes("helix")) return "helix-commission";
  if (n.includes("wycademy")) return "wycademy";
  if (n.includes("scrivener")) return "royal-scrivener";
  if (n.includes("poacher") || n.includes("infiltrator") || n.includes("talon")) {
    return "talon-society";
  }
  if (n.includes("handler")) return "hunters-guild";
  return "hunters-guild";
}

function mapSkillSummary(raw: Raw): string {
  const blocks = Array.isArray(raw.skillProficiencies)
    ? (raw.skillProficiencies as Raw[])
    : [];
  const parts = blocks.flatMap((block) => mapProficiencyBlock(block));
  return parts.length ? parts.join("; ") : "—";
}

function mapToolSummary(raw: Raw): string {
  const blocks = Array.isArray(raw.toolProficiencies)
    ? (raw.toolProficiencies as Raw[])
    : [];
  const parts = blocks.flatMap((block) => mapProficiencyBlock(block));
  return parts.length ? parts.join("; ") : "—";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBackground(raw: any): Background {
  const { listEntries, features, suggested } = splitEntries(raw);
  const listProf = mapListProficiencies(listEntries);

  const bgSource = { type: "background" as const, name: String(raw.name ?? "Unknown") };
  const skillGrants = parseSkillProficiencyBlocks(
    Array.isArray(raw.skillProficiencies) ? raw.skillProficiencies : [],
    bgSource,
  );
  const toolGrants = parseNamedProficiencyBlocks(
    Array.isArray(raw.toolProficiencies) ? raw.toolProficiencies : [],
    bgSource,
  );
  const languageGrants = parseNamedProficiencyBlocks(
    Array.isArray(raw.languageProficiencies) ? raw.languageProficiencies : [],
    bgSource,
  );

  return {
    id: backgroundId(raw),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "AGMH"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    faction: inferFaction(String(raw.name ?? ""), raw._faction),
    fluff: mapFluffEntriesToText(raw.fluff),
    proficiencies: {
      skills: listProf.skills !== "—" ? listProf.skills : mapSkillSummary(raw),
      tools: listProf.tools !== "—" ? listProf.tools : mapToolSummary(raw),
      languages: listProf.languages,
      equipment: listProf.equipment,
    },
    features,
    suggestedCharacteristics: suggested,
    skillGrants,
    toolGrants,
    languageGrants,
    originFeatGrant: AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT,
  };
}
