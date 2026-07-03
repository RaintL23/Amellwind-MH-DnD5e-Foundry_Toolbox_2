import type { ListFilterSectionConfig } from "@/shared/components/list-filters";

export function buildMonsterFilterSections(
  uniqueCRs: string[],
  uniqueTypes: string[],
  uniqueEnvironments: string[],
): ListFilterSectionConfig[] {
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
      options: uniqueTypes.map((type) => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
      })),
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
