import type { ListFilterSectionConfig } from "@/shared/components/list-filters";
import { TIER_LABELS } from "../../constants/rune.constants";
import { formatTag } from "../../utils/rune-tag.utils";
import { MATERIAL_EFFECT_TIER_FILTER_OPTIONS } from "@/features/material-effects/constants/material-effect.constants";

export type RuneSlotFilter = "" | "A" | "W";

export interface RuneDialogFiltersState {
  monster: string[];
  monsterCr: string[];
  slot: RuneSlotFilter;
  obtainment: string[];
  tag: string[];
  monsterTier: string[];
  materialEffectTier: string[];
}

export interface RuneFiltersState extends RuneDialogFiltersState {
  name: string;
}

export const DEFAULT_RUNE_DIALOG_FILTERS: RuneDialogFiltersState = {
  monster: [],
  monsterCr: [],
  slot: "",
  obtainment: [],
  tag: [],
  monsterTier: [],
  materialEffectTier: [],
};

const OBTAINMENT_OPTIONS = [
  { value: "Carveable", label: "Carveable" },
  { value: "Capturable", label: "Capturable" },
  { value: "Ambas", label: "Both" },
];

const SLOT_OPTIONS = [
  { value: "A", label: "Armor" },
  { value: "W", label: "Weapon" },
];

const MONSTER_TIER_OPTIONS = ([1, 2, 3, 4] as const).map((tier) => ({
  value: String(tier),
  label: TIER_LABELS[tier],
}));

const MATERIAL_EFFECT_TIER_OPTIONS = MATERIAL_EFFECT_TIER_FILTER_OPTIONS.map(
  (tier) => ({
    value: tier,
    label: tier,
  }),
);

export function buildRuneFilterSections(
  uniqueMonsters: string[],
  uniqueMonsterCrs: string[],
  uniqueTags: string[],
): ListFilterSectionConfig[] {
  return [
    { id: "slot", title: "Slot", mode: "single", options: SLOT_OPTIONS },
    {
      id: "obtainment",
      title: "Obtainment",
      mode: "multi",
      options: OBTAINMENT_OPTIONS,
    },
    {
      id: "monsterCr",
      title: "Monster CR",
      mode: "multi",
      options: uniqueMonsterCrs.map((cr) => ({
        value: cr,
        label: `CR ${cr}`,
      })),
    },
    {
      id: "tag",
      title: "Tags",
      mode: "multi",
      options: uniqueTags.map((tag) => ({
        value: tag,
        label: formatTag(tag),
      })),
    },
    {
      id: "monsterTier",
      title: "Monster Tier",
      mode: "multi",
      options: MONSTER_TIER_OPTIONS,
    },
    {
      id: "materialEffectTier",
      title: "Material Effect Tier",
      mode: "multi",
      options: MATERIAL_EFFECT_TIER_OPTIONS,
    },
    {
      id: "monster",
      title: "Monster",
      mode: "multi",
      options: uniqueMonsters.map((name) => ({ value: name, label: name })),
    },
  ];
}

export function countActiveRuneDialogFilters(
  filters: RuneDialogFiltersState,
): number {
  let count = 0;
  if (filters.monster.length > 0) count++;
  if (filters.monsterCr.length > 0) count++;
  if (filters.slot) count++;
  if (filters.obtainment.length > 0) count++;
  if (filters.tag.length > 0) count++;
  if (filters.monsterTier.length > 0) count++;
  if (filters.materialEffectTier.length > 0) count++;
  return count;
}

export { toggleMultiFilterValue } from "@/shared/components/list-filters";
