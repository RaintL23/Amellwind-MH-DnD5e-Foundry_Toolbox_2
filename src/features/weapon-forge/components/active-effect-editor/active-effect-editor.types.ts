import type {
  WeaponActiveEffectConfig,
} from "@/shared/foundry/weapons";
import type { WeaponActivityParams } from "@/shared/foundry/weapons";

export type PatchAeFn = (
  patch: Partial<WeaponActiveEffectConfig>,
  legacy?: Partial<WeaponActivityParams>,
) => void;

export interface FeatureActiveEffectEditorProps {
  params: WeaponActivityParams;
  onChangeParams: (patch: Partial<WeaponActivityParams>) => void;
  featureName: string;
}
