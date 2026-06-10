import { useEffect, useMemo, useState } from "react";
import type { Feat } from "@/shared/types";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import { getFeatById } from "@/features/feats/services/feat.service";
import { getDndFeatById } from "@/features/dnd-feats/services/dnd-feat.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useSelectedClass } from "./useSelectedClass";
import { useSelectedSpecies } from "./useSelectedSpecies";
import { isAsiFeatSelection } from "../utils/builder-class.utils";
import {
  collectEquippedRuneSpeedBonuses,
  detectFeatSpeedBonuses,
  getCharacterSpeedBreakdown,
  type CharacterSpeedBreakdown,
  type SpeedBonus,
} from "../utils/character-speed";

export function useCharacterSpeed(): CharacterSpeedBreakdown {
  const {
    character,
    featSelections,
    speciesOriginFeat,
    subclass,
    mainHand,
    offHand,
    armor,
    trinket1,
    trinket2,
  } = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const { species } = useSelectedSpecies();
  const [featBonuses, setFeatBonuses] = useState<SpeedBonus[]>([]);

  const subclassData = useMemo(() => {
    if (!classData || !subclass) return null;
    return (
      subclassesForClassVariant(classData).find(
        (entry) => entry.id === subclass.id,
      ) ?? null
    );
  }, [classData, subclass]);

  useEffect(() => {
    const activeFeats = [
      ...(speciesOriginFeat && !isAsiFeatSelection(speciesOriginFeat)
        ? [speciesOriginFeat]
        : []),
      ...featSelections.filter(
        (feat): feat is NonNullable<typeof feat> =>
          feat !== null && !isAsiFeatSelection(feat),
      ),
    ];

    if (!activeFeats.length) {
      setFeatBonuses([]);
      return;
    }

    let cancelled = false;

    Promise.all(
      activeFeats.map((feat) =>
        feat.source === "dnd2014" || feat.source === "dnd2024"
          ? getDndFeatById(feat.id)
          : getFeatById(feat.id),
      ),
    ).then((feats) => {
      if (cancelled) return;

      const bonuses = feats
        .filter((feat): feat is Feat => feat !== undefined)
        .flatMap((feat) => detectFeatSpeedBonuses(feat));

      setFeatBonuses(bonuses);
    });

    return () => {
      cancelled = true;
    };
  }, [featSelections, speciesOriginFeat]);

  const runeBonuses = useMemo(
    () =>
      collectEquippedRuneSpeedBonuses({
        mainHand,
        offHand,
        armor,
        trinket1,
        trinket2,
      }),
    [mainHand, offHand, armor, trinket1, trinket2],
  );

  return useMemo(
    () =>
      getCharacterSpeedBreakdown({
        speciesSpeedText: species?.speed,
        speciesName: species?.name,
        classData,
        subclass: subclassData,
        level: character.level,
        featBonuses,
        runeBonuses,
      }),
    [
      species?.speed,
      species?.name,
      classData,
      subclassData,
      character.level,
      featBonuses,
      runeBonuses,
    ],
  );
}
