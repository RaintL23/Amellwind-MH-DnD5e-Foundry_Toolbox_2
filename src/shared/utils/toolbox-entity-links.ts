/**
 * In-app (and Foundry HTML) deep links for 5etools `{@tag Name|SRC|display}`
 * references. Query values use URLSearchParams so spaces become `+`
 * (`/spells?spell=Dimension+Door`).
 */

export const TOOLBOX_PUBLIC_ORIGIN =
  import.meta.env.VITE_PUBLIC_SITE_URL ??
  "https://amellwind-mh-dn-d5e-foundry-toolbox-2.vercel.app";

const AMELLWIND_SOURCES = new Set(["AGMH", "MHMM", "GTMH"]);

/** Hunter weapon catalog names (AGMH / Weapon Forge). Lowercased keys. */
const HUNTER_WEAPON_NAMES = new Set(
  [
    "Accel Axe",
    "Charge Blade",
    "Dual Blades",
    "Great Sword",
    "Gunlance",
    "Hammer",
    "Hunting Horn",
    "Insect Glaive",
    "Lance",
    "Longsword",
    "Magnet Spike",
    "Magus Staff",
    "Splint Rapier",
    "Switch Axe",
    "Sword and Shield",
    "Tonfas",
    "Wyvern Boomerang",
    "Bow",
    "Dual Repeaters",
    "Heavy Bowgun",
    "Light Bowgun",
  ].map((name) => name.toLowerCase()),
);

export type ToolboxEntityKind =
  | "spell"
  | "item"
  | "condition"
  | "disease"
  | "class"
  | "race"
  | "species"
  | "creature"
  | "weapon"
  | "feat"
  | "background";

export interface ParsedFiveToolsTag {
  tag: string;
  name: string;
  source: string;
  display: string;
}

export interface ExtractedFiveToolsTag {
  start: number;
  end: number;
  tag: string;
  body: string;
}

/** Finds the next `{@tag …}` with matching braces so nested tags parse correctly. */
export function extractNextFiveToolsTag(
  text: string,
  from = 0,
): ExtractedFiveToolsTag | null {
  const start = text.indexOf("{@", from);
  if (start < 0) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        const inner = text.slice(start + 2, i);
        const space = inner.search(/\s/);
        const tag = (space < 0 ? inner : inner.slice(0, space)).trim();
        const body = space < 0 ? "" : inner.slice(space + 1);
        return { start, end: i + 1, tag, body };
      }
    }
  }
  return null;
}

export interface ToolboxEntityRef {
  kind: ToolboxEntityKind;
  href: string;
  label: string;
}

const FILTER_PAGE_TO_PATH: Record<string, string> = {
  spells: "/spells",
  items: "/dnd-items",
  item: "/dnd-items",
  races: "/dnd-races",
  race: "/dnd-races",
  backgrounds: "/dnd-backgrounds",
  background: "/dnd-backgrounds",
  feats: "/dnd-feats",
  feat: "/dnd-feats",
  classes: "/classes",
  class: "/classes",
  bestiary: "/bestiary",
  creatures: "/bestiary",
  conditions: "/conditions",
  condition: "/conditions",
  diseases: "/conditions",
  optionalfeatures: "/dnd-feats",
  variantrules: "/character-guide",
};

export function isAmellwindSource(source: string | undefined | null): boolean {
  return AMELLWIND_SOURCES.has((source ?? "").trim().toUpperCase());
}

export function isHunterWeaponName(name: string): boolean {
  return HUNTER_WEAPON_NAMES.has(name.trim().toLowerCase());
}

/** Title-cases a 5etools lookup name (`dimension door` → `Dimension Door`). */
export function formatEntityDisplayName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b([a-z])/g, (ch) => ch.toUpperCase());
}

export function buildToolboxQueryPath(
  path: string,
  param: string,
  value: string,
): string {
  const params = new URLSearchParams();
  params.set(param, value);
  return `${path}?${params.toString()}`;
}

export function toAbsoluteToolboxUrl(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  const origin = TOOLBOX_PUBLIC_ORIGIN.replace(/\/$/, "");
  return href.startsWith("/") ? `${origin}${href}` : `${origin}/${href}`;
}

export function parseFiveToolsTagBody(body: string): {
  name: string;
  source: string;
  display: string;
} {
  const parts = body.split("|").map((part) => part.trim());
  const name = parts[0] ?? "";
  const source = parts[1] ?? "";
  const display = parts[2] ?? "";
  return { name, source, display };
}

export function parseFiveToolsTagToken(
  tag: string,
  body: string,
): ParsedFiveToolsTag {
  const parsed = parseFiveToolsTagBody(body);
  return {
    tag: tag.toLowerCase(),
    name: parsed.name,
    source: parsed.source,
    display: parsed.display,
  };
}

function monsterPath(name: string, source: string): string {
  const src = source.trim() || "MHMM";
  return `/monsters/${encodeURIComponent(`${name}|${src}`)}`;
}

function bestiaryPath(name: string, source: string): string {
  const src = source.trim() || "MM";
  return `/bestiary/${encodeURIComponent(`${name}_${src}`)}`;
}

