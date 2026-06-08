import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Check,
  Gem,
  GraduationCap,
  ScrollText,
  Search,
  Shield,
  Shirt,
  Sparkles,
  Sword,
  Users,
} from "lucide-react";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { cn } from "@/shared/utils/cn";
import { BASE_ARMORS, CLOTHING_ARMOR } from "../../data/armor.placeholder";
import { getAllWeapons } from "@/features/weapons/services/weapon.service";
import {
  getAllSpecies,
  getSpeciesById,
} from "@/features/species/services/species.service";
import {
  getBuilderListDndRaces,
  getDndRaceById,
  getDndRacesByName,
  getDndSubracesForParent,
} from "@/features/dnd-races/services/dnd-race.service";
import {
  getAllBackgrounds,
  getBackgroundById,
} from "@/features/backgrounds/services/background.service";
import {
  getDndBackgroundById,
  getDndBackgroundsByName,
  getListDndBackgrounds,
} from "@/features/dnd-backgrounds/services/dnd-background.service";
import { getListClasses } from "@/features/classes/services/class.service";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import {
  getAllFeats,
  getFeatById,
} from "@/features/feats/services/feat.service";
import {
  getDndFeatById,
  getDndFeatsByName,
  getListDndFeats,
} from "@/features/dnd-feats/services/dnd-feat.service";
import { detectExpertiseGrants } from "../../utils/expertise-detection.utils";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useBuilderInventory } from "../../context/BuilderInventoryContext";
import { useClassVariants } from "../../hooks/useClassVariants";
import { useSelectedClass } from "../../hooks/useSelectedClass";
import {
  ABILITY_SCORE_IMPROVEMENT,
  DEFAULT_ASI_CHOICES,
  isAsiFeatSelection,
  isFeatSlotSelection,
  isOriginFeatSlot,
  parseFeatSlotIndex,
} from "../../utils/builder-class.utils";
import { ORIGIN_FEAT_SOURCE_NAME } from "../../utils/origin-feat.constants";
import { AsiLibraryPanel } from "./AsiLibraryPanel";
import { ArmorItem, Weapon } from "@/shared/types";
import type {
  Background,
  BuilderFeatSelection,
  DndBackground,
  DndFeat,
  DndRace,
  Feat,
  Species,
  Subclass,
} from "@/shared/types";
import type { BookSourceNameMap } from "@/features/spells/services/book-source.service";
import type { PaperDollSelection } from "../../hooks/usePaperDollSelection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BuilderPanel } from "../shared/BuilderPanel";
import {
  IdentitySourceBadgeGroup,
  type IdentityDataSource,
} from "../shared/IdentitySourceBadgeGroup";
import {
  FeatSourceBadgeGroup,
  type FeatDataSource,
} from "../shared/FeatSourceBadgeGroup";
import type { NamedVariant } from "../shared/NamedVariantSwitcher";
import { LibraryList } from "../shared/LibraryList";
import { SourceVariantSwitcher } from "../shared/SourceVariantSwitcher";
import { useLibraryVariants } from "../../hooks/useLibraryVariants";
import {
  dedupeByNameToListOptions,
  entityToLibraryOption,
  filterLibraryOptions,
  type LibraryListOption,
  type SourceVariant,
} from "../../utils/library-variant.utils";
import { IdentityLibraryDetail } from "./IdentityLibraryDetail";
import { FeatLibraryDetail } from "./FeatLibraryDetail";
import { ClassFeatureDetailsPanel } from "@/features/classes/components/detail/ClassFeatureDetailsPanel";
import { ClassLibraryDetail } from "./ClassLibraryDetail";
import { WeaponLibraryDetail } from "./WeaponLibraryDetail";
import { ArmorLibraryDetail } from "./ArmorLibraryDetail";

const RARITY_BADGE: Record<string, string> = {
  Uncommon:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  Rare: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  "Very Rare":
    "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
  Legendary:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
};

const SLOT_LABELS: Partial<Record<NonNullable<PaperDollSelection>, string>> = {
  species: "Species",
  background: "Background",
  class: "Class",
  subclass: "Subclass",
  "origin-feat": "Origin Feat",
  mainHand: "Weapon",
  offHand: "Weapon",
  armor: "Armor",
  trinket1: "Trinket",
  trinket2: "Trinket",
};

function isDnd2024Feat(feat: DndFeat): boolean {
  return (
    feat.source === "XPHB" ||
    feat.basicRules2024 === true ||
    feat.srd52 === true
  );
}

interface BuilderItemLibraryPanelProps {
  selectedSlot: PaperDollSelection;
}

function isLoadedSpecies(data: Species | Background | null): data is Species {
  return !!data && "traits" in data;
}

function isLoadedBackground(
  data: Species | Background | null,
): data is Background {
  return !!data && "proficiencies" in data;
}

