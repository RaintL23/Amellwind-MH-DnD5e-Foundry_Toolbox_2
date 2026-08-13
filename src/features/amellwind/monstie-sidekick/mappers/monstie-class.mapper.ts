import type { MonstieLevelProgression, MonstieSidekickClass } from "@/shared/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const MONSTIE_CLASS_NAME = "Monstie Sidekick";

function parseFeatureRef(ref: string): { name: string; level: number } | null {
  const parts = ref.split("|");
  if (parts.length < 4) return null;
  const level = Number(parts[3]);
  if (Number.isNaN(level)) return null;
  return { name: parts[0].trim(), level };
}

export function mapMonstieSidekickClass(rawList: unknown[]): MonstieSidekickClass | null {
  const raw = rawList.find(
    (r) =>
      typeof r === "object" &&
      r !== null &&
      (r as Raw).name === MONSTIE_CLASS_NAME,
  ) as Raw | undefined;

  if (!raw) return null;

  const refs = Array.isArray(raw.classFeatures)
    ? (raw.classFeatures as string[])
    : [];

  const byLevel = new Map<number, string[]>();
  for (const ref of refs) {
    const parsed = parseFeatureRef(ref);
    if (!parsed) continue;
    const list = byLevel.get(parsed.level) ?? [];
    list.push(parsed.name);
    byLevel.set(parsed.level, list);
  }

  const progression: MonstieLevelProgression[] = [...byLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, features]) => ({ level, features }));

  return {
    name: MONSTIE_CLASS_NAME,
    source: String(raw.source ?? "AGMH"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    isSidekick: raw.isSidekick === true,
    progression,
  };
}
