import { useEffect, useState } from "react";
import type { Feat } from "@/shared/types";
import { getFeatById } from "@/features/feats/services/feat.service";
import { getDndFeatById } from "@/features/dnd-feats/services/dnd-feat.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { isAsiFeatSelection } from "../utils/builder-class.utils";

/**
 * Resolves the character's currently active (non-ASI) feats to their full
 * {@link Feat} objects: the species/background origin feats plus every chosen
 * feat slot. This used to be copy-pasted (identically) inside the hit-points
 * and speed hooks; centralizing it gives the derived-combat layer a single
 * feat-resolution source. Consumers apply their own per-feat detection
 * (e.g. HP bonus by level, speed bonuses) over the returned list.
 */
export function useActiveResolvedFeats(): Feat[] {
  const { featSelections, speciesOriginFeat, backgroundOriginFeat } =
    useCharacterBuilder();
  const [feats, setFeats] = useState<Feat[]>([]);

  useEffect(() => {
    const activeFeats = [
      ...(speciesOriginFeat && !isAsiFeatSelection(speciesOriginFeat)
        ? [speciesOriginFeat]
        : []),
      ...(backgroundOriginFeat && !isAsiFeatSelection(backgroundOriginFeat)
        ? [backgroundOriginFeat]
        : []),
      ...featSelections.filter(
        (feat): feat is NonNullable<typeof feat> =>
          feat !== null && !isAsiFeatSelection(feat),
      ),
    ];

    if (!activeFeats.length) {
      setFeats([]);
      return;
    }

    let cancelled = false;

    Promise.all(
      activeFeats.map((feat) =>
        feat.source === "dnd2014" || feat.source === "dnd2024"
          ? getDndFeatById(feat.id)
          : getFeatById(feat.id),
      ),
    ).then((resolved) => {
      if (cancelled) return;
      setFeats(resolved.filter((feat): feat is Feat => feat !== undefined));
    });

    return () => {
      cancelled = true;
    };
  }, [featSelections, speciesOriginFeat, backgroundOriginFeat]);

  return feats;
}
