/**
 * Lenient sanitizers for the read-only blocks of a Builder JSON (`meta`,
 * `provenance`, `derived`). They are never restored into the Builder, but the
 * Character Sheet compiler reads them, so their shape must be safe to iterate.
 * Malformed entries are dropped; a missing block stays undefined.
 */
import { ABILITY_KEYS } from "@/shared/constants/dnd";
import type { AbilityKey, AbilityScores } from "@/shared/types";
import {
  isAbilityKey,
  isDamageType,
  isRecord,
  isSkillKey,
  type SnapshotWarn,
} from "../foundry-export/builder-snapshot-validators";
import {
  BUILDER_CHARACTER_JSON_APP,
  type BuilderCharacterDerived,
  type BuilderCharacterMeta,
  type BuilderCharacterProvenance,
  type ProvenanceGrant,
} from "./builder-character.types";

type UnknownRecord = Record<string, unknown>;

const str = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;
const optStr = (value: unknown): string | undefined =>
  typeof value === "string" && value ? value : undefined;
const nullableStr = (value: unknown): string | null =>
  typeof value === "string" ? value : null;
const num = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

/** Records that have a string `name`, mapped by `map`. */
function named<T>(value: unknown, map: (item: UnknownRecord & { name: string }) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.name !== "string") continue;
    const mapped = map(item as UnknownRecord & { name: string });
    if (mapped) out.push(mapped);
  }
  return out;
}

const grant = (item: UnknownRecord & { name: string }): ProvenanceGrant => ({
  name: item.name,
  grantedBy: strings(item.grantedBy),
});

function scores(value: unknown): AbilityScores | null {
  if (!isRecord(value)) return null;
  const out = {} as AbilityScores;
  for (const key of ABILITY_KEYS) {
    const score = value[key];
    if (typeof score !== "number" || !Number.isFinite(score)) return null;
    out[key] = score;
  }
  return out;
}

export function normalizeMeta(value: unknown): BuilderCharacterMeta | undefined {
  if (!isRecord(value)) return undefined;
  return {
    exportedAt: nullableStr(value.exportedAt),
    app: str(value.app, BUILDER_CHARACTER_JSON_APP),
    sources: strings(value.sources),
    complete: value.complete === true,
    pendingChoices: strings(value.pendingChoices),
  };
}

