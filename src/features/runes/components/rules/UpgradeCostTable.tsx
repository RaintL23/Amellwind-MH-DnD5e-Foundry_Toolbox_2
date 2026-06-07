import { cn } from "@/shared/utils/cn";

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
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground">
              <th className="px-2 py-1.5 text-left font-medium">Rarity</th>
              <th className="px-2 py-1.5 text-left font-medium">Resource</th>
              <th className="px-2 py-1.5 text-center font-medium">Amt.</th>
              <th className="px-2 py-1.5 text-right font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rarity} className="border-b border-border/50 last:border-0">
                <td className="px-2 py-1.5 font-medium text-foreground whitespace-nowrap">
                  {row.rarity}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground">{row.resource}</td>
                <td className="px-2 py-1.5 text-center text-foreground">{row.amount}</td>
                <td className="px-2 py-1.5 text-right text-amber-400/90 font-medium whitespace-nowrap">
                  {row.cost}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic">
        {materialFootnote}
      </p>
    </div>
  );
}
