export const MONSTER_MANUAL_URL =
  "https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Monster%20Hunter%20Monster%20Manual.json";

export const GUIDE_TO_MONSTER_HUNTING_URL =
  "https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Amellwind's%20Guide%20to%20Monster%20Hunting.json";

/** Tiempo de caché en milisegundos: 24 horas */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const DB_NAME = "mh-dnd5e-toolbox";
export const DB_VERSION = 1;

export const STORES = {
  MM_CURRENT: "mm_current",
  MM_PREVIOUS: "mm_previous",
  MM_META: "mm_meta",
  GTMH_CURRENT: "gtmh_current",
  GTMH_PREVIOUS: "gtmh_previous",
  GTMH_META: "gtmh_meta",
} as const;
