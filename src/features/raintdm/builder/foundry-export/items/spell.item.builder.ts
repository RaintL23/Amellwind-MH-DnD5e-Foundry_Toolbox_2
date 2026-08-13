import type { FoundryItem } from "@/shared/foundry";
import {
  foundryId,
  wrapItem,
  defaultMidiProperties,
  resolveSpellIcon,
  mapDamageType,
  slugify,
} from "@/shared/foundry";
import { sourceBlock, htmlDesc } from "./item-shared";

// ─── Spell items ─────────────────────────────────────────────────────────────

const SPELL_SCHOOL_MAP: Record<string, string> = {
  A: "abj",
  C: "con",
  D: "div",
  E: "enc",
  I: "evo",
  N: "nec",
  T: "trs",
  V: "ill",
  abjuration: "abj",
  conjuration: "con",
  divination: "div",
  enchantment: "enc",
  evocation: "evo",
  necromancy: "nec",
  transmutation: "trs",
  illusion: "ill",
};

const SAVE_ABILITY_MAP: Record<string, string> = {
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha",
  str: "str",
  dex: "dex",
  con: "con",
  int: "int",
  wis: "wis",
  cha: "cha",
};

function mapSpellSchool(school: string | undefined): string {
  if (!school) return "";
  return SPELL_SCHOOL_MAP[school] ?? SPELL_SCHOOL_MAP[school.toLowerCase()] ?? "";
}

function parseActivation(castingTime: string | undefined): {
  type: string;
  value: number | null;
} {
  const raw = (castingTime ?? "").toLowerCase();
  if (raw.includes("bonus")) return { type: "bonus", value: 1 };
  if (raw.includes("reaction")) return { type: "reaction", value: 1 };
  if (raw.includes("minute")) {
    const n = Number(raw.match(/(\d+)/)?.[1] ?? 1);
    return { type: "minute", value: n };
  }
  if (raw.includes("hour")) {
    const n = Number(raw.match(/(\d+)/)?.[1] ?? 1);
    return { type: "hour", value: n };
  }
  if (raw.includes("action") || !raw) return { type: "action", value: 1 };
  return { type: "special", value: null };
}

function parseSpellDuration(duration: string | undefined): {
  value: string;
  units: string;
  concentration: boolean;
} {
  const raw = (duration ?? "").trim();
  const concentration = /concentration/i.test(raw);
  const instant = /instant/i.test(raw) || !raw;
  if (instant) return { value: "", units: "inst", concentration };
  const round = raw.match(/(\d+)\s*round/i);
  if (round) return { value: round[1], units: "round", concentration };
  const minute = raw.match(/(\d+)\s*minute/i);
  if (minute) return { value: minute[1], units: "minute", concentration };
  const hour = raw.match(/(\d+)\s*hour/i);
  if (hour) return { value: hour[1], units: "hour", concentration };
  const day = raw.match(/(\d+)\s*day/i);
  if (day) return { value: day[1], units: "day", concentration };
  return { value: "", units: "spec", concentration };
}

function parseSpellRange(range: string | undefined): {
  value: number | null;
  long: number | null;
  units: string;
} {
  const raw = (range ?? "").trim().toLowerCase();
  if (!raw) return { value: null, long: null, units: "" };
  if (raw === "self") return { value: null, long: null, units: "self" };
  if (raw === "touch") return { value: null, long: null, units: "touch" };
  if (raw.includes("sight")) return { value: null, long: null, units: "spec" };
  const ft = raw.match(/(\d+)\s*(?:feet|foot|ft)/i);
  if (ft) return { value: Number(ft[1]), long: null, units: "ft" };
  return { value: null, long: null, units: "spec" };
}

function mapSaveAbility(label: string): string {
  const key = label.trim().toLowerCase();
  return SAVE_ABILITY_MAP[key] ?? "";
}

/** dnd5e `system.preparation.mode` values used by the export. */
export type SpellPreparationMode =
  | "prepared"
  | "always"
  | "pact"
  | "innate"
  | "atwill";

export interface SpellItemInput {
  name: string;
  level: number;
  ability?: string;
  prepared?: boolean;
  /** Defaults to `"prepared"`. Use `"pact"` for Warlock, `"always"` for always-prepared grants. */
  preparationMode?: SpellPreparationMode;
  description?: string;
  source?: string;
  school?: string;
  castingTime?: string;
  range?: string;
  duration?: string;
  isRitual?: boolean;
  isConcentration?: boolean;
  components?: { v?: boolean; s?: boolean; m?: string };
  spellAttack?: string[];
  savingThrows?: string[];
  damageTypes?: string[];
  /** Foundry `img` (5etools fluff URL or school fallback path). */
  img?: string;
}