export function normalizeProvenance(
  value: unknown,
  baseScores: AbilityScores,
  warn: SnapshotWarn,
): BuilderCharacterProvenance | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    warn("Provenance: expected an object, ignored.");
    return undefined;
  }
  const abilities = isRecord(value.abilityScores) ? value.abilityScores : {};
  const finalScores = scores(abilities.final);
  if (!finalScores) {
    warn("Provenance: final ability scores missing or invalid; using base scores.");
  }
  const species = isRecord(value.species) && typeof value.species.name === "string"
    ? {
        name: value.species.name,
        traits: strings(value.species.traits),
        spellGroupChoice: nullableStr(value.species.spellGroupChoice),
      }
    : null;
  const background = isRecord(value.background) && typeof value.background.name === "string"
    ? { name: value.background.name, faction: nullableStr(value.background.faction) }
    : null;

  return {
    summary: str(value.summary),
    totalLevel: num(value.totalLevel, 1),
    classes: named(value.classes, (c) => ({
      ...(optStr(c.id) ? { id: optStr(c.id) } : {}),
      name: c.name,
      subclass: nullableStr(c.subclass),
      ...(c.subclassId !== undefined ? { subclassId: nullableStr(c.subclassId) } : {}),
      level: num(c.level, 1),
      primary: c.primary === true,
      features: named(c.features, (f) => ({
        level: num(f.level, 1),
        name: f.name,
        from: str(f.from),
      })),
    })),
    species,
    background,
    abilityScores: {
      method: (str(abilities.method, "manual") as BuilderCharacterProvenance["abilityScores"]["method"]),
      base: scores(abilities.base) ?? baseScores,
      final: finalScores ?? baseScores,
      originBonuses: strings(abilities.originBonuses),
    },
    feats: named(value.feats, (f) => ({
      ...(optStr(f.id) ? { id: optStr(f.id) } : {}),
      name: f.name,
      source: str(f.source),
      grantedBy: str(f.grantedBy),
      abilityChoices: strings(f.abilityChoices),
      spellList: nullableStr(f.spellList),
    })),
    optionalFeatures: named(value.optionalFeatures, (f) => ({
      ...grant(f),
      ...(optStr(f.id) ? { id: optStr(f.id) } : {}),
      ...(optStr(f.progressionId) ? { progressionId: optStr(f.progressionId) } : {}),
    })),
    savingThrows: strings(value.savingThrows).filter((k): k is AbilityKey => isAbilityKey(k)),
    skills: named(value.skills, (s) =>
      isSkillKey(s.skill)
        ? { ...grant(s), skill: s.skill, expertise: nullableStr(s.expertise) }
        : null,
    ),
    tools: named(value.tools, grant),
    languages: named(value.languages, grant),
    armor: named(value.armor, grant),
    weapons: named(value.weapons, grant),
    defenses: named(value.defenses, (d) =>
      isDamageType(d.damageType)
        ? { ...grant(d), damageType: d.damageType, kind: str(d.kind) }
        : null,
    ),
    spells: named(value.spells, (s) => ({
      ...(optStr(s.id) ? { id: optStr(s.id) } : {}),
      name: s.name,
      level: num(s.level),
      source: str(s.source),
      grantedBy: str(s.grantedBy),
    })),
    grantedSpells: named(value.grantedSpells, (s) => ({
      name: s.name,
      grantedBy: str(s.grantedBy),
      unlockedAtLevel: num(s.unlockedAtLevel, 1),
    })),
    equipment: named(value.equipment, (e) => {
      const ref = isRecord(e.ref) && typeof e.ref.name === "string"
        ? { id: nullableStr(e.ref.id), name: e.ref.name, source: nullableStr(e.ref.source) }
        : undefined;
      const runeRefs = named(e.runeRefs, (r) => ({ name: r.name, monster: nullableStr(r.monster) }));
      return {
        slot: str(e.slot),
        name: e.name,
        rarity: nullableStr(e.rarity),
        runes: strings(e.runes),
        ...(ref ? { ref } : {}),
        ...(runeRefs.length > 0 ? { runeRefs } : {}),
      };
    }),
  };
}

export function normalizeDerived(value: unknown): BuilderCharacterDerived | undefined {
  if (!isRecord(value)) return undefined;
  const hp = isRecord(value.hitPoints) ? value.hitPoints : null;
  const speed: BuilderCharacterDerived["speed"] = {};
  if (isRecord(value.speed)) {
    for (const key of ["walk", "fly", "swim", "climb", "burrow"] as const) {
      if (typeof value.speed[key] === "number") speed[key] = value.speed[key] as number;
    }
  }
  const casting = isRecord(value.spellcasting) && isAbilityKey(value.spellcasting.ability)
    ? {
        ability: value.spellcasting.ability,
        saveDc: num(value.spellcasting.saveDc),
        attackBonus: num(value.spellcasting.attackBonus),
      }
    : null;
  const attunement = isRecord(value.attunement) ? value.attunement : {};
  return {
    proficiencyBonus: num(value.proficiencyBonus, 2),
    hitPoints: hp ? { max: num(hp.max), hitDice: str(hp.hitDice) } : null,
    armorClass: num(value.armorClass, 10),
    initiative: num(value.initiative),
    speed,
    passivePerception: num(value.passivePerception, 10),
    spellcasting: casting,
    attunement: {
      slots: num(attunement.slots, 3),
      artificerBonusMaterialSlots: num(attunement.artificerBonusMaterialSlots),
    },
  };
}
