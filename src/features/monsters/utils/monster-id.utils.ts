const SEP = "|";

export function toMonsterId(name: string, source: string): string {
  return encodeURIComponent(`${name}${SEP}${source}`);
}

export function parseMonsterId(monsterId: string): { name: string; source: string } | null {
  const decoded = decodeURIComponent(monsterId);
  const sepIndex = decoded.indexOf(SEP);
  if (sepIndex < 0) return null;
  return {
    name: decoded.slice(0, sepIndex),
    source: decoded.slice(sepIndex + 1),
  };
}
