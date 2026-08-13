import type { SkillKey } from "@/shared/types";
import { SKILL_ABILITY, ABILITY_KEYS } from "@/shared/constants/dnd";
import type { FoundryActor, FoundryItem } from "@/shared/foundry";
import {
  buildStats,
  buildPrototypeToken,
  DEFAULT_OWNERSHIP,
  ensureActivityMidiProperties,
  FULL_CASTER_SLOTS,
  effectiveCasterLevel,
  mapLanguage,
  mapArmorProficiency,
  mapSize,
  mapTool,
  mapWeaponProficiency,
  toolAbility,
} from "@/shared/foundry";
import { applyItemAutomation } from "@/shared/foundry/weapons";
import { toBuilderSnapshotFlags } from "./builder-snapshot";
import {
  buildArmorItem,
  buildBackgroundItem,
  buildClassItem,
  buildFeatItem,
  buildInventoryItem,
  buildRaceItem,
  buildSpellItem,
  buildSubclassItem,
  buildTrinketItem,
  buildWeaponItem,
  type InventoryCatalogMeta,
} from "./item.builders";
import {
  buildHitPointsAdvancement,
  buildScaleValueAdvancements,
  buildSizeAdvancement,
  buildTraitAdvancement,
} from "./advancement.builders";
import { buildRuneFoundryItem } from "@/features/amellwind/runes/utils/rune-foundry-export";
import {
  stampAdvancementOrigins,
  buildFeatureItems,
  itemGrantsByLevel,
} from "./actor-feature-advancement";
import type { FoundryExportInput } from "./actor-export.types";

export type {
  FeatureInput,
  ClassInfoInput,
  SubclassInfoInput,
  RaceInfoInput,
  BackgroundInfoInput,
  FoundryExportInput,
} from "./actor-export.types";

