import type { BuilderSpellSelections, Spell } from "@/shared/types";
import type { DndItem } from "@/shared/types/dnd-item.types";
import { getAllDndItems } from "@/features/dnd/items/services/dnd-item.service";
import {
  downloadFoundryJson,
  FOUNDRY_ITEM_ICONS,
  kebab,
  mapAbilityLabel,
  resolveItemIcon,
} from "@/shared/foundry";
import { statBlockContentsToPlainText } from "@/shared/utils/statblock-entries.mapper";
import { loadFeatExportLookups } from "../utils/character-sheet-export.utils";
import { downloadCharacterImages } from "../utils/image-download.utils";
import { buildFoundryActor } from "./actor.builder";
import type { FoundryExportInput } from "./actor-export.types";
import {
  buildFoundryExportInput,
  type BuildFoundryExportInputContext,
} from "./build-foundry-export-input";
import {
  resolveBackgroundFluffForFoundry,
  resolveClassFluffForFoundry,
  resolveRaceFluffForFoundry,
  resolveSubclassFluffForFoundry,
  prefetchFoundryEntityFluffImgs,
  getSpellFluffImgSync,
  getItemFluffImgSync,
  getFeatFluffImgSync,
} from "./fluff-lookup";
import {
  buildBackgroundIdentityDescription,
  buildClassIdentityDescription,
  buildRaceIdentityDescription,
  buildSubclassIdentityDescription,
} from "./identity-description";
import {
  parseWeightLb,
  type InventoryCatalogMeta,
  type SpellItemInput,
} from "./item.builders";
import type { SpellcastingInfo } from "../hooks/useSpellcasting";
import { buildSpellExportList } from "./spell-export.utils";

/** Full runtime context for async Foundry actor export. */
export interface ExportFoundryActorContext extends BuildFoundryExportInputContext {
  allSpells: Spell[];
}

function sourceRank(source: string): number {
  const s = source.toUpperCase();
  if (s === "XPHB" || s === "XDMG") return 0;
  if (s === "PHB" || s === "DMG") return 1;
  return 2;
}

function catalogScore(meta: InventoryCatalogMeta): number {
  const hasDesc = meta.description ? 1_000_000 : 0;
  return (
    hasDesc -
    sourceRank(meta.source ?? "") * 10_000 +
    (meta.description?.length ?? 0)
  );
}

