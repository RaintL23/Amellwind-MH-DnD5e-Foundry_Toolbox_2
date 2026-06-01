import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Swords,
  Shield,
  Gem,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Hammer,
  Package,
  Store,
  Sword,
  Leaf,
  MapPin,
  User,
  Users,
  ScrollText,
  Award,
  BookOpen,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useBuilderInventory } from "@/features/builder/context/BuilderInventoryContext";

type NavItem = { to: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Character",
    items: [
      { to: "/builder", label: "Builder", icon: User },
      { to: "/character-guide", label: "Creation Guide", icon: BookOpen },
      { to: "/species", label: "Species", icon: Users },
      { to: "/backgrounds", label: "Backgrounds", icon: ScrollText },
      { to: "/feats", label: "Feats", icon: Award },
    ],
  },
  {
    label: "Bestiary",
    items: [
      { to: "/monsters", label: "Monsters", icon: Swords },
      { to: "/environments", label: "Environments", icon: MapPin },
    ],
  },
  {
    label: "Gear",
    items: [
      { to: "/runes", label: "Runes", icon: Gem },
      { to: "/weapons", label: "Weapons", icon: Sword },
      { to: "/items", label: "Items", icon: Package },
    ],
  },
  {
    label: "Craft & Trade",
    items: [
      { to: "/shops", label: "Shops", icon: Store },
      { to: "/cooking", label: "Cooking", icon: ChefHat },
      { to: "/combo", label: "Combo List", icon: Hammer },
      { to: "/resources", label: "Resources", icon: Leaf },
    ],
  },
];

interface SidebarProps {
  /** Desktop: colapsado a sólo iconos */
  collapsed: boolean;
  /** Mobile: drawer visible */
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
}

function BuilderBadge({ collapsed }: { collapsed: boolean }) {
  const { totalItems } = useBuilderInventory();
  if (totalItems === 0) return null;
  return (
    <span
      className={cn(
        "rounded-full bg-primary/80 text-[9px] font-bold text-primary-foreground min-w-[16px] h-4 flex items-center justify-center px-1",
        collapsed ? "absolute -top-0.5 -right-0.5" : "ml-auto",
      )}
    >
      {totalItems}
    </span>
  );
}

function isNavItemActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function groupHasActiveRoute(pathname: string, group: NavGroup) {
  return group.items.some((item) => isNavItemActive(pathname, item.to));
}

function NavItemLink({
  to,
  label,
  icon: Icon,
  collapsed,
  onMobileClose,
}: NavItem & { collapsed: boolean; onMobileClose: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onMobileClose}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-md text-sm font-medium transition-colors relative",
          collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
          isActive
            ? "bg-primary/20 text-primary border border-primary/30"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && label}
      {to === "/builder" && <BuilderBadge collapsed={collapsed} />}
    </NavLink>
  );
}

function SidebarNavGroup({
  group,
  collapsed,
  open,
  onToggle,
  onMobileClose,
}: {
  group: NavGroup;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}) {
  const { pathname } = useLocation();
  const isActiveGroup = groupHasActiveRoute(pathname, group);
  const panelId = `sidebar-group-${group.label.replace(/\s+/g, "-").toLowerCase()}`;

  if (collapsed) {
    return (
      <div className="flex flex-col gap-1">
        {group.items.map((item) => (
          <NavItemLink
            key={item.to}
            {...item}
            collapsed={collapsed}
            onMobileClose={onMobileClose}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider transition-colors",
          isActiveGroup
            ? "text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
        <span className="flex-1 truncate">{group.label}</span>
      </button>
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-0.5 pb-1 pl-1">
            {group.items.map((item) => (
              <NavItemLink
                key={item.to}
                {...item}
                collapsed={collapsed}
                onMobileClose={onMobileClose}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarNav({
  collapsed,
  onMobileClose,
}: {
  collapsed: boolean;
  onMobileClose: () => void;
}) {
  const { pathname } = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.label, false])),
  );

  useEffect(() => {
    const activeGroup = NAV_GROUPS.find((g) => groupHasActiveRoute(pathname, g));
    if (!activeGroup) return;
    setOpenGroups((prev) =>
      prev[activeGroup.label]
        ? prev
        : { ...prev, [activeGroup.label]: true },
    );
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
      {NAV_GROUPS.map((group, groupIndex) => (
        <div
          key={group.label}
          className={cn(
            groupIndex > 0 && (collapsed ? "pt-2 mt-1 border-t border-border" : "pt-1"),
          )}
        >
          <SidebarNavGroup
            group={group}
            collapsed={collapsed}
            open={openGroups[group.label] ?? false}
            onToggle={() => toggleGroup(group.label)}
            onMobileClose={onMobileClose}
          />
        </div>
      ))}
    </nav>
  );
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
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo / título */}
      <div
        className={cn(
          "flex items-center border-b border-border shrink-0",
          collapsed ? "justify-center px-2 py-5" : "gap-2 px-4 py-5",
        )}
      >
        <Shield className="h-7 w-7 text-primary shrink-0" />
        {!collapsed && (
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-bold text-foreground truncate">
              MH DnD5e
            </span>
            <span className="text-xs text-muted-foreground truncate">
              Toolbox
            </span>
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
      <SidebarNav collapsed={collapsed} onMobileClose={onMobileClose} />

      {/* Footer + botón collapse (solo desktop) */}
      <div className="border-t border-border shrink-0">
        {/* Botón collapse — oculto en mobile */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "hidden md:flex w-full items-center px-3 py-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
            collapsed ? "justify-center" : "gap-2",
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
      <div className="hidden md:flex h-full shrink-0">{inner}</div>

      {/* ── Mobile: drawer con overlay ── */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={onMobileClose}
        aria-hidden
      />
      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 min-h-screen transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {inner}
      </div>
    </>
  );
}
