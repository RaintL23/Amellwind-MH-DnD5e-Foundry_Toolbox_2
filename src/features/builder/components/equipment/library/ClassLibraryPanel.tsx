import { useCallback, useEffect, useMemo, useState } from "react";
import { GraduationCap, Sparkles } from "lucide-react";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { getListClasses } from "@/features/classes/services/class.service";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useClassVariants } from "@/features/builder/hooks/useClassVariants";
import { useSelectedClass } from "@/features/builder/hooks/useSelectedClass";
import type { BuilderSlotSelection } from "@/features/builder/hooks/useBuilderSlotSelection";
import {
  isMulticlassClassSlot,
  isMulticlassSubclassSlot,
  parseMulticlassClassSlotIndex,
  parseMulticlassSubclassSlotIndex,
  buildCurrentClassesForMulticlassPicker,
  getMulticlassCandidatePrerequisiteFailures,
  formatPrerequisiteFailureReason,
} from "@/features/builder/utils/multiclass.utils";
import { useEffectiveAbilityScores } from "@/features/builder/hooks/useEffectiveAbilityScores";
import { isClothingArmor } from "@/features/builder/data/armor.data";
import { getClassEquipmentConflictReason } from "@/features/builder/utils/equipment-proficiency.utils";
import {
  dedupeByNameToListOptions,
  entityToLibraryOption,
  filterLibraryOptions,
  type LibraryListOption,
  type SourceVariant,
} from "@/features/builder/utils/library-variant.utils";
import { LibraryList } from "@/features/builder/components/shared/LibraryList";
import type { Class } from "@/shared/types";
import { ClassLibraryDetail } from "./ClassLibraryDetail";
import { SubclassLibraryDetail } from "./shared/SubclassLibraryDetail";
import { EmptyState } from "./shared/LibraryUi";

interface ClassLibraryPanelProps {
  selectedSlot: BuilderSlotSelection;
  q: string;
}

