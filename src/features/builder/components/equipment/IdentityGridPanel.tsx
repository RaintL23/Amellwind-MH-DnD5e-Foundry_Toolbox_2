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
  CharacterSelectionRef,
} from "@/shared/types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
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
import { resolveOptionalFeatureProgressions } from "../../utils/class-optional-features.utils";
import type { Class } from "@/shared/types";
import type { BuilderOptionalFeatureSelections } from "@/shared/types";
import type { OptionalFeatureOriginFeatSlot } from "../../utils/optional-feature-feat-grants.utils";
import { OptionalFeatureGridPanel } from "./OptionalFeatureGridPanel";

interface IdentityGridPanelProps {
  species: CharacterSelectionRef | null;
  background: CharacterSelectionRef | null;
  faction: import("@/shared/types/background.types").BackgroundFaction | null;
  classSelection: CharacterSelectionRef | null;
  subclass: CharacterSelectionRef | null;
  classData: Class | null;
  subclassData: import("@/shared/types").Subclass | null;
  level: number;
  featSelections: (BuilderFeatSelection | null)[];
  optionalFeatureSelections: BuilderOptionalFeatureSelections;
  speciesOriginFeatGrant: OriginFeatGrant | null;
  speciesOriginFeat: BuilderFeatSelection | null;
  backgroundOriginFeatGrant: OriginFeatGrant | null;
  backgroundOriginFeat: BuilderFeatSelection | null;
  optionalFeatureOriginFeatSlots: OptionalFeatureOriginFeatSlot[];
  optionalFeatureOriginFeats: (BuilderFeatSelection | null)[];
  backstoryNotes: string;
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
  featSelections,
  optionalFeatureSelections,
  speciesOriginFeatGrant,
  speciesOriginFeat,
  backgroundOriginFeatGrant,
  backgroundOriginFeat,
  optionalFeatureOriginFeatSlots,
  optionalFeatureOriginFeats,
  backstoryNotes,
  selectedSlot,
  onSelectSlot,
  onUnequipSlot,
}: IdentityGridPanelProps) {
  const hasBackstory = backstoryNotes.trim().length > 0;
  const showSubclass = isSubclassLevelReached(classData, level);
  const featSlotLevels = getFeatSlotLevels(classSelection?.name ?? "", level);
  const subclassLabel = classData?.subclassTitle ?? "Subclass";
  const showOriginFeat = !!(
    speciesOriginFeatGrant || backgroundOriginFeatGrant
  );
  const originFeatCanChange = speciesOriginFeatGrant?.kind === "choose";
  const originFeatEquipped = speciesOriginFeat
    ? {
        name: speciesOriginFeat.name,
        detail:
          speciesOriginFeat.source === "dnd2024"
            ? "D&D 2024"
            : speciesOriginFeat.source === "dnd2014"
              ? "D&D 2014"
              : "Species",
      }
    : backgroundOriginFeat
      ? {
          name: backgroundOriginFeat.name,
          detail: "Background",
        }
      : speciesOriginFeatGrant?.kind === "fixed"
        ? {
            name:
              speciesOriginFeatGrant.featRefs[0]?.displayLabel ??
              speciesOriginFeatGrant.summary,
            detail: "Species",
          }
        : backgroundOriginFeatGrant?.kind === "fixed"
          ? {
              name:
                backgroundOriginFeatGrant.featRefs[0]?.displayLabel ??
                backgroundOriginFeatGrant.summary,
              detail: "Background",
            }
          : null;

  const optionalProgressions = resolveOptionalFeatureProgressions(
    classData,
    subclassData,
    level,
  );

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-5 gap-1.5">
        <GridElementSlot
          label="Specie"
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
        <GridElementSlot
          label="Background"
          icon={<ScrollText className="h-5 w-5 text-violet-400" />}
          equipped={background ? { name: background.name } : null}
          onClickEquip={() => onSelectSlot("background")}
          onClickDetails={() => onSelectSlot("background")}
          onUnequip={background ? () => onUnequipSlot("background") : undefined}
          isSelected={selectedSlot === "background"}
        />
        <GridElementSlot
          label="Faction"
          icon={<Shield className="h-5 w-5 text-emerald-400" />}
          equipped={
            faction
              ? { name: BACKGROUND_FACTION_LABELS[faction] }
              : null
          }
          onClickEquip={() => onSelectSlot("faction")}
          onClickDetails={() => onSelectSlot("faction")}
          onUnequip={faction ? () => onUnequipSlot("faction") : undefined}
          isSelected={selectedSlot === "faction"}
          emptyTitle="Elegir facción de Amellwind"
        />
        <GridElementSlot
          label="Backstory"
          icon={<Book className="h-5 w-5 text-blue-400" />}
          equipped={hasBackstory ? { name: "Backstory" } : null}
          onClickEquip={() => onSelectSlot("backstory")}
          onClickDetails={() => onSelectSlot("backstory")}
          isSelected={selectedSlot === "backstory"}
          emptyTitle="Escribir backstory"
        />
        <GridElementSlot
          label="Class"
          icon={<GraduationCap className="h-5 w-5 text-amber-400" />}
          equipped={classSelection ? { name: classSelection.name } : null}
          onClickEquip={() => onSelectSlot("class")}
          onClickDetails={() => onSelectSlot("class")}
          onUnequip={classSelection ? () => onUnequipSlot("class") : undefined}
          isSelected={selectedSlot === "class"}
        />
        {showSubclass ? (
          <GridElementSlot
            label={subclassLabel}
            icon={<Sparkles className="h-5 w-5 text-emerald-400" />}
            equipped={subclass ? { name: subclass.name } : null}
            onClickEquip={() => onSelectSlot("subclass")}
            onClickDetails={() => onSelectSlot("subclass")}
            onUnequip={subclass ? () => onUnequipSlot("subclass") : undefined}
            isSelected={selectedSlot === "subclass"}
            disabled={!classSelection}
            disabledHint={
              !classSelection ? "Elige una clase primero" : undefined
            }
          />
        ) : (
          <div
            aria-hidden
            className="min-h-[72px] rounded-md border border-dashed border-transparent"
          />
        )}
        {optionalProgressions.length > 0 && (
          <OptionalFeatureGridPanel
            progressions={optionalProgressions}
            selections={optionalFeatureSelections}
            selectedSlot={selectedSlot}
            onSelectSlot={onSelectSlot}
            onUnequipSlot={onUnequipSlot}
          />
        )}
      </div>

      {(showOriginFeat ||
        optionalFeatureOriginFeatSlots.length > 0 ||
        featSlotLevels.length > 0) && (
        <div className="grid grid-cols-5 gap-1.5">
          {showOriginFeat && (
            <GridElementSlot
              label="Origin Feat"
              icon={<Award className="h-5 w-5 text-emerald-400" />}
              equipped={originFeatEquipped}
              onClickEquip={() => onSelectSlot("origin-feat")}
              onClickDetails={() => onSelectSlot("origin-feat")}
              onUnequip={
                originFeatCanChange && speciesOriginFeat
                  ? () => onUnequipSlot("origin-feat")
                  : undefined
              }
              isSelected={selectedSlot === "origin-feat"}
              disabled={!species && !background}
              disabledHint={
                !species && !background
                  ? "Elige specie o background primero"
                  : undefined
              }
              emptyTitle="Elegir Origin Feat"
            />
          )}
          {optionalFeatureOriginFeatSlots.map((slotMeta) => {
            const slotId = toOptionalOriginFeatSlot(slotMeta.slotIndex);
            const feat = optionalFeatureOriginFeats[slotMeta.slotIndex] ?? null;
            return (
              <GridElementSlot
                key={slotId}
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
                onUnequip={
                  feat ? () => onUnequipSlot(slotId) : undefined
                }
                isSelected={selectedSlot === slotId}
                emptyTitle={`Elegir Origin Feat (${slotMeta.sourceFeatureName})`}
              />
            );
          })}
          {featSlotLevels.map((featLevel, index) => {
            const feat = featSelections[index] ?? null;
            const slot = toFeatSlot(index);
            return (
              <GridElementSlot
                key={slot}
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
                disabledHint={
                  !classSelection ? "Elige una clase primero" : undefined
                }
                emptyTitle={`Elegir feat (nivel ${featLevel})`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
