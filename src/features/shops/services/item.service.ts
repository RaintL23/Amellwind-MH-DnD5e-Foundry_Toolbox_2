import { MHItem } from "@/shared/types";
import { getGtmhData } from "@/shared/db/sync.service";

const TYPE_LABELS: Record<string, string> = {
  HW: "Hunter Weapon",
  MHPSA: "Phial (Switch Axe)",
  MHCB: "Coating (Bow)",
  MHABG: "Ammo (Bowgun)",
  MHADR: "Ammo (Repeaters)",
  P: "Potion",
  G: "Gear",
  "EXP|DMG": "Explosive",
};

interface RawItem {
  name?: string;
  source?: string;
  type?: string;
  rarity?: string;
  value?: number;
  weight?: number;
  page?: number;
  entries?: unknown[];
}

export function formatValueGp(valueCp: number | null): string {
  if (valueCp === null || valueCp === undefined) return "—";
  const gp = valueCp / 100;
  if (gp >= 1000) return `${gp.toLocaleString("en-US")} gp`;
  return `${gp} gp`;
}

function mapItem(raw: RawItem): MHItem {
  const type = raw.type ?? "misc";
  return {
    name: raw.name ?? "Unknown",
    source: raw.source ?? "AGMH",
    type,
    typeLabel: TYPE_LABELS[type] ?? "Misc",
    rarity: raw.rarity ?? "none",
    valueCp: raw.value ?? null,
    weight: raw.weight ?? null,
    page: raw.page,
    entries: raw.entries ?? [],
  };
}

let cache: MHItem[] | null = null;

export async function getAllItems(): Promise<MHItem[]> {
  if (cache) return cache;

  const raw = await getGtmhData();
  if (!raw || !Array.isArray(raw)) return [];

  cache = (raw as RawItem[]).map(mapItem);
  return cache;
}

export function clearItemCache(): void {
  cache = null;
}
