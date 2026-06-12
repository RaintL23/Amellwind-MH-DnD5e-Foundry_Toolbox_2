const STORAGE_KEY = "builder:useAmellwindHomebrew";

export function loadUseAmellwindHomebrew(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export function persistUseAmellwindHomebrew(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    /* localStorage unavailable */
  }
}
