import type { RpgbotRatingsData } from "../data/rpgbot-ratings.types";

let loadPromise: Promise<RpgbotRatingsData> | null = null;
let cached: RpgbotRatingsData | null = null;

export function loadRpgbotRatings(): Promise<RpgbotRatingsData> {
  if (cached) return Promise.resolve(cached);
  if (!loadPromise) {
    loadPromise = import("../data/rpgbot-ratings.json").then((mod) => {
      const loaded = (mod.default ?? mod) as unknown as RpgbotRatingsData;
      cached = loaded;
      return cached;
    });
  }
  return loadPromise;
}
