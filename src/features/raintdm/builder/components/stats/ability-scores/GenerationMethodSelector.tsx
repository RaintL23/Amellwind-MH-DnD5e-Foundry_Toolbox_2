import { Select } from "@/components/ui/select";
import type { GenerationMethod } from "./constants";

type GenerationMethodSelectorProps = {
  compact: boolean;
  method: GenerationMethod;
  onMethodChange: (method: GenerationMethod) => void;
  /** Simple mode: only Standard Array and Point Buy (plus the method in use). */
  simple?: boolean;
};

const METHOD_OPTIONS: ReadonlyArray<{
  value: GenerationMethod;
  label: string;
  compactLabel: string;
  advanced?: boolean;
}> = [
  {
    value: "standard",
    label: "Standard Array (15, 14, 13, 12, 10, 8)",
    compactLabel: "Standard Array (15, 14, 13, 12, 10, 8)",
  },
  {
    value: "pointbuy",
    label: "Point Buy (27 pts, max 15)",
    compactLabel: "Point buy",
  },
  { value: "manual", label: "Manual", compactLabel: "Manual", advanced: true },
  {
    value: "dice",
    label: "Roll Dice (4d6 drop lowest)",
    compactLabel: "Roll Dice (4d6 drop lowest)",
    advanced: true,
  },
];

const METHOD_SELECT_ID = "ability-score-method";

export function GenerationMethodSelector({
  compact,
  method,
  onMethodChange,
  simple = false,
}: GenerationMethodSelectorProps) {
  const options = METHOD_OPTIONS.filter(
    (option) => !simple || !option.advanced || option.value === method,
  );
  const renderOptions = () =>
    options.map((option) => (
      <option key={option.value} value={option.value}>
        {compact ? option.compactLabel : option.label}
      </option>
    ));

  if (!compact) {
    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={METHOD_SELECT_ID}
          className="text-xs text-muted-foreground font-medium"
        >
          Ability Scores
        </label>
        <Select
          id={METHOD_SELECT_ID}
          value={method}
          onChange={(e) =>
            onMethodChange(e.target.value as GenerationMethod)
          }
          className="h-8 text-xs"
        >
          {renderOptions()}
        </Select>
      </div>
    );
  }

  return (
    <Select
      id={METHOD_SELECT_ID}
      value={method}
      onChange={(e) => onMethodChange(e.target.value as GenerationMethod)}
      className="mb-2 h-7 w-full text-[12px]"
      aria-label="Ability score method"
    >
      {renderOptions()}
    </Select>
  );
}
