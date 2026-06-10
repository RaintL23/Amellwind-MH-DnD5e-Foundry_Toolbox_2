import { useMemo } from "react";
import type { Subclass } from "@/shared/types";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useSelectedClass } from "./useSelectedClass";

export function useSelectedSubclass(): Subclass | null {
  const { subclass } = useCharacterBuilder();
  const { classData } = useSelectedClass();

  return useMemo(() => {
    if (!classData || !subclass) return null;
    return (
      subclassesForClassVariant(classData).find((sc) => sc.id === subclass.id) ??
      null
    );
  }, [classData, subclass]);
}
