import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Class, Subclass } from "@/shared/types";
import { useCharacterBuilder } from "./CharacterBuilderContext";
import { useSelectedClass, useSelectedSubclass } from "../hooks/useBuilderSelections";
import { useCantripPoolCatalogs } from "../hooks/useCantripPools";
import { useEffectiveAbilityScores } from "../hooks/useEffectiveAbilityScores";
import {
  computeSpellcasting,
  type SpellcastingInfo,
} from "../hooks/useSpellcasting";
import { resolveOptionalFeatureProgressions } from "../utils/class-optional-features.utils";
import {
  resolveBonusCantripPools,
  type CantripPoolDefinition,
} from "../utils/cantrip-pools.utils";
import { resolveClassOptionalFeatureSpellGrants } from "../utils/optional-feature-spells.utils";
import type { SubclassSpellGrant } from "../utils/subclass-spells.utils";

/** Spellcasting of one additional class (multiclass entry). */
export interface MulticlassSpellcastingInfo {
  /** Index in `multiclassEntries`. */
  index: number;
  classData: Class;
  subclassData: Subclass | null;
  spellcasting: SpellcastingInfo;
}

export interface SpellcastingContextValue {
  optionalFeatureSpellGrants: SubclassSpellGrant[];
  bonusCantripPools: CantripPoolDefinition[];
  cantripPoolsReady: boolean;
  /** Primary class spellcasting at its class level (picker, completeness, export). */
  spellcasting: SpellcastingInfo;
  /** One entry per additional class with loaded data, each at its own class level. */
  multiclassSpellcasting: MulticlassSpellcastingInfo[];
}

const SpellcastingContext = createContext<SpellcastingContextValue | null>(null);

export function SpellcastingProvider({ children }: Readonly<{ children: ReactNode }>) {
  const builder = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const subclassData = useSelectedSubclass();
  const effectiveAbilities = useEffectiveAbilityScores();
  const optionalFeatureSelections = builder.optionalFeatureSelections ?? {};

  const cantripPoolOptions = useMemo(
    () => ({
      speciesOriginFeat: builder.speciesOriginFeat,
      backgroundOriginFeat: builder.backgroundOriginFeat,
      speciesOriginFeatGrant: builder.speciesOriginFeatGrant,
      backgroundOriginFeatGrant: builder.backgroundOriginFeatGrant,
      featSelections: builder.featSelections,
    }),
    [
      builder.speciesOriginFeat,
      builder.backgroundOriginFeat,
      builder.speciesOriginFeatGrant,
      builder.backgroundOriginFeatGrant,
      builder.featSelections,
    ],
  );

  const { optionalCatalog, featCatalog, ready: cantripPoolsReady } =
    useCantripPoolCatalogs();

  // Multiclass: spells known/prepared are chosen per class "as if single-classed",
  // so the primary class progression uses its own class level.
  const progressions = useMemo(
    () =>
      resolveOptionalFeatureProgressions(
        classData,
        subclassData,
        builder.primaryClassLevel,
      ).map((entry) => entry.progression),
    [classData, subclassData, builder.primaryClassLevel],
  );

  const optionalFeatureSpellGrants = useMemo(
    () =>
      resolveClassOptionalFeatureSpellGrants(
        optionalFeatureSelections,
        progressions,
        optionalCatalog,
        builder.primaryClassLevel,
      ),
    [
      optionalFeatureSelections,
      progressions,
      optionalCatalog,
      builder.primaryClassLevel,
    ],
  );

  const bonusCantripPools = useMemo(() => {
    if (!cantripPoolsReady) return [];
    return resolveBonusCantripPools({
      optionalFeatureSelections,
      progressions,
      optionalCatalog,
      featCatalog,
      classData,
      subclass: subclassData,
      level: builder.primaryClassLevel,
      ...cantripPoolOptions,
    });
  }, [
    cantripPoolsReady,
    optionalFeatureSelections,
    progressions,
    optionalCatalog,
    featCatalog,
    classData,
    subclassData,
    builder.primaryClassLevel,
    cantripPoolOptions,
  ]);

  const spellcasting = useMemo(
    () =>
      computeSpellcasting(
        classData,
        subclassData,
        builder.primaryClassLevel,
        effectiveAbilities,
        builder.spellSelections ?? {},
        optionalFeatureSpellGrants,
        builder.faction,
        bonusCantripPools,
      ),
    [
      classData,
      subclassData,
      builder.primaryClassLevel,
      effectiveAbilities,
      builder.spellSelections,
      optionalFeatureSpellGrants,
      builder.faction,
      bonusCantripPools,
    ],
  );

  // Additional classes keep their spells on the entry; feat / faction spell
  // pools stay with the primary class.
  const multiclassSpellcasting = useMemo(
    () =>
      builder.multiclassContexts.map((ctx): MulticlassSpellcastingInfo => {
        const classProgressions = ctx.progressions.map((r) => r.progression);
        const level = ctx.entry.level;
        const pools = cantripPoolsReady
          ? resolveBonusCantripPools({
              optionalFeatureSelections,
              progressions: classProgressions,
              optionalCatalog,
              featCatalog,
              classData: ctx.classData,
              subclass: ctx.subclassData,
              level,
            })
          : [];
        return {
          index: ctx.index,
          classData: ctx.classData,
          subclassData: ctx.subclassData,
          spellcasting: computeSpellcasting(
            ctx.classData,
            ctx.subclassData,
            level,
            effectiveAbilities,
            ctx.entry.spellSelections ?? {},
            resolveClassOptionalFeatureSpellGrants(
              optionalFeatureSelections,
              classProgressions,
              optionalCatalog,
              level,
            ),
            null,
            pools,
          ),
        };
      }),
    [
      builder.multiclassContexts,
      cantripPoolsReady,
      optionalFeatureSelections,
      optionalCatalog,
      featCatalog,
      effectiveAbilities,
    ],
  );

  const value = useMemo(
    (): SpellcastingContextValue => ({
      optionalFeatureSpellGrants,
      bonusCantripPools,
      cantripPoolsReady,
      spellcasting,
      multiclassSpellcasting,
    }),
    [
      optionalFeatureSpellGrants,
      bonusCantripPools,
      cantripPoolsReady,
      spellcasting,
      multiclassSpellcasting,
    ],
  );

  return (
    <SpellcastingContext.Provider value={value}>
      {children}
    </SpellcastingContext.Provider>
  );
}

export function useSpellcastingContext(): SpellcastingContextValue {
  const ctx = useContext(SpellcastingContext);
  if (!ctx) {
    throw new Error(
      "useSpellcastingContext must be used inside SpellcastingProvider",
    );
  }
  return ctx;
}
