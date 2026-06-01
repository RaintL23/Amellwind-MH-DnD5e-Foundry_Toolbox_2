import { WeaponRarityRow, UNLOCK_COLUMN_PREFIX } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { RarityDot } from "./RarityDot";

interface UnlockSection {
  label: string;
  items: string[];
}

interface RaritySlideUnlockSectionProps {
  sections: UnlockSection[];
  rarityRows: WeaponRarityRow[];
  rarityIndex: number;
  styleText: string;
}

export function RaritySlideUnlockSection({
  sections,
  rarityRows,
  rarityIndex,
  styleText,
}: RaritySlideUnlockSectionProps) {
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map(({ label, items }) => (
        <div key={label} className="border-t border-white/10 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            {label.replace(UNLOCK_COLUMN_PREFIX, "")}
          </p>
          <ul className="text-sm space-y-0.5">
            {items.map((item) => {
              const introducedAt = rarityRows.findIndex((r) => {
                const val = r.columns[label];
                if (!val) return false;
                const list = Array.isArray(val) ? val : [val];
                return list.some((v) => v.toLowerCase() === item.toLowerCase());
              });
              const isNew = introducedAt === rarityIndex;
              return (
                <li
                  key={item}
                  className={cn(
                    "flex items-center gap-2 leading-snug",
                    isNew ? "text-foreground" : "text-muted-foreground/70",
                  )}
                >
                  <span className="shrink-0">•</span>
                  <span className="flex-1">{item}</span>
                  {introducedAt >= 0 && (
                    <RarityDot rarity={rarityRows[introducedAt]?.rarity ?? ""} />
                  )}
                  {isNew && (
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wide shrink-0",
                        styleText,
                      )}
                    >
                      new
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