export function buildFoundryActor(input: FoundryExportInput): FoundryActor {
  const items: FoundryItem[] = [];
  const descFor = (name: string): string | undefined =>
    input.itemDescriptions?.[name.trim().toLowerCase()];
  const catalogFor = (name: string): InventoryCatalogMeta | undefined => {
    const key = name.trim().toLowerCase();
    const fromCatalog = input.itemCatalog?.[key];
    if (fromCatalog) return fromCatalog;
    const description = descFor(name);
    return description ? { description } : undefined;
  };
  const imgFor = (name: string): string | undefined =>
    input.itemImages?.[name.trim().toLowerCase()];

  let classId: string | null = null;
  let subclassId: string | null = null;
  let raceId: string | null = null;
  let backgroundId: string | null = null;

  // Class + class features
  if (input.classInfo) {
    const { items: featureItems, byLevel } = buildFeatureItems(
      input.classInfo.features,
    );
    items.push(...featureItems);

    const itemGrants = itemGrantsByLevel(byLevel);
    const advancement: Record<string, unknown>[] = [
      buildHitPointsAdvancement(),
      buildTraitAdvancement(
        "Saving Throws",
        input.classInfo.saveProficiencies.map((a) => `saves:${a}`),
        input.classInfo.saveProficiencies.map((a) => `saves:${a}`),
        1,
        "primary",
      ),
      ...buildScaleValueAdvancements(input.classInfo.identifier),
      ...itemGrants,
    ];

    const classItem = buildClassItem({
      name: input.classInfo.name,
      identifier: input.classInfo.identifier,
      source: input.classInfo.source,
      levels: input.classInfo.levels,
      hitDie: input.classInfo.hitDie,
      spellcastingProgression: input.classInfo.spellcastingProgression,
      spellcastingAbility: input.classInfo.spellcastingAbility,
      primaryAbilities: input.classInfo.primaryAbilities,
      description: input.classInfo.description,
      img: input.classInfo.img,
      advancement,
    });
    classId = classItem._id;
    stampAdvancementOrigins(featureItems, itemGrants, classId);
    items.push(classItem);
  }

  // Subclass + subclass features
  if (input.subclassInfo) {
    const { items: featureItems, byLevel } = buildFeatureItems(
      input.subclassInfo.features.map((f) => ({
        ...f,
        subtype: f.subtype === "class" ? "subclass" : f.subtype,
      })),
    );
    items.push(...featureItems);
    const itemGrants = itemGrantsByLevel(byLevel);
    const subclassItem = buildSubclassItem({
      name: input.subclassInfo.name,
      identifier: input.subclassInfo.identifier,
      classIdentifier: input.subclassInfo.classIdentifier,
      source: input.subclassInfo.source,
      spellcastingProgression: input.subclassInfo.spellcastingProgression,
      spellcastingAbility: input.subclassInfo.spellcastingAbility,
      description: input.subclassInfo.description,
      img: input.subclassInfo.img,
      advancement: itemGrants,
    });
    subclassId = subclassItem._id;
    stampAdvancementOrigins(featureItems, itemGrants, subclassId);
    items.push(subclassItem);
  }

  // Race + traits
  if (input.raceInfo) {
    const { items: featureItems, byLevel } = buildFeatureItems(
      input.raceInfo.features,
    );
    items.push(...featureItems);
    const itemGrants = itemGrantsByLevel(
      byLevel,
      "icons/environment/people/group.webp",
    );
    const advancement: Record<string, unknown>[] = [
      buildSizeAdvancement(mapSize(input.raceInfo.size)),
      ...itemGrants,
    ];
    const raceItem = buildRaceItem({
      name: input.raceInfo.name,
      identifier: input.raceInfo.identifier,
      source: input.raceInfo.source,
      walkSpeed: input.raceInfo.walkSpeed,
      creatureType: input.raceInfo.creatureType,
      subtype: input.raceInfo.subtype,
      size: mapSize(input.raceInfo.size),
      senses: { darkvision: input.raceInfo.darkvision ?? null },
      description: input.raceInfo.description,
      img: input.raceInfo.img,
      advancement,
    });
    raceId = raceItem._id;
    stampAdvancementOrigins(featureItems, itemGrants, raceId);
    items.push(raceItem);
  }

  // Background + features
  if (input.backgroundInfo) {
    const { items: featureItems, byLevel } = buildFeatureItems(
      input.backgroundInfo.features,
    );
    items.push(...featureItems);
    const itemGrants = itemGrantsByLevel(byLevel);
    const backgroundItem = buildBackgroundItem({
      name: input.backgroundInfo.name,
      identifier: input.backgroundInfo.identifier,
      source: input.backgroundInfo.source,
      description: input.backgroundInfo.description,
      img: input.backgroundInfo.img,
      advancement: itemGrants,
    });
    backgroundId = backgroundItem._id;
    stampAdvancementOrigins(featureItems, itemGrants, backgroundId);
    items.push(backgroundItem);
  }

  // Standalone feats (origin feats, ASI feats, optional-feature picks, …)
  for (const feat of input.feats) {
    let advancementOrigin: string | undefined;
    if (feat.originKind === "class" && classId) advancementOrigin = classId;
    else if (feat.originKind === "subclass" && subclassId) {
      advancementOrigin = subclassId;
    } else if (feat.originKind === "race" && raceId) advancementOrigin = raceId;
    else if (feat.originKind === "background" && backgroundId) {
      advancementOrigin = backgroundId;
    }
    items.push(
      buildFeatItem({
        name: feat.name,
        description: feat.description,
        subtype: feat.subtype,
        identifier: feat.identifier,
        img: feat.img ?? imgFor(feat.name),
        advancementOrigin,
      }),
    );
  }

  // Weapons
  for (const w of input.weapons) {
    const weaponItem = buildWeaponItem(w.equipped, {
      equipped: w.isEquipped,
      attackAbility: w.attackAbility,
      description: w.equipped.weapon.description,
      img: imgFor(w.equipped.weapon.name),
    });
    const magical =
      Number(
        (weaponItem.system as Record<string, unknown>).magicalBonus ?? 0,
      ) > 0;
    ensureActivityMidiProperties(weaponItem, {
      magicDamage: magical,
      magicEffect: magical,
    });
    items.push(weaponItem);
  }

  // Armor / shields
  for (const a of input.armors) {
    items.push(
      buildArmorItem(
        a.armor,
        a.equipped,
        a.armor.description ?? descFor(a.armor.name),
        imgFor(a.armor.name),
      ),
    );
  }

  // Trinkets
  for (const t of input.trinkets) {
    items.push(buildTrinketItem(t, descFor(t), imgFor(t)));
  }

  // Inventory (tools / clothing / consumables / loot)
  for (const entry of input.loot) {
    items.push(
      buildInventoryItem(entry, catalogFor(entry.name), imgFor(entry.name)),
    );
  }

  // Embedded runes (equipment trinkets with AE)
  for (const entry of input.runes ?? []) {
    const runeItem = buildRuneFoundryItem(entry.rune, entry.slotContext);
    // Mark as equipped so transfer AE apply when the actor is imported.
    (runeItem.system as Record<string, unknown>).equipped = true;
    items.push(runeItem);
  }

  // Spells
  for (const spell of input.spells) {
    items.push(buildSpellItem(spell));
  }

  // Enrich items with Midi-QoL / DAE automation (Plutonium-style overlays).
  for (const item of items) {
    applyItemAutomation(item);
  }

  // ── system.abilities ──
  const abilities: Record<string, unknown> = {};
  const saveSet = new Set(input.saveProficiencies);
  for (const key of ABILITY_KEYS) {
    abilities[key] = {
      value: input.abilities[key],
      proficient: saveSet.has(key) ? 1 : 0,
      max: null,
      bonuses: { check: "", save: "" },
      check: { roll: { min: null, max: null, mode: 0 } },
      save: { roll: { min: null, max: null, mode: 0 } },
    };
  }

  // ── system.skills ──
  const skills: Record<string, unknown> = {};
  for (const key of Object.keys(SKILL_ABILITY) as SkillKey[]) {
    skills[key] = {
      ability: SKILL_ABILITY[key],
      roll: { min: null, max: null, mode: 0 },
      value: input.skillProficiencies[key] ?? 0,
      bonuses: { check: "", passive: "" },
    };
  }

  // ── system.tools ──
  const tools: Record<string, unknown> = {};
  for (const label of input.tools) {
    const id = mapTool(label);
    if (!id || tools[id]) continue;
    tools[id] = {
      value: 1,
      ability: toolAbility(id),
      roll: { min: null, max: null, mode: 0 },
      bonuses: { check: "" },
    };
  }

  // ── system.traits ──
  const languageKeys: string[] = [];
  const languageCustom: string[] = [];
  for (const label of input.languages) {
    const mapped = mapLanguage(label);
    if (mapped.key) {
      if (!languageKeys.includes(mapped.key)) languageKeys.push(mapped.key);
    } else if (mapped.custom) {
      languageCustom.push(mapped.custom);
    }
  }

  const weaponProf = [
    ...new Set(input.weaponProficiencies.map(mapWeaponProficiency)),
  ];
  const armorProf = [
    ...new Set(
      input.armorProficiencies
        .map(mapArmorProficiency)
        .filter((p): p is string => p !== null),
    ),
  ];

  const traits = {
    size: mapSize(input.size),
    di: { value: input.immunities, custom: "", bypasses: [] },
    dr: { value: input.resistances, custom: "", bypasses: [] },
    dv: { value: [], custom: "", bypasses: [] },
    dm: { amount: {}, bypasses: [] },
    ci: { value: [], custom: "" },
    languages: {
      value: languageKeys,
      custom: languageCustom.join(";"),
      communication: { telepathy: { value: null, units: "ft" } },
    },
    weaponProf: {
      value: weaponProf,
      custom: "",
      mastery: {
        value: [...new Set(input.weaponMasteryBaseItems ?? [])],
        bonus: [],
      },
    },
    armorProf: { value: armorProf, custom: "" },
  };

  // ── system.attributes ──
  const movement: Record<string, unknown> = {
    burrow: input.speed.burrow ?? null,
    climb: input.speed.climb ?? null,
    fly: input.speed.fly ?? null,
    swim: input.speed.swim ?? null,
    walk: input.speed.walk ?? null,
    units: "ft",
    hover: input.speed.hover ?? false,
  };

  const attributes = {
    ac:
      input.acCalc === "flat"
        ? { calc: "flat", flat: input.acFlat ?? 10 }
        : { calc: input.acCalc, flat: null },
    init: {
      ability: input.initiativeAbility,
      roll: { min: null, max: null, mode: 0 },
      bonus: "",
    },
    movement,
    attunement: { max: input.attunementMax },
    senses: {
      darkvision: input.darkvision ?? null,
      blindsight: null,
      tremorsense: null,
      truesight: null,
      units: "ft",
      special: "",
    },
    spellcasting: input.spellcastingAbility,
    exhaustion: 0,
    concentration: {
      ability: "",
      roll: { min: null, max: null, mode: 0 },
      bonuses: { save: "" },
      limit: 1,
    },
    loyalty: { value: null },
    hp: {
      value: input.hp,
      max: input.hp,
      temp: null,
      tempmax: 0,
      bonuses: { overall: "", level: "" },
    },
    death: {
      roll: { min: null, max: null, mode: 0 },
      success: 0,
      failure: 0,
      bonuses: { save: "" },
    },
    inspiration: false,
  };

  // ── system.details ──
  const details = {
    biography: { value: input.biography ? `<p>${input.biography}</p>` : "", public: "" },
    alignment: input.alignment,
    ideal: "",
    bond: "",
    flaw: "",
    race: raceId,
    background: backgroundId,
    originalClass: classId,
    xp: { value: input.xp },
    appearance: "",
    trait: "",
    eyes: "",
    height: "",
    faith: "",
    hair: "",
    weight: "",
    gender: "",
    skin: "",
    age: "",
  };

  // ── system.spells ──
  const spells: Record<string, unknown> = {};
  const slotArray =
    input.casterProgression !== "none" && input.casterProgression !== "pact"
      ? FULL_CASTER_SLOTS[
          effectiveCasterLevel(input.casterLevel, input.casterProgression)
        ] ?? []
      : [];
  for (let lvl = 1; lvl <= 9; lvl++) {
    spells[`spell${lvl}`] = { value: slotArray[lvl - 1] ?? 0, override: null };
  }
  spells.pact = input.pactSlots
    ? { value: input.pactSlots.count, override: null }
    : { value: 0, override: null };

  const system = {
    abilities,
    bonuses: {
      mwak: { attack: "", damage: "" },
      rwak: { attack: "", damage: "" },
      msak: { attack: "", damage: "" },
      rsak: { attack: "", damage: "" },
      abilities: { check: "", save: "", skill: "" },
      spell: { dc: "" },
    },
    skills,
    tools,
    spells,
    attributes,
    details,
    traits,
    currency: input.currency,
    resources: {
      primary: { value: null, max: null, sr: false, lr: false, label: "" },
      secondary: { value: null, max: null, sr: false, lr: false, label: "" },
      tertiary: { value: null, max: null, sr: false, lr: false, label: "" },
    },
    bastion: { name: "", description: "" },
    favorites: [],
  };

  const DEFAULT_ART = "icons/svg/mystery-man.svg";
  const portraitSrc = input.portraitImage || DEFAULT_ART;
  const tokenSrc = input.tokenImage || input.portraitImage || DEFAULT_ART;

  return {
    name: input.name,
    type: "character",
    img: portraitSrc,
    system,
    items,
    effects: [],
    prototypeToken: buildPrototypeToken(input.name, tokenSrc),
    folder: null,
    sort: 0,
    ownership: { ...DEFAULT_OWNERSHIP },
    flags: input.builderSnapshot ? toBuilderSnapshotFlags(input.builderSnapshot) : {},
    _stats: buildStats(),
  };
}
