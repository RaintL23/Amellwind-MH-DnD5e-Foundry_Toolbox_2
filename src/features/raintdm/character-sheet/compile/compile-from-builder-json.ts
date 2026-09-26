/**
 * Compile a PlayCharacterCompiled from a BuilderCharacterJson without mounting
 * the Character Builder React context.
 */
import type { BuilderCharacterJson } from "@/features/raintdm/builder/builder-json/builder-character.types";
import { getCarryingCapacity, normalizeBuilderCreatureSize } from "@/features/raintdm/builder/utils/carrying-capacity.utils";
import {
  detectClassSpeedBonuses,
  detectFeatSpeedBonuses,
  getCharacterSpeedBreakdown,
} from "@/features/raintdm/builder/utils/character-speed";
import { resolveSpeciesParts } from "@/features/raintdm/builder/utils/species-resolution.utils";
import { getAllFeats } from "@/features/amellwind/feats/services/feat.service";
import { getAllClasses, getClassById } from "@/features/dnd/classes/services/class.service";
import { subclassesForClassVariant } from "@/features/dnd/classes/utils/class-subclass.utils";
import { getAllDndFeats } from "@/features/dnd/feats/services/dnd-feat.service";
import { getAllDndOptionalFeatures } from "@/features/dnd/optionalfeatures/services/dnd-optionalfeature.service";
import { getAllSpells } from "@/features/dnd/spells/services/spell.service";
import {
  ABILITY_KEYS,
  SKILL_ABILITY,
  SKILL_ORDER,
  toAbilityKey,
} from "@/shared/constants/dnd";
import type {
  AbilityKey,
  AbilityScores,
  Class,
  Feat,
  SkillKey,
  SpeciesTrait,
  Spell,
  Subclass,
} from "@/shared/types";
import { getAbilityModifier } from "@/shared/utils/cr.utils";
import { entryToPlainText } from "@/shared/utils/entry-text.utils";
import { plainFeatureText } from "@/features/raintdm/builder/foundry-export/feature-usage.utils";
import { buildPlayResources } from "./class-resources";
import {
  detectFeatureStatEffects,
  isStubFeatureDescription,
} from "./detect-feature-stat-effects";
import {
  castingTimeToBucket,
  mapFeatureFromText,
  slugId,
} from "./play-feature.mapper";
import { STANDARD_ACTIONS } from "./standard-actions.data";
import type {
  PlayAttack,
  PlayCharacterCompiled,
  PlayFeature,
  PlayHitDie,
  PlayInventoryItem,
  PlaySpell,
  PlaySpellcasting,
  RulesEdition,
} from "../utils/play-character.types";
import { createInitialSession } from "../utils/play-character.types";
import type { PlayCharacterRecord } from "../utils/play-character.types";

function featCatalogText(feat: Feat): string {
  const parts = [...feat.paragraphs];
  for (const section of feat.sections) {
    if (section.name) parts.push(section.name);
    parts.push(...section.paragraphs);
  }
  return parts.filter(Boolean).join("\n\n").trim();
}

function traitPlainDescription(trait: SpeciesTrait): string {
  const fromContent = entryToPlainText(trait).trim();
  if (fromContent) return fromContent;
  return (trait.entries ?? []).join("\n").trim();
}

function collectSpeciesTraits(
  parts: Awaited<ReturnType<typeof resolveSpeciesParts>>,
): SpeciesTrait[] {
  const byName = new Map<string, SpeciesTrait>();
  for (const list of [
    parts.base?.traits,
    parts.dndSubrace?.traits,
    parts.mhSubrace?.traits,
  ]) {
    for (const trait of list ?? []) {
      const key = trait.name.trim().toLowerCase();
      if (!key || byName.has(key)) continue;
      byName.set(key, trait);
    }
  }
  return [...byName.values()];
}

