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

const HOMEBREW_STORAGE_KEY = "builder:useAmellwindHomebrew";
const BACKSTORY_STORAGE_KEY = "mh-builder-backstory-notes";
const PERSONALITY_STORAGE_KEY = "mh-builder-personality";

export function loadUseAmellwindHomebrew(): boolean {
  try {
    const raw = localStorage.getItem(HOMEBREW_STORAGE_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export function persistUseAmellwindHomebrew(value: boolean): void {
  try {
    localStorage.setItem(HOMEBREW_STORAGE_KEY, String(value));
  } catch {
    /* localStorage unavailable */
  }
}

export function loadBuilderBackstoryNotes(): string {
  try {
    return localStorage.getItem(BACKSTORY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function persistBuilderBackstoryNotes(notes: string): void {
  try {
    if (notes.trim()) {
      localStorage.setItem(BACKSTORY_STORAGE_KEY, notes);
    } else {
      localStorage.removeItem(BACKSTORY_STORAGE_KEY);
    }
  } catch {
    /* localStorage unavailable */
  }
}

export function loadBuilderPersonality(): BuilderPersonality {
  try {
    const raw = localStorage.getItem(PERSONALITY_STORAGE_KEY);
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
      localStorage.setItem(PERSONALITY_STORAGE_KEY, JSON.stringify(personality));
    } else {
      localStorage.removeItem(PERSONALITY_STORAGE_KEY);
    }
  } catch {
    /* localStorage unavailable */
  }
}
