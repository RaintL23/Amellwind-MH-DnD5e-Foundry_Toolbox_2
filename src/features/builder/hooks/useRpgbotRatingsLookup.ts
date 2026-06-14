import { useMemo } from "react";
import type { RpgbotRatingLookupEntry } from "../data/rpgbot-ratings.types";
import type {
  RpgbotLookupContext,
  RpgbotLookupFn,
} from "../data/rpgbot-ratings.utils";
import { useRpgbotRatingsContext } from "../context/RpgbotRatingsContext";

function contextKey(context: RpgbotLookupContext | null): string | null {
  if (!context) return null;
  return `${context.classSlug}:${context.guideKey}:${context.category}`;
}

export function useRpgbotRatingsLookup(
  context: RpgbotLookupContext | null,
): { lookup: RpgbotLookupFn | null; ready: boolean } {
  const { ready, createLookup } = useRpgbotRatingsContext();
  const key = contextKey(context);

  const lookup = useMemo(() => {
    if (!key || !context) return null;
    return createLookup(context);
  }, [createLookup, key, context]);

  return { lookup, ready };
}

export type { RpgbotRatingLookupEntry };
