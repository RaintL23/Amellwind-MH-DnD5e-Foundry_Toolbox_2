import {
  RARITY_ORDER,
  Weapon,
  WeaponRarityRow,
} from "@/shared/types";
import { mapWeapon } from "@/features/weapons/mappers/weapon.mapper";
import type {
  CustomWeapon,
  WeaponForgeFeatureDef,
  WeaponForgeFormValues,
} from "../types/weapon-forge.types";
import {
  createFeatureDef,
  featureDefsFromRarityRows,
} from "../types/weapon-forge.types";
import { descriptionToParagraphs } from "../utils/weapon-forge-features.utils";

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
    customFeatures?: WeaponForgeFeatureDef[];
  },
): CustomWeapon {
  const now = new Date().toISOString();
  const customFeatures =
    options.customFeatures ??
    (weapon as CustomWeapon).customFeatures ??
    featureDefsFromRarityRows(weapon.rarityRows);

  return {
    ...weapon,
    id: options.id ?? newId(),
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    isCustom: options.isCustom,
    source: weapon.source || "RAINTDM",
    contentSource: "amellwind",
    customFeatures,
  };
}

export function formValuesToWeapon(values: WeaponForgeFormValues): Weapon {
  const acParsed = values.acBonus.trim()
    ? Number.parseInt(values.acBonus, 10)
    : undefined;
  const acBonus =
    acParsed !== undefined && Number.isFinite(acParsed) ? acParsed : undefined;

  const baseFeatureNames = values.baseFeatureNames
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const supplementaryNotes = values.supplementaryNotes
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    name: values.name.trim() || "Untitled Weapon",
    source: "RAINTDM",
    contentSource: "amellwind",
    dmg1: values.dmg1.trim(),
    dmg2: values.dmg2.trim() || undefined,
    dmgType: values.dmgType,
    properties: [...values.properties],
    weight: Number.isFinite(values.weight) ? values.weight : 0,
    valueCp: Number.isFinite(values.valueCp) ? values.valueCp : 0,
    acBonus,
    includesShield: acBonus !== undefined,
    range: values.range.trim() || undefined,
    isFocus: values.isFocus,
    description: values.description.trim(),
    supplementaryNotes,
    rarityRows: normalizeRarityRows(values.rarityRows),
    baseFeatureNames,
  };
}

/**
 * Builds a 5etools-compatible HW entry from a CustomWeapon / Weapon
 * so it can be re-imported and read outside the app.
 */
export function weaponToRawExport(weapon: Weapon): Record<string, unknown> {
  const colLabels = buildColLabels(weapon.rarityRows);
  const rows = weapon.rarityRows.map((row) => {
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

  const custom = weapon as CustomWeapon;
  if (custom.customFeatures && custom.customFeatures.length > 0) {
    raw._raintdm = {
      customFeatures: custom.customFeatures.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        upgradesFromId: f.upgradesFromId,
      })),
    };
  }

  return raw;
}

function buildColLabels(rows: WeaponRarityRow[]): string[] {
  const labels = ["Rarity", "Slots"];
  const seen = new Set<string>();

  // Prefer Bonus early when present
  const preferOrder = ["Bonus", "Features"];
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
    labels.push("Bonus", "Features");
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
      }),
    )
    .filter((f) => f.name.trim());
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
    },
    {
      id: typeof raw.id === "string" ? raw.id : undefined,
      isCustom,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
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
    return toCustomWeapon(mapped, { isCustom, customFeatures });
  }
  throw new Error("Unrecognized weapon JSON shape");
}

/** Convert forge feature defs into OptionalFeature-compatible entries for the viewer. */
export function customFeaturesToOptionalMap(
  features: WeaponForgeFeatureDef[] | undefined,
  weaponName: string,
): Map<string, import("@/shared/types").OptionalFeature> {
  const map = new Map<string, import("@/shared/types").OptionalFeature>();
  if (!features) return map;
  for (const feat of features) {
    map.set(feat.name.toLowerCase(), {
      name: feat.name,
      source: "RAINTDM",
      featureType: ["HW"],
      weaponName,
      paragraphs: descriptionToParagraphs(feat.description),
    });
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

  // Keep Amellwind order when possible
  const ordered = RARITY_ORDER.filter((r) => byRarity.has(r)).map(
    (r) => byRarity.get(r)!,
  );
  for (const [rarity, row] of byRarity) {
    if (!RARITY_ORDER.includes(rarity as (typeof RARITY_ORDER)[number])) {
      ordered.push(row);
    }
  }

  if (ordered.length === 0) {
    return RARITY_ORDER.map((rarity) => ({
      rarity,
      slots: 1,
      columns: {},
    }));
  }

  return ordered.map((row) => ({
    rarity: row.rarity,
    slots: row.slots,
    columns: { ...row.columns },
  }));
}
