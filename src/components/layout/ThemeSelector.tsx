import { Moon, Palette, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Select } from "@/components/ui/select";
import { useTheme } from "@/shared/context/ThemeContext";
import type { AppTheme } from "@/shared/theme/theme";
import { THEME_LABELS, THEME_ORDER } from "@/shared/theme/theme";
import { cn } from "@/shared/utils/cn";

const THEME_ICONS: Record<AppTheme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  mh: Palette,
};

interface ThemeSelectorProps {
  collapsed: boolean;
}

export function ThemeSelector({ collapsed }: ThemeSelectorProps) {
  const { theme, setTheme, cycleTheme } = useTheme();
  const Icon = THEME_ICONS[theme];

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        title={`Tema: ${THEME_LABELS[theme]} (clic para cambiar)`}
        aria-label={`Tema actual: ${THEME_LABELS[theme]}. Clic para cambiar.`}
        className="flex w-full items-center justify-center px-2 py-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5">
      <label
        htmlFor="theme-select"
        className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Tema
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Select
          id="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as AppTheme)}
          className={cn("h-8 pl-8 text-xs")}
          aria-label="Seleccionar tema de la página"
        >
          {THEME_ORDER.map((t) => (
            <option key={t} value={t}>
              {THEME_LABELS[t]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
