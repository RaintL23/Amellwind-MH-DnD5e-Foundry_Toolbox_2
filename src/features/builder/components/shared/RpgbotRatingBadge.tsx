import { cn } from "@/shared/utils/cn";
import type { RpgbotRatingLookupEntry } from "@/features/builder/data/rpgbot-ratings.types";
import {
  RPGBOT_RATING_LABELS,
  RPGBOT_RATING_SHORT,
} from "@/features/builder/data/rpgbot-ratings.utils";

const RATING_STYLES = {
  blue: "border-sky-500/50 bg-sky-950/50 text-sky-200",
  green: "border-emerald-500/50 bg-emerald-950/50 text-emerald-200",
  orange: "border-amber-500/50 bg-amber-950/50 text-amber-200",
  red: "border-rose-500/50 bg-rose-950/50 text-rose-200",
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
        "inline-flex h-4 min-w-4 items-center justify-center rounded border px-1 text-[9px] font-bold leading-none",
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
