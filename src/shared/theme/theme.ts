export type AppTheme = "light" | "dark" | "mh";

export const THEME_STORAGE_KEY = "mh-toolbox-theme";

export const THEME_LABELS: Record<AppTheme, string> = {
  light: "Light",
  dark: "Dark",
  mh: "MH Blue",
};

export const THEME_ORDER: AppTheme[] = ["light", "dark", "mh"];

export function isAppTheme(value: string | null): value is AppTheme {
  return value === "light" || value === "dark" || value === "mh";
}

export function getStoredTheme(): AppTheme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isAppTheme(stored)) return stored;
  } catch {
    /* localStorage unavailable */
  }
  return "mh";
}

export function applyTheme(theme: AppTheme): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme !== "light");
}

export function persistTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* localStorage unavailable */
  }
}
