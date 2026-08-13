import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useCharacterBuilder } from "./CharacterBuilderContext";
import { useSelectedClass, useSelectedSubclass } from "../hooks/useBuilderSelections";
import { useOptionalFeatureSpellGrants } from "../hooks/useOptionalFeatureSpellGrants";
import { useCantripPoolCatalogs } from "../hooks/useCantripPools";
import {
  useSpellcasting,
  type SpellcastingInfo,
} from "../hooks/useSpellcasting";
import {
  buildClassLevelEntries,
} from "../utils/multiclass.utils";
import { resolveOptionalFeatureProgressions } from "../utils/class-optional-features.utils";
import {
  resolveBonusCantripPools,
  type CantripPoolDefinition,
} from "../utils/cantrip-pools.utils";
import type { SubclassSpellGrant } from "../utils/subclass-spells.utils";

export interface SpellcastingContextValue {
  optionalFeatureSpellGrants: SubclassSpellGrant[];
  bonusCantripPools: CantripPoolDefinition[];
  primaryBonusCantripPools: CantripPoolDefinition[];
  cantripPoolsReady: boolean;
  /** Completeness, export, and general builder use (character level). */
  spellcasting: SpellcastingInfo;
  /** Center panel spell picker (primary class level + multiclass progression). */
  centerPanelSpellcasting: SpellcastingInfo;
}

const SpellcastingContext = createContext<SpellcastingContextValue | null>(null);

export function SpellcastingProvider({ children }: Readonly<{ children: ReactNode }>) {
  const builder = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const subclassData = useSelectedSubclass();

  const optionalFeatureSpellGrants = useOptionalFeatureSpellGrants(
    builder.optionalFeatureSelections ?? {},
    builder.character.level,
    classData,
    subclassData,
  );

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

  const progressions = useMemo(
    () =>
      resolveOptionalFeatureProgressions(
        classData,
        subclassData,
        builder.character.level,
      ).map((entry) => entry.progression),
    [classData, subclassData, builder.character.level],
  );

  const primaryProgressions = useMemo(
    () =>
      resolveOptionalFeatureProgressions(
        classData,
        subclassData,
        builder.primaryClassLevel,
      ).map((entry) => entry.progression),
    [classData, subclassData, builder.primaryClassLevel],
  );

  const bonusCantripPools = useMemo(() => {
    if (!cantripPoolsReady) return [];
    return resolveBonusCantripPools({
      optionalFeatureSelections: builder.optionalFeatureSelections ?? {},
      progressions,
      optionalCatalog,
      featCatalog,
      classData,
      subclass: subclassData,
      level: builder.character.level,
      ...cantripPoolOptions,
    });
  }, [
    cantripPoolsReady,
    builder.optionalFeatureSelections,
    progressions,
    optionalCatalog,
    featCatalog,
    classData,
    subclassData,
    builder.character.level,
    cantripPoolOptions,
  ]);

  const primaryBonusCantripPools = useMemo(() => {
    if (!cantripPoolsReady) return [];
    return resolveBonusCantripPools({
      optionalFeatureSelections: builder.optionalFeatureSelections ?? {},
      progressions: primaryProgressions,
      optionalCatalog,
      featCatalog,
      classData,
      subclass: subclassData,
      level: builder.primaryClassLevel,
      ...cantripPoolOptions,
    });
  }, [
    cantripPoolsReady,
    builder.optionalFeatureSelections,
    primaryProgressions,
    optionalCatalog,
    featCatalog,
    classData,
    subclassData,
    builder.primaryClassLevel,
    cantripPoolOptions,
  ]);

  const spellcasting = useSpellcasting(
    classData,
    subclassData,
    builder.character.level,
    builder.character.abilities,
    builder.spellSelections ?? {},
    builder.optionalFeatureSelections ?? {},
    optionalFeatureSpellGrants,
    builder.faction,
    builder.character.level,
    undefined,
    bonusCantripPools,
  );

  const multiclassClassEntries = useMemo(
    () =>
      builder.multiclassEnabled
        ? buildClassLevelEntries(
            builder.class,
            classData,
            builder.primaryClassLevel,
            builder.subclass,
            builder.multiclassEntries,
            builder.multiclassClassData,
          )
        : undefined,
    [
      builder.multiclassEnabled,
      builder.class,
      classData,
      builder.primaryClassLevel,
      builder.subclass,
      builder.multiclassEntries,
      builder.multiclassClassData,
    ],
  );

  const centerPanelSpellcasting = useSpellcasting(
    classData,
    subclassData,
    builder.character.level,
    builder.character.abilities,
    builder.spellSelections ?? {},
    builder.optionalFeatureSelections ?? {},
    optionalFeatureSpellGrants,
    builder.faction,
    builder.primaryClassLevel,
    multiclassClassEntries,
    primaryBonusCantripPools,
  );

  const value = useMemo(
    (): SpellcastingContextValue => ({
      optionalFeatureSpellGrants,
      bonusCantripPools,
      primaryBonusCantripPools,
      cantripPoolsReady,
      spellcasting,
      centerPanelSpellcasting,
    }),
    [
      optionalFeatureSpellGrants,
      bonusCantripPools,
      primaryBonusCantripPools,
      cantripPoolsReady,
      spellcasting,
      centerPanelSpellcasting,
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
