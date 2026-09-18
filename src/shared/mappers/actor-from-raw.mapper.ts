import type {
  AbilityScores,
  ArmorClass,
  Entry,
  HP,
  Monster,
  Senses,
  Speed,
} from "@/shared/types";
import { SIZE_MAP, getAbilityModifier, getBaseCr, formatCrDisplay, getProficiencyBonus } from "@/shared/utils/cr.utils";
import {
  mapStatBlockEntries,
  statBlockContentToPlainText,
} from "@/shared/utils/statblock-entries.mapper";
import {
  baseNamesFromNamedEntries,
  sanitizeNamedEntrySection,
} from "@/shared/utils/statblock-named-entries.sanitize";

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
  return ac.map((a: RawActor | number) => {
    if (typeof a === "number") return { ac: a };
    if (typeof a === "object" && a !== null) {
      const special =
        typeof a.special === "string" && a.special.trim()
          ? a.special.trim()
          : undefined;
      return {
        ac: typeof a.ac === "number" ? a.ac : special ? 0 : Number(a.ac ?? 0),
        from: Array.isArray(a.from) ? a.from.map(String) : undefined,
        special,
      };
    }
    return { ac: 0 };
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
  const special =
    typeof h.special === "string" && h.special.trim()
      ? h.special.trim()
      : undefined;
  return {
    formula: typeof h.formula === "string" ? h.formula : undefined,
    average: typeof h.average === "number" ? h.average : undefined,
    special,
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
  return getBaseCr(raw.cr);
}

export function mapCrDisplay(raw: RawActor): string {
  return formatCrDisplay(raw.cr);
}

export function mapSize(raw: RawActor): string {
  const size = Array.isArray(raw.size) ? raw.size[0] : raw.size;
  return SIZE_MAP[size as string] ?? String(size ?? "Medium");
}

/** Flatten messy 5etools `type` values (string, object, choose, tags-as-objects). */
export function mapCreatureType(raw: RawActor): { type: string; tags?: string[] } {
  const rawType = raw.type;

  if (typeof rawType === "string") {
    return { type: rawType };
  }

  if (Array.isArray(rawType)) {
    const parts = rawType
      .map((part) => formatTypePiece(part))
      .filter(Boolean);
    return { type: parts.join(" or ") || "unknown" };
  }

  if (typeof rawType === "object" && rawType !== null) {
    const t = rawType as RawActor;
    const typeLabel = formatTypePiece(t.type ?? t.choose ?? t);
    const tags = flattenTypeTags(t.tags);
    return {
      type: typeLabel || "unknown",
      tags: tags.length > 0 ? tags : undefined,
    };
  }

  return { type: "unknown" };
}

function formatTypePiece(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(formatTypePiece).filter(Boolean).join(" or ");
  }
  if (typeof value === "object") {
    const obj = value as RawActor;
    if (typeof obj.type === "string") return obj.type;
    if (Array.isArray(obj.from)) {
      return obj.from.map(formatTypePiece).filter(Boolean).join(" or ");
    }
    if (obj.choose != null) return formatTypePiece(obj.choose);
    if (typeof obj.special === "string") return obj.special;
  }
  return "";
}

function flattenTypeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => {
      if (typeof tag === "string") return tag;
      if (typeof tag === "object" && tag !== null) {
        const obj = tag as RawActor;
        if (typeof obj.tag === "string") return obj.tag;
        if (typeof obj.prefix === "string" && typeof obj.tag === "string") {
          return `${obj.prefix} ${obj.tag}`;
        }
        if (typeof obj.special === "string") return obj.special;
      }
      return "";
    })
    .filter(Boolean);
}

function mapConditionImmunities(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => {
      if (typeof c === "string") return c;
      if (typeof c === "object" && c !== null) {
        const obj = c as RawActor;
        if (typeof obj.conditionImmune === "string") return obj.conditionImmune;
        if (Array.isArray(obj.conditionImmune)) {
          return obj.conditionImmune.map(String).join(", ");
        }
        if (typeof obj.special === "string") return obj.special;
      }
      return "";
    })
    .filter(Boolean);
}

function mapLanguages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((lang) => {
      if (typeof lang === "string") return lang;
      if (typeof lang === "object" && lang !== null) {
        const obj = lang as RawActor;
        if (typeof obj.special === "string") return obj.special;
        if (typeof obj.language === "string") return obj.language;
      }
      return "";
    })
    .filter(Boolean);
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
  const sanitizedActions = sanitizeNamedEntrySection(raw.action ?? []);
  const sanitizedTraits = sanitizeNamedEntrySection(
    raw.trait ?? [],
    baseNamesFromNamedEntries(sanitizedActions),
  );
  const pbNote =
    typeof raw.pbNote === "string" && raw.pbNote.trim()
      ? raw.pbNote.trim()
      : undefined;

  return {
    name: String(raw.name ?? "Unknown"),
    shortName: raw.shortName ? String(raw.shortName) : undefined,
    size: mapSize(raw),
    type: mapCreatureType(raw),
    alignment: Array.isArray(raw.alignment) ? raw.alignment.map(String) : ["U"],
    armorClass: mapArmorClass(raw.ac),
    hp: mapHP(raw.hp),
    speed: mapSpeed(raw.speed),
    initiative: getAbilityModifier(abilities.dex),
    proficiencyBonus: getProficiencyBonus(cr),
    pbNote,
    abilities,
    savingThrows: raw.save ? raw.save : {},
    skills: raw.skill ? raw.skill : {},
    passivePerception: mapPassivePerception(raw, abilities),
    senses: mapSenses(raw),
    damageImmunities: raw.immune ?? [],
    damageResistances: raw.resist ?? [],
    damageVulnerabilities: raw.vulnerable ?? [],
    conditionImmunities: mapConditionImmunities(raw.conditionImmune),
    languages: mapLanguages(raw.languages),
    traits: mapEntries(sanitizedTraits),
    actions: mapEntries(sanitizedActions),
    reactions: mapEntries(sanitizeNamedEntrySection(raw.reaction ?? [])),
  };
}
