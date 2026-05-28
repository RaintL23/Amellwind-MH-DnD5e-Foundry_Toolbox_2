import { Monster, ArmorClass, Speed, HP, Senses, Entry } from "@/shared/types";
import { SIZE_MAP, getProficiencyBonus, getAbilityModifier } from "@/shared/utils/cr.utils";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function mapEntries(entries: unknown[]): Entry[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((e): e is Raw => typeof e === "object" && e !== null && "name" in e)
    .map((e) => ({
      name: String(e.name ?? ""),
      entries: Array.isArray(e.entries)
        ? e.entries.map((t: unknown) =>
            typeof t === "string" ? parseFiveToolsMarkup(t) : ""
          )
        : [],
    }));
}

function mapArmorClass(ac: unknown): ArmorClass[] {
  if (!Array.isArray(ac)) return [];
  return ac.map((a: Raw) => {
    if (typeof a === "number") return { ac: a };
    return {
      ac: Number(a.ac ?? 0),
      from: Array.isArray(a.from) ? a.from : undefined,
    };
  });
}

function mapSpeed(speed: unknown): Speed {
  if (typeof speed !== "object" || speed === null) return { walk: 30 };
  const s = speed as Raw;
  return {
    walk: typeof s.walk === "number" ? s.walk : undefined,
    swim: typeof s.swim === "number" ? s.swim : undefined,
    fly: typeof s.fly === "number" ? s.fly : undefined,
    burrow: typeof s.burrow === "number" ? s.burrow : undefined,
    climb: typeof s.climb === "number" ? s.climb : undefined,
    hover: s.canHover === true,
  };
}

function mapHP(hp: unknown): HP {
  if (typeof hp !== "object" || hp === null) return {};
  const h = hp as Raw;
  return {
    formula: typeof h.formula === "string" ? h.formula : undefined,
    average: typeof h.average === "number" ? h.average : undefined,
  };
}

function mapSenses(raw: Raw): Senses {
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
    // Formato: ["darkvision 60 ft.", "tremorsense 30 ft."]
    for (const s of senses) {
      const str = String(s).toLowerCase();
      if (str.includes("darkvision")) result.darkvision = parseValue(str.match(/(\d+)/)?.[0]);
      if (str.includes("blindsight")) result.blindsight = parseValue(str.match(/(\d+)/)?.[0]);
      if (str.includes("tremorsense")) result.tremorsense = parseValue(str.match(/(\d+)/)?.[0]);
      if (str.includes("truesight")) result.truesight = parseValue(str.match(/(\d+)/)?.[0]);
    }
  } else if (typeof senses === "object") {
    const s = senses as Raw;
    if (s.darkvision) result.darkvision = parseValue(s.darkvision);
    if (s.blindsight) result.blindsight = parseValue(s.blindsight);
    if (s.tremorsense) result.tremorsense = parseValue(s.tremorsense);
    if (s.truesight) result.truesight = parseValue(s.truesight);
    if (s.special) result.special = String(s.special);
  }

  return result;
}

function mapPassivePerception(raw: Raw, abilities: Monster["abilities"]): number {
  // passive_perception puede ser un número directo en el JSON
  if (typeof raw.passive === "number") return raw.passive;

  const wisMod = getAbilityModifier(abilities.wis);
  const skills = raw.skill ?? {};
  const percBonus = skills.perception ? parseInt(String(skills.perception)) : 0;
  return 10 + wisMod + (percBonus > wisMod ? percBonus - wisMod : 0);
}

function mapFluffText(fluff: unknown): string {
  if (typeof fluff !== "object" || fluff === null) return "";
  const f = fluff as Raw;
  if (!Array.isArray(f.entries)) return "";
  return f.entries
    .filter((e: unknown) => typeof e === "string")
    .join(" ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMonster(raw: any): Monster {
  //console.log("raw", raw);
  const abilities = {
    str: raw.str ?? 10,
    dex: raw.dex ?? 10,
    con: raw.con ?? 10,
    int: raw.int ?? 10,
    wis: raw.wis ?? 10,
    cha: raw.cha ?? 10,
  };

  const cr = typeof raw.cr === "object" ? String(raw.cr.cr ?? "0") : String(raw.cr ?? "0");

  return {
    name: String(raw.name ?? "Unknown"),
    shortName: raw.shortName ? String(raw.shortName) : undefined,
    size: SIZE_MAP[raw.size] ?? raw.size ?? "Medium",
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
          typeof c === "string" ? c : String((c as Raw).conditionImmune ?? c)
        )
      : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    traits: mapEntries(raw.trait ?? []),
    actions: mapEntries(raw.action ?? []),
    reactions: mapEntries(raw.reaction ?? []),
    // Monster-specific
    group: Array.isArray(raw.group) ? raw.group : undefined,
    source: String(raw.source ?? ""),
    page: typeof raw.page === "number" ? raw.page : undefined,
    cr,
    environment: Array.isArray(raw.environment) ? raw.environment : undefined,
    legendaryActions: mapEntries(raw.legendary ?? []),
    loot: raw.fluff ? { rolls: extractRolls(raw.fluff) } : undefined,
    fluff: mapFluffText(raw.fluff),
  };
}

function extractRolls(fluff: unknown): number {
  if (typeof fluff !== "object" || fluff === null) return 0;
  const f = fluff as Raw;
  if (!Array.isArray(f.entries)) return 0;
  const inset = f.entries.find((e: unknown) =>
    typeof e === "object" && e !== null && (e as Raw).type === "inset"
  );
  if (!inset) return 0;
  const ins = inset as Raw;
  const tables = (ins.entries ?? []).filter((e: Raw) => e.type === "table");
  const header = tables.find((t: Raw) => !t.colLabels);
  return parseInt(String(header?.rows?.[0]?.[3] ?? 0)) || 0;
}
