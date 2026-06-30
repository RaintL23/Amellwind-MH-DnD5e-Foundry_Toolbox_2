import { Spell, SpellComponents, SpellSchool } from "@/shared/types";
import {
  parseFiveToolsMarkup,
  renderFiveToolsEntries,
} from "@/shared/utils/fivetools-parser";
import { isSpellListFilterClass } from "../utils/spell-class.constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export const SCHOOL_NAMES: Record<string, string> = {
  A: "Abjuration",
  C: "Conjuration",
  D: "Divination",
  E: "Enchantment",
  I: "Illusion",
  N: "Necromancy",
  T: "Transmutation",
  V: "Evocation",
};

function spellId(raw: Raw): string {
  return `${raw.source}::${raw.name}`;
}

function mapCastingTime(raw: Raw): string {
  if (!Array.isArray(raw.time) || raw.time.length === 0) return "Unknown";
  const t = raw.time[0] as Raw;
  const number = typeof t.number === "number" ? t.number : 1;
  const unit = typeof t.unit === "string" ? t.unit : "";
  const suffix = t.condition ? ` (${parseFiveToolsMarkup(String(t.condition))})` : "";
  return `${number} ${unit}${suffix}`;
}

function mapRange(raw: Raw): string {
  const r = raw.range as Raw | undefined;
  if (!r) return "Unknown";
  const type = String(r.type ?? "");
  if (type === "special") return "Special";
  if (type === "point") {
    const dist = r.distance as Raw | undefined;
    if (!dist) return "Unknown";
    const distType = String(dist.type ?? "");
    if (distType === "self") return "Self";
    if (distType === "touch") return "Touch";
    if (distType === "sight") return "Sight";
    if (distType === "unlimited") return "Unlimited";
    const amount = typeof dist.amount === "number" ? dist.amount : "";
    return `${amount} ${distType}`;
  }
  if (type === "radius" || type === "cone" || type === "line" || type === "cube" || type === "hemisphere" || type === "sphere") {
    const dist = r.distance as Raw | undefined;
    const amount = dist && typeof dist.amount === "number" ? dist.amount : "";
    const unit = dist ? String(dist.type ?? "") : "";
    return `Self (${amount}-${unit} ${type})`;
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function mapComponents(raw: Raw): SpellComponents {
  const c = raw.components as Raw | undefined;
  if (!c) return { v: false, s: false };
  const m = c.m;
  let mText: string | undefined;
  if (typeof m === "string") mText = parseFiveToolsMarkup(m);
  else if (m && typeof m === "object" && typeof m.text === "string") {
    mText = parseFiveToolsMarkup(String(m.text));
  }
  return {
    v: c.v === true,
    s: c.s === true,
    m: mText,
  };
}

function mapDuration(raw: Raw): { text: string; isConcentration: boolean } {
  if (!Array.isArray(raw.duration) || raw.duration.length === 0) {
    return { text: "Instantaneous", isConcentration: false };
  }
  const d = raw.duration[0] as Raw;
  const type = String(d.type ?? "");
  let isConcentration = d.concentration === true;

  if (type === "instant") return { text: "Instantaneous", isConcentration: false };
  if (type === "permanent") {
    const ends = Array.isArray(d.ends) ? (d.ends as string[]).join(" or ") : "";
    return { text: ends ? `Until ${ends}` : "Permanent", isConcentration: false };
  }
  if (type === "special") return { text: "Special", isConcentration };

  if (type === "timed") {
    const amount = typeof d.duration?.amount === "number" ? d.duration.amount : 1;
    const unit = typeof d.duration?.type === "string" ? d.duration.type : "";
    const prefix = isConcentration ? "Concentration, up to " : "";
    return { text: `${prefix}${amount} ${unit}`, isConcentration };
  }

  return { text: type.charAt(0).toUpperCase() + type.slice(1), isConcentration };
}

function renderEntries(entries: unknown[]): string[] {
  return renderFiveToolsEntries(entries);
}

function mapSpellClassLists(raw: Raw): { classNames: string[]; classes: string[] } {
  const classesField = raw.classes as Raw | undefined;
  if (!classesField) return { classNames: [], classes: [] };

  const fromClassList = Array.isArray(classesField.fromClassList)
    ? (classesField.fromClassList as Raw[])
    : [];
  const fromClassListVariant = Array.isArray(classesField.fromClassListVariant)
    ? (classesField.fromClassListVariant as Raw[])
    : [];
  const fromSubclass = Array.isArray(classesField.fromSubclass)
    ? (classesField.fromSubclass as Raw[])
    : [];

  const nameSet = new Set<string>();
  const labelSeen = new Set<string>();
  const classNames: string[] = [];
  const classes: string[] = [];

  const addName = (name: string) => {
    if (!name || !isSpellListFilterClass(name) || nameSet.has(name)) return;
    nameSet.add(name);
    classNames.push(name);
  };

  const addLabel = (label: string) => {
    if (!label || labelSeen.has(label)) return;
    labelSeen.add(label);
    classes.push(label);
  };

  for (const c of fromClassList) {
    const name = typeof c.name === "string" ? c.name : null;
    if (name) {
      addName(name);
      addLabel(name);
    }
  }

  for (const c of fromClassListVariant) {
    const name = typeof c.name === "string" ? c.name : null;
    if (!name) continue;
    const definedIn =
      typeof c.definedInSource === "string" ? c.definedInSource : undefined;
    addLabel(definedIn ? `${name} (${definedIn})` : `${name} (variant)`);
  }

  for (const sc of fromSubclass) {
    const className =
      typeof sc.class?.name === "string" ? sc.class.name : null;
    const subclassName =
      typeof sc.subclass?.name === "string" ? sc.subclass.name : null;
    if (className) {
      addLabel(
        subclassName ? `${className} (${subclassName})` : className,
      );
    }
  }

  classNames.sort((a, b) => a.localeCompare(b));
  classes.sort((a, b) => a.localeCompare(b));

  return { classNames, classes };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSpell(raw: any): Spell {
  const school = String(raw.school ?? "V") as SpellSchool;
  const description = renderEntries(Array.isArray(raw.entries) ? (raw.entries as unknown[]) : []);
  const { text: duration, isConcentration } = mapDuration(raw);

  let higherLevel: string | undefined;
  if (Array.isArray(raw.entriesHigherLevel) && raw.entriesHigherLevel.length > 0) {
    const hlEntries = renderEntries(raw.entriesHigherLevel as unknown[]);
    higherLevel = hlEntries.join(" ") || undefined;
  }

  const firstParagraph = description.find((p) => p && !p.startsWith("•") && !p.startsWith("»") && !p.startsWith("**"));
  const summary = firstParagraph
    ? firstParagraph.slice(0, 150) + (firstParagraph.length > 150 ? "…" : "")
    : "";

  return {
    id: spellId(raw),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? ""),
    page: typeof raw.page === "number" ? raw.page : undefined,
    level: typeof raw.level === "number" ? raw.level : 0,
    school,
    schoolName: SCHOOL_NAMES[school] ?? school,
    castingTime: mapCastingTime(raw),
    range: mapRange(raw),
    components: mapComponents(raw),
    duration,
    isRitual: raw.meta?.ritual === true,
    isConcentration,
    ...mapSpellClassLists(raw),
    description,
    higherLevel,
    summary,
  };
}
