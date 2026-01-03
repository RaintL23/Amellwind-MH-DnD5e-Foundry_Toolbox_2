/**
 * MainLayout Component
 *
 * Root layout component that handles responsive navigation
 * - Desktop: Fixed sidebar
 * - Mobile: Drawer/hamburger menu
 *
 * Architecture decision: Uses render prop pattern for flexibility
 * in rendering different tools/pages
 */

import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

interface MainLayoutProps {
  currentPage: string;
  onNavigate: (href: string) => void;
  children: React.ReactNode;
}

export function MainLayout({
  currentPage,
  onNavigate,
  children,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <MobileNav currentPage={currentPage} onNavigate={onNavigate} />

      {/* Desktop Layout */}
      <div className="lg:flex lg:h-screen">
        {/* Desktop Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          className="hidden lg:flex lg:w-64 lg:flex-col"
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
