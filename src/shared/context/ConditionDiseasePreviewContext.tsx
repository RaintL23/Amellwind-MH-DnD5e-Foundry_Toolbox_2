import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MhCondition, MhDisease } from "@/shared/types";
import { getAllConditions } from "@/features/amellwind/conditions/services/condition.service";
import { getAllDiseases } from "@/features/amellwind/diseases/services/disease.service";
import {
  getAllDndConditions,
  getAllDndDiseases,
} from "@/features/dnd/conditions/services/dnd-condition.service";
import { ConditionDetailDialog } from "@/features/amellwind/conditions/components/ConditionDetailDialog";
import { DiseaseDetailDialog } from "@/features/amellwind/diseases/components/DiseaseDetailDialog";

interface ConditionDiseasePreviewValue {
  openCondition: (name: string) => void;
  openDisease: (name: string) => void;
}

const ConditionDiseasePreviewContext =
  createContext<ConditionDiseasePreviewValue | null>(null);

function findByName<T extends { name: string }>(
  items: T[],
  name: string,
): T | null {
  const needle = name.trim().toLowerCase();
  if (!needle) return null;
  return items.find((item) => item.name.toLowerCase() === needle) ?? null;
}

export function ConditionDiseasePreviewProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [condition, setCondition] = useState<MhCondition | null>(null);
  const [disease, setDisease] = useState<MhDisease | null>(null);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [diseaseOpen, setDiseaseOpen] = useState(false);

  const openCondition = useCallback((name: string) => {
    void Promise.all([getAllConditions(), getAllDndConditions()]).then(
      ([mh, dnd]) => {
        const found = findByName(mh, name) ?? findByName(dnd, name);
        if (!found) return;
        setDiseaseOpen(false);
        setDisease(null);
        setCondition(found);
        setConditionOpen(true);
      },
    );
  }, []);

  const openDisease = useCallback((name: string) => {
    void Promise.all([getAllDiseases(), getAllDndDiseases()]).then(
      ([mh, dnd]) => {
        const found = findByName(mh, name) ?? findByName(dnd, name);
        if (!found) return;
        setConditionOpen(false);
        setCondition(null);
        setDisease(found);
        setDiseaseOpen(true);
      },
    );
  }, []);

  const value = useMemo(
    () => ({ openCondition, openDisease }),
    [openCondition, openDisease],
  );

  return (
    <ConditionDiseasePreviewContext.Provider value={value}>
      {children}
      <ConditionDetailDialog
        condition={condition}
        open={conditionOpen}
        onOpenChange={(open) => {
          setConditionOpen(open);
          if (!open) setCondition(null);
        }}
      />
      <DiseaseDetailDialog
        disease={disease}
        open={diseaseOpen}
        onOpenChange={(open) => {
          setDiseaseOpen(open);
          if (!open) setDisease(null);
        }}
      />
    </ConditionDiseasePreviewContext.Provider>
  );
}

/** Opens condition/disease detail dialogs in place (no route change). */
export function useConditionDiseasePreview(): ConditionDiseasePreviewValue | null {
  return useContext(ConditionDiseasePreviewContext);
}
