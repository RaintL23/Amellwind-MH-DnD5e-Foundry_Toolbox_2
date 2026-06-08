import { Rune } from "@/shared/types";
import { BuildSlotType, useRuneBuild } from "../../context/RuneBuildContext";
import { RuleViolation } from "../../utils/build.validation";
import { BuildSlotRow } from "./BuildSlotRow";
import { BuildViolationList } from "./BuildViolationList";
import { cn } from "@/shared/utils/cn";

interface BuildSectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  runes: (Rune | null)[];
  slotType: BuildSlotType;
  violations: RuleViolation[];
}

export function BuildSection({
  title,
  icon,
  iconColor,
  runes,
  slotType,
  violations,
}: BuildSectionProps) {
  const { removeRune } = useRuneBuild();

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider", iconColor)}>
        {icon}
        {title}
      </div>

      <div className="space-y-1.5">
        {runes.map((rune, i) => (
          <BuildSlotRow
            key={i}
            index={i}
            rune={rune}
            onRemove={() => removeRune(slotType, i)}
          />
        ))}
      </div>

      <BuildViolationList violations={violations} />
    </div>
  );
}
