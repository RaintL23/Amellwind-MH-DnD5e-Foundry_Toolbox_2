import {
  mapActorCore,
  mapCrDisplay,
  mapCrString,
  mapEntries,
  type RawActor,
} from "@/shared/mappers/actor-from-raw.mapper";
import type { BestiaryCreature, SpellcastingBlock } from "@/shared/types/bestiary-creature.types";
import { parseEntries, parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { toCreatureHash } from "../utils/bestiary-hash.utils";
import type { RawMonster } from "../utils/bestiary-raw.types";

function mapSpellcasting(raw: unknown[]): SpellcastingBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is RawActor => typeof s === "object" && s !== null)
    .map((s) => ({
      name: String(s.name ?? "Spellcasting"),
      header: Array.isArray(s.headerEntries)
        ? s.headerEntries.map((e: unknown) =>
            typeof e === "string" ? parseFiveToolsMarkup(e) : parseEntries([e]),
          )
        : [],
      footer: Array.isArray(s.footerEntries)
        ? s.footerEntries.map((e: unknown) =>
            typeof e === "string" ? parseFiveToolsMarkup(e) : parseEntries([e]),
          )
        : [],
    }));
}

export function mapBestiaryCreature(raw: RawMonster): BestiaryCreature {
  const actor = mapActorCore(raw as RawActor);
  const cr = mapCrString(raw as RawActor);
  const name = String(raw.name ?? "Unknown");
  const source = String(raw.source ?? "");

  return {
    ...actor,
    id: toCreatureHash(name, source),
    source,
    page: typeof raw.page === "number" ? raw.page : undefined,
    cr,
    crDisplay: mapCrDisplay(raw as RawActor),
    environment: Array.isArray(raw.environment) ? raw.environment : undefined,
    group: Array.isArray(raw.group) ? raw.group : undefined,
    legendaryActions: mapEntries(raw.legendary ?? []),
    bonusActions: mapEntries(raw.bonus ?? []),
    mythicActions: mapEntries(raw.mythic ?? []),
    spellcasting: mapSpellcasting(raw.spellcasting ?? []),
    legendaryGroupRef:
      raw.legendaryGroup?.name && raw.legendaryGroup?.source
        ? { name: raw.legendaryGroup.name, source: raw.legendaryGroup.source }
        : undefined,
    hasToken: raw.hasToken === true,
  };
}
