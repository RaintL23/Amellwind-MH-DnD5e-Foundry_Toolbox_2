import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/features/builder/components/shared/NumberStepper";
import { COMMON_DICE_SIDES } from "../utils/damage-math.utils";
import type { DiceGroup } from "../types/damage-calculator.types";

interface DiceEditorProps {
  groups: DiceGroup[];
  flatBonus: number;
  disabled?: boolean;
  onFlatBonusChange: (value: number) => void;
  onDiceChange: (diceId: string, patch: Partial<DiceGroup>) => void;
  onAddDice: (sides: number) => void;
  onRemoveDice: (diceId: string) => void;
}

export function DiceEditor({
  groups,
  flatBonus,
  disabled = false,
  onFlatBonusChange,
  onDiceChange,
  onAddDice,
  onRemoveDice,
}: DiceEditorProps) {
  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <div
          key={group.id}
          className="flex flex-wrap items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-2.5 py-2"
        >
          <NumberStepper
            value={group.count}
            min={1}
            max={20}
            disabled={disabled}
            ariaLabel="Dice count"
            onChange={(count) => onDiceChange(group.id, { count })}
          />
          <span className="text-sm font-medium text-muted-foreground">d</span>
          <div className="flex gap-1">
            {COMMON_DICE_SIDES.map((sides) => (
              <Button
                key={sides}
                type="button"
                size="sm"
                variant={group.sides === sides ? "default" : "outline"}
                disabled={disabled}
                className="h-7 min-w-9 px-2 text-xs tabular-nums"
                onClick={() => onDiceChange(group.id, { sides })}
              >
                {sides}
              </Button>
            ))}
          </div>
          {groups.length > 1 && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveDice(group.id)}
              aria-label="Remove dice group"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Bonus Damage (Flat)
        </span>
        <NumberStepper
          value={flatBonus}
          min={-20}
          disabled={disabled}
          ariaLabel="Flat damage bonus"
          onChange={onFlatBonusChange}
        />
      </div>

      {!disabled && (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Add damage dice
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => onAddDice(4)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
