import type { FoundryItem } from "./types";

/**
 * Default Midi QOL 12.4.x activity `midiProperties` blob.
 * Requires midi-qol active in the destination world.
 */
export function defaultMidiProperties(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ignoreTraits: [],
    triggeredActivityId: "none",
    triggeredActivityConditionText: "",
    triggeredActivityTargets: "targets",
    triggeredActivityRollAs: "self",
    autoConsume: false,
    forceConsumeDialog: "default",
    forceRollDialog: "default",
    forceDamageDialog: "default",
    confirmTargets: "default",
    autoTargetType: "any",
    autoTargetAction: "default",
    automationOnly: false,
    otherActivityCompatible: true,
    identifier: "",
    displayActivityName: false,
    rollMode: "default",
    chooseEffects: false,
    toggleEffect: false,
    ignoreFullCover: false,
    removeChatButtons: "default",
    magicEffect: false,
    magicDamage: false,
    noConcentrationCheck: false,
    autoCEEffects: "default",
    ...overrides,
  };
}

/**
 * Links non-transfer Active Effects on an item to activities that have an empty
 * `effects` array (typical cast/attack activity → applied-on-use AE wiring).
 */
export function linkNonTransferEffectsToActivities(item: FoundryItem): void {
  const nonTransferIds = item.effects
    .filter((effect) => effect.transfer === false)
    .map((effect) => effect._id)
    .filter(Boolean);
  if (nonTransferIds.length === 0) return;

  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return;

  const refs = nonTransferIds.map((id) => ({ _id: id }));

  for (const activity of Object.values(
    activities as Record<string, Record<string, unknown>>,
  )) {
    if (!activity || typeof activity !== "object") continue;
    const existing = activity.effects;
    if (Array.isArray(existing) && existing.length > 0) continue;
    activity.effects = refs.map((r) => ({ ...r }));
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function activityHasDamageParts(activity: Record<string, unknown>): boolean {
  const damage = activity.damage;
  if (!isPlainObject(damage) || !Array.isArray(damage.parts)) return false;
  return damage.parts.length > 0;
}

/** Spell Midi defaults: mark as magical so CPR/GPS auras (Circle of Power, etc.) see them. */
export function midiOverridesForItem(item: FoundryItem): Record<string, unknown> {
  if (item.type !== "spell") return {};
  const system = item.system;
  const activities = system.activities;
  let hasDamage = false;
  if (isPlainObject(activities)) {
    hasDamage = Object.values(activities).some(
      (activity) => isPlainObject(activity) && activityHasDamageParts(activity),
    );
  }
  return {
    magicEffect: true,
    magicDamage: hasDamage,
  };
}

/**
 * Fills empty `midiProperties.identifier` from the activity or item name so
 * Midi / Item Macro hooks can key off a stable slug.
 */
export function ensureMidiActivityIdentifiers(item: FoundryItem): void {
  const activities = item.system.activities;
  if (!isPlainObject(activities)) return;

  for (const activity of Object.values(activities)) {
    if (!isPlainObject(activity)) continue;
    const midi = isPlainObject(activity.midiProperties)
      ? activity.midiProperties
      : null;
    if (!midi) continue;
    const current = typeof midi.identifier === "string" ? midi.identifier.trim() : "";
    if (current) continue;
    const fromName = String(activity.name ?? "").trim();
    midi.identifier = fromName
      ? fromName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      : "";
  }
}

/** Ensures every activity on the item has midiProperties (defaults + overrides). */
export function ensureActivityMidiProperties(
  item: FoundryItem,
  overrides: Record<string, unknown> = {},
): void {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return;

  for (const activity of Object.values(
    activities as Record<string, Record<string, unknown>>,
  )) {
    if (!activity || typeof activity !== "object") continue;
    if (activity.midiProperties && typeof activity.midiProperties === "object") {
      activity.midiProperties = {
        ...defaultMidiProperties(),
        ...(activity.midiProperties as Record<string, unknown>),
        ...overrides,
      };
    } else {
      activity.midiProperties = defaultMidiProperties(overrides);
    }
    // Midi 12.4 replaced `forceDialog` with forceConsume/Roll/DamageDialog.
    delete (activity.midiProperties as Record<string, unknown>).forceDialog;
  }
}
