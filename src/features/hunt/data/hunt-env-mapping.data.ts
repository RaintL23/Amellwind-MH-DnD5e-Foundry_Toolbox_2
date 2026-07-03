export interface HuntEnvironmentMapping {
  envName: string;
  tags: string[];
}

/** Maps GTMH location stat blocks to 5etools environment tags used on MH monsters. */
export const HUNT_ENVIRONMENT_MAPPINGS: HuntEnvironmentMapping[] = [
  {
    envName: "Ancestral Steppes",
    tags: ["grassland", "forest", "hill", "mountain"],
  },
  {
    envName: "The Dunes",
    tags: ["desert"],
  },
  {
    envName: "Jungle",
    tags: ["forest", "hill", "coastal", "swamp"],
  },
  {
    envName: "Ocean",
    tags: ["coastal", "underwater"],
  },
  {
    envName: "Snowy Mountains",
    tags: ["arctic", "mountain"],
  },
  {
    envName: "Verdant Hills",
    tags: ["forest", "hill", "grassland"],
  },
  {
    envName: "Volcano",
    tags: ["mountain", "underdark"],
  },
  {
    envName: "The Wetlands",
    tags: ["swamp"],
  },
];

export function getTagsForEnvironment(envName: string): string[] {
  return (
    HUNT_ENVIRONMENT_MAPPINGS.find((mapping) => mapping.envName === envName)
      ?.tags ?? []
  );
}
