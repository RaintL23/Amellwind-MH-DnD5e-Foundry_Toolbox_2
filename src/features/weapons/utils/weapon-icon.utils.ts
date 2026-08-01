const WEAPON_ICON_PREFIXES = ["weapon_"] as const;
const WEAPON_ICON_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg"] as const;

/** Filenames under `public/mh-icons/` for MH weapon-type icons (picker catalog). */
export const MH_WEAPON_ICON_FILES = [
  "weapon_accelaxe.webp",
  "weapon_bow.webp",
  "weapon_bowgun.webp",
  "weapon_chargeblade.webp",
  "weapon_dualblades.webp",
  "weapon_dualrepeaters.webp",
  "weapon_greatsword.webp",
  "weapon_gunlance.webp",
  "weapon_hammer.webp",
  "weapon_heavybowgun.webp",
  "weapon_huntinghorn.webp",
  "weapon_lance.webp",
  "weapon_lightbowgun.webp",
  "weapon_longsword.webp",
  "weapon_magnetspike.webp",
  "weapon_magusstaff.webp",
  "weapon_splintrapier.webp",
  "weapon_switchaxe.webp",
  "weapon_swordandshield.webp",
  "weapon_tonfas.webp",
  "weapon_wyvernboomerang.webp",
] as const;

export type MhWeaponIconFile = (typeof MH_WEAPON_ICON_FILES)[number];

export interface MhWeaponIconOption {
  file: MhWeaponIconFile;
  /** App-relative public path, e.g. `/mh-icons/weapon_greatsword.webp`. */
  path: string;
  /** Short label for UI (e.g. "Greatsword"). */
  label: string;
}

function humanizeWeaponIconFile(file: string): string {
  const slug = file
    .replace(/^weapon_/i, "")
    .replace(/\.(webp|png|jpe?g)$/i, "");
  return slug
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Catalog of selectable MH weapon icons from `public/mh-icons`. */
export const MH_WEAPON_ICON_OPTIONS: readonly MhWeaponIconOption[] =
  MH_WEAPON_ICON_FILES.map((file) => ({
    file,
    path: `/mh-icons/${file}`,
    label: humanizeWeaponIconFile(file),
  }));

/** Normalize a stored/selected icon path to `/mh-icons/...` when possible. */
export function normalizeMhIconPath(path: string | undefined | null): string | null {
  const trimmed = path?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/mh-icons/")) return trimmed;
  if (trimmed.startsWith("mh-icons/")) return `/${trimmed}`;
  if (trimmed.startsWith("modules/mh-icons/")) {
    return trimmed.replace(/^modules/, "");
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** e.g. "Accel Axe" -> "AccelAxe" (matches weapon_AccelAxe.webp on disk) */
function weaponNameToFileSlug(weaponName: string): string {
  return weaponName
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function buildWeaponIconPaths(
  prefix: string,
  slug: string,
  extension: string,
): string[] {
  const filename = `${prefix}${slug}${extension}`;
  const lowerFilename = filename.toLowerCase();

  return lowerFilename === filename
    ? [`/mh-icons/${filename}`]
    : [`/mh-icons/${lowerFilename}`, `/mh-icons/${filename}`];
}

/** Candidate public URLs for a weapon icon, ordered by prefix and extension preference. */
export function getWeaponIconUrlCandidates(weaponName: string): string[] {
  const slug = weaponNameToFileSlug(weaponName);

  return WEAPON_ICON_PREFIXES.flatMap((prefix) =>
    WEAPON_ICON_EXTENSIONS.flatMap((extension) =>
      buildWeaponIconPaths(prefix, slug, extension),
    ),
  );
}

/** First catalog candidate for a weapon name (SPA public path). */
export function resolveCatalogIconForWeaponName(
  weaponName: string,
): string | null {
  return getWeaponIconUrlCandidates(weaponName)[0] ?? null;
}

/**
 * Map an app-relative icon path (`/mh-icons/...`) to a Foundry img path.
 * MH icons resolve as `mh-icons/filename.webp` (not `modules/mh-icons/...`).
 * Absolute http(s) URLs and core `icons/` paths pass through.
 */
export function toFoundryImgPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("icons/")) {
    return trimmed;
  }

  let rel = trimmed
    .replace(/^modules\/mh-icons\//, "")
    .replace(/^\//, "");

  // Collapse accidental `mh-icons/mh-icons/...`
  rel = rel.replace(/^(?:mh-icons\/)+/, "mh-icons/");

  if (rel.startsWith("mh-icons/")) return rel;
  if (/\.(webp|png|jpe?g|svg)$/i.test(rel)) {
    return `mh-icons/${rel}`;
  }
  return rel;
}
