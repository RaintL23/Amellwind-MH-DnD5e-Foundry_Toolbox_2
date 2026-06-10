import { useState } from "react";
import { Gem } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Rune } from "@/shared/types";
import { ExpandableFeatureRow } from "@/features/weapons/components/ExpandableFeatureRow";
import { TierBadge } from "@/features/runes/components/shared/TierBadge";

interface RuneFeaturesSectionProps {
  runes: (Rune | null)[];
  effectKind: "weapon" | "armor";
}

function runeKey(rune: Rune): string {
  return `${rune.name}||${rune.monsterName}`;
}

function effectToParagraphs(effect: string): string[] {
  const parts = effect
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [effect];
}

export function RuneFeaturesSection({
  runes,
  effectKind,
}: RuneFeaturesSectionProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filledRunes = runes.filter((rune): rune is Rune => {
    if (!rune) return false;
    const effect =
      effectKind === "weapon" ? rune.weaponEffect : rune.armorEffect;
    return !!effect;
  });

  if (filledRunes.length === 0) return null;

  function toggleFeature(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <>
      <Separator className="my-3" />
      <div className="mb-3">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
          Rune Features
        </h3>
        <div className="space-y-2">
          {filledRunes.map((rune) => {
            const effect =
              effectKind === "weapon" ? rune.weaponEffect! : rune.armorEffect!;
            const key = runeKey(rune);

            return (
              <ExpandableFeatureRow
                key={key}
                name={rune.name}
                paragraphs={effectToParagraphs(effect)}
                isExpanded={expanded.has(key)}
                onToggle={() => toggleFeature(key)}
                leadingIcon={<Gem className="h-3 w-3 shrink-0 mt-0.5 text-amber-400" />}
                className="text-xs text-foreground"
                nameClassName="font-semibold"
                trailing={
                  <span className="flex shrink-0 items-center gap-1">
                    <TierBadge tier={rune.tier} />
                    <span className="max-w-[5rem] truncate text-[10px] text-muted-foreground">
                      {rune.monsterName}
                    </span>
                  </span>
                }
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