function mapCatalogSpellToPlay(
  found: Spell | undefined,
  fallback: { name: string; level?: number; id?: string },
  index: number,
): PlaySpell {
  const name = found?.name ?? fallback.name;
  const levelNum = found?.level ?? fallback.level ?? 0;
  const rawDesc = found?.description?.join("\n").trim() ?? "";
  const description = rawDesc ? plainFeatureText(rawDesc) : undefined;
  const higherLevel = found?.higherLevel
    ? plainFeatureText(found.higherLevel)
    : undefined;
  const statEffects = description
    ? detectFeatureStatEffects({ name, description })
    : [];

  return {
    id: found?.id ?? fallback.id ?? slugId("spell", name, index),
    name,
    level: levelNum,
    school: found?.schoolName ?? found?.school,
    castingTime: found?.castingTime,
    range: found?.range,
    duration: found?.duration,
    isConcentration: found?.isConcentration ?? false,
    isRitual: found?.isRitual ?? false,
    components: found?.components,
    description,
    higherLevel,
    prepared: levelNum === 0,
    alwaysPrepared: false,
    bucket: castingTimeToBucket(found?.castingTime),
    ...(statEffects.length > 0 ? { statEffects } : {}),
  };
}

function proficiencyBonusAtLevel(level: number): number {
  return Math.ceil(level / 4) + 1;
}

function detectRulesEdition(classData: Class | null | undefined): RulesEdition {
  const src = (classData?.source ?? "").toUpperCase();
  if (src === "PHB" || src === "DMG" || src === "XGE" || src === "TCE") {
    return "2014";
  }
  return "2024";
}

function parseSlotTotalsFromClass(
  classData: Class | null,
  level: number,
): { slots: Record<number, number>; pact?: { max: number; level: number } } {
  const slots: Record<number, number> = {};
  if (!classData?.spellProgression?.length) return { slots };

  const rowIndex = Math.max(0, level - 1);
  let pactCount = 0;
  let pactLevel = 0;

  for (const group of classData.spellProgression) {
    const labels = group.colLabels ?? [];
    const row = group.rows[rowIndex];
    if (!row) continue;
    labels.forEach((label, i) => {
      const key = label.trim().toLowerCase();
      const val = String(row[i] ?? "");
      const n = parseInt(val, 10);
      if (Number.isNaN(n) || n <= 0) return;

      const ordinal = key.match(/^(\d+)(st|nd|rd|th)$/);
      if (ordinal) {
        slots[parseInt(ordinal[1], 10)] = n;
        return;
      }
      if (key === "spell slots" || key.includes("warlock")) {
        pactCount = n;
      }
      if (key === "slot level") {
        const m = val.match(/(\d+)/);
        if (m) pactLevel = parseInt(m[1], 10);
      }
    });
  }

  if (pactCount > 0 && pactLevel > 0) {
    return { slots: {}, pact: { max: pactCount, level: pactLevel } };
  }
  return { slots };
}

function guessSpellAbility(className: string): AbilityKey | "" {
  const n = className.toLowerCase();
  if (/(wizard|fighter|rogue|artificer)/.test(n)) return "int";
  if (/(cleric|druid|ranger|monk)/.test(n)) return "wis";
  if (/(bard|paladin|sorcerer|warlock)/.test(n)) return "cha";
  return "";
}

async function resolveClass(
  json: BuilderCharacterJson,
): Promise<Class | null> {
  const ref = json.identity.class;
  if (!ref) return null;
  if (ref.id) {
    const byId = await getClassById(ref.id).catch(() => undefined);
    if (byId) return byId;
  }
  const all = await getAllClasses().catch(() => [] as Class[]);
  const name = (ref.name ?? "").toLowerCase();
  return (
    all.find((c) => c.name.toLowerCase() === name) ??
    all.find((c) => c.name.toLowerCase().includes(name)) ??
    null
  );
}

