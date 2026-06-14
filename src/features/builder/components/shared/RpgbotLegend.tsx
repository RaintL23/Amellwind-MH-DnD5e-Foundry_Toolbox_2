import type { RpgbotRating } from "@/features/builder/data/rpgbot-ratings.types";
import {
  RPGBOT_RATING_LABELS,
  RPGBOT_RATING_SHORT,
} from "@/features/builder/data/rpgbot-ratings.utils";

const RATING_COLORS: Record<RpgbotRating, string> = {
  blue: "bg-sky-500",
  green: "bg-emerald-500",
  orange: "bg-amber-500",
  red: "bg-rose-500",
};

export function RpgbotLegend({ compact = false }: { compact?: boolean }) {
  const items: RpgbotRating[] = ["blue", "green", "orange", "red"];

  return (
    <div
      className={
        compact
          ? "flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground"
          : "mb-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5"
      }
    >
      {!compact && (
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          RPGBOT · best to worst
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((rating) => (
          <span
            key={rating}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
            title={RPGBOT_RATING_LABELS[rating]}
          >
            <span
              className={`inline-flex h-3.5 min-w-3.5 items-center justify-center rounded px-0.5 text-[9px] font-bold text-white ${RATING_COLORS[rating]}`}
            >
              {RPGBOT_RATING_SHORT[rating]}
            </span>
            {!compact && (
              <span className="hidden sm:inline">
                {RPGBOT_RATING_LABELS[rating]}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
