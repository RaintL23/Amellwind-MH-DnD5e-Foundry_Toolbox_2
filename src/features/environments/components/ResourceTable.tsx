import { RESOURCE_CATEGORY_ICONS, type LevelTier } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="bg-card/80 hover:bg-transparent">
            <TableHead className="h-auto w-8 px-2 py-1.5 font-medium text-muted-foreground">
              d6
            </TableHead>
            {tier.resources.columns.map((col) => (
              <TableHead
                key={col.category}
                className="h-auto px-2 py-1.5 text-center font-medium text-muted-foreground"
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
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tier.resources.rows.map((row) => (
            <TableRow
              key={row.roll}
              className="border-t border-border/50 hover:bg-accent/20 transition-colors"
            >
              <TableCell className="px-2 py-1.5 text-center font-bold text-muted-foreground">
                {row.roll}
              </TableCell>
              {row.items.map((item, i) => (
                <TableCell key={i} className="px-2 py-1.5 text-center text-foreground">
                  {item}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
