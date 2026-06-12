import type { Class } from "@/shared/types";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";

export function useSelectedClass(): {
  classData: Class | null;
  loading: boolean;
} {
  const { classData, classDataLoading } = useCharacterBuilder();
  return { classData, loading: classDataLoading };
}
