import { useEffect, useMemo, useState } from "react";
import type { Feat } from "@/shared/types";
import { getFeatById } from "@/features/feats/services/feat.service";
import { getDndFeatById } from "@/features/dnd-feats/services/dnd-feat.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useSelectedClass } from "./useSelectedClass";
import { isAsiFeatSelection } from "../utils/builder-class.utils";
import {
  buildClassLevelEntries,
  getMulticlassHitPointBreakdown,
} from "../utils/multiclass.utils";
import {
  detectFeatHitPointBonus,
  getCharacterHitPointBreakdown,
  type CharacterHitPointBreakdown,
  type FeatHitPointBonus,
} from "../utils/character-hit-points";

export function useCharacterHitPoints(): CharacterHitPointBreakdown | null {
  const {
    character,
    featSelections,
    speciesOriginFeat,
    class: classSelection,
    subclass,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    primaryClassLevel,
  } = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const [featBonuses, setFeatBonuses] = useState<FeatHitPointBonus[]>([]);

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
        .map((feat) => detectFeatHitPointBonus(feat, character.level))
        .filter((bonus): bonus is FeatHitPointBonus => bonus !== null);

      setFeatBonuses(bonuses);
    });

    return () => {
      cancelled = true;
    };
  }, [featSelections, speciesOriginFeat, character.level]);

  return useMemo(() => {
    if (!classData?.hitDie) return null;

    if (multiclassEnabled && multiclassEntries.some((e) => e.classRef)) {
      const classEntries = buildClassLevelEntries(
        classSelection,
        classData,
        primaryClassLevel,
        subclass,
        multiclassEntries,
        multiclassClassData,
      );
      return getMulticlassHitPointBreakdown(
        classEntries,
        character.getModifier("con"),
        featBonuses,
      );
    }

    return getCharacterHitPointBreakdown(
      character.level,
      character.getModifier("con"),
      classData.hitDie,
      classData.name,
      featBonuses,
    );
  }, [
    classData?.hitDie,
    classData?.name,
    classSelection,
    subclass,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    primaryClassLevel,
    character.level,
    character.abilities.con,
    featBonuses,
  ]);
}