/** Builds item catalog lookups from the D&D item compendium. */
async function buildItemCatalogLookups(): Promise<{
  itemDescriptions: Record<string, string>;
  itemCatalog: Record<string, InventoryCatalogMeta>;
}> {
  const dndItems = await getAllDndItems().catch(() => [] as DndItem[]);
  const itemDescriptions: Record<string, string> = {};
  const itemCatalog: Record<string, InventoryCatalogMeta> = {};

  for (const item of dndItems) {
    const key = item.name.trim().toLowerCase();
    if (!key) continue;
    const description =
      item.description.length > 0
        ? statBlockContentsToPlainText(item.description)
        : undefined;
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

  return { itemDescriptions, itemCatalog };
}

function attachItemFluffImages(input: FoundryExportInput): void {
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
}

/** Spell items cast through one class (`sourceClass` = its identifier). */
function classSpellExportList(
  allSpells: Spell[],
  spellcasting: SpellcastingInfo,
  spellSelections: BuilderSpellSelections,
  className: string,
  subclassName: string | null,
  classLevel: number,
): SpellItemInput[] {
  const sourceClass = kebab(className);
  return buildSpellExportList({
    allSpells,
    selections: Object.values(spellSelections).flat(),
    isPreparedCaster: spellcasting.isPreparedCaster,
    isPactMagic: spellcasting.isPactMagic,
    spellAbilityKey: mapAbilityLabel(spellcasting.spellcastingAbility),
    listContext: {
      className,
      subclassName,
      subclassShortName: spellcasting.subclassShortName,
      expandedFilters: spellcasting.expandedSpellFilters,
      characterLevel: classLevel,
      availableSpellSlotLevels: spellcasting.availableSpellSlotLevels,
      spellcastingFromSubclass: spellcasting.spellcastingFromSubclass,
    },
    alwaysPrepared: spellcasting.subclassAlwaysPrepared,
    bonusKnown: spellcasting.subclassBonusKnown,
    optionalFeatureGranted: spellcasting.optionalFeatureGranted,
    resolveFluffImg: (name, source) => getSpellFluffImgSync(name, source),
  }).map((spell) => (className ? { ...spell, sourceClass } : spell));
}

function attachSpellExportList(
  input: FoundryExportInput,
  ctx: ExportFoundryActorContext,
): void {
  const { builder, allSpells, spellcasting, multiclassSpellcasting } = ctx;
  const lists = [
    classSpellExportList(
      allSpells,
      spellcasting,
      builder.spellSelections ?? {},
      builder.class?.name ?? "",
      builder.subclass?.name ?? null,
      builder.primaryClassLevel,
    ),
    ...multiclassSpellcasting.map((mc) => {
      const entry = builder.multiclassEntries[mc.index];
      return classSpellExportList(
        allSpells,
        mc.spellcasting,
        entry?.spellSelections ?? {},
        mc.classData.name,
        entry?.subclass?.name ?? null,
        entry?.level ?? 1,
      );
    }),
  ];

  // A spell known by two classes is kept once, preferring a prepared copy.
  const merged = new Map<string, SpellItemInput>();
  for (const spell of lists.flat()) {
    const key = spell.name.trim().toLowerCase();
    const existing = merged.get(key);
    if (existing && (existing.prepared || !spell.prepared)) continue;
    merged.set(key, spell);
  }
  input.spells = [...merged.values()].sort(
    (a, b) => a.level - b.level || a.name.localeCompare(b.name),
  );
}

async function enrichIdentityDescriptions(
  input: FoundryExportInput,
  ctx: ExportFoundryActorContext,
): Promise<void> {
  const { builder, classData, subclassData } = ctx;

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
      speciesTraitChoices: builder.speciesTraitChoices ?? {},
    });
    if (html) input.raceInfo.description = html;
    if (raceFluff.img) input.raceInfo.img = raceFluff.img;
  }
  // Additional classes (multiclass): same class / subclass fluff as the primary.
  await Promise.all(
    (input.additionalClasses ?? []).map(async ({ classInfo, subclassInfo }, i) => {
      const mc = ctx.multiclassSpellcasting[i];
      if (!mc) return;
      const [mcClassFluff, mcSubclassFluff] = await Promise.all([
        resolveClassFluffForFoundry(classInfo.name, classInfo.source ?? ""),
        subclassInfo
          ? resolveSubclassFluffForFoundry(
              subclassInfo.name,
              subclassInfo.source ?? "",
              classInfo.name,
              classInfo.source,
            )
          : Promise.resolve({ html: "", img: undefined }),
      ]);
      const classHtml = buildClassIdentityDescription({
        fluff: mcClassFluff,
        classData: mc.classData,
      });
      if (classHtml) classInfo.description = classHtml;
      if (mcClassFluff.img) classInfo.img = mcClassFluff.img;
      if (subclassInfo && mc.subclassData) {
        const subclassHtml = buildSubclassIdentityDescription({
          fluff: mcSubclassFluff,
          subclassData: mc.subclassData,
        });
        if (subclassHtml) subclassInfo.description = subclassHtml;
        if (mcSubclassFluff.img) subclassInfo.img = mcSubclassFluff.img;
      }
    }),
  );

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
}

function sanitizeFilenamePart(s: string): string {
  return s.trim().replace(/[\s/\\:*?"<>|]+/g, "_").replace(/^_+|_+$/g, "");
}

/**
 * Loads catalogs, enriches export input with fluff/spells, builds the actor,
 * and triggers JSON + image downloads.
 */
export async function exportFoundryActor(
  ctx: ExportFoundryActorContext,
): Promise<void> {
  const { builder } = ctx;

  const { optDescMap, featDescLookup } = await loadFeatExportLookups();
  const { itemDescriptions, itemCatalog } = await buildItemCatalogLookups();

  const input = buildFoundryExportInput(
    ctx,
    featDescLookup,
    optDescMap,
    itemDescriptions,
    itemCatalog,
  );

  await prefetchFoundryEntityFluffImgs();

  attachItemFluffImages(input);
  attachSpellExportList(input, ctx);
  await enrichIdentityDescriptions(input, ctx);

  const actor = buildFoundryActor(input);
  const parts = [
    sanitizeFilenamePart(input.name) || "Character",
    sanitizeFilenamePart(builder.class?.name ?? ""),
    `Level${input.level}`,
  ].filter(Boolean);
  const filenameBase = parts.join("_");
  downloadFoundryJson(actor, `${filenameBase}.json`);
  downloadCharacterImages(filenameBase, builder.portraitImage, builder.tokenImage);
}
