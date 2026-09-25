import type { PlayActivationBucket, PlayFeature } from "../utils/play-character.types";

/** PHB / XPHB standard actions available to every character. */
export const STANDARD_ACTIONS: Omit<PlayFeature, "id">[] = [
  {
    name: "Attack",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description: "Make one melee or ranged attack (Extra Attack may grant more).",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Dash",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description: "Gain extra movement equal to your Speed for this turn.",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Disengage",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description: "Your movement doesn't provoke Opportunity Attacks this turn.",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Dodge",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description:
      "Until the start of your next turn, attack rolls against you have disadvantage if you can see the attacker, and you make DEX saves with advantage.",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Help",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description:
      "Help an ally with an ability check or the next attack against a creature within 5 feet.",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Hide",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description: "Make a Dexterity (Stealth) check to hide.",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Influence",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description: "Persuade, deceive, or intimidate (XPHB).",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Magic Action",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description:
      "Cast a spell with a casting time of an action, or use a magic item that requires an action (XPHB).",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Ready",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description: "Prepare a reaction to a trigger you describe.",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Search",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description: "Make a Perception or Investigation check to find something.",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Study",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description: "Recall lore or examine something closely (XPHB).",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Utilize",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description:
      "Use a nonmagical object — tools, adventuring gear, and similar (XPHB). Drinking a potion is a Bonus Action.",
    activation: "action",
    bucket: "action",
  },
  {
    name: "Opportunity Attack",
    sourceKind: "standard",
    sourceLabel: "Standard",
    description:
      "When a creature leaves your reach, use your Reaction to make one melee attack.",
    activation: "reaction",
    bucket: "reaction" as PlayActivationBucket,
  },
];