export function ClassLibraryPanel({ selectedSlot, q }: ClassLibraryPanelProps) {
  const [classOptions, setClassOptions] = useState<LibraryListOption[]>([]);
  const [classCatalog, setClassCatalog] = useState<Class[]>([]);
  const [classLoading, setClassLoading] = useState(false);

  const {
    character,
    mainHand,
    offHand,
    armor,
    class: classSelection,
    subclass,
    multiclassEntries,
    multiclassClassData,
    primaryClassLevel,
    setClass,
    setSubclass,
    setMulticlassEntryClass,
    setMulticlassEntrySubclass,
  } = useCharacterBuilder();

  const { classData, loading: classDetailLoading } = useSelectedClass();
  const effectiveAbilityScores = useEffectiveAbilityScores();
  const {
    variants: classVariants,
    varyingFields,
    bookNames,
  } = useClassVariants(classData);
  const identityBookNames = useBookSourceNames();

  const isClassSlot = selectedSlot === "class";
  const isSubclassSlot = selectedSlot === "subclass";
  const multiclassClassIndex = isMulticlassClassSlot(selectedSlot)
    ? parseMulticlassClassSlotIndex(selectedSlot)
    : null;
  const multiclassSubclassIndex = isMulticlassSubclassSlot(selectedSlot)
    ? parseMulticlassSubclassSlotIndex(selectedSlot)
    : null;
  const isMulticlassClassPicker = multiclassClassIndex !== null;
  const isMulticlassSubclassPicker = multiclassSubclassIndex !== null;

  useEffect(() => {
    if (
      !isClassSlot &&
      !isSubclassSlot &&
      !isMulticlassClassPicker &&
      !isMulticlassSubclassPicker
    ) {
      return;
    }
    setClassLoading(true);
    setClassOptions([]);
    setClassCatalog([]);
    getListClasses()
      .then((list) => {
        const playable = list.filter((c) => !c.isSidekick);
        setClassCatalog(playable);
        setClassOptions(playable.map(entityToLibraryOption));
      })
      .finally(() => setClassLoading(false));
  }, [isClassSlot, isSubclassSlot, selectedSlot]);

  useEffect(() => {
    if (!classData || !subclass) return;
    const isValid = subclassesForClassVariant(classData).some(
      (sc) => sc.id === subclass.id,
    );
    if (!isValid) setSubclass(null);
  }, [classData, subclass, setSubclass]);

  const classFiltered = useMemo(() => {
    if (!isClassSlot && !isMulticlassClassPicker) return [];
    let options = filterLibraryOptions(classOptions, q);
    if (isMulticlassClassPicker) {
      const takenIds = new Set(
        [
          classSelection?.id,
          ...multiclassEntries.map((e) => e.classRef?.id),
        ].filter(Boolean),
      );
      options = options.filter((o) => !takenIds.has(o.id));
    }
    return options;
  }, [
    classOptions,
    isClassSlot,
    isMulticlassClassPicker,
    q,
    classSelection?.id,
    multiclassEntries,
  ]);

  const classById = useMemo(() => {
    return new Map(classCatalog.map((cls) => [cls.id, cls]));
  }, [classCatalog]);

  const equippedArmorItem = armor?.armor ?? null;

  const getClassDisabledReason = useCallback(
    (option: LibraryListOption): string | null => {
      const cls = classById.get(option.id);

      if (isMulticlassClassPicker && cls && multiclassClassIndex !== null) {
        const currentEntries = buildCurrentClassesForMulticlassPicker(
          classSelection,
          classData,
          primaryClassLevel,
          subclass,
          multiclassEntries,
          multiclassClassData,
          multiclassClassIndex,
        );
        const failures = getMulticlassCandidatePrerequisiteFailures(
          cls,
          currentEntries,
          effectiveAbilityScores,
        );
        if (failures.length > 0) {
          return formatPrerequisiteFailureReason(failures);
        }
      }

      const hasEquippedGear =
        !!mainHand ||
        !!offHand ||
        (!!equippedArmorItem && !isClothingArmor(equippedArmorItem));
      if (!hasEquippedGear) return null;

      if (!cls) return null;

      return getClassEquipmentConflictReason(
        mainHand?.weapon.name ?? null,
        offHand?.weapon.name ?? null,
        equippedArmorItem,
        cls.armorGrants,
        cls.weaponGrants,
      );
    },
    [
      classById,
      isMulticlassClassPicker,
      multiclassClassIndex,
      classSelection,
      classData,
      primaryClassLevel,
      subclass,
      multiclassEntries,
      multiclassClassData,
      effectiveAbilityScores,
      mainHand,
      offHand,
      equippedArmorItem,
    ],
  );

  const subclassOptions = useMemo(() => {
    if (!isSubclassSlot && !isMulticlassSubclassPicker) return [];
    const sourceClassData =
      isMulticlassSubclassPicker && multiclassSubclassIndex !== null
        ? multiclassClassData[multiclassSubclassIndex]
        : classData;
    if (!sourceClassData) return [];
    return dedupeByNameToListOptions(subclassesForClassVariant(sourceClassData));
  }, [
    isSubclassSlot,
    isMulticlassSubclassPicker,
    multiclassSubclassIndex,
    classData,
    multiclassClassData,
  ]);

  const subclassFiltered = useMemo(() => {
    return filterLibraryOptions(subclassOptions, q);
  }, [subclassOptions, q]);

  const activeSubclass = useMemo(() => {
    if (!classData || !subclass) return null;
    return (
      subclassesForClassVariant(classData).find(
        (sc) => sc.id === subclass.id,
      ) ?? null
    );
  }, [classData, subclass]);

  const subclassSourceVariants = useMemo((): SourceVariant[] => {
    if (!subclass?.name || !classData) return [];
    return subclassesForClassVariant(classData)
      .filter((sc) => sc.name === subclass.name)
      .sort((a, b) => a.source.localeCompare(b.source));
  }, [classData, subclass?.name]);

  const showClassDetail = isClassSlot && !!classSelection && !!classData;
  const showSubclassDetail = isSubclassSlot && !!subclass && !!activeSubclass;

  function handleSelectClass(id: string, name: string) {
    setClass({ id, name });
    setSubclass(null);
  }

  function handleClassSourceSelect(id: string) {
    const variant = classVariants.find((v) => v.id === id);
    if (!variant) return;
    setClass({ id: variant.id, name: variant.name });
    setSubclass(null);
  }

  function handleSelectSubclass(id: string, name: string) {
    setSubclass({ id, name });
  }

  function handleSubclassSourceSelect(id: string) {
    const variant = subclassSourceVariants.find((v) => v.id === id);
    if (!variant || !subclass) return;
    setSubclass({ id: variant.id, name: subclass.name });
  }

  if (isClassSlot) {
    if (showClassDetail) {
      if (classDetailLoading) {
        return <EmptyState text="Loading..." />;
      }
      if (classData) {
        return (
          <ClassLibraryDetail
            classData={classData}
            subclass={activeSubclass}
            level={character.level}
            variants={classVariants}
            varyingFields={varyingFields}
            bookNames={bookNames}
            onSourceSelect={handleClassSourceSelect}
          />
        );
      }
      return <EmptyState text="Information not found." />;
    }

    return (
      <LibraryList
        loading={classLoading}
        options={classFiltered}
        selectedId={classSelection?.id ?? null}
        selectedName={classSelection?.name ?? null}
        icon={<GraduationCap className="h-3.5 w-3.5 text-amber-400" />}
        getDisabledReason={getClassDisabledReason}
        onSelect={handleSelectClass}
      />
    );
  }

  if (isSubclassSlot) {
    if (!classData) {
      return <EmptyState text="Choose a class first." />;
    }
    if (showSubclassDetail && activeSubclass) {
      return (
        <SubclassLibraryDetail
          subclass={activeSubclass}
          level={character.level}
          sourceVariants={subclassSourceVariants}
          activeSourceId={subclass?.id}
          onSourceSelect={handleSubclassSourceSelect}
          bookNames={identityBookNames}
        />
      );
    }

    return (
      <LibraryList
        loading={classDetailLoading}
        options={subclassFiltered}
        selectedId={subclass?.id ?? null}
        selectedName={subclass?.name ?? null}
        icon={<Sparkles className="h-3.5 w-3.5 text-emerald-400" />}
        onSelect={handleSelectSubclass}
      />
    );
  }

  function handleSelectMulticlassClass(id: string, name: string) {
    if (multiclassClassIndex === null) return;
    setMulticlassEntryClass(multiclassClassIndex, { id, name });
  }

  function handleSelectMulticlassSubclass(id: string, name: string) {
    if (multiclassSubclassIndex === null) return;
    setMulticlassEntrySubclass(multiclassSubclassIndex, { id, name });
  }

  if (isMulticlassClassPicker) {
    return (
      <LibraryList
        loading={classLoading}
        options={classFiltered}
        selectedId={multiclassEntries[multiclassClassIndex!]?.classRef?.id ?? null}
        selectedName={
          multiclassEntries[multiclassClassIndex!]?.classRef?.name ?? null
        }
        icon={<GraduationCap className="h-3.5 w-3.5 text-orange-400" />}
        getDisabledReason={getClassDisabledReason}
        onSelect={handleSelectMulticlassClass}
      />
    );
  }

  if (isMulticlassSubclassPicker) {
    const entryClassData =
      multiclassSubclassIndex !== null
        ? multiclassClassData[multiclassSubclassIndex]
        : null;
    const entrySubclass =
      multiclassSubclassIndex !== null
        ? multiclassEntries[multiclassSubclassIndex]?.subclass
        : null;

    if (!entryClassData) {
      return <EmptyState text="Elige la clase adicional primero." />;
    }

    return (
      <LibraryList
        loading={classDetailLoading}
        options={subclassFiltered}
        selectedId={entrySubclass?.id ?? null}
        selectedName={entrySubclass?.name ?? null}
        icon={<Sparkles className="h-3.5 w-3.5 text-teal-400" />}
        onSelect={handleSelectMulticlassSubclass}
      />
    );
  }

  return null;
}

export function isClassDetailVisible(
  selectedSlot: BuilderSlotSelection,
  classSelection: { id: string } | null,
  classData: Class | null,
): boolean {
  return selectedSlot === "class" && !!classSelection && !!classData;
}

export function isSubclassDetailVisible(
  selectedSlot: BuilderSlotSelection,
  subclass: { id: string } | null,
  activeSubclass: { id: string } | null,
): boolean {
  return selectedSlot === "subclass" && !!subclass && !!activeSubclass;
}
