/** Labels for 5etools-style spell misc / component filter tags. */
export const SPELL_MISC_TAG_LABELS: Record<string, string> = {
  Concentration: "Concentration",
  Verbal: "Verbal",
  Somatic: "Somatic",
  Material: "Material",
  Royalty: "Royalty",
  "Material with Cost": "Material with Cost",
  "Material is Consumed": "Material is Consumed",
  "Material is Optionally Consumed": "Material is Optionally Consumed",
  Ritual: "Ritual",
  HL: "Healing",
  THP: "Grants Temporary Hit Points",
  SGT: "Requires Sight",
  PRM: "Permanent Effects",
  SCL: "Scaling Effects",
  SCT: "Scaling Targets",
  SMN: "Summons Creature",
  MAC: "Modifies AC",
  TP: "Teleportation",
  FMV: "Forced Movement",
  RO: "Rollable Effects",
  LGTS: "Creates Sunlight",
  LGT: "Creates Light",
  UBA: "Uses Bonus Action",
  PS: "Plane Shifting",
  OBS: "Obscures Vision",
  DFT: "Difficult Terrain",
  AAD: "Additional Attack Damage",
  OBJ: "Affects Objects",
  ADV: "Grants Advantage",
  PIR: "Permanent If Repeated",
};

export const SPELL_ATTACK_LABELS: Record<string, string> = {
  M: "Melee",
  R: "Ranged",
  O: "Other/Unknown",
};

export const SPELL_AREA_LABELS: Record<string, string> = {
  ST: "Single Target",
  MT: "Multiple Targets",
  C: "Cube",
  N: "Cone",
  Y: "Cylinder",
  S: "Sphere",
  R: "Circle",
  Q: "Square",
  L: "Line",
  H: "Hemisphere",
  W: "Wall",
  E: "Emanation",
};

export const SPELL_CAST_TIME_LABELS: Record<string, string> = {
  action: "Action",
  bonus: "Bonus Action",
  reaction: "Reaction",
  round: "Round",
  minute: "Minute",
  hour: "Hour",
  special: "Special",
};

export const SPELL_DURATION_BUCKETS = [
  "Instant",
  "1 Round",
  "1 Minute",
  "10 Minutes",
  "1 Hour",
  "8 Hours",
  "24+ Hours",
  "Permanent",
  "Special",
] as const;

export const SPELL_RANGE_BUCKETS = [
  "Self",
  "Touch",
  "Point",
  "Self (Area)",
  "Special",
] as const;

export const SPELL_SAVE_ABILITIES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

export const SPELL_DAMAGE_TYPES = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
] as const;

export function labelSpellMiscTag(tag: string): string {
  return SPELL_MISC_TAG_LABELS[tag] ?? tag;
}

export function labelAbilitySave(ability: string): string {
  return `${ability.charAt(0).toUpperCase()}${ability.slice(1)} Save`;
}

export function optionsFromPresent(
  present: Iterable<string>,
  labels: Record<string, string>,
  preferredOrder?: readonly string[],
): Array<{ value: string; label: string }> {
  const set = new Set(present);
  const ordered =
    preferredOrder?.filter((v) => set.has(v)) ??
    [...set].sort((a, b) =>
      (labels[a] ?? a).localeCompare(labels[b] ?? b, undefined, {
        sensitivity: "base",
      }),
    );
  const rest = preferredOrder
    ? [...set].filter((v) => !preferredOrder.includes(v)).sort()
    : [];
  return [...ordered, ...rest].map((value) => ({
    value,
    label: labels[value] ?? value,
  }));
}
