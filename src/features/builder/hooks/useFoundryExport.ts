import { useCallback, useState } from "react";
import type { CartEntry, EquippedWeapon, Rune, SkillKey } from "@/shared/types";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { useSelectedClass, useSelectedSubclass } from "./useBuilderSelections";
import { useSelectedBackground } from "./useSelectedBackground";
import { useCharacterHitPoints } from "./useCharacterHitPoints";
import { useCharacterArmorClass } from "./useCharacterArmorClass";
import { useCharacterSpeed } from "./useCharacterSpeed";
import { useSpellcasting } from "./useSpellcasting";
import { useSpellCatalog } from "./useSpellCatalog";
import { useOptionalFeatureSpellGrants } from "./useOptionalFeatureSpellGrants";
import { useCantripPools } from "./useCantripPools";
import { getAttunementInfo } from "../utils/attunement.utils";
import { standaloneShieldToArmorItem } from "../data/shield.data";
import { SKILL_ORDER } from "@/shared/constants/dnd";
import {
  getXpForLevel,
  loadFeatExportLookups,
  sumInventoryGoldGp,
  isGoldInventoryEntry,
  type FeatExportDescLookup,
  type OptionalFeatureDescMap,
} from "../utils/character-sheet-export.utils";
import type {
  Class,
  OptionalFeatureProgression,
  Subclass,
} from "@/shared/types";
import { buildFoundryActor, downloadFoundryActor } from "../foundry-export";
import type {
  FeatureInput,
  FoundryExportInput,
  BuilderChoiceSnapshot,
} from "../foundry-export";
import { BUILDER_SNAPSHOT_VERSION } from "../foundry-export";
import { kebab, mapAbilityLabel, mapCasterProgression } from "../foundry-export/mappings";
import {
  resolveBackgroundFluffForFoundry,
  resolveClassFluffForFoundry,
  resolveRaceFluffForFoundry,
  resolveSubclassFluffForFoundry,
  prefetchFoundryEntityFluffImgs,
  getSpellFluffImgSync,
  getItemFluffImgSync,
  getFeatFluffImgSync,
} from "../foundry-export/fluff-lookup";
import {
  buildBackgroundIdentityDescription,
  buildClassIdentityDescription,
  buildRaceIdentityDescription,
  buildSubclassIdentityDescription,
} from "../foundry-export/identity-description";
import { renderFiveToolsEntries } from "../foundry-export/fluff-description";
import { buildSpellExportList } from "../foundry-export/spell-export.utils";
import { FOUNDRY_ITEM_ICONS, resolveItemIcon } from "../foundry-export/foundry-icons";
import { downloadCharacterImages } from "../utils/image-download.utils";
import { getAllDndItems } from "@/features/dnd-items/services/dnd-item.service";
import type { DndItem } from "@/shared/types/dnd-item.types";
import type {
  InventoryCatalogMeta,
  SpellItemInput,
} from "../foundry-export/item.builders";
import { parseWeightLb } from "../foundry-export/item.builders";
import { getWeaponMasteryWeapon } from "../data/weapon-mastery.data";
import { slugify } from "../foundry-export/mappings";

const ALIGNMENT_LABELS: Record<string, string> = {
  L: "Lawful", N: "Neutral", C: "Chaotic", G: "Good", E: "Evil",
};

/** Converts the builder's alignment axis codes (e.g. ["L","G"]) to a label. */
function formatAlignment(codes: string[] | undefined): string {
  if (!codes || codes.length === 0) return "";
  const words = codes.map((c) => ALIGNMENT_LABELS[c] ?? c);
  if (words.length === 2 && words[0] === "Neutral" && words[1] === "Neutral") {
    return "True Neutral";
  }
  return words.join(" ");
}

function joinDescription(lines: string[] | undefined): string | undefined {
  if (!lines || lines.length === 0) return undefined;
  // Keep raw 5etools tags; foundry-export description enrichers convert them.
  return lines.join("\n\n");
}

