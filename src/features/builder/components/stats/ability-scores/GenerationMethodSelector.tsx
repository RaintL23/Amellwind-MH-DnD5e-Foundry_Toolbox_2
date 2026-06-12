import { Select } from "@/components/ui/select";
import type { GenerationMethod } from "./constants";

type GenerationMethodSelectorProps = {
  compact: boolean;
  method: GenerationMethod;
  onMethodChange: (method: GenerationMethod) => void;
};

export function GenerationMethodSelector({
  compact,
  method,
  onMethodChange,
}: GenerationMethodSelectorProps) {
  if (!compact) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground font-medium">
          Ability Scores
        </label>
        <Select
          value={method}
          onChange={(e) =>
            onMethodChange(e.target.value as GenerationMethod)
          }
          className="h-8 text-xs"
        >
          <option value="manual">Manual</option>
          <option value="standard">
            Standard Array (15, 14, 13, 12, 10, 8)
          </option>
          <option value="pointbuy">Point Buy (27 pts, max 15)</option>
          <option value="dice">Roll Dice (4d6 drop lowest)</option>
        </Select>
      </div>
    );
  }

  return (
    <Select
      value={method}
      onChange={(e) => onMethodChange(e.target.value as GenerationMethod)}
      className="mb-2 h-7 w-full text-[12px]"
    >
      <option value="manual">Manual</option>
      <option value="standard">Standard Array (15, 14, 13, 12, 10, 8)</option>
      <option value="pointbuy">Point buy</option>
      <option value="dice">Roll Dice (4d6 drop lowest)</option>
    </Select>
  );
}
