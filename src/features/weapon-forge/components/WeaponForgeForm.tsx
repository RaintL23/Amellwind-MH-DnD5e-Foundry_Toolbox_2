import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeaponForgeForm } from "../hooks/useWeaponForgeForm";
import {
  formValuesToWeapon,
  toCustomWeapon,
} from "../mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "../mappers/weapon-forge-foundry.export";
import { WeaponBaseSelector } from "./WeaponBaseSelector";
import { WeaponForgeBasicsFields } from "./WeaponForgeBasicsFields";
import { WeaponForgeFormActions } from "./WeaponForgeFormActions";
import { WeaponForgeFormHeader } from "./WeaponForgeFormHeader";
import { WeaponRarityEditor } from "./WeaponRarityEditor";
import { WeaponFoundryPreviewPanel } from "@/features/weapons/components/WeaponFoundryPreviewPanel";

export function WeaponForgeForm() {
  const {
    isEdit,
    values,
    amellwindWeapons,
    loading,
    notFound,
    patch,
    patchMany,
    handleChangeRows,
    handleChangeFeatures,
    applyBase,
    goBack,
    handleSubmit,
  } = useWeaponForgeForm();

  const [previewRarityIndex, setPreviewRarityIndex] = useState(0);

  const previewWeapon = useMemo(() => {
    const base = formValuesToWeapon(values);
    return toCustomWeapon(base, {
      id: "forge-form-preview",
      isCustom: true,
      author: values.author,
      img: values.img,
      customFeatures: values.customFeatures,
    });
  }, [values]);

  const foundryItem = useMemo(() => {
    try {
      return buildWeaponFoundryItem(previewWeapon, previewRarityIndex);
    } catch {
      return null;
    }
  }, [previewWeapon, previewRarityIndex]);

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
        <div className="mx-auto w-full space-y-4">
          <Tabs defaultValue="edit" className="w-full">
            <TabsList>
              <TabsTrigger value="edit">Edit weapon</TabsTrigger>
              <TabsTrigger value="foundry">Foundry VTT</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="mt-4">
              <form
                id="weapon-forge-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <WeaponBaseSelector
                  weapons={amellwindWeapons}
                  onApply={applyBase}
                />

                <WeaponForgeBasicsFields
                  values={values}
                  onPatch={patch}
                  onPatchMany={patchMany}
                />

                <WeaponRarityEditor
                  rows={values.rarityRows}
                  customFeatures={values.customFeatures}
                  onChangeRows={handleChangeRows}
                  onChangeFeatures={handleChangeFeatures}
                />

                <WeaponForgeFormActions isEdit={isEdit} onCancel={goBack} />
              </form>
            </TabsContent>

            <TabsContent value="foundry" className="mt-4">
              <p className="text-xs text-muted-foreground mb-3">
                Live preview of the Foundry Item JSON for the current form
                values (not saved until you submit). Use this to validate
                Activities before export.
              </p>
              <WeaponFoundryPreviewPanel
                weapon={previewWeapon}
                rarityIndex={previewRarityIndex}
                item={foundryItem}
                onRarityIndexChange={setPreviewRarityIndex}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