function buildAttacksFromEquipment(
  json: BuilderCharacterJson,
  attackAbilityMod: number,
  pb: number,
): PlayAttack[] {
  const attacks: PlayAttack[] = [];
  const eq = json.snapshot.equipment;
  const hands = [
    { slot: "main" as const, weapon: eq.mainHand },
    { slot: "off" as const, weapon: eq.offHand },
  ];

  hands.forEach(({ slot, weapon }, idx) => {
    if (!weapon?.weapon) return;
    const w = weapon.weapon;
    const props = (w.properties ?? []).map(String);
    const mod = attackAbilityMod;
    const proficient = true;
    const attackBonus = mod + (proficient ? pb : 0);
    const dmg1 = w.dmg1 || "1d4";
    const dmgType = w.dmgType || undefined;
    const isOffHandLight =
      slot === "off" && props.some((p) => /light/i.test(p));
    // Light off-hand bonus attack: no ability mod to damage (TWF style can add it back).
    const withMod = (dice: string) =>
      isOffHandLight
        ? dice
        : `${dice}${mod >= 0 ? "+" : ""}${mod}`;
    attacks.push({
      id: slugId("atk", w.name, idx),
      name: w.name,
      attackBonus,
      damage: [{ expression: withMod(dmg1), type: dmgType }],
      versatile: w.dmg2
        ? [{ expression: withMod(w.dmg2), type: dmgType }]
        : undefined,
      range: w.range ? String(w.range) : undefined,
      properties: props,
      mastery: w.mastery ? String(w.mastery) : undefined,
      critRange: 20,
      bucket: isOffHandLight ? "bonus" : "action",
      sourceKind: "item",
    });
  });

  return attacks;
}

function isGoldPileName(name: string): boolean {
  return /^\d+(?:\.\d+)?\s*gp$/i.test(name.trim());
}

function inventoryFromSnapshot(
  json: BuilderCharacterJson,
  attackAbilityMod: number,
  pb: number,
): PlayInventoryItem[] {
  const items: PlayInventoryItem[] = [];
  const eq = json.snapshot.equipment;
  let i = 0;

  const pushWeapon = (
    equippedWeapon: NonNullable<typeof eq.mainHand> | null | undefined,
  ) => {
    const w = equippedWeapon?.weapon;
    if (!w?.name) return;
    const mod = attackAbilityMod;
    const dmg1 = w.dmg1 || "1d4";
    items.push({
      id: slugId("inv", w.name, i++),
      name: w.name,
      quantity: 1,
      weightLb: Number(w.weight) || 0,
      equipped: true,
      attuned: false,
      requiresAttunement: false,
      kind: "weapon",
      source: w.contentSource === "dnd" ? "dnd" : "amellwind",
      isWeapon: true,
      attackBonus: mod + pb,
      damageExpression: `${dmg1}${mod >= 0 ? "+" : ""}${mod}`,
      properties: (w.properties ?? []).map(String),
    });
  };

  pushWeapon(eq.mainHand);
  pushWeapon(eq.offHand);

  if (eq.armor?.armor) {
    const a = eq.armor.armor;
    items.push({
      id: slugId("inv", a.name, i++),
      name: a.name,
      quantity: 1,
      weightLb: Number(a.weight) || 0,
      equipped: true,
      attuned: false,
      requiresAttunement: false,
      kind: "armor",
      source: a.contentSource === "dnd" ? "dnd" : "amellwind",
      armorAc: a.baseAC,
      armorMaxDex: a.maxDexBonus,
      summary: `AC ${a.baseAC}`,
    });
  }

  if (eq.shield) {
    const s = eq.shield;
    items.push({
      id: slugId("inv", s.name, i++),
      name: s.name,
      quantity: 1,
      weightLb: Number(s.weight) || 6,
      equipped: true,
      attuned: false,
      requiresAttunement: false,
      kind: "shield",
      source: "dnd",
      shieldBonus: s.acBonus ?? 2,
      summary: `Shield +${s.acBonus ?? 2} AC`,
    });
  }

  const pushTrinket = (name: string | undefined) => {
    if (!name) return;
    items.push({
      id: slugId("inv", name, i++),
      name,
      quantity: 1,
      weightLb: 0,
      equipped: true,
      attuned: false,
      requiresAttunement: false,
      kind: "gear",
      source: "custom",
    });
  };
  pushTrinket(eq.trinket1?.name);
  pushTrinket(eq.trinket2?.name);

  for (const entry of eq.inventory ?? []) {
    if (isGoldPileName(entry.name)) continue;
    const lower = entry.name.trim().toLowerCase();
    const isShield = lower === "shield";
    items.push({
      id: slugId("inv", entry.name, i++),
      name: entry.name,
      quantity: entry.quantity || 1,
      weightLb: parseFloat(String(entry.weight ?? "0")) || (isShield ? 6 : 0),
      equipped: false,
      attuned: false,
      requiresAttunement: false,
      kind: isShield ? "shield" : "gear",
      source: "custom",
      shieldBonus: isShield ? 2 : undefined,
    });
  }

  return items;
}

