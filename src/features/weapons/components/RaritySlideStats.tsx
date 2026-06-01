import { cn } from "@/shared/utils/cn";

interface RaritySlideStatsProps {
  entries: [string, string][];
  styleText: string;
}

export function RaritySlideStats({ entries, styleText }: RaritySlideStatsProps) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-white/10 pt-2">
      {entries.map(([label, value]) => {
        const isAcBonus = label.toLowerCase() === "ac bonus";
        return (
          <div key={label} className="text-sm">
            <span className="text-muted-foreground">{label}:</span>{" "}
            <span className={cn("font-semibold", styleText)}>{value}</span>
            {isAcBonus && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                While the integrated shield is equipped
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
