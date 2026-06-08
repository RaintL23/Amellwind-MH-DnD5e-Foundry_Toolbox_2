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
import { cn } from "@/shared/utils/cn";
import { BASE_ARMORS, CLOTHING_ARMOR } from "../../data/armor.placeholder";
import { getAllWeapons } from "@/features/weapons/services/weapon.service";
import { getAllSpecies, getSpeciesById } from "@/features/species/services/species.service";
import { getAllDndRaces, getDndRaceById } from "@/features/dnd-races/services/dnd-race.service";
import { getAllBackgrounds, getBackgroundById } from "@/features/backgrounds/services/background.service";
import { getAllDndBackgrounds, getDndBackgroundById } from "@/features/dnd-backgrounds/services/dnd-background.service";
import { getListClasses } from "@/features/classes/services/class.service";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import { getAllFeats, getFeatById } from "@/features/feats/services/feat.service";
import { getListDndFeats, getDndFeatById } from "@/features/dnd-feats/services/dnd-feat.service";
import { detectExpertiseGrants } from "../../utils/expertise-detection.utils";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useBuilderInventory } from "../../context/BuilderInventoryContext";
import { useSelectedClass } from "../../hooks/useSelectedClass";
import {
  ABILITY_SCORE_IMPROVEMENT,
  DEFAULT_ASI_CHOICES,
  isAsiFeatSelection,
  isFeatSlotSelection,
  parseFeatSlotIndex,
} from "../../utils/builder-class.utils";
import { AsiLibraryPanel } from "./AsiLibraryPanel";
import { ArmorItem, Weapon } from "@/shared/types";
import type {
  Background,
  BuilderFeatSelection,
  DndFeat,
  Feat,
  Species,
  Subclass,
} from "@/shared/types";
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
import { IdentityLibraryDetail } from "./IdentityLibraryDetail";
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

