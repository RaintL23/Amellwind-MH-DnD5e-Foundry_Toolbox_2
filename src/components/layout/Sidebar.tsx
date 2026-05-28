import { NavLink } from "react-router-dom";
import { Swords, Shield, Gem, ChefHat, ChevronLeft, ChevronRight, X, Hammer, Package, Store, Sword } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const NAV_ITEMS = [
  { to: "/monsters", label: "Monsters", icon: Swords },
  { to: "/runes", label: "Runes", icon: Gem },
  { to: "/weapons", label: "Weapons", icon: Sword },
  { to: "/cooking", label: "Cooking", icon: ChefHat },
  { to: "/combo", label: "Combo List", icon: Hammer },
  { to: "/items", label: "Items", icon: Package },
  { to: "/shops", label: "Shops", icon: Store },
];

interface SidebarProps {
  /** Desktop: colapsado a sólo iconos */
  collapsed: boolean;
  /** Mobile: drawer visible */
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onMobileClose,
}: SidebarProps) {
  const inner = (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo / título */}
      <div
        className={cn(
          "flex items-center border-b border-border shrink-0",
          collapsed ? "justify-center px-2 py-5" : "gap-2 px-4 py-5"
        )}
      >
        <Shield className="h-7 w-7 text-primary shrink-0" />
        {!collapsed && (
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-bold text-foreground truncate">MH DnD5e</span>
            <span className="text-xs text-muted-foreground truncate">Toolbox</span>
          </div>
        )}
        {/* Botón cerrar en mobile */}
        <button
          onClick={onMobileClose}
          className="ml-auto md:hidden p-1 rounded hover:bg-accent text-muted-foreground"
          aria-label="Cerrar menú"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onMobileClose}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* Footer + botón collapse (solo desktop) */}
      <div className="border-t border-border shrink-0">
        {/* Botón collapse — oculto en mobile */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "hidden md:flex w-full items-center px-3 py-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
            collapsed ? "justify-center" : "gap-2"
          )}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Colapsar</span>
            </>
          )}
        </button>
        {!collapsed && (
          <p className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border">
            Amellwind Homebrew
          </p>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Desktop: sidebar estático ── */}
      <div className="hidden md:flex min-h-screen shrink-0">{inner}</div>

      {/* ── Mobile: drawer con overlay ── */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onMobileClose}
        aria-hidden
      />
      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 min-h-screen transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {inner}
      </div>
    </>
  );
}
