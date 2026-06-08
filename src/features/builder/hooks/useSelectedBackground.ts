import { useEffect, useState } from "react";
import type { Background } from "@/shared/types";
import { getBackgroundById } from "@/features/backgrounds/services/background.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";

export function useSelectedBackground(): {
  backgroundData: Background | null;
  loading: boolean;
} {
  const { background: backgroundRef } = useCharacterBuilder();
  const [backgroundData, setBackgroundData] = useState<Background | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!backgroundRef) {
      setBackgroundData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getBackgroundById(backgroundRef.id)
      .then((data) => {
        if (!cancelled) setBackgroundData(data ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [backgroundRef?.id]);

  return { backgroundData, loading };
}
