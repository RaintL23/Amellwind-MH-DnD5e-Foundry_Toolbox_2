/**
 * useTheme Hook
 *
 * Manages dark/light theme state with localStorage persistence
 * Applies theme class to document root element
 */

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "mh-toolbox-theme";

/**
 * Get initial theme from localStorage or system preference
 */
function getInitialTheme(): Theme {
  // Check localStorage first
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored) {
    return stored;
  }

  // Check system preference
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

/**
 * Hook to manage theme state
 *
 * @returns Current theme and function to toggle it
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    // Remove both classes first
    root.classList.remove("light", "dark");

    // Add current theme class
    root.classList.add(theme);

    // Persist to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme };
}
