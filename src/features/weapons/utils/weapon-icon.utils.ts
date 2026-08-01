const WEAPON_ICON_PREFIXES = ["weapon_"] as const;
const WEAPON_ICON_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg"] as const;

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
 * Map an app-relative icon path (`/mh-icons/...`) to a Foundry-friendly img string.
 * Absolute http(s) URLs and already-namespaced Foundry paths pass through.
 */
export function toFoundryImgPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("icons/")) {
    return trimmed;
  }
  if (trimmed.startsWith("/mh-icons/")) {
    return `modules/mh-icons${trimmed}`;
  }
  if (trimmed.startsWith("mh-icons/")) {
    return `modules/${trimmed}`;
  }
  return trimmed.replace(/^\//, "");
}