export function BuilderItemLibraryPanel({
  selectedSlot,
}: BuilderItemLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [allWeapons, setAllWeapons] = useState<Weapon[]>([]);
  const [weaponsLoading, setWeaponsLoading] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityOptions, setIdentityOptions] = useState<LibraryListOption[]>(
    [],
  );
  const [identityDetail, setIdentityDetail] = useState<
    Species | Background | null
  >(null);
  const [identitySubraceDetail, setIdentitySubraceDetail] =
    useState<DndRace | null>(null);
  const [dndSubraceOptions, setDndSubraceOptions] = useState<NamedVariant[]>(
    [],
  );
  const [identityDetailLoading, setIdentityDetailLoading] = useState(false);
  const [identitySource, setIdentitySource] =
    useState<IdentityDataSource>("amellwind");
  const [classOptions, setClassOptions] = useState<LibraryListOption[]>([]);
  const [classLoading, setClassLoading] = useState(false);
  const [featDetail, setFeatDetail] = useState<Feat | DndFeat | null>(null);
  const [featDetailLoading, setFeatDetailLoading] = useState(false);
  const [featSource, setFeatSource] = useState<FeatDataSource>("amellwind");
  const [showFeatList, setShowFeatList] = useState(true);
  const [amellwindFeats, setAmellwindFeats] = useState<Feat[]>([]);
  const [dndFeats, setDndFeats] = useState<DndFeat[]>([]);
  const [featsLoading, setFeatsLoading] = useState(false);

  const {
    character,
    mainHand,
    offHand,
    armor,
    trinket1,
    trinket2,
    species,
    background,
    class: classSelection,
    subclass,
    featSelections,
    equipWeapon,
    equipArmor,
    equipTrinket,
    setSpecies,
    setBackground,
    setClass,
    setSubclass,
    setFeatAtIndex,
    speciesOriginFeatGrant,
    speciesOriginFeat,
    setSpeciesOriginFeat,
    applyIdentityGrants,
    setFeatSkillChoices,
    setOriginFeatSkillChoices,
  } = useCharacterBuilder();
  const { classData, loading: classDetailLoading } = useSelectedClass();
  const {
    variants: classVariants,
    varyingFields,
    bookNames,
  } = useClassVariants(classData);
  const identityBookNames = useBookSourceNames();
  const { weapons: inventoryWeapons, armors: inventoryArmors } =
    useBuilderInventory();

  const isWeaponSlot =
    selectedSlot === "mainHand" || selectedSlot === "offHand";
  const isArmorSlot = selectedSlot === "armor";
  const isTrinketSlot =
    selectedSlot === "trinket1" || selectedSlot === "trinket2";
  const isSpeciesSlot = selectedSlot === "species";
  const isBackgroundSlot = selectedSlot === "background";
  const isClassSlot = selectedSlot === "class";
  const isSubclassSlot = selectedSlot === "subclass";
  const isOriginFeatSlotSelected =
    selectedSlot !== null && isOriginFeatSlot(selectedSlot);
  const isFeatSlot = selectedSlot !== null && isFeatSlotSelection(selectedSlot);
  const featSlotIndex = isFeatSlot ? parseFeatSlotIndex(selectedSlot) : null;
  const originFeatLocked = speciesOriginFeatGrant?.kind === "fixed";

  useEffect(() => {
    setSearch("");
    setIdentitySource("amellwind");
    setFeatSource("amellwind");
    setShowFeatList(true);
  }, [selectedSlot]);

  useEffect(() => {
    if (!isWeaponSlot) return;
    setWeaponsLoading(true);
    getAllWeapons()
      .then(setAllWeapons)
      .finally(() => setWeaponsLoading(false));
  }, [isWeaponSlot, selectedSlot]);

  useEffect(() => {
    if (!isSpeciesSlot && !isBackgroundSlot) return;
    setIdentityLoading(true);
    setIdentityOptions([]);

    let load: Promise<LibraryListOption[]>;
    if (isSpeciesSlot) {
      load =
        identitySource === "dnd"
          ? getBuilderListDndRaces().then((list) =>
              list.map(entityToLibraryOption),
            )
          : getAllSpecies().then((list) =>
              list.map((s) => ({ id: s.id, name: s.name })),
            );
    } else {
      load =
        identitySource === "dnd"
          ? getListDndBackgrounds().then((list) =>
              list.map(entityToLibraryOption),
            )
          : getAllBackgrounds().then((list) =>
              list.map((b) => ({ id: b.id, name: b.name })),
            );
    }

    load.then(setIdentityOptions).finally(() => setIdentityLoading(false));
  }, [isSpeciesSlot, isBackgroundSlot, selectedSlot, identitySource]);

  useEffect(() => {
    if (!isClassSlot && !isSubclassSlot) return;
    setClassLoading(true);
    setClassOptions([]);
    getListClasses()
      .then((list) =>
        setClassOptions(
          list.filter((c) => !c.isSidekick).map(entityToLibraryOption),
        ),
      )
      .finally(() => setClassLoading(false));
  }, [isClassSlot, isSubclassSlot, selectedSlot]);

  // Apply feat grants whenever class feat slots or species origin feat change
  useEffect(() => {
    const classFeatSelections = featSelections
      .filter(Boolean)
      .filter(
        (f) => f && !isAsiFeatSelection(f),
      ) as import("@/shared/types").BuilderFeatSelection[];

    const originFeatSelection =
      speciesOriginFeat && !isAsiFeatSelection(speciesOriginFeat)
        ? speciesOriginFeat
        : null;

    const activeEntries: Array<{
      selection: import("@/shared/types").BuilderFeatSelection;
      isOrigin: boolean;
      classSlotIndex: number | null;
    }> = [];

    if (originFeatSelection) {
      activeEntries.push({
        selection: originFeatSelection,
        isOrigin: true,
        classSlotIndex: null,
      });
    }

    classFeatSelections.forEach((selection, classSlotIndex) => {
      activeEntries.push({ selection, isOrigin: false, classSlotIndex });
    });

    if (!activeEntries.length) {
      applyIdentityGrants({
        source: "feats",
        skillGrants: [],
        expertiseGrants: [],
      });
      return;
    }

    Promise.all(
      activeEntries.map(({ selection }) =>
        selection.source === "dnd2014" || selection.source === "dnd2024"
          ? getDndFeatById(selection.id)
          : getFeatById(selection.id),
      ),
    ).then((feats) => {
      const skillGrants: import("@/shared/types/proficiency.types").SkillProficiencyGrant[] =
        [];
      const expertiseGrants: import("@/shared/types/proficiency.types").ExpertiseGrant[] =
        [];

      feats.forEach((feat, i) => {
        if (!feat) return;
        const entry = activeEntries[i];
        const sourceName = entry.isOrigin
          ? ORIGIN_FEAT_SOURCE_NAME
          : `Feat slot ${(entry.classSlotIndex ?? 0) + 1}`;
        const tagSource = {
          type: "feat" as const,
          name: sourceName,
        };

        for (const grant of feat.skillGrants ?? []) {
          skillGrants.push({ ...grant, source: tagSource });
        }
        for (const grant of feat.expertiseGrants ?? []) {
          expertiseGrants.push({ ...grant, source: tagSource });
        }

        if ((feat.skillGrants?.length ?? 0) === 0) {
          if (entry.isOrigin) setOriginFeatSkillChoices([]);
          else if (entry.classSlotIndex !== null) {
            setFeatSkillChoices(entry.classSlotIndex, []);
          }
        }
      });

      applyIdentityGrants({ source: "feats", skillGrants, expertiseGrants });
    });
  }, [
    featSelections,
    speciesOriginFeat,
    applyIdentityGrants,
    setFeatSkillChoices,
    setOriginFeatSkillChoices,
  ]);

  // Apply class grants whenever classData or level changes
  useEffect(() => {
    if (!classData) {
      applyIdentityGrants({
        source: "class",
        skillGrants: [],
        saveProficiencies: [],
        expertiseGrants: [],
      });
      return;
    }
    const level = character.level;
    const expertiseGrants = detectExpertiseGrants(classData, level);
    applyIdentityGrants({
      source: "class",
      skillGrants: classData.skillChoiceGrants,
      saveProficiencies: classData.saveProficiencies,
      expertiseGrants,
    });
  }, [classData, character.level, applyIdentityGrants]);

  useEffect(() => {
    if (!classData || !subclass) return;
    const isValid = subclassesForClassVariant(classData).some(
      (sc) => sc.id === subclass.id,
    );
    if (!isValid) setSubclass(null);
  }, [classData, subclass, setSubclass]);

  const isFeatPickerSlot = isFeatSlot || isOriginFeatSlotSelected;

  useEffect(() => {
    if (!isFeatPickerSlot) return;
    setFeatsLoading(true);
    Promise.all([getAllFeats(), getListDndFeats()])
      .then(([amellwind, dnd]) => {
        setAmellwindFeats(amellwind);
        setDndFeats(dnd);
      })
      .finally(() => setFeatsLoading(false));
  }, [isFeatPickerSlot, selectedSlot]);

  const q = search.toLowerCase().trim();

  const inventoryWeaponsFiltered = useMemo(() => {
    if (!isWeaponSlot) return [];
    return inventoryWeapons.filter((w) => w.name.toLowerCase().includes(q));
  }, [inventoryWeapons, isWeaponSlot, q]);

  const catalogWeaponsFiltered = useMemo(() => {
    if (!isWeaponSlot) return [];
    const invNames = new Set(inventoryWeapons.map((w) => w.name));
    return allWeapons.filter(
      (w) => w.name.toLowerCase().includes(q) && !invNames.has(w.name),
    );
  }, [allWeapons, inventoryWeapons, isWeaponSlot, q]);

  const inventoryArmorsFiltered = useMemo(() => {
    if (!isArmorSlot) return [];
    return inventoryArmors.filter((a) => a.name.toLowerCase().includes(q));
  }, [inventoryArmors, isArmorSlot, q]);

  const catalogArmorsFiltered = useMemo(() => {
    if (!isArmorSlot) return [];
    const invNames = new Set(inventoryArmors.map((a) => a.name));
    return BASE_ARMORS.filter(
      (a) => a.name.toLowerCase().includes(q) && !invNames.has(a.name),
    );
  }, [inventoryArmors, isArmorSlot, q]);

  const showClothOption = useMemo(() => {
    if (!isArmorSlot) return false;
    if (!q) return true;
    return [
      "cloth",
      "clothing",
      "robe",
      "tunic",
      "caster",
      "mage",
      "wizard",
      "monk",
    ].some((term) => term.includes(q) || q.includes(term));
  }, [isArmorSlot, q]);

  const identityFiltered = useMemo(() => {
    if (!isSpeciesSlot && !isBackgroundSlot) return [];
    return filterLibraryOptions(identityOptions, q);
  }, [identityOptions, isSpeciesSlot, isBackgroundSlot, q]);

  const classFiltered = useMemo(() => {
    if (!isClassSlot) return [];
    return filterLibraryOptions(classOptions, q);
  }, [classOptions, isClassSlot, q]);

  const subclassOptions = useMemo(() => {
    if (!isSubclassSlot || !classData) return [];
    return dedupeByNameToListOptions(subclassesForClassVariant(classData));
  }, [isSubclassSlot, classData]);

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

  const selectedFeat = isOriginFeatSlotSelected
    ? speciesOriginFeat
    : isFeatSlot && featSlotIndex !== null
      ? (featSelections[featSlotIndex] ?? null)
      : null;

  const showAsiPanel =
    isFeatSlot &&
    !!selectedFeat &&
    isAsiFeatSelection(selectedFeat) &&
    !showFeatList;

  useEffect(() => {
    if (!isFeatPickerSlot) return;
    if (isOriginFeatSlotSelected) {
      setFeatSource("dnd2024");
      setShowFeatList(!speciesOriginFeat || originFeatLocked);
      return;
    }
    const feat =
      featSlotIndex !== null ? (featSelections[featSlotIndex] ?? null) : null;
    setShowFeatList(!feat || !isAsiFeatSelection(feat));
  }, [
    isFeatPickerSlot,
    isOriginFeatSlotSelected,
    originFeatLocked,
    speciesOriginFeat,
    featSlotIndex,
    featSelections,
  ]);

  const featListOptions = useMemo((): LibraryListOption[] => {
    if (isOriginFeatSlotSelected) {
      const originFeats = dndFeats.filter(
        (f) => isDnd2024Feat(f) && f.isOriginFeat,
      );
      const deduped = dedupeByNameToListOptions(originFeats, (group) =>
        group
          .flatMap((f) => [f.name, f.source, f.summary, ...f.prerequisites])
          .join(" ")
          .toLowerCase(),
      );
      return filterLibraryOptions(deduped, q);
    }

    if (!isFeatSlot) return [];

    const asiOption: LibraryListOption = {
      id: ABILITY_SCORE_IMPROVEMENT.id,
      name: ABILITY_SCORE_IMPROVEMENT.name,
    };

    const dnd2024Asi = dndFeats.find(
      (f) => isDnd2024Feat(f) && f.name === ABILITY_SCORE_IMPROVEMENT.name,
    );

    if (featSource === "amellwind") {
      const list = amellwindFeats
        .filter((f) => f.name !== ABILITY_SCORE_IMPROVEMENT.name)
        .map((f) => ({
          id: f.id,
          name: f.name,
          searchText: f.name.toLowerCase(),
        }));
      const filtered = filterLibraryOptions(list, q);
      return [asiOption, ...filtered];
    }

    const editionFeats =
      featSource === "dnd2014"
        ? dndFeats.filter((f) => !isDnd2024Feat(f))
        : dndFeats.filter((f) => isDnd2024Feat(f));

    const deduped = dedupeByNameToListOptions(editionFeats, (group) =>
      group
        .flatMap((f) => [f.name, f.source, f.summary, ...f.prerequisites])
        .join(" ")
        .toLowerCase(),
    ).filter((f) => f.name !== ABILITY_SCORE_IMPROVEMENT.name);

    const filtered = filterLibraryOptions(deduped, q);

    if (featSource === "dnd2024" && dnd2024Asi) {
      return [entityToLibraryOption(dnd2024Asi), ...filtered];
    }

    return [asiOption, ...filtered];
  }, [
    isFeatSlot,
    isOriginFeatSlotSelected,
    featSource,
    amellwindFeats,
    dndFeats,
    q,
  ]);

  const equippedWeapon =
    selectedSlot === "mainHand"
      ? mainHand
      : selectedSlot === "offHand"
        ? offHand
        : null;

  const equippedTrinket =
    selectedSlot === "trinket1"
      ? trinket1
      : selectedSlot === "trinket2"
        ? trinket2
        : null;

  const selectedIdentity =
    selectedSlot === "species"
      ? species
      : selectedSlot === "background"
        ? background
        : null;

  const showIdentityDetail =
    (isSpeciesSlot || isBackgroundSlot) && !!selectedIdentity;

  const showClassDetail = isClassSlot && !!classSelection && !!classData;
  const showSubclassDetail = isSubclassSlot && !!subclass && !!activeSubclass;

  const showWeaponDetail = isWeaponSlot && !!equippedWeapon;
  const showArmorDetail = isArmorSlot && !!armor;

  const showFeatDetail =
    isFeatPickerSlot &&
    !!selectedFeat &&
    !showAsiPanel &&
    !isAsiFeatSelection(selectedFeat) &&
    (isOriginFeatSlotSelected ? originFeatLocked || !showFeatList : true);

  const dndRaceSourceVariants = useLibraryVariants<DndRace>(
    identitySource === "dnd" && isSpeciesSlot && !!selectedIdentity?.name,
    selectedIdentity?.name,
    identitySource === "dnd" && isSpeciesSlot ? getDndRacesByName : null,
  );

  const dndBackgroundSourceVariants = useLibraryVariants<DndBackground>(
    identitySource === "dnd" && isBackgroundSlot && !!selectedIdentity?.name,
    selectedIdentity?.name,
    identitySource === "dnd" && isBackgroundSlot
      ? getDndBackgroundsByName
      : null,
  );

  const dndIdentitySourceVariants: SourceVariant[] = isSpeciesSlot
    ? dndRaceSourceVariants
    : dndBackgroundSourceVariants;

  const isDndFeatSelection =
    selectedFeat?.source === "dnd2014" || selectedFeat?.source === "dnd2024";

  const dndFeatVariantsRaw = useLibraryVariants<DndFeat>(
    isDndFeatSelection && !!selectedFeat?.name,
    selectedFeat?.name,
    getDndFeatsByName,
  );

  const dndFeatSourceVariants = useMemo((): SourceVariant[] => {
    if (!isDndFeatSelection) return [];
    const filtered =
      selectedFeat?.source === "dnd2024"
        ? dndFeatVariantsRaw.filter(isDnd2024Feat)
        : dndFeatVariantsRaw.filter((f) => !isDnd2024Feat(f));
    return filtered;
  }, [dndFeatVariantsRaw, isDndFeatSelection, selectedFeat?.source]);

  const subclassSourceVariants = useMemo((): SourceVariant[] => {
    if (!subclass?.name || !classData) return [];
    return subclassesForClassVariant(classData)
      .filter((sc) => sc.name === subclass.name)
      .sort((a, b) => a.source.localeCompare(b.source));
  }, [classData, subclass?.name]);

  useEffect(() => {
    // Clear grants immediately when identity is removed or slot changes
    if (!selectedIdentity) {
      setIdentityDetail(null);
      setIdentitySubraceDetail(null);
      setDndSubraceOptions([]);
      setIdentityDetailLoading(false);
      if (isSpeciesSlot) {
        applyIdentityGrants({
          source: "species",
          skillGrants: [],
          skillAdvantages: [],
        });
      } else if (isBackgroundSlot) {
        applyIdentityGrants({ source: "background", skillGrants: [] });
      }
      return;
    }

    if (!isSpeciesSlot && !isBackgroundSlot) {
      setIdentityDetail(null);
      setIdentitySubraceDetail(null);
      setDndSubraceOptions([]);
      setIdentityDetailLoading(false);
      return;
    }

    if (isSpeciesSlot) {
      applyIdentityGrants({
        source: "species",
        skillGrants: [],
        skillAdvantages: [],
      });
    } else {
      applyIdentityGrants({ source: "background", skillGrants: [] });
    }

    let cancelled = false;
    setIdentityDetailLoading(true);
    setIdentityDetail(null);
    setIdentitySubraceDetail(null);
    setDndSubraceOptions([]);

    async function loadIdentityDetail() {
      if (isSpeciesSlot && identitySource === "dnd") {
        const base = await getDndRaceById(selectedIdentity!.id);
        if (cancelled || !base) return;

        setIdentityDetail(base as unknown as Species);

        const subraces = await getDndSubracesForParent(base.name, base.source);
        if (cancelled) return;

        setDndSubraceOptions(
          subraces.map((subrace) => ({ id: subrace.id, name: subrace.name })),
        );

        const selectedSubrace = selectedIdentity!.subraceId
          ? subraces.find(
              (subrace) => subrace.id === selectedIdentity!.subraceId,
            )
          : undefined;

        if (selectedIdentity!.subraceId && !selectedSubrace) {
          setSpecies({
            id: selectedIdentity!.id,
            name: selectedIdentity!.name,
            subraceId: null,
            subraceName: null,
          });
        }

        if (selectedSubrace) {
          setIdentitySubraceDetail(selectedSubrace);
        }

        applyIdentityGrants({
          source: "species",
          skillGrants: [
            ...base.skillGrants,
            ...(selectedSubrace?.skillGrants ?? []),
          ],
          skillAdvantages: [
            ...base.skillAdvantages,
            ...(selectedSubrace?.skillAdvantages ?? []),
          ],
        });
        return;
      }

      const data = isSpeciesSlot
        ? await getSpeciesById(selectedIdentity!.id)
        : identitySource === "dnd"
          ? await getDndBackgroundById(selectedIdentity!.id)
          : await getBackgroundById(selectedIdentity!.id);

      if (cancelled || !data) return;

      setIdentityDetail(data as Species | Background);

      if ("skillGrants" in data) {
        if (isSpeciesSlot) {
          applyIdentityGrants({
            source: "species",
            skillGrants: data.skillGrants,
            skillAdvantages:
              "skillAdvantages" in data ? data.skillAdvantages : [],
          });
        } else {
          applyIdentityGrants({
            source: "background",
            skillGrants: data.skillGrants,
          });
        }
      }
    }

    void loadIdentityDetail().finally(() => {
      if (!cancelled) setIdentityDetailLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    selectedIdentity?.id,
    selectedIdentity?.subraceId,
    isSpeciesSlot,
    isBackgroundSlot,
    identitySource,
    applyIdentityGrants,
    setSpecies,
  ]);

  useEffect(() => {
    if (!showFeatDetail || !selectedFeat) {
      setFeatDetail(null);
      setFeatDetailLoading(false);
      return;
    }

    let cancelled = false;
    setFeatDetailLoading(true);
    setFeatDetail(null);

    const load =
      selectedFeat.source === "amellwind"
        ? getFeatById(selectedFeat.id)
        : getDndFeatById(selectedFeat.id);

    load
      .then((data) => {
        if (!cancelled && data) setFeatDetail(data);
      })
      .finally(() => {
        if (!cancelled) setFeatDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showFeatDetail, selectedFeat?.id, selectedFeat?.source]);

  function handleSelectWeapon(weapon: Weapon) {
    if (!isWeaponSlot || !selectedSlot) return;
    equipWeapon(selectedSlot, weapon, "Common");
  }

  function handleSelectArmor(item: ArmorItem) {
    equipArmor(item);
  }

  function handleSelectTrinket(name: string) {
    if (!isTrinketSlot || !selectedSlot) return;
    equipTrinket(selectedSlot, name);
  }

  function handleSelectIdentity(id: string, name: string) {
    const ref = {
      id,
      name,
      subraceId: null,
      subraceName: null,
    };
    if (isSpeciesSlot) setSpecies(ref);
    else if (isBackgroundSlot) setBackground(ref);
  }

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

  function handleDndIdentitySourceSelect(id: string) {
    if (!selectedIdentity) return;

    if (isSpeciesSlot) {
      const variant = dndRaceSourceVariants.find((v) => v.id === id);
      if (!variant) return;
      setSpecies({
        id: variant.id,
        name: variant.name,
        subraceId: null,
        subraceName: null,
      });
      return;
    }

    if (isBackgroundSlot) {
      const variant = dndBackgroundSourceVariants.find((v) => v.id === id);
      if (!variant) return;
      setBackground({ id: variant.id, name: variant.name });
    }
  }

  function handleSubspeciesSelect(subraceId: string | null) {
    if (!selectedIdentity || !isSpeciesSlot) return;
    if (!subraceId) {
      setSpecies({
        id: selectedIdentity.id,
        name: selectedIdentity.name,
        subraceId: null,
        subraceName: null,
      });
      return;
    }
    const option = dndSubraceOptions.find((entry) => entry.id === subraceId);
    if (!option) return;
    setSpecies({
      id: selectedIdentity.id,
      name: selectedIdentity.name,
      subraceId: option.id,
      subraceName: option.name,
    });
  }

  function handleSelectSubclass(id: string, name: string) {
    setSubclass({ id, name });
  }

  function handleSubclassSourceSelect(id: string) {
    const variant = subclassSourceVariants.find((v) => v.id === id);
    if (!variant || !subclass) return;
    setSubclass({ id: variant.id, name: subclass.name });
  }

  function handleSelectFeatOption(id: string, name: string) {
    if (featSlotIndex === null) return;

    if (id === ABILITY_SCORE_IMPROVEMENT.id && featSource !== "dnd2024") {
      handleSelectFeat({
        id,
        name,
        source: "asi",
      });
      return;
    }

    const source =
      featSource === "amellwind"
        ? ("amellwind" as const)
        : featSource === "dnd2024"
          ? ("dnd2024" as const)
          : ("dnd2014" as const);

    handleSelectFeat({ id, name, source });
  }

  function handleDndFeatSourceSelect(id: string) {
    const variant = dndFeatSourceVariants.find((v) => v.id === id);
    if (!variant || !selectedFeat) return;
    if (isOriginFeatSlotSelected) {
      if (originFeatLocked) return;
      setSpeciesOriginFeat({
        id: variant.id,
        name: selectedFeat.name,
        source: selectedFeat.source,
      });
      return;
    }
    if (featSlotIndex === null) return;
    setFeatAtIndex(featSlotIndex, {
      id: variant.id,
      name: selectedFeat.name,
      source: selectedFeat.source,
    });
  }

  function handleSelectFeat(selection: BuilderFeatSelection) {
    if (isOriginFeatSlotSelected) {
      if (originFeatLocked) return;
      setSpeciesOriginFeat(selection);
      setShowFeatList(false);
      return;
    }
    if (featSlotIndex === null) return;
    const next: BuilderFeatSelection = isAsiFeatSelection(selection)
      ? {
          ...selection,
          asiChoices: selection.asiChoices ?? { ...DEFAULT_ASI_CHOICES },
        }
      : selection;
    setFeatAtIndex(featSlotIndex, next);
    if (isAsiFeatSelection(next)) {
      setShowFeatList(false);
    }
  }

  function handleSelectOriginFeatOption(id: string, name: string) {
    handleSelectFeat({ id, name, source: "dnd2024" });
  }

  function handleUpdateAsiChoices(
    choices: NonNullable<BuilderFeatSelection["asiChoices"]>,
  ) {
    if (featSlotIndex === null || !selectedFeat) return;
    setFeatAtIndex(featSlotIndex, { ...selectedFeat, asiChoices: choices });
  }

  const showIdentitySourceToggle = isSpeciesSlot || isBackgroundSlot;
  const showFeatSourceToggle = isFeatSlot && !showAsiPanel && !isOriginFeatSlotSelected;

  const slotLabel = useMemo(() => {
    if (!selectedSlot) return "Library";
    if (isFeatSlotSelection(selectedSlot)) {
      return `Feat ${featSlotIndex !== null ? featSlotIndex + 1 : ""}`.trim();
    }
    return SLOT_LABELS[selectedSlot] ?? selectedSlot;
  }, [selectedSlot, featSlotIndex]);

  const panelTitle = selectedSlot ? (
    <span className="flex min-w-0 flex-wrap items-center gap-2">
      <span>{showAsiPanel ? "ASI" : `Library — ${slotLabel}`}</span>
      {showIdentitySourceToggle && (
        <IdentitySourceBadgeGroup
          value={identitySource}
          onChange={setIdentitySource}
        />
      )}
      {showFeatSourceToggle && (
        <FeatSourceBadgeGroup value={featSource} onChange={setFeatSource} />
      )}
    </span>
  ) : (
    "Library"
  );

  return (
    <BuilderPanel title={panelTitle}>
      {!selectedSlot ? (
        <EmptyState text="Click on an equipment slot to see the available options." />
      ) : (
        <>
          {!showIdentityDetail &&
            !showClassDetail &&
            !showSubclassDetail &&
            !showWeaponDetail &&
            !showArmorDetail &&
            !showFeatDetail &&
            !showAsiPanel && (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}

          <div className="h-auto space-y-1 overflow-y-auto overscroll-y-contain pr-1">
            {isWeaponSlot &&
              (showWeaponDetail ? (
                <WeaponLibraryDetail equipped={equippedWeapon} />
              ) : (
                <WeaponList
                  inventory={inventoryWeaponsFiltered}
                  catalog={catalogWeaponsFiltered}
                  loading={weaponsLoading}
                  equipped={equippedWeapon?.weapon.name ?? null}
                  onSelect={handleSelectWeapon}
                />
              ))}

            {isArmorSlot &&
              (showArmorDetail ? (
                <ArmorLibraryDetail equipped={armor} />
              ) : (
                <ArmorList
                  showCloth={showClothOption}
                  inventory={inventoryArmorsFiltered}
                  catalog={catalogArmorsFiltered}
                  equippedName={armor?.armor.name ?? null}
                  onSelect={handleSelectArmor}
                />
              ))}

            {isTrinketSlot && (
              <TrinketList
                equippedName={equippedTrinket?.name ?? null}
                onSelect={handleSelectTrinket}
              />
            )}

            {(isSpeciesSlot || isBackgroundSlot) &&
              (showIdentityDetail ? (
                identityDetailLoading ? (
                  <EmptyState text="Cargando…" />
                ) : isSpeciesSlot && isLoadedSpecies(identityDetail) ? (
                  <IdentityLibraryDetail
                    species={identityDetail}
                    sourceVariants={
                      identitySource === "dnd"
                        ? dndIdentitySourceVariants
                        : undefined
                    }
                    activeSourceId={selectedIdentity?.id}
                    onSourceSelect={
                      identitySource === "dnd"
                        ? handleDndIdentitySourceSelect
                        : undefined
                    }
                    subspeciesOptions={
                      identitySource === "dnd" ? dndSubraceOptions : undefined
                    }
                    activeSubspeciesId={selectedIdentity?.subraceId ?? null}
                    onSubspeciesSelect={
                      identitySource === "dnd"
                        ? handleSubspeciesSelect
                        : undefined
                    }
                    subspeciesTraits={identitySubraceDetail?.traits ?? []}
                    subspeciesAbilitySummary={
                      identitySubraceDetail?.abilitySummary ?? null
                    }
                    subspeciesLabel={selectedIdentity?.subraceName ?? null}
                    bookNames={identityBookNames}
                  />
                ) : isBackgroundSlot && isLoadedBackground(identityDetail) ? (
                  <IdentityLibraryDetail
                    background={identityDetail}
                    backgroundAbilitySummary={
                      identitySource === "dnd" &&
                      identityDetail &&
                      "abilitySummary" in identityDetail &&
                      typeof identityDetail.abilitySummary === "string"
                        ? identityDetail.abilitySummary
                        : null
                    }
                    sourceVariants={
                      identitySource === "dnd"
                        ? dndIdentitySourceVariants
                        : undefined
                    }
                    activeSourceId={selectedIdentity?.id}
                    onSourceSelect={
                      identitySource === "dnd"
                        ? handleDndIdentitySourceSelect
                        : undefined
                    }
                    bookNames={identityBookNames}
                  />
                ) : (
                  <EmptyState text="No se encontró la información." />
                )
              ) : (
                <LibraryList
                  loading={identityLoading}
                  options={identityFiltered}
                  selectedId={selectedIdentity?.id ?? null}
                  selectedName={
                    identitySource === "dnd"
                      ? (selectedIdentity?.name ?? null)
                      : null
                  }
                  icon={
                    isSpeciesSlot ? (
                      <Users className="h-3.5 w-3.5 text-sky-400" />
                    ) : (
                      <ScrollText className="h-3.5 w-3.5 text-violet-400" />
                    )
                  }
                  onSelect={handleSelectIdentity}
                />
              ))}

            {isClassSlot &&
              (showClassDetail ? (
                classDetailLoading ? (
                  <EmptyState text="Cargando…" />
                ) : classData ? (
                  <ClassLibraryDetail
                    classData={classData}
                    subclass={activeSubclass}
                    level={character.level}
                    variants={classVariants}
                    varyingFields={varyingFields}
                    bookNames={bookNames}
                    onSourceSelect={handleClassSourceSelect}
                  />
                ) : (
                  <EmptyState text="No se encontró la información." />
                )
              ) : (
                <LibraryList
                  loading={classLoading}
                  options={classFiltered}
                  selectedId={classSelection?.id ?? null}
                  selectedName={classSelection?.name ?? null}
                  icon={
                    <GraduationCap className="h-3.5 w-3.5 text-amber-400" />
                  }
                  onSelect={handleSelectClass}
                />
              ))}

            {isSubclassSlot &&
              (!classData ? (
                <EmptyState text="Elige una clase primero." />
              ) : showSubclassDetail && activeSubclass ? (
                <SubclassLibraryDetail
                  subclass={activeSubclass}
                  level={character.level}
                  sourceVariants={subclassSourceVariants}
                  activeSourceId={subclass?.id}
                  onSourceSelect={handleSubclassSourceSelect}
                  bookNames={identityBookNames}
                />
              ) : (
                <LibraryList
                  loading={classDetailLoading}
                  options={subclassFiltered}
                  selectedId={subclass?.id ?? null}
                  selectedName={subclass?.name ?? null}
                  icon={<Sparkles className="h-3.5 w-3.5 text-emerald-400" />}
                  onSelect={handleSelectSubclass}
                />
              ))}

            {isOriginFeatSlotSelected && !speciesOriginFeatGrant && (
              <EmptyState text="Esta specie no otorga un Origin Feat." />
            )}

            {isOriginFeatSlotSelected &&
              !!speciesOriginFeatGrant &&
              (showFeatDetail ? (
                featDetailLoading ? (
                  <EmptyState text="Cargando…" />
                ) : featDetail ? (
                  <FeatLibraryDetail
                    feat={featDetail}
                    sourceVariants={
                      isDndFeatSelection ? dndFeatSourceVariants : undefined
                    }
                    activeSourceId={selectedFeat?.id}
                    onSourceSelect={
                      isDndFeatSelection && !originFeatLocked
                        ? handleDndFeatSourceSelect
                        : undefined
                    }
                    bookNames={identityBookNames}
                  />
                ) : (
                  <EmptyState text="No se encontró la información." />
                )
              ) : featsLoading ? (
                <EmptyState text="Cargando feats…" />
              ) : (
                <FeatList
                  options={featListOptions}
                  selectedId={selectedFeat?.id ?? null}
                  selectedName={selectedFeat?.name ?? null}
                  onSelect={handleSelectOriginFeatOption}
                />
              ))}

            {isFeatSlot &&
              (showAsiPanel && selectedFeat ? (
                <AsiLibraryPanel
                  choices={
                    selectedFeat.asiChoices ?? { ...DEFAULT_ASI_CHOICES }
                  }
                  onChange={handleUpdateAsiChoices}
                  onBack={() => setShowFeatList(true)}
                />
              ) : showFeatDetail ? (
                featDetailLoading ? (
                  <EmptyState text="Cargando…" />
                ) : featDetail ? (
                  <FeatLibraryDetail
                    feat={featDetail}
                    sourceVariants={
                      isDndFeatSelection ? dndFeatSourceVariants : undefined
                    }
                    activeSourceId={selectedFeat?.id}
                    onSourceSelect={
                      isDndFeatSelection ? handleDndFeatSourceSelect : undefined
                    }
                    bookNames={identityBookNames}
                  />
                ) : (
                  <EmptyState text="No se encontró la información." />
                )
              ) : featsLoading ? (
                <EmptyState text="Cargando feats…" />
              ) : (
                <FeatList
                  options={featListOptions}
                  selectedId={selectedFeat?.id ?? null}
                  selectedName={
                    isDndFeatSelection ? (selectedFeat?.name ?? null) : null
                  }
                  onSelect={handleSelectFeatOption}
                />
              ))}
          </div>
        </>
      )}
    </BuilderPanel>
  );
}

function WeaponList({
  inventory,
  catalog,
  loading,
  equipped,
  onSelect,
}: {
  inventory: Weapon[];
  catalog: Weapon[];
  loading: boolean;
  equipped: string | null;
  onSelect: (w: Weapon) => void;
}) {
  if (loading) return <EmptyState text="Cargando armas…" />;
  if (inventory.length === 0 && catalog.length === 0) {
    return <EmptyState text="No weapons available." />;
  }

  return (
    <>
      {inventory.length > 0 && <SectionLabel>Inventario</SectionLabel>}
      {inventory.map((w) => (
        <ItemRow
          key={`inv-${w.name}`}
          icon={<Sword className="h-3.5 w-3.5 text-primary" />}
          name={w.name}
          stats={`${w.dmg1} ${w.dmgType} • ${w.properties.join(", ")}`}
          equipped={equipped === w.name}
          onClick={() => onSelect(w)}
        />
      ))}
      {catalog.map((w) => (
        <ItemRow
          key={w.name}
          icon={<Sword className="h-3.5 w-3.5 text-muted-foreground" />}
          name={w.name}
          stats={`${w.dmg1} ${w.dmgType} • ${w.properties.join(", ")}`}
          equipped={equipped === w.name}
          onClick={() => onSelect(w)}
        />
      ))}
    </>
  );
}

function ArmorList({
  showCloth,
  inventory,
  catalog,
  equippedName,
  onSelect,
}: {
  showCloth: boolean;
  inventory: ArmorItem[];
  catalog: ArmorItem[];
  equippedName: string | null;
  onSelect: (a: ArmorItem) => void;
}) {
  return (
    <>
      {showCloth && (
        <>
          <SectionLabel>Clothing</SectionLabel>
          <ItemRow
            icon={<Shirt className="h-3.5 w-3.5 text-violet-400" />}
            name="Cloth"
            stats={`10 + DEX • ${CLOTHING_ARMOR.rarity}`}
            equipped={equippedName === CLOTHING_ARMOR.name}
            onClick={() => onSelect(CLOTHING_ARMOR)}
          />
        </>
      )}
      {inventory.length > 0 && <SectionLabel>Inventario</SectionLabel>}
      {inventory.map((a) => (
        <ItemRow
          key={`inv-${a.name}`}
          icon={<Shield className="h-3.5 w-3.5 text-primary" />}
          name={a.name}
          stats={`CA ${a.baseAC} • ${a.category}`}
          rarity={a.rarity}
          equipped={equippedName === a.name}
          onClick={() => onSelect(a)}
        />
      ))}
      {catalog.map((a) => (
        <ItemRow
          key={a.name}
          icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />}
          name={a.name}
          stats={`CA ${a.baseAC} • ${a.category}`}
          rarity={a.rarity}
          equipped={equippedName === a.name}
          onClick={() => onSelect(a)}
        />
      ))}
    </>
  );
}

function TrinketList({
  equippedName,
  onSelect,
}: {
  equippedName: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <>
      {["Rune Holder A", "Rune Holder B", "Rune Holder C"].map((name) => (
        <ItemRow
          key={name}
          icon={<Gem className="h-3.5 w-3.5 text-muted-foreground" />}
          name={name}
          stats="Placeholder"
          equipped={equippedName === name}
          onClick={() => onSelect(name)}
        />
      ))}
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-primary">
      {children}
    </p>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-xs text-muted-foreground">{text}</p>
  );
}

function SubclassLibraryDetail({
  subclass,
  level,
  sourceVariants,
  activeSourceId,
  onSourceSelect,
  bookNames = {},
}: {
  subclass: Subclass;
  level: number;
  sourceVariants?: SourceVariant[];
  activeSourceId?: string;
  onSourceSelect?: (id: string) => void;
  bookNames?: BookSourceNameMap;
}) {
  const rowsWithFeatures = subclass.progression.filter(
    (row) => row.level <= level && row.features.length > 0,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-foreground">
          {subclass.name}
        </h3>
        <span className="text-[10px] text-muted-foreground">
          {subclass.source}
        </span>
      </div>

      {sourceVariants && onSourceSelect && (
        <SourceVariantSwitcher
          variants={sourceVariants}
          activeId={activeSourceId}
          onSelect={onSourceSelect}
          bookNames={bookNames}
          accent="emerald"
        />
      )}

      {rowsWithFeatures.length > 0 ? (
        <Accordion type="multiple" className="space-y-1">
          {rowsWithFeatures.map((row) => (
            <AccordionItem
              key={row.level}
              value={`subclass-level-${row.level}`}
              className="rounded-md border border-border/60 px-2"
            >
              <AccordionTrigger className="gap-2 py-2 text-xs font-medium hover:no-underline">
                <span className="shrink-0 font-semibold text-emerald-400/90">
                  Level {row.level}
                </span>
                <span className="min-w-0 flex-1 truncate text-left text-[10px] font-normal text-muted-foreground">
                  {row.features.map((f) => f.displayName).join(", ")}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2 pt-0">
                <ClassFeatureDetailsPanel
                  features={row.features.map((f) => ({
                    ...f,
                    isSubclassFeature: true,
                  }))}
                  className="mt-0"
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-xs italic text-muted-foreground">
          Sin rasgos de subclass disponibles para este nivel.
        </p>
      )}
    </div>
  );
}

function FeatList({
  options,
  selectedId,
  selectedName = null,
  onSelect,
}: {
  options: LibraryListOption[];
  selectedId: string | null;
  selectedName?: string | null;
  onSelect: (id: string, name: string) => void;
}) {
  if (options.length === 0) {
    return <EmptyState text="No feats available." />;
  }

  return (
    <LibraryList
      loading={false}
      options={options}
      selectedId={selectedId}
      selectedName={selectedName}
      icon={<Award className="h-3.5 w-3.5 text-rose-400" />}
      stats={(option) =>
        option.id === ABILITY_SCORE_IMPROVEMENT.id
          ? "Mejora 2 puntos de habilidad o elige un feat"
          : ""
      }
      onSelect={onSelect}
    />
  );
}

function ItemRow({
  icon,
  name,
  stats,
  rarity,
  trailing,
  trailingTitle,
  equipped = false,
  onClick,
}: {
  icon: React.ReactNode;
  name: string;
  stats: string;
  rarity?: string;
  trailing?: string;
  trailingTitle?: string;
  equipped?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mb-1 flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/50",
        equipped ? "border-violet-400/40 bg-violet-400/5" : "border-border/60",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 font-medium text-foreground">
          {icon}
          <span className="truncate">{name}</span>
          {equipped && <Check className="h-3 w-3 shrink-0 text-emerald-400" />}
        </div>
        {stats && (
          <div className="truncate pl-5 text-[11px] text-muted-foreground">
            {stats}
          </div>
        )}
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-1.5">
        {trailing && (
          <span
            className="max-w-[16rem] text-[10px] text-muted-foreground"
            title={trailingTitle ?? trailing}
          >
            {trailing}
          </span>
        )}
        {rarity && RARITY_BADGE[rarity] && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              RARITY_BADGE[rarity],
            )}
          >
            {rarity}
          </span>
        )}
      </div>
    </button>
  );
}
