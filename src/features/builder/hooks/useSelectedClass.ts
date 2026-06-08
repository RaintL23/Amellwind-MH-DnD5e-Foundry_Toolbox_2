import { useEffect, useState } from "react";
import type { Class } from "@/shared/types";
import { getClassById } from "@/features/classes/services/class.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";

export function useSelectedClass(): {
  classData: Class | null;
  loading: boolean;
} {
  const { class: classRef } = useCharacterBuilder();
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classRef) {
      setClassData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getClassById(classRef.id)
      .then((data) => {
        if (!cancelled) setClassData(data ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [classRef?.id]);

  return { classData, loading };
}
