/**
 * App Component - Root Application
 *
 * Architecture Overview:
 * - React Query for data fetching and caching
 * - Simple client-side routing (no router library needed for MVP)
 * - Responsive layout with mobile and desktop support
 * - Feature-based organization for scalability
 *
 * Routing Strategy:
 * Currently using simple state-based routing for simplicity.
 * Can be easily upgraded to React Router or TanStack Router later.
 */

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MainLayout } from "./components/layout/MainLayout";
import { Homepage } from "./components/layout/Homepage";
import { ComingSoon } from "./components/layout/ComingSoon";
import { MonsterList } from "./features/monsters/components/MonsterList";
import { RuneList } from "./features/runes/components/RuneList";
import { Package, Hammer, Shield, ScrollText } from "lucide-react";
import { useTheme } from "./hooks/useTheme";

/**
 * React Query client configuration
 * Provides sensible defaults for caching and error handling
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState("/");

  // Initialize theme system
  useTheme();

  /**
   * Simple routing function
   * Renders the appropriate component based on current route
   */
  const renderPage = () => {
    switch (currentPage) {
      case "/":
        return <Homepage onNavigate={setCurrentPage} />;
      case "/monsters":
        return <MonsterList />;
      case "/runes":
        return <RuneList />;
      case "/items":
        return (
          <ComingSoon
            title="Items & Equipment"
            description="Browse Monster Hunter weapons, armor, and equipment for D&D 5e"
            icon={<Package className="h-16 w-16" />}
          />
        );
      case "/crafting":
        return (
          <ComingSoon
            title="Crafting System"
            description="Craft powerful equipment using monster materials"
            icon={<Hammer className="h-16 w-16" />}
          />
        );
      case "/armor":
        return (
          <ComingSoon
            title="Armor Builder"
            description="Design and create custom armor sets with unique bonuses"
            icon={<Shield className="h-16 w-16" />}
          />
        );
      case "/carving":
        return (
          <ComingSoon
            title="Carving Tables"
            description="Discover what materials you can harvest from defeated monsters"
            icon={<ScrollText className="h-16 w-16" />}
          />
        );
      default:
        return <Homepage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </MainLayout>
    </QueryClientProvider>
  );
}

export default App;
