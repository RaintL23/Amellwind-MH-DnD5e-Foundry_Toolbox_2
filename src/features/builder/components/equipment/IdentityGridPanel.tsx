import {
  Award,
  Book,
  GraduationCap,
  ScrollText,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { BACKGROUND_FACTION_LABELS } from "@/shared/types";
import type {
  BuilderFeatSelection,
  BuilderMulticlassEntry,
  CharacterSelectionRef,
} from "@/shared/types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { BuilderSlotGrid } from "../shared/BuilderSlotGrid";
import { GridElementSlot } from "../shared/GridElementSlot";
import type { BuilderSlotSelection } from "../../hooks/useBuilderSlotSelection";
import {
  formatAsiChoicesSummary,
  getFeatSlotLevels,
  isAsiFeatSelection,
  isSubclassLevelReached,
  toFeatSlot,
  toOptionalOriginFeatSlot,
} from "../../utils/builder-class.utils";
import {
  buildClassLevelEntries,
  getFeatSlotLevelsForBuild,
  toMulticlassClassSlot,
  toMulticlassSubclassSlot,
} from "../../utils/multiclass.utils";
import { resolveOptionalFeatureProgressions } from "../../utils/class-optional-features.utils";
import { hasOriginFeatChooseGrant } from "../../utils/origin-feat.constants";
import type { Class } from "@/shared/types";
import type { BuilderOptionalFeatureSelections } from "@/shared/types";
import type { OptionalFeatureOriginFeatSlot } from "../../utils/optional-feature-feat-grants.utils";
import { OptionalFeatureGridPanel } from "./OptionalFeatureGridPanel";
import { useSlotCompletenessHighlight } from "../../context/BuildCompletenessContext";
import type { ComponentProps } from "react";

function HighlightedGridSlot({
  highlightKey,
  ...props
}: ComponentProps<typeof GridElementSlot> & { highlightKey: string }) {
  const { highlighted } = useSlotCompletenessHighlight(highlightKey);
  return <GridElementSlot {...props} highlighted={highlighted} />;
}

interface IdentityGridPanelProps {
  species: CharacterSelectionRef | null;
  background: CharacterSelectionRef | null;
  faction: import("@/shared/types/background.types").BackgroundFaction | null;
  classSelection: CharacterSelectionRef | null;
  subclass: CharacterSelectionRef | null;
  classData: Class | null;
  subclassData: import("@/shared/types").Subclass | null;
  level: number;
  primaryClassLevel: number;
  multiclassEnabled: boolean;
  multiclassEntries: BuilderMulticlassEntry[];
  multiclassClassData: (Class | null)[];
  featSelections: (BuilderFeatSelection | null)[];
  optionalFeatureSelections: BuilderOptionalFeatureSelections;
  speciesOriginFeatGrant: OriginFeatGrant | null;
  speciesOriginFeat: BuilderFeatSelection | null;
  backgroundOriginFeatGrant: OriginFeatGrant | null;
  backgroundOriginFeat: BuilderFeatSelection | null;
  optionalFeatureOriginFeatSlots: OptionalFeatureOriginFeatSlot[];
  optionalFeatureOriginFeats: (BuilderFeatSelection | null)[];
  backstoryNotes: string;
  showFaction?: boolean;
  selectedSlot: BuilderSlotSelection;
  onSelectSlot: (slot: BuilderSlotSelection) => void;
  onUnequipSlot: (slot: BuilderSlotSelection) => void;
}

export function IdentityGridPanel({
  species,
  background,
  faction,
  classSelection,
  subclass,
  classData,
  subclassData,
  level,
  primaryClassLevel,
  multiclassEnabled,
  multiclassEntries,
  multiclassClassData,
  featSelections,
  optionalFeatureSelections,
  speciesOriginFeatGrant,
  speciesOriginFeat,
  backgroundOriginFeatGrant,
  backgroundOriginFeat,
  optionalFeatureOriginFeatSlots,
  optionalFeatureOriginFeats,
  backstoryNotes,
  showFaction = true,
  selectedSlot,
  onSelectSlot,
  onUnequipSlot,
}: IdentityGridPanelProps) {
  const hasBackstory = backstoryNotes.trim().length > 0;
  const showSubclass = isSubclassLevelReached(classData, primaryClassLevel);
  const classEntries = buildClassLevelEntries(
    classSelection,
    classData,
    primaryClassLevel,
    subclass,
    multiclassEntries,
    multiclassClassData,
  );
  const featSlotLevels = multiclassEnabled
    ? getFeatSlotLevelsForBuild(classEntries, level)
    : getFeatSlotLevels(classSelection?.name ?? "", level);
  const subclassLabel = classData?.subclassTitle ?? "Subclass";
  const showOriginFeat = !!(
    speciesOriginFeatGrant || backgroundOriginFeatGrant
  );
  const originFeatCanChange = hasOriginFeatChooseGrant(
    speciesOriginFeatGrant,
    backgroundOriginFeatGrant,
  );
  const originFeatEquipped = speciesOriginFeat
    ? {
        name: "Origin Feat: " + speciesOriginFeat.name,
        detail:
          speciesOriginFeat.source === "dnd2024"
            ? "D&D 2024"
            : speciesOriginFeat.source === "dnd2014"
              ? "D&D 2014"
              : "Species",
      }
    : backgroundOriginFeat
      ? {
          name: "Origin Feat: " + backgroundOriginFeat.name,
          detail:
            backgroundOriginFeat.source === "dnd2024"
              ? "D&D 2024"
              : backgroundOriginFeat.source === "dnd2014"
                ? "D&D 2014"
                : "Background",
        }
      : speciesOriginFeatGrant?.kind === "fixed"
        ? {
            name:
              "Origin Feat: " +
              (speciesOriginFeatGrant.featRefs[0]?.displayLabel ?? "") +
              speciesOriginFeatGrant.summary,
            detail: "Species",
          }
        : backgroundOriginFeatGrant?.kind === "fixed"
          ? {
              name:
                "Origin Feat: " +
                (backgroundOriginFeatGrant.featRefs[0]?.displayLabel ?? "") +
                backgroundOriginFeatGrant.summary,
              detail: "Background",
            }
          : null;

  const optionalProgressions = resolveOptionalFeatureProgressions(
    classData,
    subclassData,
    primaryClassLevel,
  );

  return (
    <BuilderSlotGrid>
      <HighlightedGridSlot
        highlightKey="species"
        label="Species"
        icon={<Users className="h-5 w-5 text-sky-400" />}
        equipped={
          species
            ? {
                name: species.subraceName
                  ? `${species.name} (${species.subraceName})`
                  : species.name,
              }
            : null
        }
        onClickEquip={() => onSelectSlot("species")}
        onClickDetails={() => onSelectSlot("species")}
        onUnequip={species ? () => onUnequipSlot("species") : undefined}
        isSelected={selectedSlot === "species"}
      />
      <HighlightedGridSlot
        highlightKey="background"
        label="Background"
        icon={<ScrollText className="h-5 w-5 text-violet-400" />}
        equipped={
          background ? { name: "Background: " + background.name } : null
        }
        onClickEquip={() => onSelectSlot("background")}
        onClickDetails={() => onSelectSlot("background")}
        onUnequip={background ? () => onUnequipSlot("background") : undefined}
        isSelected={selectedSlot === "background"}
      />
      {showFaction && (
        <GridElementSlot
          label="Faction"
          icon={<Shield className="h-5 w-5 text-emerald-400" />}
          equipped={
            faction
              ? { name: "Faction: " + BACKGROUND_FACTION_LABELS[faction] }
              : null
          }
          onClickEquip={() => onSelectSlot("faction")}
          onClickDetails={() => onSelectSlot("faction")}
          onUnequip={faction ? () => onUnequipSlot("faction") : undefined}
          isSelected={selectedSlot === "faction"}
          emptyTitle="Choose Amellwind faction"
        />
      )}
      <GridElementSlot
        label="Backstory"
        icon={<Book className="h-5 w-5 text-blue-400" />}
        equipped={hasBackstory ? { name: "Backstory" } : null}
        onClickEquip={() => onSelectSlot("backstory")}
        onClickDetails={() => onSelectSlot("backstory")}
        isSelected={selectedSlot === "backstory"}
        emptyTitle="Write backstory"
      />
      <HighlightedGridSlot
        highlightKey="class"
        label={multiclassEnabled ? "Class 1" : "Class"}
        icon={<GraduationCap className="h-5 w-5 text-amber-400" />}
        equipped={
          classSelection
            ? {
                name: multiclassEnabled
                  ? `${classSelection.name} (${primaryClassLevel})`
                  : classSelection.name,
              }
            : null
        }
        onClickEquip={() => onSelectSlot("class")}
        onClickDetails={() => onSelectSlot("class")}
        onUnequip={classSelection ? () => onUnequipSlot("class") : undefined}
        isSelected={selectedSlot === "class"}
      />
      {multiclassEnabled &&
        multiclassEntries.map((entry, index) => {
          const classSlot = toMulticlassClassSlot(index);
          const subclassSlot = toMulticlassSubclassSlot(index);
          const entryClassData = multiclassClassData[index] ?? null;
          const showEntrySubclass =
            entry.classRef &&
            entryClassData &&
            isSubclassLevelReached(entryClassData, entry.level);

          return (
            <div key={classSlot} className="contents">
              <HighlightedGridSlot
                highlightKey={classSlot}
                label={`Class ${index + 2}`}
                icon={<GraduationCap className="h-5 w-5 text-orange-400" />}
                equipped={
                  entry.classRef
                    ? {
                        name: `${entry.classRef.name} (${entry.level})`,
                      }
                    : null
                }
                onClickEquip={() => onSelectSlot(classSlot)}
                onClickDetails={() => onSelectSlot(classSlot)}
                onUnequip={
                  entry.classRef ? () => onUnequipSlot(classSlot) : undefined
                }
                isSelected={selectedSlot === classSlot}
                emptyTitle="Choose additional class"
              />
              {showEntrySubclass && (
                <HighlightedGridSlot
                  highlightKey={subclassSlot}
                  label={entryClassData?.subclassTitle ?? "Subclass"}
                  icon={<Sparkles className="h-5 w-5 text-teal-400" />}
                  equipped={
                    entry.subclass ? { name: entry.subclass.name } : null
                  }
                  onClickEquip={() => onSelectSlot(subclassSlot)}
                  onClickDetails={() => onSelectSlot(subclassSlot)}
                  onUnequip={
                    entry.subclass
                      ? () => onUnequipSlot(subclassSlot)
                      : undefined
                  }
                  isSelected={selectedSlot === subclassSlot}
                  disabled={!entry.classRef}
                />
              )}
            </div>
          );
        })}
      {showSubclass && (
        <HighlightedGridSlot
          highlightKey="subclass"
          label={subclassLabel}
          icon={<Sparkles className="h-5 w-5 text-emerald-400" />}
          equipped={subclass ? { name: subclass.name } : null}
          onClickEquip={() => onSelectSlot("subclass")}
          onClickDetails={() => onSelectSlot("subclass")}
          onUnequip={subclass ? () => onUnequipSlot("subclass") : undefined}
          isSelected={selectedSlot === "subclass"}
          disabled={!classSelection}
          disabledHint={!classSelection ? "Elige una clase primero" : undefined}
        />
      )}
      <OptionalFeatureGridPanel
        progressions={optionalProgressions}
        selections={optionalFeatureSelections}
        selectedSlot={selectedSlot}
        onSelectSlot={onSelectSlot}
        onUnequipSlot={onUnequipSlot}
      />
      {showOriginFeat && (
        <HighlightedGridSlot
          highlightKey="origin-feat"
          label="Origin Feat"
          icon={<Award className="h-5 w-5 text-emerald-400" />}
          equipped={originFeatEquipped}
          onClickEquip={() => onSelectSlot("origin-feat")}
          onClickDetails={() => onSelectSlot("origin-feat")}
          onUnequip={
            originFeatCanChange && (speciesOriginFeat || backgroundOriginFeat)
              ? () => onUnequipSlot("origin-feat")
              : undefined
          }
          isSelected={selectedSlot === "origin-feat"}
          disabled={!species && !background}
          disabledHint={
            !species && !background
              ? "Choose species or background first"
              : undefined
          }
          emptyTitle="Choose Origin Feat"
        />
      )}
      {optionalFeatureOriginFeatSlots.map((slotMeta) => {
        const slotId = toOptionalOriginFeatSlot(slotMeta.slotIndex);
        const feat = optionalFeatureOriginFeats[slotMeta.slotIndex] ?? null;
        return (
          <HighlightedGridSlot
            key={slotId}
            highlightKey={slotId}
            label="Origin Feat"
            icon={<Award className="h-5 w-5 text-teal-400" />}
            equipped={
              feat
                ? {
                    name: feat.name,
                    detail: slotMeta.sourceFeatureName,
                  }
                : null
            }
            onClickEquip={() => onSelectSlot(slotId)}
            onClickDetails={() => onSelectSlot(slotId)}
            onUnequip={feat ? () => onUnequipSlot(slotId) : undefined}
            isSelected={selectedSlot === slotId}
            emptyTitle={`Choose Origin Feat (${slotMeta.sourceFeatureName})`}
          />
        );
      })}
      {featSlotLevels.map((featLevel, index) => {
        const feat = featSelections[index] ?? null;
        const slot = toFeatSlot(index);
        return (
          <HighlightedGridSlot
            key={slot}
            highlightKey={slot}
            label={`Feat (Lv ${featLevel})`}
            icon={<Award className="h-5 w-5 text-rose-400" />}
            equipped={
              feat
                ? {
                    name: feat.name,
                    detail: isAsiFeatSelection(feat)
                      ? formatAsiChoicesSummary(feat.asiChoices)
                      : feat.source === "amellwind"
                        ? "Amellwind"
                        : feat.source === "dnd2024"
                          ? "D&D 2024"
                          : "D&D 2014",
                  }
                : null
            }
            onClickEquip={() => onSelectSlot(slot)}
            onClickDetails={() => onSelectSlot(slot)}
            onUnequip={feat ? () => onUnequipSlot(slot) : undefined}
            isSelected={selectedSlot === slot}
            disabled={!classSelection}
            disabledHint={!classSelection ? "Choose a class first" : undefined}
            emptyTitle={`Choose feat (level ${featLevel})`}
          />
        );
      })}
    </BuilderSlotGrid>
  );
}
