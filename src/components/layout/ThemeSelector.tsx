import { Check, Moon, Palette, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/shared/context/ThemeContext";
import type { AppTheme } from "@/shared/theme/theme";
import { THEME_LABELS, THEME_ORDER } from "@/shared/theme/theme";

const THEME_ICONS: Record<AppTheme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  mh: Palette,
};

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const Icon = THEME_ICONS[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={`Theme: ${THEME_LABELS[theme]}`}
          aria-label={`Theme: ${THEME_LABELS[theme]}. Open theme menu`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={8} className="w-44">
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_ORDER.map((t) => {
          const ThemeIcon = THEME_ICONS[t];
          const selected = theme === t;
          return (
            <DropdownMenuItem
              key={t}
              onSelect={() => setTheme(t)}
              className="gap-2 text-xs"
            >
              <ThemeIcon className="h-3.5 w-3.5" />
              <span className="flex-1">{THEME_LABELS[t]}</span>
              {selected && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
