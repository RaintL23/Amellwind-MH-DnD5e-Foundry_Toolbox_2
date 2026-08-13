/** 5etools-style hash: urlified name + _ + urlified source */
export function toCreatureHash(name: string, source: string): string {
  return `${urlify(name)}_${urlify(source)}`;
}

function urlify(s: string): string {
  return encodeURIComponent(s.trim());
}

/**
 * Parses a creature id from the URL. React Router often decodes `%20` in the path,
 * so the param may not exactly match the stored hash key.
 */
export function parseCreatureHashFromRoute(
  routeId: string,
): { name: string; source: string } | null {
  const decoded = decodeURIComponent(routeId);
  const lastUnderscore = decoded.lastIndexOf("_");
  if (lastUnderscore <= 0) return null;

  const namePart = decoded.slice(0, lastUnderscore);
  const source = decoded.slice(lastUnderscore + 1);
  if (!source) return null;

  let name = namePart;
  try {
    if (namePart.includes("%")) {
      name = decodeURIComponent(namePart);
    }
  } catch {
    name = namePart;
  }

  return { name: name.trim(), source: source.trim() };
}

export function creatureEntityKey(name: string, source: string): string {
  return `${name}|${source}`.toLowerCase();
}
