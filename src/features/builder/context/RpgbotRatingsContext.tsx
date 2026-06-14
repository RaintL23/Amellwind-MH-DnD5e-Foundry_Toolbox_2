import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RpgbotRatingsData } from "../data/rpgbot-ratings.types";
import {
  createRpgbotLookupFn,
  type RpgbotLookupContext,
  type RpgbotLookupFn,
} from "../data/rpgbot-ratings.utils";
import { loadRpgbotRatings } from "../services/rpgbot-ratings.service";

interface RpgbotRatingsContextValue {
  ready: boolean;
  data: RpgbotRatingsData | null;
  createLookup: (context: RpgbotLookupContext | null) => RpgbotLookupFn | null;
}

const RpgbotRatingsContext = createContext<RpgbotRatingsContextValue | null>(
  null,
);

export function RpgbotRatingsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RpgbotRatingsData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadRpgbotRatings()
      .then((loaded) => {
        if (!cancelled) {
          setData(loaded);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setReady(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    (): RpgbotRatingsContextValue => ({
      ready,
      data,
      createLookup: (context) =>
        ready && data ? createRpgbotLookupFn(data, context) : null,
    }),
    [ready, data],
  );

  return (
    <RpgbotRatingsContext.Provider value={value}>
      {children}
    </RpgbotRatingsContext.Provider>
  );
}

export function useRpgbotRatingsContext(): RpgbotRatingsContextValue {
  const ctx = useContext(RpgbotRatingsContext);
  if (!ctx) {
    throw new Error(
      "useRpgbotRatingsContext must be used within RpgbotRatingsProvider",
    );
  }
  return ctx;
}
