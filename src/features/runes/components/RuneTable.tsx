import { Layers } from "lucide-react";
import { Rune } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "./TierBadge";
import { formatTag, tagVariant } from "../utils/rune-tag.utils";
import { cn } from "@/shared/utils/cn";

interface RuneTableProps {
  runes: Rune[];
  totalFiltered: number;
  isInBuild: (rune: Rune) => boolean;
  onSelect: (rune: Rune) => void;
}

export function RuneTable({ runes, totalFiltered, isInBuild, onSelect }: RuneTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Monster
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Slots
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Carve
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Capture
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Tier
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Tags
              </th>
            </tr>
          </thead>
          <tbody>
            {runes.map((rune, i) => {
              const inBuild = isInBuild(rune);
              return (
                <tr
                  key={`${rune.monsterSource}-${rune.monsterName}-${rune.name}-${i}`}
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors",
                    inBuild && "bg-amber-900/10 hover:bg-amber-900/20",
                  )}
                  onClick={() => onSelect(rune)}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {rune.name}
                      {inBuild && (
                        <Layers className="h-3 w-3 text-amber-400 shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rune.monsterName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {rune.slots.includes("A") && (
                        <Badge variant="blue">A</Badge>
                      )}
                      {rune.slots.includes("W") && (
                        <Badge variant="orange">W</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rune.carveChance === "-" ? (
                      <span className="text-muted-foreground/40">—</span>
                    ) : (
                      rune.carveChance
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rune.captureChance === "-" ? (
                      <span className="text-muted-foreground/40">—</span>
                    ) : (
                      rune.captureChance
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={rune.tier} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {rune.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant={tagVariant(tag)}
                          className="text-xs"
                        >
                          {formatTag(tag)}
                        </Badge>
                      ))}
                      {rune.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{rune.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {totalFiltered === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No materials found with the applied filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
