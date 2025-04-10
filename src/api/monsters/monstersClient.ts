import Monster from "@/models/monster/monster";
import { fetchApiData } from "../client";
import MonsterFluff from "@/models/monster/MonsterFluff";
import MonsterRunes from "@/models/monster/MonsterRunes";

export const getMonsters = async (): Promise<Monster[]> => {
  const data = await fetchApiData();
  console.log("monsters data");
  console.log(data);
  return data.monster;
};

// export const getMonsterRunes = async (monster: Monster): Promise<string[]> => {
//   console.log("monster data for runes");
//   console.log(monster);
//   return [];
// };

const getMonsterRunes = (monster: Monster): MonsterRunes => {
  const result: MonsterRunes = {
    armorEffects: [],
    weaponEffects: [],
  };

  if (!monster?.fluff?.entries) return result;

  // Función recursiva para buscar en las entries
  const processEntries = (entries: MonsterFluff[]) => {
    for (const entry of entries) {
      // Si es una lista con style "list-hang" y tiene el nombre que buscamos
      if (entry.type === "list" && entry.style === "list-hang") {
        if (entry.name === "ARMOR MATERIAL EFFECTS" && entry.items) {
          result.armorEffects = entry.items.map((item) => ({
            name: item.name || "Unknown",
            effect: item.entries?.[0] || "No effect description",
          }));
        } else if (entry.name === "WEAPON MATERIAL EFFECTS" && entry.items) {
          result.weaponEffects = entry.items.map((item) => ({
            name: item.name || "Unknown",
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
  console.log("Monster Runes");
  console.log(result);
  return result;
};

export const getMonsterRunesNames = (monster: Monster): string[] => {
  runes = getMonsterRunes(monster);
  if (runes) return [];
};
