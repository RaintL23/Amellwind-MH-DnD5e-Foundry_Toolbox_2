import { foundryId } from "./foundry-id.utils";

const FEATURE_ICON = "icons/svg/upgrade.svg";

/** ItemGrant advancement listing feature items granted at a given level. */
export function buildItemGrantAdvancement(
  level: number,
  featIds: string[],
  title = "Features",
  icon = FEATURE_ICON,
): Record<string, unknown> {
  const added: Record<string, string> = {};
  for (const id of featIds) added[id] = `.${id}`;
  return {
    _id: foundryId(),
    type: "ItemGrant",
    level,
    title,
    icon,
    configuration: {
      items: featIds.map((id) => ({ uuid: `.${id}`, optional: false })),
      optional: false,
      spell: {
        ability: [""],
        preparation: "",
        uses: { max: "", per: "", requireSlot: false },
      },
    },
    value: { added },
  };
}

/** Trait advancement recording granted/chosen proficiencies. */
export function buildTraitAdvancement(
  title: string,
  grants: string[],
  chosen: string[],
  level: number,
  classRestriction?: "primary" | "secondary",
): Record<string, unknown> {
  const adv: Record<string, unknown> = {
    _id: foundryId(),
    type: "Trait",
    configuration: {
      mode: "default",
      allowReplacements: false,
      grants,
      choices: [],
    },
    level,
    title,
    value: { chosen: chosen.length ? chosen : grants },
  };
  if (classRestriction) adv.classRestriction = classRestriction;
  return adv;
}

export function buildSizeAdvancement(size: string): Record<string, unknown> {
  return {
    _id: foundryId(),
    type: "Size",
    configuration: { sizes: [size] },
    value: { size },
    level: 0,
    title: "",
  };
}

export function buildHitPointsAdvancement(): Record<string, unknown> {
  return {
    _id: foundryId(),
    type: "HitPoints",
    configuration: {},
    value: {},
    title: "Hit Points",
  };
}

// ─── ScaleValue presets (class scaling formulas like @scale.monk.die) ────────

interface ScalePreset {
  identifier: string;
  type: "dice" | "number" | "distance";
  title: string;
  scale: Record<string, Record<string, unknown>>;
  distanceUnits?: string;
}

const SCALE_PRESETS: Record<string, ScalePreset[]> = {
  monk: [
    {
      identifier: "die",
      type: "dice",
      title: "Martial Arts Die",
      scale: {
        "1": { faces: 6, number: null, modifiers: [] },
        "5": { faces: 8, number: null, modifiers: [] },
        "11": { faces: 10, number: null, modifiers: [] },
        "17": { faces: 12, number: null, modifiers: [] },
      },
    },
  ],
  rogue: [
    {
      identifier: "sneak-attack",
      type: "dice",
      title: "Sneak Attack",
      scale: {
        "1": { number: 1, faces: 6, modifiers: [] },
        "3": { number: 2, faces: 6, modifiers: [] },
        "5": { number: 3, faces: 6, modifiers: [] },
        "7": { number: 4, faces: 6, modifiers: [] },
        "9": { number: 5, faces: 6, modifiers: [] },
        "11": { number: 6, faces: 6, modifiers: [] },
        "13": { number: 7, faces: 6, modifiers: [] },
        "15": { number: 8, faces: 6, modifiers: [] },
        "17": { number: 9, faces: 6, modifiers: [] },
        "19": { number: 10, faces: 6, modifiers: [] },
      },
    },
  ],
  barbarian: [
    {
      identifier: "rage-damage",
      type: "number",
      title: "Rage Damage",
      scale: {
        "1": { value: 2 },
        "9": { value: 3 },
        "16": { value: 4 },
      },
    },
  ],
};

export function buildScaleValueAdvancements(
  classIdentifier: string,
): Record<string, unknown>[] {
  const presets = SCALE_PRESETS[classIdentifier];
  if (!presets) return [];
  return presets.map((preset) => ({
    _id: foundryId(),
    type: "ScaleValue",
    configuration: {
      identifier: preset.identifier,
      type: preset.type,
      scale: preset.scale,
      distance: { units: preset.distanceUnits ?? "" },
    },
    title: preset.title,
    value: {},
  }));
}
