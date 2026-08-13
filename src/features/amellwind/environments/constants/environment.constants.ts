export const ENVIRONMENT_RULES: Array<{ term?: string; text: string }> = [
  {
    text: "There are many different environments and locations that these creatures dwell in. In the location stat blocks below you will find out information about each location.",
  },
  {
    term: "Biome.",
    text: "the biome tells what type of areas you would see in the location.",
  },
  {
    term: "Navigation DC.",
    text: "Determines the difficulty of skill checks for finding safe passage through the terrain, the trailblazer DC if they are not hunting a specific monster, and any other checks related to navigating.",
  },
  {
    term: "Encounter DC.",
    text: "The Encounter DC determines how often a random encounter may or may not occur. Roll a d20, if the roll equals or exceeds the Encounter DC roll on the encounter table within the stat block.",
  },
  {
    term: "Investigation DC.",
    text: "When a character attempts to locate resources to gather while on a hunt, they must make an Intelligence (Investigation) check against the location's Investigation DC. On a success, the GM determines what type of resources are nearby.",
  },
  {
    term: "Full size Map.",
    text: "{@link Monster Hunter World Map 2000x1387|https://drive.google.com/open?id=1mkk3L-DajBFKjouEe-f8HwcGN57cCu4O}",
  },
  {
    term: "Total Resources.",
    text: "The total resources number is the maximum amount of times a Resource check can be made on a Hunt.",
  },
  {
    term: "Resources.",
    text: "When a character attempts to fish, mine, catch insects, or gather plants they must make a skill check against the Resources DC in addition to having the proper equipment. A character must have fishing tackle (PHB 150) to fish, a miner's pick (PHB 150) to mine ore, a bug net (2 gp) for catching insects, or an herbalism kit (PHB 154) to gather plants. A character can attempt to gather plants without a herbalist kit but does so at disadvantage. If the character succeeds, they roll a d6 and receive the item listed in the resources table.",
  },
  {
    term: "Common Small Monsters.",
    text: "Typical smaller monsters seen in this area for the level range.",
  },
  {
    term: "Common Large Monsters.",
    text: "Typical large monsters seen in this area for the level range.",
  },
  {
    term: "Common Weather.",
    text: "The usual type of weather that occurs in the area.",
  },
];

export const BIOME_ICONS: Record<string, string> = {
  "Ancestral Steppes": "🌄",
  "The Dunes": "🏜️",
  Jungle: "🌴",
  Ocean: "🌊",
  "Snowy Mountains": "🏔️",
  "Verdant Hills": "🌿",
  Volcano: "🌋",
  "The Wetlands": "🐊",
};

export type EnvironmentColors = {
  accent: string;
  bg: string;
  border: string;
  badge: string;
};
