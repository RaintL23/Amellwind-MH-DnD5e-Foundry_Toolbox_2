import { RESOURCE_CATEGORY_ICONS, type LevelTier } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { EnvironmentColors } from "../constants/environment.constants";

export function ResourceTable({
  tier,
  colors,
}: {
  tier: LevelTier;
  colors: Pick<EnvironmentColors, "badge">;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-card/80">
            <th className="px-2 py-1.5 text-left text-muted-foreground font-medium w-8">
              d6
            </th>
            {tier.resources.columns.map((col) => (
              <th
                key={col.category}
                className="px-2 py-1.5 text-center text-muted-foreground font-medium"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{RESOURCE_CATEGORY_ICONS[col.category]}</span>
                  <span>{col.category}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[9px] px-1 py-0", colors.badge)}
                  >
                    DC {col.dc}
                  </Badge>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tier.resources.rows.map((row) => (
            <tr
              key={row.roll}
              className="border-t border-border/50 hover:bg-accent/20 transition-colors"
            >
              <td className="px-2 py-1.5 text-center font-bold text-muted-foreground">
                {row.roll}
              </td>
              {row.items.map((item, i) => (
                <td key={i} className="px-2 py-1.5 text-center text-foreground">
                  {item}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
