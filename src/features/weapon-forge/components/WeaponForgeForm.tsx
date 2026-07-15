import { Button } from "@/components/ui/button";
import { useWeaponForgeForm } from "../hooks/useWeaponForgeForm";
import { WeaponBaseSelector } from "./WeaponBaseSelector";
import { WeaponForgeBasicsFields } from "./WeaponForgeBasicsFields";
import { WeaponForgeFormActions } from "./WeaponForgeFormActions";
import { WeaponForgeFormHeader } from "./WeaponForgeFormHeader";
import { WeaponRarityEditor } from "./WeaponRarityEditor";

export function WeaponForgeForm() {
  const {
    isEdit,
    values,
    amellwindWeapons,
    loading,
    notFound,
    patch,
    handleChangeRows,
    handleChangeFeatures,
    applyBase,
    goBack,
    handleSubmit,
  } = useWeaponForgeForm();

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <WeaponForgeFormHeader isEdit={isEdit} onBack={goBack} />
        <div className="flex-1 px-6 py-8">
          <p className="text-sm text-muted-foreground">Loading form…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <WeaponForgeFormHeader isEdit={isEdit} onBack={goBack} />
        <div className="flex-1 px-6 py-8 space-y-3">
          <p className="text-sm text-foreground">Weapon not found.</p>
          <p className="text-sm text-muted-foreground">
            It may have been deleted or is not stored in this browser.
          </p>
          <Button type="button" variant="outline" onClick={goBack}>
            Back to Weapon Forge
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <WeaponForgeFormHeader isEdit={isEdit} onBack={goBack} />

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        <form
          id="weapon-forge-form"
          onSubmit={handleSubmit}
          className="mx-auto w-full space-y-6"
        >
          <WeaponBaseSelector weapons={amellwindWeapons} onApply={applyBase} />

          <WeaponForgeBasicsFields values={values} onPatch={patch} />

          <WeaponRarityEditor
            rows={values.rarityRows}
            customFeatures={values.customFeatures}
            onChangeRows={handleChangeRows}
            onChangeFeatures={handleChangeFeatures}
          />

          <WeaponForgeFormActions isEdit={isEdit} onCancel={goBack} />
        </form>
      </div>
    </div>
  );
}
