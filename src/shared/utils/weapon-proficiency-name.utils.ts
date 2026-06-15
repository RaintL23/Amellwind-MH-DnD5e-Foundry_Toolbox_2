import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

const SOURCE_SUFFIXES = new Set([
  "phb",
  "xphb",
  "dmg",
  "mm",
  "xgte",
  "scag",
  "vgm",
  "tce",
  "ftd",
  "egw",
  "ggr",
  "ai",
  "llk",
  "mpmm",
  "vrgr",
  "mot",
  "scc",
  "bcc",
  "wbw",
  "sj",
  "aag",
  "dsotdq",
  "tofw",
  "idrotf",
  "cm",
  "cos",
  "hotb",
  "veor",
]);

const COMPACT_WEAPON_ALIASES: Record<string, string> = {
  handcrossbow: "Hand Crossbow",
  lightcrossbow: "Light Crossbow",
  heavycrossbow: "Heavy Crossbow",
  handcrossbows: "Hand Crossbow",
  lightcrossbows: "Light Crossbow",
  heavycrossbows: "Heavy Crossbow",
  warpick: "War Pick",
  lightarmor: "Light",
  mediumarmor: "Medium",
  heavyarmor: "Heavy",
};

const CROSSBOW_VARIANTS: Record<string, string> = {
  hand: "Hand Crossbow",
  light: "Light Crossbow",
  heavy: "Heavy Crossbow",
};

function titleCaseWords(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function stripSourceSuffixes(parts: string[]): string[] {
  return parts.filter((part) => !SOURCE_SUFFIXES.has(part.toLowerCase()));
}

function resolveCrossbowVariant(parts: string[]): string | undefined {
  if (parts.length !== 2) return undefined;

  if (parts[0] === "crossbow") {
    return CROSSBOW_VARIANTS[parts[1]];
  }

  if (parts[1] === "crossbow") {
    return CROSSBOW_VARIANTS[parts[0]];
  }

  return undefined;
}

/**
 * Normalize 5etools weapon/armor proficiency keys into display names the builder
 * can match against (e.g. crossbow|hand|phb → Hand Crossbow).
 */
export function canonicalizeWeaponProficiencyLabel(raw: string): string {
  const trimmed = raw.trim().replace(/\s*\(optional\)$/i, "").trim();
  if (!trimmed) return "";

  if (trimmed.includes("{@")) {
    return parseFiveToolsMarkup(trimmed);
  }

  const compact = trimmed.toLowerCase().replace(/'/g, "").replace(/\s+/g, "");
  const compactAlias = COMPACT_WEAPON_ALIASES[compact];
  if (compactAlias) return compactAlias;

  if (!trimmed.includes("|")) {
    const lower = trimmed.toLowerCase();
    if (lower === "simple") return "Simple";
    if (lower === "martial") return "Martial";
    if (lower === "shield" || lower === "shields") return "Shield";
    if (lower === "light") return "Light";
    if (lower === "medium") return "Medium";
    if (lower === "heavy") return "Heavy";
    return titleCaseWords(trimmed);
  }

  const parts = stripSourceSuffixes(
    trimmed.split("|").map((part) => part.trim().toLowerCase()),
  );

  const crossbow = resolveCrossbowVariant(parts);
  if (crossbow) return crossbow;

  if (parts.length === 2 && parts[0] === "war" && parts[1] === "pick") {
    return "War Pick";
  }

  if (parts.length === 1) {
    const [part] = parts;
    if (part === "simple") return "Simple";
    if (part === "martial") return "Martial";
    if (part === "shield" || part === "shields") return "Shield";
    if (part === "light") return "Light";
    if (part === "medium") return "Medium";
    if (part === "heavy") return "Heavy";
    return titleCaseWords(part);
  }

  return titleCaseWords(parts.join(" "));
}

export function normalizeWeaponProficiencyKey(raw: string): string {
  return canonicalizeWeaponProficiencyLabel(raw)
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/s$/, "");
}
