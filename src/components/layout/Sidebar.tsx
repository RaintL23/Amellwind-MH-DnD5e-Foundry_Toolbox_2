/**
 * Sidebar Component
 *
 * Navigation sidebar for desktop view
 * Displays available tools and navigation links
 * Designed to be easily extensible for future tools
 */

import {
  Swords,
  Package,
  Hammer,
  Shield,
  ScrollText,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export interface NavItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href: string;
  enabled: boolean;
  comingSoon?: boolean;
}

/**
 * Navigation items configuration
 * Easy to extend with new tools
 */
export const NAV_ITEMS: NavItem[] = [
  // {
  //   id: "home",
  //   title: "Home",
  //   icon: <Home className="h-5 w-5" />,
  //   href: "/",
  //   enabled: true,
  // },
  {
    id: "monsters",
    title: "Monster Bestiary",
    icon: <Swords className="h-5 w-5" />,
    href: "/monsters",
    enabled: true,
  },
  {
    id: "runes",
    title: "Material Runes",
    icon: <Sparkles className="h-5 w-5" />,
    href: "/runes",
    enabled: true,
  },
  {
    id: "items",
    title: "Items & Equipment",
    icon: <Package className="h-5 w-5" />,
    href: "/items",
    enabled: false,
    comingSoon: true,
  },
  {
    id: "crafting",
    title: "Crafting System",
    icon: <Hammer className="h-5 w-5" />,
    href: "/crafting",
    enabled: false,
    comingSoon: true,
  },
  {
    id: "armor",
    title: "Armor Builder",
    icon: <Shield className="h-5 w-5" />,
    href: "/armor",
    enabled: false,
    comingSoon: true,
  },
  {
    id: "carving",
    title: "Carving Tables",
    icon: <ScrollText className="h-5 w-5" />,
    href: "/carving",
    enabled: false,
    comingSoon: true,
  },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (href: string) => void;
  className?: string;
}

export function Sidebar({ currentPage, onNavigate, className }: SidebarProps) {
  return (
    <aside className={cn("flex flex-col border-r bg-card h-full", className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">MH Toolbox</h1>
        <p className="text-sm text-muted-foreground mt-1">
          D&D 5e Monster Hunter
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
          Tools
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.href;
          const isDisabled = !item.enabled;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.enabled) {
                  onNavigate(item.href);
                }
              }}
              disabled={isDisabled}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive && "bg-accent text-accent-foreground",
                isDisabled &&
                  "opacity-50 cursor-not-allowed hover:bg-transparent"
              )}
            >
              <span className={cn(isActive && "text-primary")}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.title}</span>
              {item.comingSoon && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Soon
                </span>
              )}
              {isActive && <ChevronRight className="h-4 w-4" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Theme
          </span>
          <ThemeToggle />
        </div>
        <p className="text-xs text-muted-foreground">
          Based on Amellwind's Monster Hunter content
        </p>
      </div>
    </aside>
  );
}
