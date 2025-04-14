import Monster from "@/models/monster/monster";
import { fetchApiData } from "../client";
import MonsterRunes from "@/models/monster/MonsterRunes";
import MonsterRune1 from "@/models/monster/monsterRune1";
import MonsterEntries from "@/models/monster/monsterEntries";

export const getMonsters = async (): Promise<Monster[]> => {
  const data = await fetchApiData();
  // console.log("monsters data");
  // console.log(data);
  return data.monster;
};

export const getMonstersRunes = async (): Promise<MonsterRunes[]> => {
  const monsters = await getMonsters();
  const monstersRunes: MonsterRunes[] = [];
  monsters.forEach((monster) =>
    monstersRunes.push(getMonsterRunes(monster.name, monster))
  );
  return monstersRunes;
};

export const getMonstersRunes2 = async (): Promise<MonsterRune1[]> => {
  const monsters = await getMonsters();
  const monstersRunes: MonsterRune1[] = [];
  monsters.forEach((monster) =>
    monstersRunes.push(...getMonsterRune2(monster.name, monster))
  );
  return monstersRunes;
};

const getMonsterRune2 = (
  monsterName: string,
  monster: Monster
): MonsterRune1[] => {
  const result: MonsterRune1[] = [];
  // Función recursiva para buscar en las entries
  const processEntries = (entries: MonsterEntries[]) => {
    if (entries !== undefined) {
      for (const entry of entries) {
        // console.log(entry);
        // Si es una lista con style "list-hang" y tiene el nombre que buscamos
        if (
          entry.type === "list" &&
          entry.style === "list-hang" &&
          (entry.name === "ARMOR MATERIAL EFFECTS" ||
            entry.name === "WEAPON MATERIAL EFFECTS" ||
            entry.name === "OTHER MATERIAL EFFECTS") &&
          entry.items
        ) {
          result.push(
            ...entry.items.map((item) => ({
              name: item.name,
              effect: item.entries?.[0] || "No effect description",
              monsterName: monsterName,
              monsterOrigin: monster,
              tier: selectRuneTier(monster),
              type: {
                type:
                  entry.name === "ARMOR MATERIAL EFFECTS"
                    ? "Armor"
                    : entry.name === "WEAPON MATERIAL EFFECTS"
                    ? "Weapon"
                    : entry.name === "OTHER MATERIAL EFFECTS"
                    ? "Other"
                    : "Unknown",
                tags:
                  item.entries?.[0] !== undefined && item.entries?.[0] !== null
                    ? processRuneTags(item.entries?.[0])
                    : undefined,
              },
            }))
          );
        }

        // Si la entry tiene más entries anidadas, procesarlas también
        if (entry.entries && Array.isArray(entry.entries)) {
          processEntries(entry.entries);
        }
      }
    }
  };

  if (monster.fluff?.entries) {
    processEntries(monster.fluff.entries);
  }
  return result;
};

const selectRuneTier = (monster: Monster): number => {
  let rawCR: any = monster.cr;

  // Caso en que es un objeto con campos "cr" y "lair"
  if (typeof rawCR === "object" && rawCR !== null && "cr" in rawCR) {
    rawCR = rawCR.cr;
  }

  // Convertir a número
  const CR = Number(rawCR);

  if (isNaN(CR)) return 0;

  switch (true) {
    case CR >= 0 && CR < 5:
      return 1;
    case CR >= 5 && CR < 10:
      return 2;
    case CR >= 10 && CR < 15:
      return 3;
    case CR >= 15 && CR < 20:
      return 4;
    case CR >= 20:
      return 5;
    default:
      return 0;
  }
};

const processRuneTags = (runeEffect?: string): string[] => {
  const tags: string[] = [];
  if (runeEffect === undefined) return tags;
  const tagsNames: string[] = [
    "extra damage",
    "Greatsword",
    "Longsword",
    "Sword",
    "Bow",
    "Bowgun",
    "Hammer",
    "Gunlance",
    "Dual Blades",
    "Hunting Horn",
    "Insect Glaive",
    "Lance",
    "Magnet Spike",
    "Magus Staff",
    "Splint Rapier",
    "Switch Axe",
    "Tonfas",
    "Wyvern Boomerang",
    "Dual Repeaters",
  ];
  tagsNames.forEach((tag) => {
    if (runeEffect.includes(tag)) tags.push(tag);
  });

  if (runeEffect.includes("critical hit")) tags.push("Criticals");
  if (runeEffect.includes("Your weapon deals an extra"))
    tags.push("Simple extra dice damage");
  if (runeEffect.includes("Whenever you make a saving throw against"))
    tags.push("Saving throw bonus");
  if (runeEffect.includes("speed")) tags.push("Movement bonus");
  if (runeEffect.includes("You have resistance")) tags.push("Resistance");

  return tags;
};

const getMonsterRunes = (
  monsterName: string,
  monster: Monster
): MonsterRunes => {
  const result: MonsterRunes = {
    armorEffects: [],
    weaponEffects: [],
  };
  let index = 0;
  if (!monster?.fluff?.entries) return result;

  // Función recursiva para buscar en las entries
  const processEntries = (entries: MonsterEntries[]) => {
    for (const entry of entries) {
      // Si es una lista con style "list-hang" y tiene el nombre que buscamos
      if (entry.type === "list" && entry.style === "list-hang") {
        if (entry.name === "ARMOR MATERIAL EFFECTS" && entry.items) {
          result.armorEffects = entry.items.map((item) => ({
            id: ++index,
            monsterName: monsterName || "Unknown",
            name: `[A] ${item.name}` || "Unknown",
            effect: item.entries?.[0] || "No effect description",
          }));
        } else if (entry.name === "WEAPON MATERIAL EFFECTS" && entry.items) {
          result.weaponEffects = entry.items.map((item) => ({
            id: ++index,
            monsterName: monsterName || "Unknown",
            name: `[W] ${item.name}` || "Unknown",
            effect: item.entries?.[0] || "No effect description",
          }));
        }
      }

      // Si la entry tiene más entries anidadas, procesarlas también
      if (entry.entries && Array.isArray(entry.entries)) {
        processEntries(entry.entries);
      }
    }
  };

  processEntries(monster.fluff.entries);
  return result;
};

export const getMonsterRunesNames = (monster: Monster): string[] => {
  const runes = getMonsterRunes(monster.name, monster);
  const runesNames: string[] = [];
  if (runes.armorEffects.length > 0) {
    runes.armorEffects.forEach((armorRune) => {
      runesNames.push(armorRune.name);
    });
  }
  if (runes.weaponEffects.length > 0) {
    runes.weaponEffects.forEach((weaponRune) => {
      runesNames.push(weaponRune.name);
    });
  }
  // console.log("Monster Runes 1");
  // console.log(runesNames);
  if (runesNames.length == 0) return ["No runes available"];
  return runesNames;
};
