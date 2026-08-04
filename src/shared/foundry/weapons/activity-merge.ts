import type {
  WeaponFeatureAutomationSpec,
  WeaponActivityTemplateKind,
  WeaponFeatureFoundryOverrides,
  WeaponActivityParams,
} from "./activity.types";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep-merge plain objects; arrays and scalars from `source` replace `target`. */
export function deepMergeRecords(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = out[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      out[key] = deepMergeRecords(existing, value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

function mergeOverrides(
  a: WeaponFeatureFoundryOverrides | undefined,
  b: WeaponFeatureFoundryOverrides | undefined,
): WeaponFeatureFoundryOverrides | undefined {
  if (!a && !b) return undefined;
  if (!a) return b ? { ...b } : undefined;
  if (!b) return { ...a };

  const activities =
    a.activities || b.activities
      ? deepMergeRecords(
          (a.activities as Record<string, unknown>) ?? {},
          (b.activities as Record<string, unknown>) ?? {},
        )
      : undefined;

  const flags =
    a.flags || b.flags
      ? deepMergeRecords(
          (a.flags as Record<string, unknown>) ?? {},
          (b.flags as Record<string, unknown>) ?? {},
        )
      : undefined;

  return {
    activities,
    effects: b.effects ?? a.effects,
    itemUses: b.itemUses ?? a.itemUses,
    flags,
  };
}

/**
 * Merge automation specs along a chain (root → leaf). Last non-empty wins for
 * scalars; params/overrides deep-merge. Effective template skips `upgrade_scaler`.
 */
export function mergeAutomationSpecs(
  links: Array<WeaponFeatureAutomationSpec | undefined>,
): WeaponFeatureAutomationSpec | undefined {
  const present = links.filter(
    (l): l is WeaponFeatureAutomationSpec => !!l && !!l.template,
  );
  if (present.length === 0) return undefined;

  let template: WeaponActivityTemplateKind = "unmapped";
  let enabled: boolean | undefined;
  let chainKey: string | undefined;
  let params: WeaponActivityParams = {};
  let foundryOverrides: WeaponFeatureFoundryOverrides | undefined;
  let notes: string | undefined;

  for (const link of present) {
    if (link.template !== "upgrade_scaler") {
      template = link.template;
    } else if (template === "unmapped" && link.template === "upgrade_scaler") {
      // Keep upgrade_scaler only if nothing else established a real template yet;
      // compiler will still skip emit when effective template is upgrade_scaler alone.
      template = "upgrade_scaler";
    }
    if (link.enabled !== undefined) enabled = link.enabled;
    if (link.chainKey?.trim()) chainKey = link.chainKey.trim();
    if (link.params) {
      params = deepMergeRecords(
        params as Record<string, unknown>,
        link.params as Record<string, unknown>,
      ) as WeaponActivityParams;
    }
    foundryOverrides = mergeOverrides(foundryOverrides, link.foundryOverrides);
    if (link.notes?.trim()) notes = link.notes.trim();
  }

  return {
    template,
    enabled,
    chainKey,
    params,
    foundryOverrides,
    notes,
  };
}

/** Lowercase + collapse whitespace (keeps "Upgrade I" for exact registry keys). */
export function normalizeFeatureAutomationName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Strip " Upgrade…" suffixes so leaf names can fall back to the root registry
 * entry when no exact upgrade key exists.
 */
export function stripFeatureAutomationUpgradeSuffix(name: string): string {
  return normalizeFeatureAutomationName(name).replace(/\s+upgrade\b.*/i, "");
}
