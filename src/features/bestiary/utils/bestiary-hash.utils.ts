/** 5etools-style hash: urlified name + _ + urlified source */
export function toCreatureHash(name: string, source: string): string {
  return `${urlify(name)}_${urlify(source)}`;
}

function urlify(s: string): string {
  return encodeURIComponent(s.trim()).replace(/%20/g, "%20");
}

export function creatureEntityKey(name: string, source: string): string {
  return `${name}|${source}`.toLowerCase();
}
