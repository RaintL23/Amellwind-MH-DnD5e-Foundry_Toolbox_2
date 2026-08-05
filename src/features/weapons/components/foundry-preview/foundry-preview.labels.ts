export const WEAPON_TYPE_LABELS: Record<string, string> = {
  simpleM: "Simple Melee",
  simpleR: "Simple Ranged",
  martialM: "Martial Melee",
  martialR: "Martial Ranged",
};

export const PROPERTY_LABELS: Record<string, string> = {
  amm: "Ammunition",
  fin: "Finesse",
  fir: "Firearm",
  foc: "Focus",
  hvy: "Heavy",
  lgt: "Light",
  lod: "Loading",
  mgc: "Magical",
  rch: "Reach",
  rel: "Reload",
  ret: "Returning",
  sil: "Silvered",
  spc: "Special",
  thr: "Thrown",
  two: "Two-Handed",
  ver: "Versatile",
  ada: "Adamantine",
};

export const ACTIVATION_LABELS: Record<string, string> = {
  action: "Action",
  bonus: "Bonus Action",
  reaction: "Reaction",
  special: "Special",
  minute: "Minute",
  hour: "Hour",
  day: "Day",
  legendary: "Legendary Action",
  mythic: "Mythic Action",
  lair: "Lair Action",
  crew: "Crew Action",
};

export const DURATION_LABELS: Record<string, string> = {
  inst: "Instantaneous",
  turn: "Turn",
  round: "Round",
  minute: "Minute",
  hour: "Hour",
  day: "Day",
  month: "Month",
  year: "Year",
  perm: "Permanent",
  spec: "Special",
};

export function propertyLabel(key: string): string {
  return PROPERTY_LABELS[key] ?? key;
}
