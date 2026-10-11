import type { RpgbotRating } from "@/features/raintdm/builder/data/rpgbot-ratings.types";
import {
  RPGBOT_RATING_LABELS,
  RPGBOT_RATING_SHORT,
} from "@/features/raintdm/builder/data/rpgbot-ratings.utils";

const RATING_COLORS: Record<RpgbotRating, string> = {
  blue: "bg-sky-500",
  green: "bg-emerald-500",
  orange: "bg-amber-500",
  red: "bg-rose-500",
};

export function RpgbotLegend({
  compact = false,
  simple = false,
}: {
  compact?: boolean;
  /** Plain-language explanation instead of the letter-grade key. */
  simple?: boolean;
}) {
  const items: RpgbotRating[] = ["blue", "green", "orange", "red"];

  if (simple) {
    return (
      <p className="mb-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
        Best picks for your class are listed first. Labels like{" "}
        <span className="font-medium text-foreground">Excellent</span> or{" "}
        <span className="font-medium text-foreground">Good</span> come from
        RPGBOT, a popular D&amp;D character-optimization guide — any option is
        still a valid choice.
      </p>
    );
  }

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
