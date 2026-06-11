import { useEffect, useState } from "react";
import type { BuilderOptionalFeatureSelections } from "@/shared/types";
import { getAllDndOptionalFeatures } from "@/features/dnd-optionalfeatures/services/dnd-optionalfeature.service";
import { resolveOptionalFeatureSpells } from "../utils/optional-feature-spells.utils";
import type { SubclassSpellGrant } from "../utils/subclass-spells.utils";

export function useOptionalFeatureSpellGrants(
  selections: BuilderOptionalFeatureSelections,
  characterLevel: number,
): SubclassSpellGrant[] {
  const [grants, setGrants] = useState<SubclassSpellGrant[]>([]);

  useEffect(() => {
    const flatSelections = Object.values(selections)
      .flat()
      .filter((s): s is NonNullable<typeof s> => s !== null);

    if (flatSelections.length === 0) {
      setGrants([]);
      return;
    }

    let cancelled = false;
    getAllDndOptionalFeatures().then((catalog) => {
      if (cancelled) return;
      setGrants(
        resolveOptionalFeatureSpells(catalog, flatSelections, characterLevel),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [selections, characterLevel]);

  return grants;
}
