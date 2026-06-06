import { Book, GraduationCap, ScrollText, Users } from "lucide-react";
import { GridElementSlot } from "../shared/GridElementSlot";
import type { PaperDollSelection } from "../../hooks/usePaperDollSelection";

interface CharacterStuffGridPanelProps {
  species: { name: string } | null;
  background: { name: string } | null;
  selectedSlot: PaperDollSelection;
  onSelectSlot: (slot: PaperDollSelection) => void;
  onUnequipSlot: (slot: PaperDollSelection) => void;
}

export function CharacterStuffGridPanel({
  species,
  background,
  selectedSlot,
  onSelectSlot,
  onUnequipSlot,
}: CharacterStuffGridPanelProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      <GridElementSlot
        label="Specie"
        icon={<Users className="h-5 w-5 text-sky-400" />}
        equipped={species ? { name: species.name } : null}
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
        label="Backstory"
        icon={<Book className="h-5 w-5 text-blue-400" />}
        equipped={null}
        onClickEquip={() => {}}
        onClickDetails={() => {}}
        isSelected={false}
        disabled
      />
      <GridElementSlot
        label="Class"
        icon={<GraduationCap className="h-5 w-5" />}
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
