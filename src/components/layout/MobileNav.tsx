/**
 * MobileNav Component
 *
 * Mobile navigation drawer/menu
 * Responsive navigation for smaller screens
 */

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NAV_ITEMS } from "./Sidebar";

interface MobileNavProps {
  currentPage: string;
  onNavigate: (href: string) => void;
}

export function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (href: string) => {
    onNavigate(href);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-lg font-bold">MH Toolbox</h1>
            <p className="text-xs text-muted-foreground">D&D 5e Monster Hunter</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "fixed top-[65px] left-0 z-40 h-[calc(100vh-65px)] w-80 bg-background border-r transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="p-4 space-y-2">
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
                    handleNavigate(item.href);
                  }
                }}
                disabled={isDisabled}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground",
                  isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
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
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <p className="text-xs text-muted-foreground">
            Based on Amellwind's Monster Hunter content
          </p>
        </div>
      </div>
    </>
  );
}

