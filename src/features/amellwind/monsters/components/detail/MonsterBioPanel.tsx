import { BookOpen } from "lucide-react";
import type { Monster } from "@/shared/types";
import { StatBlockContentView } from "@/components/statblock/StatBlockContentView";

interface MonsterBioPanelProps {
  monster: Monster;
}

export function MonsterBioPanel({ monster }: MonsterBioPanelProps) {
  const hasBio = (monster.bio?.length ?? 0) > 0;
  const hasLairCr = Boolean(monster.lairCr);

  if (!hasBio && !hasLairCr) {
    return (
      <div className="rounded-lg border border-border bg-muted/10 px-4 py-10 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No biography or lore is available for this monster.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans text-sm">
      {hasLairCr && (
        <div className="rounded-md border border-amber-600/25 bg-amber-600/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-1">
            Lair Challenge Rating
          </p>
          <p className="text-lg font-bold text-foreground">CR {monster.lairCr}</p>
        </div>
      )}

      {hasBio && (
        <div className="space-y-3 leading-relaxed text-muted-foreground">
          <StatBlockContentView content={monster.bio!} />
        </div>
      )}
    </div>
  );
}
