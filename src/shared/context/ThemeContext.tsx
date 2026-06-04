import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppTheme } from "@/shared/theme/theme";
import {
  applyTheme,
  getStoredTheme,
  persistTheme,
} from "@/shared/theme/theme";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(getStoredTheme);

  const setTheme = useCallback((next: AppTheme) => {
    setThemeState(next);
    applyTheme(next);
    persistTheme(next);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const order: AppTheme[] = ["light", "dark", "mh"];
      const next = order[(order.indexOf(current) + 1) % order.length];
      applyTheme(next);
      persistTheme(next);
      return next;
    });
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, cycleTheme }),
    [theme, setTheme, cycleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return ctx;
}
