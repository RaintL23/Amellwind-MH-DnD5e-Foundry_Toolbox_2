export const RARITY_SLOTS = [
  { rarity: "Common", slots: 1 },
  { rarity: "Uncommon", slots: 2 },
  { rarity: "Rare", slots: 3 },
  { rarity: "Very Rare", slots: 4 },
  { rarity: "Legendary", slots: 5 },
] as const;

/** Smithy upgrade (1 week). Common is the starting tier and is not listed in the table. */
export const ARMOR_UPGRADE_COSTS = [
  { rarity: "Uncommon", resource: "Armor Sphere", amount: 5, cost: "500 gp" },
  { rarity: "Rare", resource: "Hard Armor Sphere", amount: 10, cost: "1,500 gp" },
  { rarity: "Very Rare", resource: "Heavy Armor Sphere", amount: 15, cost: "6,000 gp" },
  { rarity: "Legendary", resource: "Royal Armor Sphere", amount: 20, cost: "24,000 gp" },
] as const;

export const WEAPON_UPGRADE_COSTS = [
  { rarity: "Uncommon", resource: "Earth Crystal", amount: 5, cost: "500 gp" },
  { rarity: "Rare", resource: "Machalite Ore", amount: 10, cost: "1,500 gp" },
  { rarity: "Very Rare", resource: "Dragonite Ore", amount: 15, cost: "6,000 gp" },
  { rarity: "Legendary", resource: "Carbalite Ore", amount: 20, cost: "24,000 gp" },
] as const;

export const ARMOR_RULES = [
  "Your armor can only have one damage reduction, resistance, or immunity to an element.",
  "Your armor can only have one advantage or immunity vs a condition such as poisoned, frightened, or prone.",
  "Your armor can only have one material that grants a bonus to AC.",
  "Your armor can only have one effect that uses runes.",
  "A material can only be replaced with another material. Once replaced the previous material is destroyed.",
  "Materials do not stack with improved versions of their effects, including unnamed materials (e.g. Detect does not stack with Detect+).",
];

export const WEAPON_RULES = [
  "A weapon can have one material that causes an effect when you roll a 20, such as a critical status effect. This material is exempt from rule 2.",
  "A weapon can only have one extra damage, condition inflicting, or on-hit effect material. The extra damage rule doesn't apply to materials that require a condition to deal that extra damage.",
  "A weapon can only have one effect that uses runes.",
  "A weapon can only have one bonus to spell DC and spell attack rolls.",
  "A material can only be replaced with another material. Once replaced the previous material is destroyed.",
  "Materials do not stack with improved versions of their effects, including unnamed materials (e.g. Critical Eye+1 does not stack with Critical Eye+2).",
];

export const TRINKET_RULES = [
  "Trinkets have 1 material slot that can hold a weapon or armor material effect.",
  "You can have up to two trinkets, but only gain the effect of one at a time.",
  "As an action, you can swap which trinket effect you are using.",
  "If a material requires armor to be worn or only works on weapon attacks, it only works on equipment you are attuned to.",
];