/**
 * Resolves a 5etools entity tag to an in-app path, or null when the tag is
 * not a catalog reference (damage, dice, italic, …).
 */
export function buildToolboxEntityHref(
  tag: string,
  name: string,
  source = "",
): string | null {
  const trimmed = formatEntityDisplayName(name);
  if (!trimmed) return null;

  const kind = tag.toLowerCase();
  const src = source.trim();
  const amellwind = isAmellwindSource(src);

  switch (kind) {
    case "spell":
      return buildToolboxQueryPath("/spells", "spell", trimmed);
    case "item":
      if (isHunterWeaponName(trimmed)) {
        return buildToolboxQueryPath("/weapons", "weapon", trimmed);
      }
      if (amellwind) return buildToolboxQueryPath("/items", "item", trimmed);
      return buildToolboxQueryPath("/dnd-items", "item", trimmed);
    case "condition":
    case "status":
      return buildToolboxQueryPath("/conditions", "condition", trimmed);
    case "disease":
      return buildToolboxQueryPath("/conditions", "disease", trimmed);
    case "class":
      return `/classes/${encodeURIComponent(trimmed)}`;
    case "subclass":
      return `/classes/${encodeURIComponent(trimmed)}`;
    case "race":
    case "species":
      if (amellwind) return buildToolboxQueryPath("/species", "species", trimmed);
      return buildToolboxQueryPath("/dnd-races", "race", trimmed);
    case "creature":
      if (amellwind || !src) return monsterPath(trimmed, src);
      return bestiaryPath(trimmed, src);
    case "weapon":
      if (amellwind || isHunterWeaponName(trimmed) || !src) {
        return buildToolboxQueryPath("/weapons", "weapon", trimmed);
      }
      return buildToolboxQueryPath("/dnd-items", "item", trimmed);
    case "feat":
      if (amellwind) return buildToolboxQueryPath("/feats", "feat", trimmed);
      return buildToolboxQueryPath("/dnd-feats", "feat", trimmed);
    case "background":
      if (amellwind) {
        return buildToolboxQueryPath("/backgrounds", "background", trimmed);
      }
      return buildToolboxQueryPath("/dnd-backgrounds", "background", trimmed);
    default:
      return null;
  }
}

export function resolveToolboxEntityRef(
  tag: string,
  body: string,
): ToolboxEntityRef | null {
  const parsed = parseFiveToolsTagToken(tag, body);
  if (!parsed.name) return null;

  const href = buildToolboxEntityHref(parsed.tag, parsed.name, parsed.source);
  if (!href) return null;

  const kind = ((): ToolboxEntityKind => {
    switch (parsed.tag) {
      case "status":
        return "condition";
      case "species":
        return "race";
      case "subclass":
        return "class";
      default:
        return parsed.tag as ToolboxEntityKind;
    }
  })();

  const label =
    parsed.display || formatEntityDisplayName(parsed.name) || parsed.name;

  return { kind, href, label };
}

/**
 * `{@filter Label|page|key=value;…}` → in-app list (or entity) path.
 */
export function buildToolboxFilterHref(
  display: string,
  page: string,
  _filterSpec = "",
): string | null {
  const label = display.trim();
  const pageSlug = page.trim().toLowerCase() || "items";

  if (isHunterWeaponName(label) && (pageSlug === "items" || pageSlug === "item")) {
    return buildToolboxQueryPath("/weapons", "weapon", formatEntityDisplayName(label));
  }

  const path = FILTER_PAGE_TO_PATH[pageSlug];
  if (!path) {
    if (label) {
      return buildToolboxQueryPath("/dnd-items", "item", formatEntityDisplayName(label));
    }
    return null;
  }

  if (!label) return path;

  if (pageSlug === "spells" || pageSlug === "spell") {
    if (/ or |,/.test(label)) return path;
    return buildToolboxQueryPath(path, "spell", formatEntityDisplayName(label));
  }
  if (pageSlug === "items" || pageSlug === "item") {
    if (/ or |,/.test(label)) return path;
    return buildToolboxQueryPath(path, "item", formatEntityDisplayName(label));
  }
  if (pageSlug === "races" || pageSlug === "race") {
    return buildToolboxQueryPath(path, "race", formatEntityDisplayName(label));
  }
  if (pageSlug === "feats" || pageSlug === "feat") {
    return buildToolboxQueryPath(path, "feat", formatEntityDisplayName(label));
  }
  if (pageSlug === "backgrounds" || pageSlug === "background") {
    return buildToolboxQueryPath(path, "background", formatEntityDisplayName(label));
  }
  if (pageSlug === "conditions" || pageSlug === "condition") {
    return buildToolboxQueryPath(path, "condition", formatEntityDisplayName(label));
  }
  if (pageSlug === "classes" || pageSlug === "class") {
    return `/classes/${encodeURIComponent(formatEntityDisplayName(label))}`;
  }

  return path;
}

export function buildToolboxWeaponHref(weaponName: string): string {
  return buildToolboxQueryPath(
    "/weapons",
    "weapon",
    formatEntityDisplayName(weaponName),
  );
}