/** Prefers raw 5etools entries (with `{@…}` tags) when present on a class feature. */
function featureDescriptionHtml(
  feature: Class["progression"][number]["features"][number],
): string | undefined {
  if (feature.rawEntries?.length) {
    const html = renderFiveToolsEntries(feature.rawEntries).trim();
    if (html) return html;
  }
  return joinDescription(feature.description);
}

/** Extracts class/subclass feature items up to a character level for advancement grants. */
function extractFeatures(
  progression: Class["progression"] | Subclass["progression"],
  level: number,
  subtype: FeatureInput["subtype"],
  onlySubclass: boolean,
  excludeNames?: Set<string>,
): FeatureInput[] {
  const features: FeatureInput[] = [];
  for (const row of progression) {
    if (row.level > level) continue;
    for (const feature of row.features) {
      if (feature.gainSubclassFeature) continue;
      if (onlySubclass && !feature.isSubclassFeature) continue;
      if (!onlySubclass && feature.isSubclassFeature) continue;
      const name = feature.displayName || feature.name;
      if (!name) continue;
      if (excludeNames?.has(name.toLowerCase())) continue;
      features.push({
        name,
        description: featureDescriptionHtml(feature),
        subtype,
        level: row.level,
      });
    }
  }
  return features;
}

/** Names of optional-feature progressions that are replaced by explicit selections. */
function progressionHandledNames(
  progressions: OptionalFeatureProgression[],
): Set<string> {
  const names = new Set<string>();
  for (const p of progressions) {
    const lower = p.name.toLowerCase();
    names.add(lower);
    names.add(lower.replace(/ options$/i, "").trim());
  }
  return names;
}

/** Resolves the full description lines for a selected optional feature. */
function resolveOptionalDescription(
  progression: OptionalFeatureProgression,
  pickId: string,
  optDescMap: OptionalFeatureDescMap,
): string[] {
  if (progression.catalog === "feature-choice") {
    const opt = (progression.choiceOptions ?? []).find((o) => o.id === pickId);
    return opt?.entries ?? [];
  }
  return optDescMap.get(pickId) ?? [];
}

/**
 * Gathers the lossless builder-choice snapshot embedded as a Foundry actor flag
 * so that optional selections and equipment metadata survive a re-import.
 */
function gatherBuilderSnapshot(
  builder: ReturnType<typeof useCharacterBuilder>,
  inventory: ReturnType<typeof useBuilderInventory>,
): BuilderChoiceSnapshot {
  return {
    version: BUILDER_SNAPSHOT_VERSION,
    useAmellwindHomebrew: builder.useAmellwindHomebrew,
    abilityScoreMethod: builder.abilityScoreMethod,
    useUnarmedStrike: builder.useUnarmedStrike,
    attacksPerTurnOverride: builder.attacksPerTurnOverride,
    faction: builder.faction,
    personality: builder.personality,

    featSelections: builder.featSelections,
    speciesOriginFeat: builder.speciesOriginFeat,
    backgroundOriginFeat: builder.backgroundOriginFeat,
    optionalFeatureOriginFeats: builder.optionalFeatureOriginFeats,
    originFeatSkillChoices: builder.originFeatSkillChoices,
    optionalFeatureOriginFeatSkillChoices:
      builder.optionalFeatureOriginFeatSkillChoices,
    optionalFeatureSelections: builder.optionalFeatureSelections ?? {},
    speciesSpellGroupChoice: builder.speciesSpellGroupChoice,

    useTashaOrigin: builder.useTashaOrigin,
    tashaPlus2: builder.tashaPlus2,
    tashaPlus1: builder.tashaPlus1,
    speciesAbilityChoices: builder.speciesAbilityChoices,
    backgroundAsiMode: builder.backgroundAsiMode,
    backgroundAsiPlus2: builder.backgroundAsiPlus2,
    backgroundAsiPlus1: builder.backgroundAsiPlus1,

    classSkillChoices: builder.classSkillChoices,
    backgroundSkillChoices: builder.backgroundSkillChoices,
    speciesSkillChoices: builder.speciesSkillChoices,
    featSkillChoices: builder.featSkillChoices,
    expertiseChoices: builder.expertiseChoices,
    classToolChoices: builder.classToolChoices,
    backgroundToolChoices: builder.backgroundToolChoices,
    speciesToolChoices: builder.speciesToolChoices,
    classLanguageChoices: builder.classLanguageChoices,
    backgroundLanguageChoices: builder.backgroundLanguageChoices,
    speciesLanguageChoices: builder.speciesLanguageChoices,
    speciesDefenseChoices: builder.speciesDefenseChoices,

    spellSelections: builder.spellSelections ?? {},

    equipment: {
      mainHand: builder.mainHand,
      offHand: builder.offHand,
      armor: builder.armor,
      shield: builder.equippedShield,
      trinket1: builder.trinket1,
      trinket2: builder.trinket2,
      inventory: inventory.items,
    },
  };
}

