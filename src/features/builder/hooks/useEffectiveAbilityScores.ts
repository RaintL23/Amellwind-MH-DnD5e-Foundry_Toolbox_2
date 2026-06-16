import { useEffect, useMemo, useState } from "react";
import type { AbilityKey, Class } from "@/shared/types";
import { getClassById } from "@/features/classes/services/class.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useSelectedClass, useSelectedSpecies } from "./useBuilderSelections";
import { useSelectedDndBackground } from "./useSelectedDndBackground";import {
  applyBaseScores,
  buildAbilityBonusMap,
} from "../utils/species-ability-bonuses";
import { applyFeatAsiBonuses } from "../utils/feat-asi-bonuses";
import {
  buildClassLevelEntries,
  getPrimaryClassLevel,
} from "../utils/multiclass.utils";

function useMulticlassClassData(
  entries: ReturnType<typeof useCharacterBuilder>["multiclassEntries"],
): { data: (Class | null)[]; loading: boolean } {
  const [data, setData] = useState<(Class | null)[]>([]);
  const [loading, setLoading] = useState(false);

  const entryIds = entries.map((e) => e.classRef?.id ?? "").join("|");

  useEffect(() => {
    const activeEntries = entries.filter((e) => e.classRef?.id);
    if (!activeEntries.length) {
      setData(entries.map(() => null));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      entries.map((entry) =>
        entry.classRef?.id
          ? getClassById(entry.classRef.id).then((cls) => cls ?? null)
          : Promise.resolve(null),
      ),
    )
      .then((results) => {
        if (!cancelled) setData(results);
      })
      .catch(() => {
        if (!cancelled) setData(entries.map(() => null));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entryIds, entries.length]);

  return { data, loading };
}

/** Effective ability scores including origin bonuses and feat ASIs. */export function useEffectiveAbilityScores(): Record<AbilityKey, number> {
  const {
    character,
    class: classSelection,
    featSelections,
    multiclassEnabled,
    multiclassEntries,
    useTashaOrigin,
    tashaPlus2,
    tashaPlus1,
    speciesAbilityChoices,
    backgroundAsiMode,
    backgroundAsiPlus2,
    backgroundAsiPlus1,
  } = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const { data: multiclassClassData } = useMulticlassClassData(
    multiclassEntries,
  );
  const { species } = useSelectedSpecies();
  const { dndBackground } = useSelectedDndBackground();

  return useMemo(() => {
    const primaryLevel = multiclassEnabled
      ? getPrimaryClassLevel(character.level, multiclassEntries)
      : character.level;

    const classEntries = buildClassLevelEntries(
      classSelection,
      classData,
      primaryLevel,
      null,
      multiclassEntries,
      multiclassClassData,
    );

    const bonusMap = buildAbilityBonusMap(species, {
      useTashaOrigin,
      tashaPlus2,
      tashaPlus1,
      speciesChoices: speciesAbilityChoices,
      background: dndBackground
        ? {
            name: dndBackground.name,
            abilityBonuses: dndBackground.abilityBonuses,
          }
        : null,
      backgroundAsiMode,
      backgroundAsiPlus2,
      backgroundAsiPlus1,
    });

    const classNames = classEntries
      .filter((e) => e.classData)
      .map((e) => e.classData!.name)
      .join("/");

    applyFeatAsiBonuses(
      bonusMap,
      featSelections,
      classNames || classSelection?.name || "",
      character.level,
    );

    const totals = applyBaseScores(bonusMap, character.abilities);
    return (Object.keys(totals) as AbilityKey[]).reduce(
      (acc, key) => {
        acc[key] = character.abilities[key] + totals[key].bonus;
        return acc;
      },
      {} as Record<AbilityKey, number>,
    );
  }, [
    character.abilities,
    character.level,
    classSelection,
    classData,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    species,
    dndBackground,
    useTashaOrigin,
    tashaPlus2,
    tashaPlus1,
    speciesAbilityChoices,
    backgroundAsiMode,
    backgroundAsiPlus2,
    backgroundAsiPlus1,
    featSelections,
  ]);
}
