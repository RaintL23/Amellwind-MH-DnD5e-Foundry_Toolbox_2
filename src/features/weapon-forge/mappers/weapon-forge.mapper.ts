import {
  BASE_RARITY,
  WEAPON_RARITY_ORDER,
  Weapon,
  WeaponRarityRow,
  defaultSlotsForWeaponRarity,
  isBaseRarity,
  type WeaponProficiencyRange,
  type WeaponProficiencyRule,
  type WeaponProficiencyTier,
} from "@/shared/types";
import { mapWeapon } from "@/features/weapons/mappers/weapon.mapper";
import {
  getBaseRarityFeatureNames,
  sortWeaponRarityRows,
} from "@/features/weapons/utils/weapon-base-rarity.utils";
import type {
  CustomWeapon,
  WeaponForgeFeatureDef,
  WeaponForgeFormValues,
} from "../types/weapon-forge.types";
import {
  BONUS_COLUMN_KEYS,
  createFeatureDef,
  featureDefsFromRarityRows,
} from "../types/weapon-forge.types";
import { descriptionToParagraphs, rarityRowsWithFeatureDisplayNames } from "../utils/weapon-forge-features.utils";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `wf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWeaponLike(value: unknown): value is Weapon {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    Array.isArray(value.rarityRows)
  );
}

function isRawHw(value: unknown): boolean {
  return isRecord(value) && (value.type === "HW" || value.type === "hw");
}

function normalizeRarityRows(rows: WeaponRarityRow[]): WeaponRarityRow[] {
  return rows.map((row) => ({
    rarity: row.rarity,
    slots: Number.isFinite(row.slots) ? row.slots : 1,
    columns: { ...(row.columns ?? {}) },
  }));
}

/** Promote a domain Weapon into a CustomWeapon with metadata. */
export function toCustomWeapon(
  weapon: Weapon,
  options: {
    id?: string;
    isCustom: boolean;
    createdAt?: string;
    updatedAt?: string;
    author?: string;
    img?: string;
    customFeatures?: WeaponForgeFeatureDef[];
  },
): CustomWeapon {
  const now = new Date().toISOString();
  const customFeatures =
    options.customFeatures ??
    (weapon as CustomWeapon).customFeatures ??
    featureDefsFromRarityRows(weapon.rarityRows);

  const existingAuthor = (weapon as CustomWeapon).author;
  const existingImg = (weapon as CustomWeapon).img;
  const img =
    options.img !== undefined
      ? options.img.trim() || undefined
      : existingImg?.trim() || undefined;

  return {
    ...weapon,
    id: options.id ?? newId(),
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    isCustom: options.isCustom,
    author: options.author ?? existingAuthor ?? "RaintDM",
    source: weapon.source || "RAINTDM",
    contentSource: "amellwind",
    customFeatures,
    ...(img ? { img } : {}),
  };
}

export function formValuesToWeapon(values: WeaponForgeFormValues): Weapon {
  const includesShield = values.includesShield;
  const acParsed = values.acBonus.trim()
    ? Number.parseInt(values.acBonus, 10)
    : undefined;
  const acBonus = includesShield
    ? acParsed !== undefined && Number.isFinite(acParsed)
      ? acParsed
      : 2
    : undefined;

  const fromField = values.baseFeatureNames
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const fromBaseRow = getBaseRarityFeatureNames(values.rarityRows);
  const baseFeatureNames =
    fromBaseRow.length > 0 ? fromBaseRow : fromField;

  const supplementaryNotes = values.supplementaryNotes
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const isVersatile = values.properties.includes("V");
  const modes =
    !isVersatile && values.modes.length >= 2
      ? values.modes.map((m) => ({
          label: m.label.trim() || "Mode",
          damage: m.damage.trim() || "1d8",
          dmgType: (m.dmgType?.trim() || values.dmgType || "S") as string,
          hasShield: m.hasShield === true,
          isTwoHanded: m.isTwoHanded === true,
          blocksOffHand: m.blocksOffHand === true,
        }))
      : undefined;

  const dmg1 = modes?.[0]?.damage ?? values.dmg1.trim();
  const dmg2 = modes
    ? modes[1]?.damage
    : values.dmg2.trim() || undefined;
  const dmgType = modes?.[0]?.dmgType ?? values.dmgType;

  const compatible = values.compatibleProficiencies
    .map((s) => s.trim())
    .filter(Boolean);
  const proficiency: WeaponProficiencyRule = {
    compatible,
    requiresShield: values.requiresShieldProficiency || undefined,
    tier: values.proficiencyTier,
    range: values.proficiencyRange,
  };

  return {
    name: values.name.trim() || "Untitled Weapon",
    source: "RAINTDM",
    contentSource: "amellwind",
    dmg1,
    dmg2,
    modes,
    dmgType,
    properties: [...values.properties],
    weight: Number.isFinite(values.weight) ? values.weight : 0,
    valueCp: Number.isFinite(values.valueCp) ? values.valueCp : 0,
    acBonus,
    includesShield: includesShield || undefined,
    proficiency,
    range: values.range.trim() || undefined,
    isFocus: values.isFocus,
    description: values.description.trim(),
    supplementaryNotes,
    rarityRows: sortWeaponRarityRows(normalizeRarityRows(values.rarityRows)),
    baseFeatureNames,
  };
}

/**
 * Builds a 5etools-compatible HW entry from a CustomWeapon / Weapon
 * so it can be re-imported and read outside the app.
 */
export function weaponToRawExport(weapon: Weapon): Record<string, unknown> {
  const custom = weapon as CustomWeapon;
  const exportRows = rarityRowsWithFeatureDisplayNames(
    weapon.rarityRows,
    custom.customFeatures ?? [],
  );
  const colLabels = buildColLabels(exportRows);
  const rows = exportRows.map((row) => {
    const cells: unknown[] = [row.rarity, String(row.slots)];
    for (let i = 2; i < colLabels.length; i++) {
      const label = colLabels[i];
      const value = row.columns[label];
      if (value == null) {
        cells.push("--");
      } else if (Array.isArray(value)) {
        cells.push(value.length > 0 ? value.join(", ") : "--");
      } else {
        cells.push(value === "" ? "--" : value);
      }
    }
    return cells;
  });

  const entries: unknown[] = [];
  if (weapon.description) entries.push(weapon.description);
  for (const note of weapon.supplementaryNotes) {
    entries.push(note);
  }

  const insetEntries: unknown[] = [];
  if (weapon.baseFeatureNames.length > 0) {
    insetEntries.push(
      weapon.baseFeatureNames
        .map((name) => `{@optfeature ${name}|AGMH}`)
        .join(", "),
    );
  }
  insetEntries.push({
    type: "table",
    colLabels,
    rows,
  });

  entries.push({
    type: "inset",
    name: weapon.name,
    entries: insetEntries,
  });

  const raw: Record<string, unknown> = {
    name: weapon.name,
    source: weapon.source || "RAINTDM",
    author: custom.author?.trim() || "RaintDM",
    type: "HW",
    rarity: "none",
    weight: weapon.weight,
    value: weapon.valueCp,
    property: weapon.properties,
    dmg1: weapon.dmg1,
    dmgType: weapon.dmgType,
    entries,
  };

  if (weapon.dmg2) raw.dmg2 = weapon.dmg2;
  if (weapon.acBonus != null) raw.ac = weapon.acBonus;
  if (weapon.range) raw.range = weapon.range;
  if (weapon.isFocus) raw.focus = true;
  if (weapon.page != null) raw.page = weapon.page;
  if (custom.img?.trim()) raw.img = custom.img.trim();

  const raintdmPayload: Record<string, unknown> = {};
  if (custom.author?.trim()) {
    raintdmPayload.author = custom.author.trim();
  }
  if (custom.customFeatures && custom.customFeatures.length > 0) {
    raintdmPayload.customFeatures = custom.customFeatures.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      upgradesFromId: f.upgradesFromId,
      resourceColumn: f.resourceColumn,
    }));
  }
  if (weapon.modes && weapon.modes.length >= 2) {
    raintdmPayload.modes = weapon.modes.map((m) => ({
      label: m.label,
      damage: m.damage,
      dmgType: m.dmgType?.trim() || undefined,
      hasShield: m.hasShield === true ? true : undefined,
      isTwoHanded: m.isTwoHanded === true ? true : undefined,
      blocksOffHand: m.blocksOffHand === true ? true : undefined,
    }));
  }
  if (weapon.proficiency) {
    raintdmPayload.proficiency = {
      compatible: [...weapon.proficiency.compatible],
      requiresShield: weapon.proficiency.requiresShield === true ? true : undefined,
      tier: weapon.proficiency.tier,
      range: weapon.proficiency.range,
    };
  }
  if (Object.keys(raintdmPayload).length > 0) {
    raw._raintdm = raintdmPayload;
  }

  return raw;
}

function buildColLabels(rows: WeaponRarityRow[]): string[] {
  const labels = ["Rarity", "Slots"];
  const seen = new Set<string>();

  const preferOrder = [
    BONUS_COLUMN_KEYS.toHit,
    BONUS_COLUMN_KEYS.ac,
    BONUS_COLUMN_KEYS.damage,
    "Bonus",
    "Features",
  ];
  for (const preferred of preferOrder) {
    if (rows.some((r) => preferred in r.columns) && !seen.has(preferred)) {
      labels.push(preferred);
      seen.add(preferred);
    }
  }

  for (const row of rows) {
    for (const key of Object.keys(row.columns)) {
      if (!seen.has(key)) {
        labels.push(key);
        seen.add(key);
      }
    }
  }

  if (labels.length === 2) {
    labels.push(BONUS_COLUMN_KEYS.toHit, "Features");
  }

  return labels;
}

function parseCustomFeatures(raw: unknown): WeaponForgeFeatureDef[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter(isRecord)
    .map((f) =>
      createFeatureDef({
        id: typeof f.id === "string" ? f.id : undefined,
        name: String(f.name ?? ""),
        description: String(f.description ?? ""),
        upgradesFromId:
          typeof f.upgradesFromId === "string" ? f.upgradesFromId : undefined,
        resourceColumn:
          typeof f.resourceColumn === "string" && f.resourceColumn.trim()
            ? f.resourceColumn.trim()
            : undefined,
      }),
    )
    .filter((f) => f.name.trim());
}

function parseAuthor(raw: Record<string, unknown>): string | undefined {
  if (typeof raw.author === "string" && raw.author.trim()) {
    return raw.author.trim();
  }
  const raintdm = isRecord(raw._raintdm) ? raw._raintdm : undefined;
  if (typeof raintdm?.author === "string" && raintdm.author.trim()) {
    return raintdm.author.trim();
  }
  return undefined;
}

function parseModes(raw: unknown): import("@/shared/types").WeaponModeDef[] | undefined {
  if (!Array.isArray(raw) || raw.length < 2) return undefined;
  const modes = raw
    .filter(isRecord)
    .map((m) => ({
      label: String(m.label ?? "").trim() || "Mode",
      damage: String(m.damage ?? "").trim() || "1d8",
      dmgType:
        typeof m.dmgType === "string" && m.dmgType.trim()
          ? m.dmgType.trim()
          : undefined,
      hasShield: m.hasShield === true,
      isTwoHanded: m.isTwoHanded === true,
      blocksOffHand: m.blocksOffHand === true,
    }));
  return modes.length >= 2 ? modes : undefined;
}

function parseModesFromRecord(
  raw: Record<string, unknown>,
): import("@/shared/types").WeaponModeDef[] | undefined {
  const fromTop = parseModes(raw.modes);
  if (fromTop) return fromTop;
  const raintdm = isRecord(raw._raintdm) ? raw._raintdm : undefined;
  return parseModes(raintdm?.modes);
}

const PROFICIENCY_TIERS: ReadonlySet<string> = new Set([
  "martial",
  "simple",
  "martial-or-simple",
]);
const PROFICIENCY_RANGES: ReadonlySet<string> = new Set(["melee", "ranged"]);

function parseProficiencyRule(raw: unknown): WeaponProficiencyRule | undefined {
  if (!isRecord(raw)) return undefined;
  const tier = String(raw.tier ?? "");
  const range = String(raw.range ?? "");
  if (!PROFICIENCY_TIERS.has(tier) || !PROFICIENCY_RANGES.has(range)) {
    return undefined;
  }
  const compatible = Array.isArray(raw.compatible)
    ? raw.compatible.map(String).map((s) => s.trim()).filter(Boolean)
    : [];
  return {
    compatible,
    requiresShield: raw.requiresShield === true,
    tier: tier as WeaponProficiencyTier,
    range: range as WeaponProficiencyRange,
  };
}

function parseProficiencyFromRecord(
  raw: Record<string, unknown>,
): WeaponProficiencyRule | undefined {
  const fromTop = parseProficiencyRule(raw.proficiency);
  if (fromTop) return fromTop;
  const raintdm = isRecord(raw._raintdm) ? raw._raintdm : undefined;
  return parseProficiencyRule(raintdm?.proficiency);
}

function parseDomainWeapon(
  raw: Record<string, unknown>,
  isCustom: boolean,
): CustomWeapon {
  const weapon = raw as unknown as Weapon;
  const customFeatures =
    parseCustomFeatures(raw.customFeatures) ??
    parseCustomFeatures(
      isRecord(raw._raintdm) ? raw._raintdm.customFeatures : undefined,
    );
  const proficiency =
    parseProficiencyFromRecord(raw) ?? weapon.proficiency;

  const img =
    typeof raw.img === "string" && raw.img.trim() ? raw.img.trim() : undefined;

  return toCustomWeapon(
    {
      ...weapon,
      rarityRows: normalizeRarityRows(weapon.rarityRows ?? []),
      properties: Array.isArray(weapon.properties) ? weapon.properties : [],
      supplementaryNotes: Array.isArray(weapon.supplementaryNotes)
        ? weapon.supplementaryNotes
        : [],
      baseFeatureNames: Array.isArray(weapon.baseFeatureNames)
        ? weapon.baseFeatureNames
        : [],
      dmg1: String(weapon.dmg1 ?? ""),
      dmgType: String(weapon.dmgType ?? ""),
      name: String(weapon.name ?? "Unknown"),
      source: String(weapon.source ?? "RAINTDM"),
      weight: typeof weapon.weight === "number" ? weapon.weight : 0,
      valueCp: typeof weapon.valueCp === "number" ? weapon.valueCp : 0,
      modes: parseModesFromRecord(raw) ?? weapon.modes,
      proficiency,
    },
    {
      id: typeof raw.id === "string" ? raw.id : undefined,
      isCustom,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
      author: parseAuthor(raw),
      img,
      customFeatures,
    },
  );
}

function parseSingleEntry(entry: unknown, isCustom: boolean): CustomWeapon {
  if (isWeaponLike(entry)) {
    return parseDomainWeapon(
      entry as unknown as Record<string, unknown>,
      isCustom,
    );
  }
  if (isRawHw(entry) || isRecord(entry)) {
    const mapped = mapWeapon(entry);
    const record = entry as Record<string, unknown>;
    const raintdm = isRecord(record._raintdm) ? record._raintdm : undefined;
    const customFeatures = parseCustomFeatures(raintdm?.customFeatures);
    const modes = parseModesFromRecord(record);
    const proficiency = parseProficiencyFromRecord(record);
    const img =
      typeof record.img === "string" && record.img.trim()
        ? record.img.trim()
        : undefined;

    return toCustomWeapon(
      {
        ...mapped,
        modes: modes ?? mapped.modes,
        proficiency: proficiency ?? mapped.proficiency,
      },
      {
        isCustom,
        author: parseAuthor(record),
        img,
        customFeatures,
      },
    );
  }
  throw new Error("Unrecognized weapon JSON shape");
}

/** Convert forge feature defs into OptionalFeature-compatible entries for the viewer. */
export function customFeaturesToOptionalMap(
  features: WeaponForgeFeatureDef[] | undefined,
  _weaponName: string,
): Map<string, import("@/shared/types").OptionalFeature> {
  const map = new Map<string, import("@/shared/types").OptionalFeature>();
  if (!features) return map;
  for (const feat of features) {
    const optional: import("@/shared/types").OptionalFeature = {
      name: feat.name,
      source: "RAINTDM",
      featureType: ["HW"],
      // Empty weaponName so these never match resolveWeaponBaseFeatures'
      // prerequisite scan (only rarity-table / Base row should list them).
      weaponName: "",
      paragraphs: descriptionToParagraphs(feat.description),
    };
    // Index by id so duplicate display names remain distinct when rows store ids.
    if (feat.id) map.set(feat.id.toLowerCase(), optional);
    // First name wins — matches findFeatureDef / resolveFeatureDef name fallback.
    const nameKey = feat.name.toLowerCase();
    if (!map.has(nameKey)) map.set(nameKey, optional);
  }
  return map;
}

/**
 * Parses uploaded JSON into one or more CustomWeapons.
 * Accepts: single HW raw, domain CustomWeapon, array, or catalog { weapons: [] }.
 */
export function parseImportedWeapons(
  data: unknown,
  options: { isCustom: boolean } = { isCustom: true },
): CustomWeapon[] {
  if (Array.isArray(data)) {
    return data.map((entry) => parseSingleEntry(entry, options.isCustom));
  }

  if (isRecord(data) && Array.isArray(data.weapons)) {
    return data.weapons.map((entry) =>
      parseSingleEntry(entry, options.isCustom),
    );
  }

  return [parseSingleEntry(data, options.isCustom)];
}

/** Ensure rarity rows cover the Amellwind progression tiers when copying a base. */
export function mergeCopiedRarities(
  base: Weapon,
  selectedRarities: string[] | "all",
): WeaponRarityRow[] {
  const wanted =
    selectedRarities === "all"
      ? new Set(base.rarityRows.map((r) => r.rarity))
      : new Set(selectedRarities);

  const byRarity = new Map(
    base.rarityRows
      .filter((r) => wanted.has(r.rarity))
      .map((r) => [r.rarity, r] as const),
  );

  const ordered: WeaponRarityRow[] = [];
  for (const rarity of WEAPON_RARITY_ORDER) {
    const row = byRarity.get(rarity);
    if (row) ordered.push(row);
  }
  for (const [rarity, row] of byRarity) {
    if (!ordered.some((r) => r.rarity === rarity)) {
      ordered.push(row);
    }
  }

  if (ordered.length === 0) {
    return WEAPON_RARITY_ORDER.map((rarity) => ({
      rarity,
      slots: defaultSlotsForWeaponRarity(rarity),
      columns: { Features: [] },
    }));
  }

  const rows = ordered.map((row) => ({
    rarity: isBaseRarity(row.rarity) ? BASE_RARITY : row.rarity,
    slots: isBaseRarity(row.rarity) ? 0 : row.slots,
    columns: { ...row.columns },
  }));

  return sortWeaponRarityRows(rows);
}
