import { Users, ScrollText, GraduationCap } from "lucide-react";
import { EquipmentSlot } from "../EquipmentSlot";
import { CharacterSelectionRef } from "@/shared/types";
import type { PaperDollSelection } from "../../hooks/usePaperDollSelection";

interface IdentityColumnProps {
  species: CharacterSelectionRef | null;
  background: CharacterSelectionRef | null;
  selectedSlot: PaperDollSelection;
  onPickSpecies: () => void;
  onPickBackground: () => void;
  onSelectSpecies: () => void;
  onSelectBackground: () => void;
}

export function IdentityColumn({
  species,
  background,
  selectedSlot,
  onPickSpecies,
  onPickBackground,
  onSelectSpecies,
  onSelectBackground,
}: IdentityColumnProps) {
  return (
    <div className="flex flex-col gap-3 shrink-0 w-20">
      <EquipmentSlot
        label="Specie"
        icon={<Users className="h-4 w-4 text-sky-400" />}
        equipped={species ? { name: species.name } : null}
        onClickEquip={onPickSpecies}
        onClickDetails={onSelectSpecies}
        isSelected={selectedSlot === "species"}
      />
      <EquipmentSlot
        label="Background"
        icon={<ScrollText className="h-4 w-4 text-violet-400" />}
        equipped={background ? { name: background.name } : null}
        onClickEquip={onPickBackground}
        onClickDetails={onSelectBackground}
        isSelected={selectedSlot === "background"}
      />
      <EquipmentSlot
        label="Class"
        icon={<GraduationCap className="h-4 w-4" />}
        equipped={null}
        onClickEquip={() => {}}
        onClickDetails={() => {}}
        isSelected={false}
        disabled
        disabledHint="Próximamente"
      />
    </div>
  );
}
