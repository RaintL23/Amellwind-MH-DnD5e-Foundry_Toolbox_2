import { Crosshair, HeartPulse } from "lucide-react";
import { useDamageCalculator } from "../hooks/useDamageCalculator";
import { getCalculatorLabels } from "../utils/calculator-labels";
import { AttacksPanel } from "./AttacksPanel";
import { WeaponList } from "./WeaponList";
import { WeaponSettingsPanel } from "./WeaponSettingsPanel";

export function DamageCalculatorPage() {
  const {
    weapons,
    selectedWeapon,
    selectedResult,
    weaponResults,
    selectWeapon,
    addWeapon,
    removeWeapon,
    duplicateWeapon,
    updateWeapon,
    updateAttack,
    addAttack,
    removeAttack,
    addDiceGroup,
    updateDiceGroup,
    removeDiceGroup,
    addFlatBonus,
    updateFlatBonus,
    removeFlatBonus,
  } = useDamageCalculator();

  if (!selectedWeapon || !selectedResult) return null;

  const weaponId = selectedWeapon.id;
  const mode = selectedWeapon.mode ?? "damage";
  const labels = getCalculatorLabels(mode);
  const TitleIcon = mode === "healing" ? HeartPulse : Crosshair;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="mb-1 flex items-center gap-3">
          <TitleIcon className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Damage & Healing Calculator
          </h1>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Estimate average and expected {labels.unit} per turn across builds.
          Compare attack rolls, critical hits, healing effects, and saving throw
          outcomes.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
          <WeaponList
            weapons={weapons}
            results={weaponResults}
            selectedId={weaponId}
            onSelect={selectWeapon}
            onAdd={addWeapon}
            onRemove={removeWeapon}
            onDuplicate={duplicateWeapon}
            onRename={(id, name) => updateWeapon(id, { name })}
          />

          <AttacksPanel
            weapon={selectedWeapon}
            results={selectedResult.attacks}
            onAddAttack={() => addAttack(weaponId)}
            onRemoveAttack={(attackId) => removeAttack(weaponId, attackId)}
            onUpdateAttack={(attackId, patch) =>
              updateAttack(weaponId, attackId, patch)
            }
            onAddDice={(attackId, sides) =>
              addDiceGroup(weaponId, attackId, sides)
            }
            onUpdateDice={(attackId, diceId, patch) =>
              updateDiceGroup(weaponId, attackId, diceId, patch)
            }
            onRemoveDice={(attackId, diceId) =>
              removeDiceGroup(weaponId, attackId, diceId)
            }
            onAddFlatBonus={(attackId) => addFlatBonus(weaponId, attackId)}
            onUpdateFlatBonus={(attackId, bonusId, patch) =>
              updateFlatBonus(weaponId, attackId, bonusId, patch)
            }
            onRemoveFlatBonus={(attackId, bonusId) =>
              removeFlatBonus(weaponId, attackId, bonusId)
            }
          />

          <WeaponSettingsPanel
            weapon={selectedWeapon}
            result={selectedResult}
            onUpdate={(patch) => updateWeapon(weaponId, patch)}
          />
        </div>
      </div>
    </div>
  );
}