function armorClassFromSnapshot(
  json: BuilderCharacterJson,
  dexMod: number,
): number {
  const eq = json.snapshot.equipment;
  const armor = eq.armor?.armor;
  let base: number;
  if (armor && armor.category !== "clothing") {
    const maxDex = armor.maxDexBonus;
    const dexPart =
      maxDex === null || maxDex === undefined
        ? dexMod
        : Math.min(dexMod, maxDex);
    base = armor.baseAC + dexPart;
  } else {
    base = 10 + dexMod;
  }
  if (eq.shield) {
    base += eq.shield.acBonus ?? 2;
  }
  return base;
}

export async function compilePlayCharacterFromBuilderJson(
  json: BuilderCharacterJson,
): Promise<PlayCharacterCompiled> {
  const level = json.core.level || 1;
  const pb = proficiencyBonusAtLevel(level);
  const scores: AbilityScores =
    json.provenance?.abilityScores.final ?? json.core.abilities;

  const classData = await resolveClass(json);
  const rulesEdition = detectRulesEdition(classData);

  const abilities = {} as PlayCharacterCompiled["abilities"];
  for (const key of ABILITY_KEYS) {
    const score = scores[key];
    abilities[key] = { score, mod: getAbilityModifier(score) };
  }

  const saveProficiencies: AbilityKey[] =
    (json.provenance?.savingThrows as AbilityKey[] | undefined) ??
    (classData?.saveProficiencies ?? []);

  const savingThrows = {} as Record<AbilityKey, number>;
  for (const key of ABILITY_KEYS) {
    const proficient = saveProficiencies.includes(key);
    savingThrows[key] = abilities[key].mod + (proficient ? pb : 0);
  }

  const skillProficiencies: Partial<Record<SkillKey, 1 | 2>> = {};
  for (const s of json.provenance?.skills ?? []) {
    skillProficiencies[s.skill] = s.expertise ? 2 : 1;
  }
  // Also from snapshot skill choices
  const snapSkills: SkillKey[] = [
    ...Object.values(json.snapshot.classSkillChoices ?? {}).flat(),
    ...(json.snapshot.backgroundSkillChoices ?? []),
    ...(json.snapshot.speciesSkillChoices ?? []),
    ...Object.values(json.snapshot.featSkillChoices ?? {}).flat(),
  ];
  for (const sk of snapSkills) {
    if (!skillProficiencies[sk]) skillProficiencies[sk] = 1;
  }
  for (const list of Object.values(json.snapshot.expertiseChoices ?? {})) {
    for (const sk of list) {
      skillProficiencies[sk] = 2;
    }
  }

  const skills = {} as Record<SkillKey, number>;
  for (const skill of SKILL_ORDER) {
    const levelProf = skillProficiencies[skill] ?? 0;
    skills[skill] =
      abilities[SKILL_ABILITY[skill]].mod + levelProf * pb;
  }

  const features: PlayFeature[] = [];
  let fi = 0;
  const primaryMod =
    abilities[guessSpellAbility(json.identity.class?.name ?? "") || "str"]?.mod ??
    0;

  const speciesRef = json.identity.species;
  const speciesParts = speciesRef?.id
    ? await resolveSpeciesParts(speciesRef)
    : null;
  const speciesBase = speciesParts?.base;
  const speciesTraitCatalog = speciesParts
    ? collectSpeciesTraits(speciesParts)
    : [];
  const speciesTraitByName = new Map(
    speciesTraitCatalog.map((t) => [t.name.trim().toLowerCase(), t]),
  );
  const speciesDarkvision = speciesBase?.darkvision;
  const speciesResistances = (speciesBase?.resistances ?? []).map(String);

  const [dndFeats, amFeats, optionalFeatures] = await Promise.all([
    getAllDndFeats().catch(() => [] as Feat[]),
    getAllFeats().catch(() => [] as Feat[]),
    getAllDndOptionalFeatures().catch(() => []),
  ]);
  const featById = new Map<string, Feat>();
  const featByName = new Map<string, Feat>();
  for (const feat of [...dndFeats, ...amFeats]) {
    featById.set(feat.id, feat);
    const key = feat.name.trim().toLowerCase();
    if (!featByName.has(key)) featByName.set(key, feat);
  }
  const optionalByName = new Map(
    optionalFeatures.map((o) => [o.name.trim().toLowerCase(), o]),
  );

  const snapshotFeatSelections = [
    ...(json.snapshot.featSelections ?? []),
    json.snapshot.speciesOriginFeat,
    json.snapshot.backgroundOriginFeat,
    ...(json.snapshot.optionalFeatureOriginFeats ?? []),
  ].filter((s): s is NonNullable<typeof s> => Boolean(s?.id || s?.name));

  const resolveFeatText = (name: string, id?: string): string | null => {
    const fromId = id ? featById.get(id) : undefined;
    const fromName = featByName.get(name.trim().toLowerCase());
    const feat = fromId ?? fromName;
    if (!feat) return null;
    const text = featCatalogText(feat);
    return text || null;
  };

  const addFeature = (
    name: string,
    description: string,
    sourceKind: PlayFeature["sourceKind"],
    sourceLabel: string,
    levelNum?: number,
  ) => {
    features.push(
      mapFeatureFromText({
        id: slugId(sourceKind, name, fi++),
        name,
        description,
        sourceKind,
        sourceLabel,
        level: levelNum,
        proficiencyBonus: pb,
        primaryAbilityMod: primaryMod,
        speciesDarkvision,
        speciesResistances,
      }),
    );
  };

  for (const cls of json.provenance?.classes ?? []) {
    for (const f of cls.features) {
      addFeature(f.name, `${f.from}`, "class", cls.name, f.level);
    }
  }
  for (const traitName of json.provenance?.species?.traits ?? []) {
    const trait = speciesTraitByName.get(traitName.trim().toLowerCase());
    const desc = trait ? traitPlainDescription(trait) : "";
    addFeature(
      traitName,
      desc || traitName,
      "species",
      json.provenance?.species?.name ?? speciesBase?.name ?? "Species",
    );
  }
  for (const trait of speciesTraitCatalog) {
    const already = features.some(
      (f) =>
        f.sourceKind === "species" &&
        f.name.toLowerCase() === trait.name.toLowerCase(),
    );
    if (already) continue;
    const desc = traitPlainDescription(trait);
    addFeature(
      trait.name,
      desc || trait.name,
      "species",
      speciesBase?.name ?? "Species",
    );
  }

  for (const feat of json.provenance?.feats ?? []) {
    const sel = snapshotFeatSelections.find(
      (s) => s.name.toLowerCase() === feat.name.toLowerCase(),
    );
    const catalogDesc = resolveFeatText(feat.name, sel?.id);
    addFeature(
      feat.name,
      catalogDesc || feat.grantedBy,
      "feat",
      feat.source || "Feat",
    );
  }
  for (const sel of snapshotFeatSelections) {
    const already = features.some(
      (f) =>
        f.sourceKind === "feat" &&
        f.name.toLowerCase() === sel.name.toLowerCase(),
    );
    if (already) continue;
    const catalogDesc = resolveFeatText(sel.name, sel.id);
    addFeature(sel.name, catalogDesc || sel.name, "feat", sel.source || "Feat");
  }

  for (const ofeat of json.provenance?.optionalFeatures ?? []) {
    const opt = optionalByName.get(ofeat.name.trim().toLowerCase());
    const desc =
      (opt?.entries ?? []).join("\n").trim() ||
      ofeat.grantedBy.join(", ") ||
      ofeat.name;
    addFeature(ofeat.name, desc, "class", "Optional Feature");
  }

  // Enrich from class progression when available
  if (classData?.progression) {
    for (const row of classData.progression) {
      if (row.level > level) continue;
      for (const f of row.features) {
        const desc = (f.description ?? []).join("\n") || f.name;
        const already = features.some(
          (x) => x.name.toLowerCase() === f.name.toLowerCase(),
        );
        if (already) {
          const idx = features.findIndex(
            (x) => x.name.toLowerCase() === f.name.toLowerCase(),
          );
          if (
            idx >= 0 &&
            ((f.description?.length ?? 0) > 0 ||
              isStubFeatureDescription(
                features[idx].name,
                features[idx].description,
                features[idx].sourceKind,
              ))
          ) {
            features[idx] = mapFeatureFromText({
              id: features[idx].id,
              name: f.name,
              description: desc,
              sourceKind: "class",
              sourceLabel: classData.name,
              level: row.level,
              proficiencyBonus: pb,
              primaryAbilityMod: primaryMod,
              speciesDarkvision,
              speciesResistances,
            });
          }
          continue;
        }
        addFeature(f.name, desc, "class", classData.name, row.level);
      }
    }
  }

  // Standard actions
  STANDARD_ACTIONS.forEach((sa, idx) => {
    features.push({
      ...sa,
      id: `standard-${idx}`,
    });
  });

  const strMod = abilities.str.mod;
  const dexMod = abilities.dex.mod;
  const attackMod = Math.max(strMod, dexMod);
  const attacks = buildAttacksFromEquipment(json, attackMod, pb);

  // Unarmed strike
  attacks.push({
    id: "atk-unarmed",
    name: "Unarmed Strike",
    attackBonus: strMod + pb,
    damage: [{ expression: `1+${strMod}`, type: "bludgeoning" }],
    properties: [],
    critRange: 20,
    bucket: "action",
    sourceKind: "standard",
  });

  // Spells
  let spellcasting: PlaySpellcasting | null = null;
  const spellSelections = json.snapshot.spellSelections ?? {};
  const allSpellRefs = Object.values(spellSelections).flat();
  const className = json.identity.class?.name ?? "";
  const spellAbility = guessSpellAbility(className);
  const { slots, pact } = parseSlotTotalsFromClass(classData, level);

  if (allSpellRefs.length > 0 || Object.keys(slots).length > 0 || pact) {
    const catalog = await getAllSpells().catch(() => [] as Spell[]);
    const byId = new Map(catalog.map((s) => [s.id, s]));
    const byName = new Map(catalog.map((s) => [s.name.toLowerCase(), s]));

    const spells: PlaySpell[] = [];
    allSpellRefs.forEach((sel, idx) => {
      const found =
        (sel.id ? byId.get(sel.id) : undefined) ??
        byName.get(sel.name.toLowerCase());
      spells.push(
        mapCatalogSpellToPlay(
          found,
          { name: sel.name, level: sel.level, id: sel.id },
          idx,
        ),
      );
    });

    // Also provenance spells + granted spells
    const provenanceSpellNames = [
      ...(json.provenance?.spells ?? []).map((ps) => ({
        name: ps.name,
        level: ps.level,
      })),
      ...(json.provenance?.grantedSpells ?? []).map((gs) => ({
        name: gs.name,
        level: undefined as number | undefined,
      })),
    ];
    for (const ps of provenanceSpellNames) {
      if (spells.some((s) => s.name.toLowerCase() === ps.name.toLowerCase())) {
        continue;
      }
      const found = byName.get(ps.name.toLowerCase());
      const play = mapCatalogSpellToPlay(
        found,
        { name: ps.name, level: ps.level ?? found?.level },
        spells.length,
      );
      play.prepared = true;
      spells.push(play);
    }

    const abilityKey = (toAbilityKey(spellAbility) ?? spellAbility) as AbilityKey | "";
    const spellMod = abilityKey ? abilities[abilityKey].mod : 0;
    const isPact = Boolean(pact) || /warlock/i.test(className);

    spellcasting = {
      ability: abilityKey || "",
      mod: spellMod,
      saveDc: 8 + pb + spellMod,
      attackBonus: pb + spellMod,
      slotMax: isPact ? {} : slots,
      pact: isPact
        ? pact ?? { max: 1, level: 1 }
        : undefined,
      isPreparedCaster: /(cleric|druid|wizard|paladin|artificer|ranger)/i.test(
        className,
      ),
      isPactMagic: isPact,
      preparedMax: undefined,
      spells,
    };
  }

  const hitDie: PlayHitDie[] = [];
  const rawHit = classData?.hitDie ?? "d8";
  const dieNorm = rawHit.startsWith("d")
    ? rawHit.replace(/^1/, "")
    : `d${rawHit.replace(/\D/g, "") || "8"}`;
  hitDie.push({
    die: dieNorm.startsWith("d") ? dieNorm : `d${dieNorm}`,
    max: level,
  });

  const size = normalizeBuilderCreatureSize(json.core.size || "M");
  const capacity = getCarryingCapacity(scores.str, size);
  const perceptionMod = skills.prc ?? abilities.wis.mod;

  const dieMatch = hitDie[0]?.die.match(/d(\d+)/);
  const dieSize = dieMatch ? parseInt(dieMatch[1], 10) : 8;
  const con = abilities.con.mod;
  const hpMax =
    level <= 1
      ? dieSize + con
      : dieSize +
        con +
        (level - 1) * (Math.floor(dieSize / 2) + 1 + con);

  const ac = armorClassFromSnapshot(json, abilities.dex.mod);

  const multiclassPartial = (json.multiclass?.entries?.length ?? 0) > 0;

  let subclassData: Subclass | null = null;
  if (classData && json.identity.subclass) {
    const subs = subclassesForClassVariant(classData);
    const subRef = json.identity.subclass;
    subclassData =
      subs.find((s) => s.id === subRef.id) ??
      subs.find((s) => s.name.toLowerCase() === (subRef.name ?? "").toLowerCase()) ??
      null;
  }

  const resolvedFeatEntities: Feat[] = [];
  for (const sel of snapshotFeatSelections) {
    const feat =
      (sel.id ? featById.get(sel.id) : undefined) ??
      featByName.get(sel.name.trim().toLowerCase());
    if (feat) resolvedFeatEntities.push(feat);
  }
  const featSpeedBonuses = resolvedFeatEntities.flatMap((feat) =>
    detectFeatSpeedBonuses(feat),
  );

  const speedBreakdown = getCharacterSpeedBreakdown({
    creatureSize: size,
    speciesSpeedText: speciesBase?.speed,
    speciesName: speciesBase?.name ?? json.provenance?.species?.name,
    classData,
    subclass: subclassData,
    level,
    featBonuses: featSpeedBonuses,
  });
  const classSpeedBonuses = detectClassSpeedBonuses(
    classData,
    subclassData,
    level,
  );
  for (const bonus of [...classSpeedBonuses, ...featSpeedBonuses]) {
    const idx = features.findIndex(
      (f) => f.name.toLowerCase() === bonus.label.toLowerCase(),
    );
    if (idx < 0) continue;
    const label =
      bonus.note === "equal to walking speed"
        ? `${bonus.type} = walk`
        : bonus.amount > 0
          ? `${bonus.type === "walk" ? "Speed" : bonus.type} +${bonus.amount} ft.`
          : `${bonus.type} ${bonus.amount} ft.`;
    const existing = features[idx].statEffects ?? [];
    if (existing.some((e) => e.kind === "speed" && e.label === label)) continue;
    features[idx] = {
      ...features[idx],
      statEffects: [...existing, { kind: "speed", label }],
    };
  }

  return {
    name: json.core.name || "Unnamed",
    species: json.identity.species?.name ?? json.provenance?.species?.name ?? "",
    background:
      json.identity.background?.name ??
      json.provenance?.background?.name ??
      "",
    className: json.identity.class?.name ?? "",
    subclass: json.identity.subclass?.name ?? "",
    level,
    size: size === "S" ? "S" : "M",
    speedDisplay: speedBreakdown.display,
    speedFt: speedBreakdown.speed.walk ?? 30,
    initiativeMod: abilities.dex.mod,
    passivePerception: 10 + perceptionMod,
    proficiencyBonus: pb,
    armorClass: ac,
    hpMax: Math.max(1, hpMax),
    hitDice: hitDie,
    abilities,
    abilityScores: scores,
    savingThrows,
    saveProficiencies,
    skills,
    skillProficiencies,
    languages: (json.provenance?.languages ?? []).map((l) => l.name),
    weaponProficiencies: (json.provenance?.weapons ?? []).map((w) => w.name),
    armorProficiencies: (json.provenance?.armor ?? []).map((a) => a.name),
    toolProficiencies: (json.provenance?.tools ?? []).map((t) => t.name),
    features,
    attacks,
    spellcasting,
    resources: buildPlayResources(classData, level, features),
    carryingCapacityLb: capacity.carryLb,
    attunementMax: 3,
    rulesEdition,
    portraitImage: json.art?.portrait ?? null,
    notes: json.snapshot.backstoryNotes ?? "",
    multiclassPartial,
  };
}

