/**
 * App navigation from shared NAV_SECTIONS: Amellwind Homebrew, RaintDM, D&D 5e.
 * Desktop icon-collapse + mobile drawer. Home consumes the same map.
 */
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Lock,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ThemeSelector } from "@/components/layout/ThemeSelector";
import {
  NAV_SECTIONS,
  type NavGroupDef,
  type NavItemDef,
} from "@/shared/constants/nav-sections";

interface SidebarProps {
  /** Desktop: colapsado a sólo iconos */
  collapsed: boolean;
  /** Mobile: drawer visible */
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
}

function isNavItemActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function groupHasActiveRoute(pathname: string, group: NavGroupDef) {
  return group.items.some(
    (item) => item.to && isNavItemActive(pathname, item.to),
  );
}

function NavItemLink({
  to,
  label,
  icon: Icon,
  disabled = false,
  collapsed,
  onMobileClose,
}: NavItemDef & { collapsed: boolean; onMobileClose: () => void }) {
  if (!to || disabled) {
    return (
      <div
        title={collapsed ? `${label} (coming soon)` : undefined}
        aria-disabled="true"
        className={cn(
          "flex items-center rounded-md text-sm font-medium transition-colors relative text-muted-foreground/60 cursor-not-allowed",
          collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span>{label}</span>
            <Lock className="h-3.5 w-3.5 ml-auto" />
          </>
        )}
      </div>
    );
  }

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
    </NavLink>
  );
}

function SidebarNavGroup({
  sectionId,
  group,
  collapsed,
  open,
  onToggle,
  onMobileClose,
}: {
  sectionId: string;
  group: NavGroupDef;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}) {
  const { pathname } = useLocation();
  const isActiveGroup = groupHasActiveRoute(pathname, group);
  const panelId = `sidebar-group-${sectionId}-${group.label.replace(/\s+/g, "-").toLowerCase()}`;

  if (collapsed) {
    return (
      <div className="flex flex-col gap-1">
        {group.items.map((item) => (
          <NavItemLink
            key={item.to ?? item.label}
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
          "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors",
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
                key={item.to ?? item.label}
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
  const groupKey = (sectionId: string, groupLabel: string) =>
    `${sectionId}__${groupLabel}`;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      NAV_SECTIONS.flatMap((s) =>
        s.groups.map((g) => [groupKey(s.id, g.label), false]),
      ),
    ),
  );

  useEffect(() => {
    NAV_SECTIONS.forEach((section) => {
      section.groups.forEach((group) => {
        if (groupHasActiveRoute(pathname, group)) {
          const key = groupKey(section.id, group.label);
          setOpenGroups((prev) =>
            prev[key] ? prev : { ...prev, [key]: true },
          );
        }
      });
    });
  }, [pathname]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
      {NAV_SECTIONS.map((section, sectionIndex) => (
        <div key={section.id} className={cn(sectionIndex > 0 && "mt-1")}>
          {!collapsed && (
            <p
              className={cn(
                "px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60",
                sectionIndex > 0 && "pt-3 mt-1 border-t border-border",
              )}
            >
              {section.label}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {section.groups.length === 1
              ? section.groups[0].items.map((item) => (
                  <NavItemLink
                    key={item.to ?? item.label}
                    {...item}
                    collapsed={collapsed}
                    onMobileClose={onMobileClose}
                  />
                ))
              : section.groups.map((group) => {
                  const key = groupKey(section.id, group.label);
                  return (
                    <SidebarNavGroup
                      key={key}
                      sectionId={section.id}
                      group={group}
                      collapsed={collapsed}
                      open={openGroups[key] ?? false}
                      onToggle={() => toggleGroup(key)}
                      onMobileClose={onMobileClose}
                    />
                  );
                })}
          </div>
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
      {/* Logo + collapse (arriba, convención moderna) */}
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-border",
          collapsed ? "flex-col gap-2 px-2 py-3" : "gap-2 px-3 py-3",
        )}
      >
        <Link
          to="/"
          className={cn(
            "flex min-w-0 items-center hover:opacity-80 transition-opacity",
            collapsed ? "justify-center" : "gap-2 flex-1",
          )}
          aria-label="Ir al inicio"
        >
          <img
            src="/icon/icon_propose_no_bg.png"
            alt=""
            className="h-7 w-7 shrink-0 object-contain"
          />
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-bold text-foreground">
                MH DnD5e
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Toolbox
              </span>
            </div>
          )}
        </Link>

        {/* Collapse — desktop only, top-right */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "hidden h-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:inline-flex",
            collapsed ? "w-8" : "gap-1.5 px-2.5 text-xs font-medium",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-3.5 w-3.5" />
            </>
          )}
        </button>

        {/* Close — mobile only */}
        <button
          type="button"
          onClick={onMobileClose}
          className="ml-auto rounded p-1 text-muted-foreground hover:bg-accent md:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navegación */}
      <SidebarNav collapsed={collapsed} onMobileClose={onMobileClose} />

      {/* Footer: theme */}
      <div className="shrink-0 border-t border-border">
        <ThemeSelector collapsed={collapsed} />
        {!collapsed && (
          <p className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
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
