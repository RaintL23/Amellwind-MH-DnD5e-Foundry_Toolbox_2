const WEAPON_ICON_PREFIXES = ["weapon_"] as const;
const WEAPON_ICON_EXTENSIONS = [".png", ".webp", ".jpg", ".jpeg"] as const;

/** e.g. "Accel Axe" -> "AccelAxe" (matches weapon_AccelAxe.png on disk) */
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