function buildSpellActivities(input: SpellItemInput): Record<string, unknown> {
  const activation = parseActivation(input.castingTime);
  const duration = parseSpellDuration(input.duration);
  if (input.isConcentration) duration.concentration = true;
  const range = parseSpellRange(input.range);
  const activities: Record<string, unknown> = {};

  const base = {
    activation: {
      type: activation.type,
      value: activation.value,
      override: false,
    },
    consumption: {
      scaling: { allowed: false },
      spellSlot: true,
      targets: [],
    },
    description: { chatFlavor: "" },
    duration: {
      value: duration.value || "",
      units: duration.units,
      concentration: duration.concentration,
      override: false,
    },
    effects: [] as { _id: string }[],
    range: {
      value: range.value,
      units: range.units || "self",
      override: false,
    },
    target: {
      template: { contiguous: false, units: "ft" },
      affects: { choice: false },
      override: false,
      prompt: true,
    },
    uses: { spent: 0, recovery: [] },
  };

  const attacks = input.spellAttack ?? [];
  const saves = (input.savingThrows ?? [])
    .map(mapSaveAbility)
    .filter(Boolean);
  const dmgType = mapDamageType(input.damageTypes?.[0] ?? "");

  if (attacks.length > 0) {
    const id = foundryId();
    const isRanged = attacks.some((a) => /ranged/i.test(a));
    activities[id] = {
      _id: id,
      type: "attack",
      sort: 0,
      name: "",
      ...base,
      attack: {
        ability: input.ability ?? "",
        type: {
          value: isRanged ? "ranged" : "melee",
          classification: "spell",
        },
        critical: { threshold: null },
        flat: false,
        bonus: "",
      },
      damage: {
        critical: { bonus: "" },
        includeBase: false,
        parts: dmgType
          ? [
              {
                number: null,
                denomination: null,
                types: [dmgType],
                custom: { enabled: false },
                scaling: { mode: "", number: 1 },
                bonus: "",
              },
            ]
          : [],
      },
      midiProperties: defaultMidiProperties({
        identifier: slugify(input.name),
      }),
    };
    return activities;
  }

  if (saves.length > 0) {
    const id = foundryId();
    activities[id] = {
      _id: id,
      type: "save",
      sort: 0,
      name: "",
      ...base,
      damage: {
        parts: dmgType
          ? [
              {
                number: null,
                denomination: null,
                types: [dmgType],
                custom: { enabled: false },
                scaling: { mode: "", number: 1 },
                bonus: "",
              },
            ]
          : [],
        onSave: "half",
      },
      save: {
        ability: saves[0],
        dc: {
          calculation: input.ability ? "spellcasting" : "",
          formula: "",
        },
      },
      midiProperties: defaultMidiProperties({
        identifier: slugify(input.name),
      }),
    };
    return activities;
  }

  const id = foundryId();
  activities[id] = {
    _id: id,
    type: "utility",
    sort: 0,
    name: "",
    ...base,
    roll: { formula: "", name: "", prompt: false, visible: false },
    midiProperties: defaultMidiProperties({
      identifier: slugify(input.name),
    }),
  };
  return activities;
}

export function buildSpellItem(input: SpellItemInput): FoundryItem {
  const activation = parseActivation(input.castingTime);
  const duration = parseSpellDuration(input.duration);
  if (input.isConcentration) duration.concentration = true;
  const range = parseSpellRange(input.range);
  const properties: string[] = [];
  if (input.components?.v) properties.push("vocal");
  if (input.components?.s) properties.push("somatic");
  if (input.components?.m) properties.push("material");
  if (input.isConcentration || duration.concentration) {
    properties.push("concentration");
  }
  if (input.isRitual) properties.push("ritual");

  const system: Record<string, unknown> = {
    source: sourceBlock(input.source),
    description: htmlDesc(input.description),
    identifier: slugify(input.name),
    level: input.level,
    school: mapSpellSchool(input.school),
    ability: input.ability ?? "",
    properties,
    materials: {
      value: input.components?.m ?? "",
      consumed: false,
      cost: 0,
      supply: 0,
    },
    preparation: {
      mode: input.preparationMode ?? "prepared",
      prepared: input.prepared ?? input.level === 0,
    },
    activation: {
      type: activation.type,
      value: activation.value,
      override: false,
    },
    duration: {
      value: duration.value,
      units: duration.units,
      concentration: duration.concentration,
    },
    range: {
      value: range.value,
      long: range.long,
      units: range.units,
    },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        units: "ft",
      },
      affects: { count: "", type: "", choice: false },
    },
    uses: { spent: 0, max: "", recovery: [] },
    activities: buildSpellActivities(input),
    sourceClass: "",
  };
  return wrapItem({
    name: input.name,
    type: "spell",
    img: input.img ?? resolveSpellIcon(input.school),
    system,
  });
}

