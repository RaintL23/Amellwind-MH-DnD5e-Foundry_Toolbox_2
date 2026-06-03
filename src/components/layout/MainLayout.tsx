import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { CartProvider } from "@/features/shops/context/CartContext";
import { BuilderInventoryProvider } from "@/features/builder/context/BuilderInventoryContext";
import { Sidebar } from "./Sidebar";

export function MainLayout({ syncing = false }: { syncing?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <CartProvider>
      <BuilderInventoryProvider>
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {syncing && (
          <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-400">
            Sincronizando datos de Amellwind…
          </div>
        )}
        {/* Topbar mobile: solo visible en md y abajo */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-foreground">MH DnD5e Toolbox</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
      </BuilderInventoryProvider>
    </CartProvider>
  );
}
