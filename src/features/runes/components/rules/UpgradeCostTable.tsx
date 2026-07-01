import { cn } from "@/shared/utils/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UpgradeRow {
  rarity: string;
  resource: string;
  amount: number;
  cost: string;
}

interface UpgradeCostTableProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  rows: readonly UpgradeRow[];
  materialFootnote: string;
}

export function UpgradeCostTable({
  title,
  icon,
  accentColor,
  rows,
  materialFootnote,
}: UpgradeCostTableProps) {
  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-2 text-sm font-semibold", accentColor)}>
        {icon}
        {title}
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 text-muted-foreground hover:bg-transparent">
              <TableHead className="h-auto px-2 py-1.5 font-medium">Rarity</TableHead>
              <TableHead className="h-auto px-2 py-1.5 font-medium">Resource</TableHead>
              <TableHead className="h-auto px-2 py-1.5 text-center font-medium">Amt.</TableHead>
              <TableHead className="h-auto px-2 py-1.5 text-right font-medium">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.rarity}
                className="border-b border-border/50 last:border-0 hover:bg-transparent"
              >
                <TableCell className="px-2 py-1.5 font-medium text-foreground whitespace-nowrap">
                  {row.rarity}
                </TableCell>
                <TableCell className="px-2 py-1.5 text-muted-foreground">{row.resource}</TableCell>
                <TableCell className="px-2 py-1.5 text-center text-foreground">{row.amount}</TableCell>
                <TableCell className="px-2 py-1.5 text-right text-amber-400/90 font-medium whitespace-nowrap">
                  {row.cost}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic">
        {materialFootnote}
      </p>
    </div>
  );
}
