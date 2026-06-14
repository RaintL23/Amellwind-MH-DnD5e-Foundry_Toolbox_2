import { useEffect, useState } from "react";
import type { RpgbotRatingLookupEntry } from "../data/rpgbot-ratings.types";
import {
  createRpgbotLookupFn,
  type RpgbotLookupContext,
  type RpgbotLookupFn,
} from "../data/rpgbot-ratings.utils";
import { loadRpgbotRatings } from "../services/rpgbot-ratings.service";

function contextKey(context: RpgbotLookupContext | null): string | null {
  if (!context) return null;
  return `${context.classSlug}:${context.guideKey}:${context.category}`;
}

export function useRpgbotRatingsLookup(
  context: RpgbotLookupContext | null,
): { lookup: RpgbotLookupFn | null } {
  const [lookup, setLookup] = useState<RpgbotLookupFn | null>(null);
  const key = contextKey(context);

  useEffect(() => {
    if (!context || !key) {
      setLookup(null);
      return;
    }

    let cancelled = false;
    loadRpgbotRatings()
      .then((data) => {
        if (!cancelled) {
          setLookup(createRpgbotLookupFn(data, context));
        }
      })
      .catch(() => {
        if (!cancelled) setLookup(null);
      });

    return () => {
      cancelled = true;
    };
  }, [context, key]);

  return { lookup };
}

export type { RpgbotRatingLookupEntry };
