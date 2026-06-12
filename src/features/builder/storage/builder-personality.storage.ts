export interface BuilderPersonality {
  trait1: string;
  trait2: string;
  ideal: string;
  bond: string;
  flaw: string;
}

export const EMPTY_BUILDER_PERSONALITY: BuilderPersonality = {
  trait1: "",
  trait2: "",
  ideal: "",
  bond: "",
  flaw: "",
};

const STORAGE_KEY = "mh-builder-personality";

export function loadBuilderPersonality(): BuilderPersonality {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_BUILDER_PERSONALITY };
    const parsed = JSON.parse(raw) as Partial<BuilderPersonality>;
    return {
      trait1: parsed.trait1 ?? "",
      trait2: parsed.trait2 ?? "",
      ideal: parsed.ideal ?? "",
      bond: parsed.bond ?? "",
      flaw: parsed.flaw ?? "",
    };
  } catch {
    return { ...EMPTY_BUILDER_PERSONALITY };
  }
}

export function persistBuilderPersonality(personality: BuilderPersonality): void {
  try {
    const hasContent = Object.values(personality).some((v) => v.trim().length > 0);
    if (hasContent) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(personality));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* localStorage unavailable */
  }
}