export function useFoundryExport() {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const { classData } = useSelectedClass();
  const subclassData = useSelectedSubclass();
  const backgroundData = useSelectedBackground();
  const hitPoints = useCharacterHitPoints();
  const armorClass = useCharacterArmorClass();
  const speed = useCharacterSpeed();
  const { allSpells } = useSpellCatalog();
  const optionalFeatureSpellGrants = useOptionalFeatureSpellGrants(
    builder.optionalFeatureSelections ?? {},
    builder.character.level,
    classData,
    subclassData,
  );
  const { bonusPools: bonusCantripPools } = useCantripPools(
    builder.optionalFeatureSelections ?? {},
    classData,
    subclassData,
    builder.character.level,
    {
      speciesOriginFeat: builder.speciesOriginFeat,
      backgroundOriginFeat: builder.backgroundOriginFeat,
      speciesOriginFeatGrant: builder.speciesOriginFeatGrant,
      backgroundOriginFeatGrant: builder.backgroundOriginFeatGrant,
      featSelections: builder.featSelections,
    },
  );
  const spellcasting = useSpellcasting(
    classData,
    subclassData,
    builder.character.level,
    builder.character.abilities,
    builder.spellSelections ?? {},
    builder.optionalFeatureSelections ?? {},
    optionalFeatureSpellGrants,
    builder.faction,
    builder.character.level,
    undefined,
    bonusCantripPools,
  );

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildInput = useCallback(
    (
      featLookup: FeatExportDescLookup,
      optDescMap: OptionalFeatureDescMap,
      itemDescriptions: Record<string, string>,
      itemCatalog: Record<string, InventoryCatalogMeta> = {},
    ): FoundryExportInput => {
    const { character } = builder;
    const level = character.level;

    // ── Skill proficiencies (1 = proficient, 2 = expertise) ──
    const skillProficiencies: Partial<Record<SkillKey, 1 | 2>> = {};
    for (const key of SKILL_ORDER) {
      if (builder.expertiseSources[key] !== undefined) {
        skillProficiencies[key] = 2;
      } else if ((builder.skillSources[key]?.length ?? 0) > 0) {
        skillProficiencies[key] = 1;
      }
    }

    // ── Spellcasting derivation ──
    const subFromSubclass = spellcasting.spellcastingFromSubclass;
    const spellAbilityKey = mapAbilityLabel(spellcasting.spellcastingAbility);
    let casterProgression = "none";
    if (spellcasting.isPactMagic) {
      casterProgression = "pact";
    } else if (spellcasting.spellcastingAbility) {
      const source = subFromSubclass ? subclassData : classData;
      casterProgression = mapCasterProgression(source?.casterProgression);
    }
    const classProgression = subFromSubclass ? "none" : casterProgression;
    const subProgression = subFromSubclass ? casterProgression : "none";

    // ── AC calculation mode ──
    const className = (builder.class?.name ?? "").toLowerCase();
    let acCalc = "default";
    if (!builder.armor) {
      if (className.includes("monk")) acCalc = "unarmoredMonk";
      else if (className.includes("barbarian")) acCalc = "unarmoredBarb";
    }

    // ── Optional-feature progressions (Fighting Style, Invocations, etc.) ──
    const allProgressions: OptionalFeatureProgression[] = [
      ...(classData?.optionalFeatureProgressions ?? []),
      ...(subclassData?.optionalFeatureProgressions ?? []),
    ];
    const handledNames = progressionHandledNames(allProgressions);

    // ── Identity: class / subclass / race / background ──
    // Descriptions are placeholders; exportFoundry replaces them with full
    // 5etools fluff HTML + art when available.
    const classInfo: FoundryExportInput["classInfo"] =
      builder.class && classData
        ? {
            name: builder.class.name,
            identifier: kebab(builder.class.name),
            source: classData.source,
            hitDie: classData.hitDie,
            levels: level,
            spellcastingProgression: classProgression,
            spellcastingAbility: subFromSubclass ? "" : spellAbilityKey,
            primaryAbilities: [],
            description: classData.summary,
            saveProficiencies: classData.saveProficiencies,
            features: extractFeatures(
              classData.progression,
              level,
              "class",
              false,
              handledNames,
            ),
          }
        : null;

    const subclassInfo: FoundryExportInput["subclassInfo"] =
      builder.subclass && subclassData
        ? {
            name: builder.subclass.name,
            identifier: kebab(builder.subclass.name),
            classIdentifier: kebab(builder.class?.name ?? ""),
            source: subclassData.source,
            spellcastingProgression: subProgression,
            spellcastingAbility: subFromSubclass ? spellAbilityKey : "",
            description: subclassData.shortName,
            features: extractFeatures(
              subclassData.progression.map((row) => ({
                ...row,
                features: row.features.map((f) => ({
                  ...f,
                  isSubclassFeature: true,
                })),
              })),
              level,
              "subclass",
              true,
              handledNames,
            ),
          }
        : null;

    const speciesData = builder.speciesData;
    const raceInfo: FoundryExportInput["raceInfo"] =
      builder.species && speciesData
        ? {
            name: builder.species.name,
            identifier: kebab(builder.species.name),
            source: speciesData.source,
            walkSpeed: speed.speed.walk ?? 30,
            creatureType: "humanoid",
            size: speciesData.sizes.includes("Small") ? "S" : "M",
            darkvision: speciesData.darkvision ?? null,
            description: speciesData.fluff || undefined,
            features: speciesData.traits.map<FeatureInput>((trait) => ({
              name: trait.name,
              description: joinDescription(trait.entries),
              subtype: "race",
              level: 0,
            })),
          }
        : null;

    const useBackground = backgroundData && builder.background?.id === backgroundData.id
      ? backgroundData
      : null;
    const backgroundInfo: FoundryExportInput["backgroundInfo"] = builder.background
      ? {
          name: builder.background.name,
          identifier: kebab(builder.background.name),
          source: useBackground?.source,
          description: useBackground?.fluff || undefined,
          features: (useBackground?.features ?? []).map<FeatureInput>((section) => ({
            name: section.name,
            description: joinDescription(section.entries),
            subtype: "background",
            level: 0,
          })),
        }
      : null;

    // ── Standalone feats (with full descriptions from the feat catalog) ──
    const feats: FeatureInput[] = [];
    const featNameSeen = new Set<string>();
    const featDescription = (id: string | undefined, name: string) => {
      const lines =
        (id ? featLookup.byId.get(id) : undefined) ??
        featLookup.byName.get(name.toLowerCase()) ??
        [];
      return joinDescription(lines);
    };
    const pushFeat = (feat: { id?: string; name: string } | null | undefined) => {
      if (!feat?.name) return;
      const key = feat.name.toLowerCase();
      if (featNameSeen.has(key)) return;
      featNameSeen.add(key);
      feats.push({
        name: feat.name,
        description: featDescription(feat.id, feat.name),
        subtype: "feat",
        level: 0,
      });
    };
    pushFeat(builder.speciesOriginFeat);
    pushFeat(builder.backgroundOriginFeat);
    for (const feat of builder.optionalFeatureOriginFeats) pushFeat(feat);
    for (const feat of builder.featSelections) pushFeat(feat);

    // Selected optional features become standalone feat items with descriptions.
    const optionalSelections = builder.optionalFeatureSelections ?? {};
    for (const progression of allProgressions) {
      const picks = (optionalSelections[progression.id] ?? []).filter(
        (pick): pick is NonNullable<typeof pick> => pick !== null,
      );
      for (const pick of picks) {
        const key = pick.name.toLowerCase();
        if (featNameSeen.has(key)) continue;
        featNameSeen.add(key);
        const baseDescription = joinDescription(
          resolveOptionalDescription(progression, pick.id, optDescMap),
        );
        const marker = `<p><em>Toolbox choice: selected for "${progression.name}".</em></p>`;
        feats.push({
          name: pick.name,
          description: `${baseDescription ?? ""}${marker}`,
          subtype: "feat",
          level: 0,
          // Group Metamagic / Fighting Style / etc. under the class section.
          originKind: "class",
        });
      }
    }

    // ── Weapons (equipped + inventory, deduped by name) ──
    const weaponMap = new Map<
      string,
      { equipped: EquippedWeapon; isEquipped: boolean }
    >();
    const addEquippedWeapon = (
      entry: EquippedWeapon | null,
      isEquipped: boolean,
    ) => {
      if (!entry) return;
      weaponMap.set(entry.weapon.name, { equipped: entry, isEquipped });
    };
    addEquippedWeapon(builder.mainHand, true);
    addEquippedWeapon(builder.offHand, true);
    for (const weapon of inventory.weapons) {
      if (weaponMap.has(weapon.name)) continue;
      weaponMap.set(weapon.name, {
        equipped: {
          weapon,
          rarity: weapon.itemRarityLabel ?? "",
          runeSlots: 0,
          runes: [],
          activeModeIndex: 0,
        },
        isEquipped: false,
      });
    }
    const weapons = [...weaponMap.values()];

    // ── Armor (equipped armor + shield + inventory, deduped by name) ──
    const armorMap = new Map<
      string,
      { armor: FoundryExportInput["armors"][number]["armor"]; equipped: boolean }
    >();
    if (builder.armor) {
      armorMap.set(builder.armor.armor.name, {
        armor: builder.armor.armor,
        equipped: true,
      });
    }
    if (builder.equippedShield) {
      const shieldArmor = standaloneShieldToArmorItem(builder.equippedShield);
      armorMap.set(shieldArmor.name, { armor: shieldArmor, equipped: true });
    }
    for (const armor of inventory.armors) {
      if (armorMap.has(armor.name)) continue;
      armorMap.set(armor.name, { armor, equipped: false });
    }
    const armors = [...armorMap.values()];

    // ── Trinkets ──
    const trinketSet = new Set<string>();
    if (builder.trinket1) trinketSet.add(builder.trinket1.name);
    if (builder.trinket2) trinketSet.add(builder.trinket2.name);
    for (const name of inventory.trinkets) trinketSet.add(name);
    const trinkets = [...trinketSet];

    // ── Inventory (exclude pure gold entries — those become system.currency) ──
    const loot: CartEntry[] = inventory.items.filter(
      (entry) =>
        inventory.getEntryKind(entry) === "other" &&
        !isGoldInventoryEntry(entry),
    );

    // ── Spells ──
    // Placeholder; exportFoundry replaces with full prepared-caster / known list
    // after fluff images are available. buildInput stays sync.
    const spells: SpellItemInput[] = [];

    // ── Runes from equipped gear ──
    const runes: { rune: Rune; slotContext: "Weapon" | "Armor" | "Trinket" }[] =
      [];
    const pushRunes = (
      list: (Rune | null)[] | undefined,
      slotContext: "Weapon" | "Armor" | "Trinket",
    ) => {
      if (!list) return;
      for (const rune of list) {
        if (rune) runes.push({ rune, slotContext });
      }
    };
    pushRunes(builder.mainHand?.runes, "Weapon");
    pushRunes(builder.offHand?.runes, "Weapon");
    pushRunes(builder.armor?.runes, "Armor");
    if (builder.trinket1?.rune) {
      runes.push({ rune: builder.trinket1.rune, slotContext: "Trinket" });
    }
    if (builder.trinket2?.rune) {
      runes.push({ rune: builder.trinket2.rune, slotContext: "Trinket" });
    }

    // ── Currency (entries named "90 gp" / gold pouch rows, not inventory items) ──
    const goldGp = sumInventoryGoldGp(inventory.items);

    const attunement = getAttunementInfo(builder.class?.name, level);

    // Weapon Mastery picks → Foundry traits.weaponProf.mastery.value (baseItem ids)
    const weaponMasteryBaseItems: string[] = [];
    for (const progression of allProgressions) {
      if (progression.name !== "Weapon Mastery") continue;
      const picks = (optionalSelections[progression.id] ?? []).filter(
        (pick): pick is NonNullable<typeof pick> => pick !== null,
      );
      for (const pick of picks) {
        const masteryWeapon = getWeaponMasteryWeapon(pick.id);
        const baseName = masteryWeapon?.name ?? pick.name;
        const baseItem = slugify(baseName);
        if (baseItem && !weaponMasteryBaseItems.includes(baseItem)) {
          weaponMasteryBaseItems.push(baseItem);
        }
      }
    }

    return {
      name: character.name,
      size: character.size === "S" ? "S" : "M",
      alignment: formatAlignment(character.alignment),
      level,
      xp: getXpForLevel(level),
      abilities: character.abilities,
      saveProficiencies: builder.saveProficiencyAbilities,
      skillProficiencies,
      proficiencyBonus: character.getProficiencyBonus(),
      hp: hitPoints?.max ?? 0,
      speed: speed.speed,
      acCalc,
      acFlat: null,
      initiativeAbility: "",
      darkvision: speciesData?.darkvision ?? null,
      languages: builder.resolvedLanguageItems,
      tools: builder.resolvedToolItems,
      weaponProficiencies: builder.resolvedWeaponItems,
      weaponMasteryBaseItems,
      armorProficiencies: builder.resolvedArmorItems,
      resistances: builder.resolvedResistances,
      immunities: builder.resolvedImmunities,
      currency: { pp: 0, gp: Math.floor(goldGp), ep: 0, sp: 0, cp: 0 },
      spellcastingAbility: spellAbilityKey,
      casterProgression,
      casterLevel: level,
      pactSlots: spellcasting.isPactMagic
        ? {
            count: spellcasting.pactSlotCount,
            level: spellcasting.pactMaxSpellLevel,
          }
        : null,
      attunementMax: attunement.attunementSlots,
      biography: builder.backstoryNotes,
      classInfo,
      subclassInfo,
      raceInfo,
      backgroundInfo,
      feats,
      weapons,
      armors,
      trinkets,
      loot,
      spells,
      runes,
      portraitImage: builder.portraitImage,
      tokenImage: builder.tokenImage,
      itemDescriptions,
      itemCatalog,
      builderSnapshot: gatherBuilderSnapshot(builder, inventory),
    };
  }, [
    armorClass,
    backgroundData,
    builder,
    classData,
    hitPoints,
    inventory,
    spellcasting,
    speed.speed,
    subclassData,
  ]);

  const exportFoundry = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      // Load catalogs to enrich feat / optional-feature descriptions.
      const { optDescMap, featDescLookup } = await loadFeatExportLookups();

      // Build catalog lookups so armor / trinkets / inventory (name-only in the
      // builder) export with 5etools descriptions, type, weight, and value.
      // Prefer XPHB/XDMG entries when multiple sources share a name.
      const dndItems = await getAllDndItems().catch(() => [] as DndItem[]);
      const itemDescriptions: Record<string, string> = {};
      const itemCatalog: Record<string, InventoryCatalogMeta> = {};

      const sourceRank = (source: string): number => {
        const s = source.toUpperCase();
        if (s === "XPHB" || s === "XDMG") return 0;
        if (s === "PHB" || s === "DMG") return 1;
        return 2;
      };

      const catalogScore = (meta: InventoryCatalogMeta): number => {
        const hasDesc = meta.description ? 1_000_000 : 0;
        return (
          hasDesc -
          sourceRank(meta.source ?? "") * 10_000 +
          (meta.description?.length ?? 0)
        );
      };

      for (const item of dndItems) {
        const key = item.name.trim().toLowerCase();
        if (!key) continue;
        const description = joinDescription(item.description);
        const valueGp =
          item.valueCp != null && Number.isFinite(item.valueCp)
            ? item.valueCp / 100
            : undefined;
        const candidate: InventoryCatalogMeta = {
          description,
          typeCode: item.typeCode,
          weightLb: parseWeightLb(item.weight),
          valueGp,
          rarity: item.rarity === "none" ? "" : item.rarity,
          attunement: item.attunement,
          source: item.source,
        };
        const existing = itemCatalog[key];
        if (!existing || catalogScore(candidate) > catalogScore(existing)) {
          itemCatalog[key] = candidate;
          if (description) itemDescriptions[key] = description;
        }
      }

      const input = buildInput(
        featDescLookup,
        optDescMap,
        itemDescriptions,
        itemCatalog,
      );

      // Prefetch fluff art maps (spells / items / feats) then enrich images + spells.
      await prefetchFoundryEntityFluffImgs();

      const itemImages: Record<string, string> = {};
      const rememberItemImg = (name: string, source?: string) => {
        const key = name.trim().toLowerCase();
        if (!key || itemImages[key]) return;
        const url = getItemFluffImgSync(name, source);
        if (url) itemImages[key] = url;
      };
      for (const w of input.weapons) {
        rememberItemImg(w.equipped.weapon.name, w.equipped.weapon.source);
      }
      for (const a of input.armors) {
        rememberItemImg(a.armor.name, a.armor.source);
      }
      for (const t of input.trinkets) {
        rememberItemImg(t);
      }
      for (const entry of input.loot) {
        rememberItemImg(entry.name, entry.source);
      }
      for (const feat of input.feats) {
        const key = feat.name.trim().toLowerCase();
        if (!key) continue;
        const url = getFeatFluffImgSync(feat.name);
        if (url) {
          itemImages[key] = url;
          feat.img = resolveItemIcon(FOUNDRY_ITEM_ICONS.feat, url);
        }
      }
      input.itemImages = itemImages;

      const spellAbilityKey = mapAbilityLabel(spellcasting.spellcastingAbility);
      const selections = Object.values(builder.spellSelections ?? {}).flat();
      input.spells = buildSpellExportList({
        allSpells,
        selections,
        isPreparedCaster: spellcasting.isPreparedCaster,
        isPactMagic: spellcasting.isPactMagic,
        spellAbilityKey,
        listContext: {
          className: builder.class?.name ?? "",
          subclassName: builder.subclass?.name ?? null,
          subclassShortName: spellcasting.subclassShortName,
          expandedFilters: spellcasting.expandedSpellFilters,
          characterLevel: builder.character.level,
          availableSpellSlotLevels: spellcasting.availableSpellSlotLevels,
          spellcastingFromSubclass: spellcasting.spellcastingFromSubclass,
        },
        alwaysPrepared: spellcasting.subclassAlwaysPrepared,
        bonusKnown: spellcasting.subclassBonusKnown,
        optionalFeatureGranted: spellcasting.optionalFeatureGranted,
        resolveFluffImg: (name, source) => getSpellFluffImgSync(name, source),
      });

      // Replace identity stubs with Plutonium-style descriptions:
      // fluff art/lore + class table + leveled features / race traits.
      const [classFluff, subclassFluff, raceFluff, backgroundFluff] =
        await Promise.all([
          input.classInfo
            ? resolveClassFluffForFoundry(
                input.classInfo.name,
                input.classInfo.source ?? "",
              )
            : Promise.resolve({ html: "", img: undefined }),
          input.subclassInfo
            ? resolveSubclassFluffForFoundry(
                input.subclassInfo.name,
                input.subclassInfo.source ?? "",
                input.classInfo?.name ?? "",
                input.classInfo?.source,
              )
            : Promise.resolve({ html: "", img: undefined }),
          input.raceInfo
            ? resolveRaceFluffForFoundry(
                input.raceInfo.name,
                input.raceInfo.source ?? "",
                builder.speciesData?.parentSpecies,
                builder.speciesData?.parentSource,
              )
            : Promise.resolve({ html: "", img: undefined }),
          input.backgroundInfo
            ? resolveBackgroundFluffForFoundry(
                input.backgroundInfo.name,
                input.backgroundInfo.source ?? "",
              )
            : Promise.resolve({ html: "", img: undefined }),
        ]);

      if (input.classInfo && classData) {
        const html = buildClassIdentityDescription({
          fluff: classFluff,
          classData,
        });
        if (html) input.classInfo.description = html;
        if (classFluff.img) input.classInfo.img = classFluff.img;
      }
      if (input.subclassInfo && subclassData) {
        const html = buildSubclassIdentityDescription({
          fluff: subclassFluff,
          subclassData,
        });
        if (html) input.subclassInfo.description = html;
        if (subclassFluff.img) input.subclassInfo.img = subclassFluff.img;
      }
      if (input.raceInfo) {
        const html = buildRaceIdentityDescription({
          fluff: raceFluff,
          fluffText: builder.speciesData?.fluff,
          traits: builder.speciesData?.traits ?? [],
        });
        if (html) input.raceInfo.description = html;
        if (raceFluff.img) input.raceInfo.img = raceFluff.img;
      }
      if (input.backgroundInfo) {
        const html = buildBackgroundIdentityDescription({
          fluff: backgroundFluff,
          fluffText: input.backgroundInfo.description,
          features: input.backgroundInfo.features.map((f) => ({
            name: f.name,
            description: f.description,
          })),
        });
        if (html) input.backgroundInfo.description = html;
        if (backgroundFluff.img) input.backgroundInfo.img = backgroundFluff.img;
      }

      const actor = buildFoundryActor(input);
      const sanitize = (s: string) =>
        s.trim().replace(/[\s/\\:*?"<>|]+/g, "_").replace(/^_+|_+$/g, "");
      const parts = [
        sanitize(input.name) || "Character",
        sanitize(builder.class?.name ?? ""),
        `Level${input.level}`,
      ].filter(Boolean);
      const filenameBase = parts.join("_");
      downloadFoundryActor(actor, `${filenameBase}.json`);
      downloadCharacterImages(filenameBase, builder.portraitImage, builder.tokenImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Foundry export failed");
    } finally {
      setExporting(false);
    }
  }, [
    buildInput,
    builder,
    allSpells,
    spellcasting,
    classData,
    subclassData,
  ]);

  return { exportFoundry, exporting, error };
}