function isLoadedSpecies(
  data: Species | Background | null,
): data is Species {
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
  const [identityOptions, setIdentityOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [identityDetail, setIdentityDetail] = useState<
    Species | Background | null
  >(null);
  const [identityDetailLoading, setIdentityDetailLoading] = useState(false);
  const [identitySource, setIdentitySource] =
    useState<IdentityDataSource>("amellwind");
  const [classOptions, setClassOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [classLoading, setClassLoading] = useState(false);
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
    applyIdentityGrants,
    setFeatSkillChoices,
  } = useCharacterBuilder();
  const { classData, loading: classDetailLoading } = useSelectedClass();
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
  const isFeatSlot =
    selectedSlot !== null && isFeatSlotSelection(selectedSlot);
  const featSlotIndex = isFeatSlot
    ? parseFeatSlotIndex(selectedSlot)
    : null;

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

    let load: Promise<Array<{ id: string; name: string }>>;
    if (isSpeciesSlot) {
      load = identitySource === "dnd"
        ? getAllDndRaces().then((list) => list.map((r) => ({ id: r.id, name: r.name })))
        : getAllSpecies().then((list) => list.map((s) => ({ id: s.id, name: s.name })));
    } else {
      load = identitySource === "dnd"
        ? getAllDndBackgrounds().then((list) => list.map((b) => ({ id: b.id, name: b.name })))
        : getAllBackgrounds().then((list) => list.map((b) => ({ id: b.id, name: b.name })));
    }

    load.then(setIdentityOptions).finally(() => setIdentityLoading(false));
  }, [isSpeciesSlot, isBackgroundSlot, selectedSlot, identitySource]);

  useEffect(() => {
    if (!isClassSlot && !isSubclassSlot) return;
    setClassLoading(true);
    setClassOptions([]);
    getListClasses()
      .then((list) =>
        setClassOptions(list.map((c) => ({ id: c.id, name: c.name }))),
      )
      .finally(() => setClassLoading(false));
  }, [isClassSlot, isSubclassSlot, selectedSlot]);

  // Apply feat grants whenever featSelections changes
  useEffect(() => {
    const activeFeatIds = featSelections
      .filter(Boolean)
      .filter((f) => f && !isAsiFeatSelection(f)) as import("@/shared/types").BuilderFeatSelection[];

    if (!activeFeatIds.length) {
      applyIdentityGrants({ source: "feats", skillGrants: [], expertiseGrants: [] });
      return;
    }

    Promise.all(
      activeFeatIds.map((f) =>
        f.source === "dnd2014" || f.source === "dnd2024"
          ? getDndFeatById(f.id)
          : getFeatById(f.id),
      ),
    ).then((feats) => {
      const validFeats = feats.filter(Boolean) as import("@/shared/types").Feat[];
      const skillGrants = validFeats.flatMap((f) => f.skillGrants ?? []);
      const expertiseGrants = validFeats.flatMap((f) => f.expertiseGrants ?? []);
      applyIdentityGrants({ source: "feats", skillGrants, expertiseGrants });

      // Reset feat skill choices for slots that have no skill grants
      validFeats.forEach((feat, i) => {
        if (feat && (feat.skillGrants?.length ?? 0) === 0) {
          setFeatSkillChoices(i, []);
        }
      });
    });
  }, [featSelections, applyIdentityGrants, setFeatSkillChoices]);

  // Apply class grants whenever classData or level changes
  useEffect(() => {
    if (!classData) {
      applyIdentityGrants({ source: "class", skillGrants: [], saveProficiencies: [], expertiseGrants: [] });
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
    if (!isFeatSlot) return;
    setFeatsLoading(true);
    Promise.all([getAllFeats(), getListDndFeats()])
      .then(([amellwind, dnd]) => {
        setAmellwindFeats(amellwind);
        setDndFeats(dnd);
      })
      .finally(() => setFeatsLoading(false));
  }, [isFeatSlot, selectedSlot]);

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
    if (!q) return identityOptions;
    return identityOptions.filter((o) => o.name.toLowerCase().includes(q));
  }, [identityOptions, isSpeciesSlot, isBackgroundSlot, q]);

  const classFiltered = useMemo(() => {
    if (!isClassSlot) return [];
    if (!q) return classOptions;
    return classOptions.filter((o) => o.name.toLowerCase().includes(q));
  }, [classOptions, isClassSlot, q]);

  const subclassOptions = useMemo(() => {
    if (!isSubclassSlot || !classData) return [];
    return subclassesForClassVariant(classData).map((sc) => ({
      id: sc.id,
      name: sc.name,
    }));
  }, [isSubclassSlot, classData]);

  const subclassFiltered = useMemo(() => {
    if (!q) return subclassOptions;
    return subclassOptions.filter((o) => o.name.toLowerCase().includes(q));
  }, [subclassOptions, q]);

  const activeSubclass = useMemo(() => {
    if (!classData || !subclass) return null;
    return (
      subclassesForClassVariant(classData).find((sc) => sc.id === subclass.id) ??
      null
    );
  }, [classData, subclass]);

  const selectedFeat =
    isFeatSlot && featSlotIndex !== null
      ? (featSelections[featSlotIndex] ?? null)
      : null;

  const showAsiPanel =
    isFeatSlot &&
    !!selectedFeat &&
    isAsiFeatSelection(selectedFeat) &&
    !showFeatList;

  useEffect(() => {
    if (!isFeatSlot) return;
    const feat =
      featSlotIndex !== null
        ? (featSelections[featSlotIndex] ?? null)
        : null;
    setShowFeatList(!feat || !isAsiFeatSelection(feat));
  }, [isFeatSlot, featSlotIndex, featSelections]);

  const featOptions = useMemo(() => {
    if (!isFeatSlot) return [];

    const asiOption: BuilderFeatSelection = {
      id: ABILITY_SCORE_IMPROVEMENT.id,
      name: ABILITY_SCORE_IMPROVEMENT.name,
      source: "asi",
    };

    const dnd2024Asi = dndFeats.find(
      (f) => isDnd2024Feat(f) && f.name === ABILITY_SCORE_IMPROVEMENT.name,
    );

    let list: Array<{ id: string; name: string; summary?: string }> = [];

    if (featSource === "amellwind") {
      list = amellwindFeats.map((f) => ({
        id: f.id,
        name: f.name,
        summary: f.summary,
      }));
    } else if (featSource === "dnd2014") {
      list = dndFeats
        .filter((f) => !isDnd2024Feat(f))
        .map((f) => ({
          id: f.id,
          name: f.name,
          summary: f.summary,
        }));
    } else {
      list = dndFeats
        .filter((f) => isDnd2024Feat(f))
        .map((f) => ({
          id: f.id,
          name: f.name,
          summary: f.summary,
        }));
    }

    list = list.filter((f) => f.name !== ABILITY_SCORE_IMPROVEMENT.name);

    const filtered = q
      ? list.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            (f.summary?.toLowerCase().includes(q) ?? false),
        )
      : list;

    const mapped = filtered.map((f) => ({
      id: f.id,
      name: f.name,
      source: featSource,
    }));

    if (featSource === "dnd2024" && dnd2024Asi) {
      return [
        {
          id: dnd2024Asi.id,
          name: dnd2024Asi.name,
          source: "dnd2024" as const,
        },
        ...mapped,
      ];
    }

    return [asiOption, ...mapped];
  }, [isFeatSlot, featSource, amellwindFeats, dndFeats, q]);

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

  useEffect(() => {
    // Clear grants immediately when identity is removed or slot changes
    if (!selectedIdentity) {
      setIdentityDetail(null);
      setIdentityDetailLoading(false);
      if (isSpeciesSlot) {
        applyIdentityGrants({ source: "species", skillGrants: [], skillAdvantages: [] });
      } else if (isBackgroundSlot) {
        applyIdentityGrants({ source: "background", skillGrants: [] });
      }
      return;
    }

    if (!isSpeciesSlot && !isBackgroundSlot) {
      setIdentityDetail(null);
      setIdentityDetailLoading(false);
      return;
    }

    // Clear previous grants while new identity loads
    if (isSpeciesSlot) {
      applyIdentityGrants({ source: "species", skillGrants: [], skillAdvantages: [] });
    } else {
      applyIdentityGrants({ source: "background", skillGrants: [] });
    }

    let cancelled = false;
    setIdentityDetailLoading(true);
    setIdentityDetail(null);

    let load: Promise<Species | import("@/shared/types").Background | import("@/shared/types").DndRace | import("@/shared/types").DndBackground | null | undefined>;
    if (isSpeciesSlot) {
      load = identitySource === "dnd"
        ? getDndRaceById(selectedIdentity.id)
        : getSpeciesById(selectedIdentity.id);
    } else {
      load = identitySource === "dnd"
        ? getDndBackgroundById(selectedIdentity.id)
        : getBackgroundById(selectedIdentity.id);
    }

    load
      .then((data) => {
        if (cancelled || !data) return;
        setIdentityDetail(data as Species | import("@/shared/types").Background);

        // Apply grants to builder context
        if ("skillGrants" in data && data.skillGrants) {
          if (isSpeciesSlot) {
            applyIdentityGrants({
              source: "species",
              skillGrants: data.skillGrants,
              skillAdvantages: "skillAdvantages" in data ? data.skillAdvantages : [],
            });
          } else {
            applyIdentityGrants({
              source: "background",
              skillGrants: data.skillGrants,
            });
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIdentityDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    selectedIdentity?.id,
    isSpeciesSlot,
    isBackgroundSlot,
    identitySource,
    applyIdentityGrants,
  ]);

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
    const ref = { id, name };
    if (isSpeciesSlot) setSpecies(ref);
    else if (isBackgroundSlot) setBackground(ref);
  }

  function handleSelectClass(id: string, name: string) {
    setClass({ id, name });
  }

  function handleSelectSubclass(id: string, name: string) {
    setSubclass({ id, name });
  }

  function handleSelectFeat(selection: BuilderFeatSelection) {
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

  function handleUpdateAsiChoices(
    choices: NonNullable<BuilderFeatSelection["asiChoices"]>,
  ) {
    if (featSlotIndex === null || !selectedFeat) return;
    setFeatAtIndex(featSlotIndex, { ...selectedFeat, asiChoices: choices });
  }

  const showIdentitySourceToggle = isSpeciesSlot || isBackgroundSlot;
  const showFeatSourceToggle = isFeatSlot && !showAsiPanel;

  const slotLabel = useMemo(() => {
    if (!selectedSlot) return "Library";
    if (isFeatSlotSelection(selectedSlot)) {
      return `Feat ${featSlotIndex !== null ? featSlotIndex + 1 : ""}`.trim();
    }
    return SLOT_LABELS[selectedSlot] ?? selectedSlot;
  }, [selectedSlot, featSlotIndex]);

  const panelTitle = selectedSlot ? (
    <span className="flex min-w-0 flex-wrap items-center gap-2">
      <span>
        {showAsiPanel ? "ASI" : `Library — ${slotLabel}`}
      </span>
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

          <div className="max-h-[min(480px,calc(100dvh-14rem))] space-y-1 overflow-y-auto overscroll-y-contain pr-1">
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
                  <IdentityLibraryDetail species={identityDetail} />
                ) : isBackgroundSlot && isLoadedBackground(identityDetail) ? (
                  <IdentityLibraryDetail background={identityDetail} />
                ) : (
                  <EmptyState text="No se encontró la información." />
                )
              ) : (
                <IdentityList
                  loading={identityLoading}
                  options={identityFiltered}
                  selectedId={selectedIdentity?.id ?? null}
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
                  />
                ) : (
                  <EmptyState text="No se encontró la información." />
                )
              ) : (
                <IdentityList
                  loading={classLoading}
                  options={classFiltered}
                  selectedId={classSelection?.id ?? null}
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
                />
              ) : (
                <IdentityList
                  loading={classDetailLoading}
                  options={subclassFiltered}
                  selectedId={subclass?.id ?? null}
                  icon={
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  }
                  onSelect={handleSelectSubclass}
                />
              ))}

            {isFeatSlot &&
              (showAsiPanel && selectedFeat ? (
                <AsiLibraryPanel
                  choices={selectedFeat.asiChoices ?? { ...DEFAULT_ASI_CHOICES }}
                  onChange={handleUpdateAsiChoices}
                  onBack={() => setShowFeatList(true)}
                />
              ) : featsLoading ? (
                <EmptyState text="Cargando feats…" />
              ) : (
                <FeatList
                  options={featOptions}
                  selectedId={selectedFeat?.id ?? null}
                  onSelect={handleSelectFeat}
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
      {inventory.length > 0 && (
        <SectionLabel>Inventario</SectionLabel>
      )}
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
      {inventory.length > 0 && (
        <SectionLabel>Inventario</SectionLabel>
      )}
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

function IdentityList({
  loading,
  options,
  selectedId,
  icon,
  onSelect,
}: {
  loading: boolean;
  options: Array<{ id: string; name: string }>;
  selectedId: string | null;
  icon: React.ReactNode;
  onSelect: (id: string, name: string) => void;
}) {
  if (loading) return <EmptyState text="Cargando…" />;
  if (options.length === 0) return <EmptyState text="No results." />;

  return (
    <>
      {options.map((o) => (
        <ItemRow
          key={o.id}
          icon={icon}
          name={o.name}
          stats=""
          equipped={selectedId === o.id}
          onClick={() => onSelect(o.id, o.name)}
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
}: {
  subclass: Subclass;
  level: number;
}) {
  const rowsWithFeatures = subclass.progression.filter(
    (row) => row.level <= level && row.features.length > 0,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-foreground">{subclass.name}</h3>
        <span className="text-[10px] text-muted-foreground">
          {subclass.source}
        </span>
      </div>
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
  onSelect,
}: {
  options: BuilderFeatSelection[];
  selectedId: string | null;
  onSelect: (selection: BuilderFeatSelection) => void;
}) {
  if (options.length === 0) {
    return <EmptyState text="No feats available." />;
  }

  return (
    <>
      {options.map((feat) => (
        <ItemRow
          key={`${feat.source}-${feat.id}`}
          icon={
            <Award
              className={cn(
                "h-3.5 w-3.5",
                isAsiFeatSelection(feat)
                  ? "text-amber-400"
                  : "text-rose-400",
              )}
            />
          }
          name={feat.name}
          stats={
            isAsiFeatSelection(feat)
              ? "Mejora 2 puntos de habilidad o elige un feat"
              : ""
          }
          equipped={selectedId === feat.id}
          onClick={() => onSelect(feat)}
        />
      ))}
    </>
  );
}

function ItemRow({
  icon,
  name,
  stats,
  rarity,
  equipped = false,
  onClick,
}: {
  icon: React.ReactNode;
  name: string;
  stats: string;
  rarity?: string;
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
      {rarity && RARITY_BADGE[rarity] && (
        <span
          className={cn(
            "ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
            RARITY_BADGE[rarity],
          )}
        >
          {rarity}
        </span>
      )}
    </button>
  );
}
