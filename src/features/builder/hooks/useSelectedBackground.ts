import { useEffect, useState } from "react";
import type { Background } from "@/shared/types";
import { getBackgroundById } from "@/features/backgrounds/services/background.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";

export function useSelectedBackground(): Background | null {
  const { background: backgroundRef } = useCharacterBuilder();
  const [background, setBackground] = useState<Background | null>(null);

  useEffect(() => {
    if (!backgroundRef) {
      setBackground(null);
      return;
    }

    let cancelled = false;

    getBackgroundById(backgroundRef.id)
      .then((data) => {
        if (!cancelled) setBackground(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setBackground(null);
      });

    return () => {
      cancelled = true;
    };
  }, [backgroundRef?.id]);

  return background;
}
