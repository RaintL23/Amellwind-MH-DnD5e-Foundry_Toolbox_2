import type { ReactNode } from "react";

interface StatBlockSectionProps {
  title: string;
  children: ReactNode;
}

/**
 * A titled section within a creature stat block (shared by the monsters and
 * bestiary stat-block views): an uppercase amber heading with a bottom rule,
 * followed by the section content.
 */
export function StatBlockSection({ title, children }: StatBlockSectionProps) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider border-b border-amber-800/50 pb-1 mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
