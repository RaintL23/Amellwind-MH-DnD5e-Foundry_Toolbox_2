import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/shared/components/NumberStepper";
import { formatDamageTypeLabel } from "@/shared/utils/defense-grant.parser";
import type { DamageType } from "@/shared/types";
import {
  ALL_DAMAGE_TYPES,
  COMMON_DICE_SIDES,
} from "../utils/damage-math.utils";
import { getCalculatorLabels } from "../utils/calculator-labels";
import type {
  CalculatorMode,
  DiceGroup,
  FlatBonus,
} from "../types/damage-calculator.types";

interface DiceEditorProps {
  groups: DiceGroup[];
  flatBonuses: FlatBonus[];
  disabled?: boolean;
  mode?: CalculatorMode;
  onFlatBonusChange: (bonusId: string, patch: Partial<FlatBonus>) => void;
  onAddFlatBonus: () => void;
  onRemoveFlatBonus: (bonusId: string) => void;
  onDiceChange: (diceId: string, patch: Partial<DiceGroup>) => void;
  onAddDice: (sides: number) => void;
  onRemoveDice: (diceId: string) => void;
}

export function DiceEditor({
  groups,
  flatBonuses,
  disabled = false,
  mode = "damage",
  onFlatBonusChange,
  onAddFlatBonus,
  onRemoveFlatBonus,
  onDiceChange,
  onAddDice,
  onRemoveDice,
}: DiceEditorProps) {
  const labels = getCalculatorLabels(mode);

  return (
    <div className="space-y-2">
      {!disabled && (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {labels.addDice}
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
          {mode === "damage" && (
            <DamageTypeSelect
              value={group.damageType}
              disabled={disabled}
              typeLabel={labels.typeOptional}
              onChange={(damageType) =>
                onDiceChange(group.id, { damageType: damageType || undefined })
              }
            />
          )}
          <Input
            value={group.comment ?? ""}
            disabled={disabled}
            placeholder="Comment"
            className="h-7 min-w-[100px] flex-1 text-xs"
            onChange={(e) =>
              onDiceChange(group.id, { comment: e.target.value })
            }
          />
          {groups.length > 1 && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveDice(group.id)}
              aria-label="Remove dice group"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {labels.bonusFlat}
        </span>
        {!disabled && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-xs"
            onClick={onAddFlatBonus}
          >
            <Plus className="h-3 w-3" />
            Flat bonus
          </Button>
        )}
        {flatBonuses.map((bonus) => (
          <div
            key={bonus.id}
            className="flex flex-wrap items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-2.5 py-2"
          >
            <NumberStepper
              value={bonus.value}
              min={-20}
              disabled={disabled}
              ariaLabel={labels.flatBonusAria}
              onChange={(value) => onFlatBonusChange(bonus.id, { value })}
            />
            {mode === "damage" && (
              <DamageTypeSelect
                value={bonus.damageType}
                disabled={disabled}
                typeLabel={labels.typeOptional}
                onChange={(damageType) =>
                  onFlatBonusChange(bonus.id, {
                    damageType: damageType || undefined,
                  })
                }
              />
            )}
            <Input
              value={bonus.comment ?? ""}
              disabled={disabled}
              placeholder="Comment"
              className="h-7 min-w-[100px] flex-1 text-xs"
              onChange={(e) =>
                onFlatBonusChange(bonus.id, { comment: e.target.value })
              }
            />
            {flatBonuses.length > 1 && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onRemoveFlatBonus(bonus.id)}
                aria-label="Remove flat bonus"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DamageTypeSelect({
  value,
  disabled,
  typeLabel,
  onChange,
}: {
  value?: DamageType;
  disabled?: boolean;
  typeLabel: string;
  onChange: (type: DamageType | "") => void;
}) {
  return (
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as DamageType | "")}
      className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground disabled:opacity-50"
      aria-label="Damage type"
    >
      <option value="">{typeLabel}</option>
      {ALL_DAMAGE_TYPES.map((type) => (
        <option key={type} value={type}>
          {formatDamageTypeLabel(type)}
        </option>
      ))}
    </select>
  );
}
