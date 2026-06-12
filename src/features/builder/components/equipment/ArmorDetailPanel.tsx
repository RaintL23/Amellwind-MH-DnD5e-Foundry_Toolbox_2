import { EquippedArmor } from "@/shared/types";
import { RarityButtonGroup } from "../shared/RarityButtonGroup";

interface ArmorDetailPanelProps {
  armor: EquippedArmor;
  showHomebrewDetails?: boolean;
  onRarityChange: (rarity: string) => void;
}

export function ArmorDetailPanel({
  armor,
  showHomebrewDetails = true,
  onRarityChange,
}: ArmorDetailPanelProps) {
  if (!showHomebrewDetails) return null;

  return (
    <div className="w-full rounded-md border border-border bg-background/50 p-3 space-y-2">
      <RarityButtonGroup value={armor.rarity} onChange={onRarityChange} />
    </div>
  );
}
