import type {
  AbilityScores,
  ArmorClass,
  Entry,
  HP,
  Monster,
  Senses,
  Speed,
} from "@/shared/types";
import { SIZE_MAP, getAbilityModifier, getProficiencyBonus } from "@/shared/utils/cr.utils";
import {
  mapStatBlockEntries,
  statBlockContentToPlainText,
} from "@/shared/utils/statblock-entries.mapper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawActor = Record<string, any>;

export function mapEntries(entries: unknown[]): Entry[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((e): e is RawActor => typeof e === "object" && e !== null && "name" in e)
    .map((e) => {
      const content = Array.isArray(e.entries)
        ? mapStatBlockEntries(e.entries as unknown[])
        : [];
      return {
        name: String(e.name ?? ""),
        entries: content.map(statBlockContentToPlainText).filter(Boolean),
        content: content.length > 0 ? content : undefined,
      };
    });
}

export function mapArmorClass(ac: unknown): ArmorClass[] {
  if (!Array.isArray(ac)) return [];
  return ac.map((a: RawActor) => {
    if (typeof a === "number") return { ac: a };
    return {
      ac: Number(a.ac ?? 0),
      from: Array.isArray(a.from) ? a.from : undefined,
    };
  });
}

export function mapSpeed(speed: unknown): Speed {
  if (typeof speed !== "object" || speed === null) return { walk: 30 };
  const s = speed as RawActor;
  return {
    walk: typeof s.walk === "number" ? s.walk : undefined,
    swim: typeof s.swim === "number" ? s.swim : undefined,
    fly: typeof s.fly === "number" ? s.fly : undefined,
    burrow: typeof s.burrow === "number" ? s.burrow : undefined,
    climb: typeof s.climb === "number" ? s.climb : undefined,
    hover: s.canHover === true,
  };
}

export function mapHP(hp: unknown): HP {
  if (typeof hp !== "object" || hp === null) return {};
  const h = hp as RawActor;
  return {
    formula: typeof h.formula === "string" ? h.formula : undefined,
    average: typeof h.average === "number" ? h.average : undefined,
  };
}

export function mapSenses(raw: RawActor): Senses {
  const senses = raw.senses;
  const result: Senses = {};
  if (!senses) return result;

  const parseValue = (val: unknown): number | undefined => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const match = val.match(/(\d+)/);
      return match ? parseInt(match[1]) : undefined;
    }
    return undefined;
  };

  if (Array.isArray(senses)) {
    for (const s of senses) {
      const str = String(s).toLowerCase();
      if (str.includes("darkvision")) result.darkvision = parseValue(str.match(/(\d+)/)?.[0]);
      if (str.includes("blindsight")) result.blindsight = parseValue(str.match(/(\d+)/)?.[0]);
      if (str.includes("tremorsense")) result.tremorsense = parseValue(str.match(/(\d+)/)?.[0]);
      if (str.includes("truesight")) result.truesight = parseValue(str.match(/(\d+)/)?.[0]);
    }
  } else if (typeof senses === "object") {
    const s = senses as RawActor;
    if (s.darkvision) result.darkvision = parseValue(s.darkvision);
    if (s.blindsight) result.blindsight = parseValue(s.blindsight);
    if (s.tremorsense) result.tremorsense = parseValue(s.tremorsense);
    if (s.truesight) result.truesight = parseValue(s.truesight);
    if (s.special) result.special = String(s.special);
  }

  return result;
}

export function mapPassivePerception(raw: RawActor, abilities: AbilityScores): number {
  if (typeof raw.passive === "number") return raw.passive;

  const wisMod = getAbilityModifier(abilities.wis);
  const skills = raw.skill ?? {};
  const percBonus = skills.perception ? parseInt(String(skills.perception)) : 0;
  return 10 + wisMod + (percBonus > wisMod ? percBonus - wisMod : 0);
}

export function mapCrString(raw: RawActor): string {
  if (typeof raw.cr === "object" && raw.cr !== null) {
    return String(raw.cr.cr ?? "0");
  }
  return String(raw.cr ?? "0");
}

export function mapCrDisplay(raw: RawActor): string {
  if (typeof raw.cr === "object" && raw.cr !== null) {
    const parts: string[] = [];
    if (raw.cr.cr != null) parts.push(String(raw.cr.cr));
    if (raw.cr.lair) parts.push(`${raw.cr.lair} (lair)`);
    if (raw.cr.coven) parts.push(`${raw.cr.coven} (coven)`);
    return parts.join(" / ") || "0";
  }
  return String(raw.cr ?? "0");
}

export function mapSize(raw: RawActor): string {
  const size = Array.isArray(raw.size) ? raw.size[0] : raw.size;
  return SIZE_MAP[size as string] ?? String(size ?? "Medium");
}

export function mapActorCore(raw: RawActor): Omit<Monster, "group" | "source" | "page" | "cr" | "environment" | "legendaryActions" | "loot" | "fluff"> {
  const abilities: AbilityScores = {
    str: raw.str ?? 10,
    dex: raw.dex ?? 10,
    con: raw.con ?? 10,
    int: raw.int ?? 10,
    wis: raw.wis ?? 10,
    cha: raw.cha ?? 10,
  };

  const cr = mapCrString(raw);

  return {
    name: String(raw.name ?? "Unknown"),
    shortName: raw.shortName ? String(raw.shortName) : undefined,
    size: mapSize(raw),
    type: {
      type: typeof raw.type === "string"
        ? raw.type
        : String(raw.type?.type ?? "unknown"),
      tags: Array.isArray(raw.type?.tags) ? raw.type.tags : [],
    },
    alignment: Array.isArray(raw.alignment) ? raw.alignment.map(String) : ["U"],
    armorClass: mapArmorClass(raw.ac),
    hp: mapHP(raw.hp),
    speed: mapSpeed(raw.speed),
    initiative: getAbilityModifier(abilities.dex),
    proficiencyBonus: getProficiencyBonus(cr),
    abilities,
    savingThrows: raw.save ? raw.save : {},
    skills: raw.skill ? raw.skill : {},
    passivePerception: mapPassivePerception(raw, abilities),
    senses: mapSenses(raw),
    damageImmunities: raw.immune ?? [],
    damageResistances: raw.resist ?? [],
    damageVulnerabilities: raw.vulnerable ?? [],
    conditionImmunities: Array.isArray(raw.conditionImmune)
      ? raw.conditionImmune.map((c: unknown) =>
          typeof c === "string" ? c : String((c as RawActor).conditionImmune ?? c),
        )
      : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    traits: mapEntries(raw.trait ?? []),
    actions: mapEntries(raw.action ?? []),
    reactions: mapEntries(raw.reaction ?? []),
  };
}
