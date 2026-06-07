const STORAGE_KEY = "mh-builder-backstory-notes";

export function loadBuilderBackstoryNotes(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function persistBuilderBackstoryNotes(notes: string): void {
  try {
    if (notes.trim()) {
      localStorage.setItem(STORAGE_KEY, notes);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* localStorage unavailable */
  }
}
