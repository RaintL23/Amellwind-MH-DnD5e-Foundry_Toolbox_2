import type {
  ListFilterOption,
  ListFilterOptionGroup,
  ListFilterSectionConfig,
} from "@/shared/components/list-filters";
import type { MonsterTypeTaxonomyEntry } from "./monster-type-filter.utils";
import {
  encodeMonsterTypeFilterValue,
  formatMonsterTypeLabel,
  formatMonsterTypeTagLabel,
} from "./monster-type-filter.utils";

export function buildMonsterFilterSections(
  uniqueCRs: string[],
  typeTaxonomy: MonsterTypeTaxonomyEntry[],
  uniqueEnvironments: string[],
): ListFilterSectionConfig[] {
  const flatTypeOptions: ListFilterOption[] = [];
  const typeGroups: ListFilterOptionGroup[] = [];

  for (const entry of typeTaxonomy) {
    const typeLabel = formatMonsterTypeLabel(entry.type);

    if (entry.tags.length === 0) {
      flatTypeOptions.push({
        value: encodeMonsterTypeFilterValue(entry.type),
        label: typeLabel,
      });
      continue;
    }

    const options: ListFilterOption[] = [
      {
        value: encodeMonsterTypeFilterValue(entry.type),
        label: `All ${typeLabel}`,
      },
      ...entry.tags.map((tag) => ({
        value: encodeMonsterTypeFilterValue(entry.type, tag),
        label: formatMonsterTypeTagLabel(entry.type, tag),
      })),
    ];

    typeGroups.push({
      id: `type-${entry.type}`,
      label: typeLabel,
      options,
    });
  }

  return [
    {
      id: "cr",
      title: "CR",
      mode: "multi",
      options: uniqueCRs.map((cr) => ({ value: cr, label: `CR ${cr}` })),
    },
    {
      id: "tier",
      title: "Tier",
      mode: "multi",
      options: [0, 1, 2, 3, 4].map((tier) => ({
        value: String(tier),
        label: `Tier ${tier}`,
      })),
    },
    {
      id: "type",
      title: "Type",
      mode: "multi",
      defaultExpanded: true,
      options: flatTypeOptions,
      groups: typeGroups.length > 0 ? typeGroups : undefined,
    },
    {
      id: "environment",
      title: "Environment",
      mode: "multi",
      options: uniqueEnvironments.map((env) => ({
        value: env,
        label: env.charAt(0).toUpperCase() + env.slice(1),
      })),
    },
  ];
}
