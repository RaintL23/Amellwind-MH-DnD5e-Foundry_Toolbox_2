import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Swords,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Sword,
  Leaf,
  Users,
  ScrollText,
  BookOpen,
  PawPrint,
  Sparkles,
  Lock,
  Skull,
  Calculator,
  UserRound,
  Shield,
  Layers,
  TreePine,
  ShoppingBag,
  UtensilsCrossed,
  FlaskConical,
  Clock,
  Bot,
  Flame,
  Wand2,
  LibraryBig,
  Map,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useBuilderInventory } from "@/features/builder/context/BuilderInventoryContext";
import { ThemeSelector } from "@/components/layout/ThemeSelector";

type NavItem = {
  label: string;
  icon: LucideIcon;
  to?: string;
  disabled?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

type NavSection = {
  id: string;
  label: string;
  groups: NavGroup[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: "amellwind",
    label: "Amellwind Homebrew",
    groups: [
      {
        label: "Character",
        items: [
          { to: "/builder", label: "Builder", icon: UserRound },
          { to: "/damage-calculator", label: "Damage Calculator", icon: Calculator },
          { to: "/character-guide", label: "Creation Guide", icon: BookOpen },
        ],
      },
      {
        label: "Bestiary and Rules",
        items: [
          { to: "/monsters", label: "Monsters", icon: Skull },
          { to: "/conditions", label: "Conditions & Diseases", icon: AlertTriangle },
        ],
      },
      {
        label: "Species and Character Options",
        items: [
          { to: "/species", label: "Species", icon: Users },
          { to: "/backgrounds", label: "Backgrounds", icon: ScrollText },
          { to: "/feats", label: "Feats", icon: Sparkles },
        ],
      },
      {
        label: "Weapons, Runes, and Equipment",
        items: [
          { to: "/weapons", label: "Weapons", icon: Sword },
          { to: "/runes", label: "Runes", icon: Flame },
          { to: "/material-effects", label: "Material Effects", icon: Shield },
          { to: "/items", label: "Items", icon: Layers },
        ],
      },
      {
        label: "World and Exploration",
        items: [
          { to: "/environments", label: "Environments", icon: TreePine },
          { to: "/resources", label: "Resources", icon: Leaf },
          { to: "/shops", label: "Shops", icon: ShoppingBag },
          { to: "/cooking", label: "Cooking", icon: UtensilsCrossed },
          { to: "/combo", label: "Combo List", icon: FlaskConical },
          { to: "/downtime", label: "Downtime", icon: Clock },
        ],
      },
      {
        label: "NPCs and Companions",
        items: [
          { to: "/monstie-sidekick", label: "Monstie Sidekick", icon: PawPrint },
          { to: "/npc-generator", label: "NPC Generator", icon: Bot },
        ],
      },
    ],
  },
  {
    id: "dnd5e",
    label: "D&D 5e Compendium",
    groups: [
      {
        label: "Spells and Classes",
        items: [
          { to: "/spells", label: "Spells", icon: Wand2 },
          { to: "/classes", label: "Classes", icon: Swords },
        ],
      },
      {
        label: "Character Options",
        items: [
          { to: "/dnd-races", label: "Races", icon: Users },
          { to: "/dnd-backgrounds", label: "Backgrounds", icon: ScrollText },
          { to: "/dnd-feats", label: "Feats", icon: Sparkles },
        ],
      },
      {
        label: "Bestiary",
        items: [{ to: "/bestiary", label: "Bestiary", icon: Skull }],
      },
      {
        label: "Equipment",
        items: [{ to: "/dnd-items", label: "Items", icon: LibraryBig }],
      },
      {
        label: "Character Tools",
        items: [
          { to: "/xanathar-backstory", label: "Xanathar Backstory", icon: Map },
        ],
      },
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
  return group.items.some((item) => item.to && isNavItemActive(pathname, item.to));
}

function NavItemLink({
  to,
  label,
  icon: Icon,
  disabled = false,
  collapsed,
  onMobileClose,
}: NavItem & { collapsed: boolean; onMobileClose: () => void }) {
  if (!to || disabled) {
    return (
      <div
        title={collapsed ? `${label} (próximamente)` : undefined}
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
      {to === "/builder" && <BuilderBadge collapsed={collapsed} />}
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
  group: NavGroup;
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
  const groupKey = (sectionId: string, groupLabel: string) => `${sectionId}__${groupLabel}`;

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
          setOpenGroups((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
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
            {section.groups.length === 1 ? (
              section.groups[0].items.map((item) => (
                <NavItemLink
                  key={item.to ?? item.label}
                  {...item}
                  collapsed={collapsed}
                  onMobileClose={onMobileClose}
                />
              ))
            ) : (
              section.groups.map((group) => {
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
              })
            )}
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
      {/* Logo / título */}
      <div
        className={cn(
          "flex items-center border-b border-border shrink-0",
          collapsed ? "justify-center px-2 py-5" : "gap-2 px-4 py-5",
        )}
      >
        <Link
          to="/"
          className={cn(
            "flex items-center min-w-0 hover:opacity-80 transition-opacity",
            collapsed ? "" : "gap-2 flex-1",
          )}
          aria-label="Ir al inicio"
        >
        <img
          src="/icon/icon_propose_no_bg.png"
          alt=""
          className="h-7 w-7 shrink-0 object-contain"
        />
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
        </Link>
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
        <ThemeSelector collapsed={collapsed} />
        {/* Botón collapse — oculto en mobile */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "hidden md:flex w-full items-center px-3 py-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
            collapsed ? "justify-center" : "gap-2",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
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
