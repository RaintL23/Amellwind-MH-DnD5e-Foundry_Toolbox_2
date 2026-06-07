import type { RollResult } from "../utils/xanathar-roll.utils";

const STORAGE_KEY = "mh-xanathar-backstory";

export interface XanatharBackstoryState {
  selectedRace: string;
  selectedBackground: string;
  selectedClass: string;
  charismaModifier: number;
  results: Record<string, RollResult>;
}

export const DEFAULT_XANATHAR_BACKSTORY_STATE: XanatharBackstoryState = {
  selectedRace: "Human",
  selectedBackground: "",
  selectedClass: "",
  charismaModifier: 0,
  results: {},
};

export function loadXanatharBackstoryState(): XanatharBackstoryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_XANATHAR_BACKSTORY_STATE };

    const parsed = JSON.parse(raw) as Partial<XanatharBackstoryState>;
    return {
      selectedRace:
        typeof parsed.selectedRace === "string"
          ? parsed.selectedRace
          : DEFAULT_XANATHAR_BACKSTORY_STATE.selectedRace,
      selectedBackground:
        typeof parsed.selectedBackground === "string"
          ? parsed.selectedBackground
          : DEFAULT_XANATHAR_BACKSTORY_STATE.selectedBackground,
      selectedClass:
        typeof parsed.selectedClass === "string"
          ? parsed.selectedClass
          : DEFAULT_XANATHAR_BACKSTORY_STATE.selectedClass,
      charismaModifier:
        typeof parsed.charismaModifier === "number"
          ? parsed.charismaModifier
          : DEFAULT_XANATHAR_BACKSTORY_STATE.charismaModifier,
      results:
        parsed.results && typeof parsed.results === "object"
          ? parsed.results
          : DEFAULT_XANATHAR_BACKSTORY_STATE.results,
    };
  } catch {
    return { ...DEFAULT_XANATHAR_BACKSTORY_STATE };
  }
}

export function persistXanatharBackstoryState(
  state: XanatharBackstoryState,
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage unavailable */
  }
}
