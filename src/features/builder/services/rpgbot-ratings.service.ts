import type { RpgbotRatingsData } from "../data/rpgbot-ratings.types";

let loadPromise: Promise<RpgbotRatingsData> | null = null;
let cached: RpgbotRatingsData | null = null;

export function loadRpgbotRatings(): Promise<RpgbotRatingsData> {
  if (cached) return Promise.resolve(cached);
  if (!loadPromise) {
    loadPromise = import("../data/rpgbot-ratings.json").then((mod) => {
      cached = mod.default as RpgbotRatingsData;
      return cached;
    });
  }
  return loadPromise;
}