function extractGoldFromSnapshot(json: BuilderCharacterJson): number {
  let gp = 0;
  for (const entry of json.snapshot.equipment.inventory ?? []) {
    const m = entry.name.trim().match(/^(\d+(?:\.\d+)?)\s*gp$/i);
    if (m) gp += parseFloat(m[1]) * (entry.quantity || 1);
  }
  return gp;
}

function inventoryModsFromCompiled(compiled: PlayCharacterCompiled): {
  attackAbilityMod: number;
  proficiencyBonus: number;
} {
  return {
    attackAbilityMod: Math.max(
      compiled.abilities.str.mod,
      compiled.abilities.dex.mod,
    ),
    proficiencyBonus: compiled.proficiencyBonus,
  };
}

export async function createPlayCharacterRecord(
  json: BuilderCharacterJson,
  existingId?: string,
): Promise<PlayCharacterRecord> {
  const compiled = await compilePlayCharacterFromBuilderJson(json);
  const now = new Date().toISOString();
  const session = createInitialSession(compiled);
  const mods = inventoryModsFromCompiled(compiled);
  session.inventory = inventoryFromSnapshot(
    json,
    mods.attackAbilityMod,
    mods.proficiencyBonus,
  );

  const gp = extractGoldFromSnapshot(json);
  if (gp > 0) session.currency = { ...session.currency, gp: Math.floor(gp) };

  return {
    id: existingId ?? crypto.randomUUID(),
    version: 1,
    compiled,
    builderJson: json,
    session,
    createdAt: now,
    updatedAt: now,
  };
}

/** Merge a newly compiled build into an existing record, preserving session. */
export async function recompilePlayCharacterRecord(
  existing: PlayCharacterRecord,
  json: BuilderCharacterJson,
  options: { replaceInventory?: boolean } = {},
): Promise<PlayCharacterRecord> {
  const compiled = await compilePlayCharacterFromBuilderJson(json);
  let session = {
    ...existing.session,
    hp: {
      ...existing.session.hp,
      max: compiled.hpMax,
      current: Math.min(existing.session.hp.current, compiled.hpMax),
    },
  };
  if (options.replaceInventory) {
    const mods = inventoryModsFromCompiled(compiled);
    session = {
      ...session,
      inventory: inventoryFromSnapshot(
        json,
        mods.attackAbilityMod,
        mods.proficiencyBonus,
      ),
    };
    const gp = extractGoldFromSnapshot(json);
    if (gp > 0) {
      session = {
        ...session,
        currency: { ...session.currency, gp: Math.floor(gp) },
      };
    }
  }
  return {
    ...existing,
    compiled,
    builderJson: json,
    session,
    updatedAt: new Date().toISOString(),
  };
}
