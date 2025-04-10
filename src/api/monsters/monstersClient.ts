import Monster from "@/models/monster/monster";
import { fetchApiData } from "../client";
import MonsterFluff from "@/models/monster/MonsterFluff";
import MonsterRunes from "@/models/monster/MonsterRunes";

export const getMonsters = async (): Promise<Monster[]> => {
  const data = await fetchApiData();
  // console.log("monsters data");
  // console.log(data);
  return data.monster;
};

export const getMonstersRunes = async (): Promise<MonsterRunes[]> => {
  const monsters = await getMonsters();
  const monstersRunes: MonsterRunes[] = [];
  monsters.forEach(monster => {
    monstersRunes.push(getMonsterRunes(monster.name, monster));
  });
  return monstersRunes;
};

const sumaSimple = (index: number): number => {
  return index
}

const getMonsterRunes = (monsterName: string, monster: Monster): MonsterRunes => {
  const result: MonsterRunes = {
    armorEffects: [],
    weaponEffects: [],
  };
  let index = 0;
  if (!monster?.fluff?.entries) return result;

  // Función recursiva para buscar en las entries
  const processEntries = (entries: MonsterFluff[]) => {
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
  const runesNames:string[] = [];
  if (runes.armorEffects.length > 0){
    runes.armorEffects.forEach(armorRune => {
      runesNames.push(armorRune.name);
    });
  }
  if (runes.weaponEffects.length > 0){
    runes.weaponEffects.forEach(weaponRune => {
      runesNames.push(weaponRune.name);
    });
  }
  // console.log("Monster Runes 1");
  // console.log(runesNames);
  if (runesNames.length == 0)
    return ["No runes available"];
  return runesNames;
};
