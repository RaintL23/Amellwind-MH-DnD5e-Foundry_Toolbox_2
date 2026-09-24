import type {
  WeaponForgePatchNotesDay,
  WeaponForgePatchNotesIndex,
} from "../types/weapon-forge-patch-notes.types";

const PATCH_NOTES_BASE = "/data/raintdm-weapons/patch-notes";

export async function loadWeaponForgePatchNotes(): Promise<
  WeaponForgePatchNotesDay[]
> {
  const indexRes = await fetch(`${PATCH_NOTES_BASE}/index.json`);
  if (!indexRes.ok) {
    throw new Error(`Patch notes index not found (${indexRes.status})`);
  }

  const index = (await indexRes.json()) as WeaponForgePatchNotesIndex;
  const dates = Array.isArray(index.dates) ? index.dates : [];
  if (dates.length === 0) return [];

  const days = await Promise.all(
    dates.map(async (date) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
      const res = await fetch(
        `${PATCH_NOTES_BASE}/${encodeURIComponent(date)}.json`,
      );
      if (!res.ok) {
        console.warn(`Failed to load patch notes for ${date}`);
        return null;
      }
      return (await res.json()) as WeaponForgePatchNotesDay;
    }),
  );

  return days.filter((day): day is WeaponForgePatchNotesDay => day != null);
}
