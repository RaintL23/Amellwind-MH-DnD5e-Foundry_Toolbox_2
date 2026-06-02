import { Class, Subclass } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { getCasterLabel } from "../../mappers/class.mapper";
import { type ClassVariantField } from "../../utils/class-variant.utils";
import { ClassMetaRow } from "./ClassMetaRow";
import { ClassMetaListSection } from "./ClassMetaListSection";

interface ClassDetailMetaSectionProps {
  active: Class;
  variantSubclasses: Subclass[];
  differs: (field: ClassVariantField) => boolean;
}

export function ClassDetailMetaSection({
  active,
  variantSubclasses,
  differs,
}: ClassDetailMetaSectionProps) {
  const hasSetupInfo =
    active.startingProficiencies.length > 0 ||
    active.startingEquipment.length > 0 ||
    active.multiclassing.length > 0;

  return (
    <div
      className={cn(
        "grid gap-3",
        hasSetupInfo ? "lg:grid-cols-2" : "grid-cols-1",
      )}
    >
      <div className="space-y-1.5 p-3 rounded-md border border-border bg-muted/20">
        <ClassMetaRow
          label="Hit Die"
          value={active.hitDie}
          differs={differs("hitDie")}
        />
        <ClassMetaRow
          label="Spellcasting"
          value={getCasterLabel(active.casterProgression)}
          differs={differs("casterProgression")}
        />
        {active.spellcastingAbility && (
          <ClassMetaRow
            label="Spell Ability"
            value={active.spellcastingAbility}
            differs={differs("spellcastingAbility")}
          />
        )}
        <ClassMetaRow
          label="Saving Throws"
          value={active.proficiencies.join(", ")}
          differs={differs("proficiencies")}
        />
        <ClassMetaRow
          label="Subclasses"
          value={`${variantSubclasses.length} subclass${variantSubclasses.length === 1 ? "" : "es"}`}
          differs={differs("subclassCount")}
        />
        {hasSetupInfo && (
          <ClassMetaListSection
            heading="Multiclassing"
            items={active.multiclassing}
            differs={differs("multiclassing")}
          />
        )}
      </div>

      {hasSetupInfo && (
        <div className="space-y-4 p-3 rounded-md border border-border bg-muted/20">
          <ClassMetaListSection
            heading="Starting Proficiencies"
            items={active.startingProficiencies}
            differs={differs("startingProficiencies")}
          />
          <ClassMetaListSection
            heading="Starting Equipment"
            items={active.startingEquipment}
            differs={differs("startingEquipment")}
          />
        </div>
      )}
    </div>
  );
}
