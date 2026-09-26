/** Weapon property normalization and attack/damage ability (Builder parity). */

function rawPropertyCode(prop: string): string {
  return String(prop).split("|")[0]?.trim() ?? "";
}

/** Map raw 5etools / catalog property strings to canonical lowercase tokens. */
export function normalizeWeaponProperties(props: string[]): string[] {
  const out = new Set<string>();
  for (const raw of props) {
    const code = rawPropertyCode(raw).toUpperCase();
    const lower = raw.trim().toLowerCase();
    if (code === "F" || lower === "finesse" || /^finesse\b/i.test(raw)) {
      out.add("finesse");
    }
    if (code === "L" || lower === "light" || /^light\b/i.test(raw)) {
      out.add("light");
    }
    if (code === "A" || lower === "ammunition" || /^ammunition\b/i.test(raw)) {
      out.add("ammunition");
    }
    if (lower === "thrown" || /^thrown\b/i.test(raw) || code === "T") {
      out.add("thrown");
    }
    if (/ranged/i.test(raw) && !/melee\s*only/i.test(raw)) {
      out.add("ranged");
    }
    if (/^melee$/i.test(lower) || /melee\s*only/i.test(raw)) {
      out.add("melee-only");
    }
  }
  return [...out];
}

export function isLightProperty(props: string[]): boolean {
  const norm = normalizeWeaponProperties(props);
  if (norm.includes("light")) return true;
  return props.some((p) => /^l$/i.test(rawPropertyCode(p)));
}

export function isFinesseProperty(props: string[]): boolean {
  const norm = normalizeWeaponProperties(props);
  if (norm.includes("finesse")) return true;
  return props.some((p) => /^f$/i.test(rawPropertyCode(p)));
}

/** Ranged weapons use DEX (A / Ammunition / Ranged label; not thrown-only). */
export function isRangedProperty(props: string[]): boolean {
  const norm = normalizeWeaponProperties(props);
  if (norm.includes("melee-only")) return false;
  if (norm.includes("ammunition") || norm.includes("ranged")) return true;
  return props.some((p) => /^a$/i.test(rawPropertyCode(p)));
}

export function getWeaponAttackAbility(
  props: string[],
  strMod: number,
  dexMod: number,
): "str" | "dex" {
  if (isRangedProperty(props)) return "dex";
  if (isFinesseProperty(props)) {
    return dexMod >= strMod ? "dex" : "str";
  }
  return "str";
}

export function weaponAttackMods(
  props: string[],
  strMod: number,
  dexMod: number,
  pb: number,
  opts?: { proficient?: boolean; omitDamageMod?: boolean },
): { attackBonus: number; damageMod: number; ability: "str" | "dex" } {
  const ability = getWeaponAttackAbility(props, strMod, dexMod);
  const mod = ability === "dex" ? dexMod : strMod;
  const proficient = opts?.proficient ?? true;
  const attackBonus = mod + (proficient ? pb : 0);
  const damageMod = opts?.omitDamageMod ? 0 : mod;
  return { attackBonus, damageMod, ability };
}

/** Split D&D item property prose into tokens for {@link normalizeWeaponProperties}. */
export function parseWeaponPropertyList(
  properties: string | string[] | null | undefined,
): string[] {
  if (!properties) return [];
  if (Array.isArray(properties)) return properties.map(String);
  return properties
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
