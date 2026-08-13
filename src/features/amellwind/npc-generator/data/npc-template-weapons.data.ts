/** Primary AGMH hunter weapon per template (one specialty per NPC). */
export const NPC_TEMPLATE_PRIMARY_WEAPON: Record<string, string> = {
  "guild-knight": "Great Sword",
  "guild-artillerist": "Heavy Bowgun",
  "frenzy-hunter": "Hammer",
  "holy-champion": "Longsword",
  "guild-militia": "Sword and Shield",
  pikeman: "Lance",
  "foot-soldier": "Longsword",
  pathfinder: "Bow",
  "hermit-tracker": "Bow",
  "free-hunter": "Dual Blades",
  scoundrel: "Splint Rapier",
  "guild-scout": "Bow",
  bladesman: "Splint Rapier",
  "troverian-artisan": "Hammer",
  "village-elder": "Splint Rapier",
  "field-hand": "Hammer",
  "tavern-keeper": "Hammer",
  "wyverian-arcanist": "Magus Staff",
  evoker: "Magus Staff",
  "wycademy-acolyte": "Magus Staff",
  warden: "Magus Staff",
  "handler-aide": "Sword and Shield",
  "war-chanter": "Hunting Horn",
  hexer: "Magus Staff",
};

/** @deprecated Use NPC_TEMPLATE_PRIMARY_WEAPON */
export const NPC_TEMPLATE_WEAPON_MAP = NPC_TEMPLATE_PRIMARY_WEAPON;
