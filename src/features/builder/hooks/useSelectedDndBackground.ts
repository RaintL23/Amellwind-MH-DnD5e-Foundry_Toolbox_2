import { useEffect, useState } from "react";
import type { DndBackground } from "@/shared/types";
import { getDndBackgroundById } from "@/features/dnd-backgrounds/services/dnd-background.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";

export function useSelectedDndBackground(): {
  dndBackground: DndBackground | null;
  loading: boolean;
} {
  const { background: backgroundRef } = useCharacterBuilder();
  const [dndBackground, setDndBackground] = useState<DndBackground | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!backgroundRef) {
      setDndBackground(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getDndBackgroundById(backgroundRef.id)
      .then((data) => {
        if (!cancelled) setDndBackground(data ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [backgroundRef?.id]);

  return { dndBackground, loading };
}
