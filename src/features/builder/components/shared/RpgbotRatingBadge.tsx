import { cn } from "@/shared/utils/cn";
import type { RpgbotRatingLookupEntry } from "@/features/builder/data/rpgbot-ratings.types";
import {
  RPGBOT_RATING_LABELS,
  RPGBOT_RATING_SHORT,
} from "@/features/builder/data/rpgbot-ratings.utils";

const RATING_STYLES = {
  blue: "bg-sky-500 text-white shadow-sm shadow-sky-500/30",
  green: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30",
  orange: "bg-amber-500 text-white shadow-sm shadow-amber-500/30",
  red: "bg-rose-500 text-white shadow-sm shadow-rose-500/30",
} as const;

export function RpgbotRatingBadge({
  rating,
  className,
}: {
  rating: RpgbotRatingLookupEntry;
  className?: string;
}) {
  const label = RPGBOT_RATING_LABELS[rating.rating];
  const short = RPGBOT_RATING_SHORT[rating.rating];
  const tooltip = `RPGBOT · ${label}\n${rating.summary}`;

  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-[1.1rem] shrink-0 items-center justify-center rounded px-1 text-[9px] font-bold leading-none",
        RATING_STYLES[rating.rating],
        className,
      )}
      title={tooltip}
      aria-label={`RPGBOT: ${label}`}
    >
      {short}
    </span>
  );
}
