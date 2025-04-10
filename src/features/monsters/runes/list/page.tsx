import {
  getMonsterRunesNames,
  getMonsters,
} from "@/api/monsters/monstersClient";
import Monster from "@/models/monster/monster";
import { useEffect, useState } from "react";

const MonstersRunesListPage = () => {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [selectedMonsterRunes, setSelectedMonsterRunes] = useState([]);

  const getRunes = (monster) => {
    const runes = getMonsterRunesNames(monster);
    return ["No runes available"];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const monsterData = await getMonsters();
        setMonsters(monsterData);
      } catch (error) {
        console.error("Error fetching monsters:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedMonster) {
      const runes = getRunes(selectedMonster);
      setSelectedMonsterRunes(runes);
    } else {
      setSelectedMonsterRunes([]);
    }

    fetchData();
  }, [selectedMonster]);

  if (loading) {
    return <p>Loading monsters runes...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Detalles del monstruo seleccionado */}
      {selectedMonster && (
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-xl font-bold mb-2">{selectedMonster.name}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-semibold">Size:</span>{" "}
              {selectedMonster.size?.join(", ") || "Unknown"}
            </div>
            <div>
              <span className="font-semibold">Type:</span>{" "}
              {selectedMonster.type?.type || "Unknown"}
            </div>
            <div>
              <span className="font-semibold">Source:</span>{" "}
              {selectedMonster.source || "Unknown"}
            </div>
            <div>
              <span className="font-semibold">Group:</span>{" "}
              {selectedMonster.group || "Unknown"}
            </div>
            <div>
              <span className="font-semibold">Environments:</span>{" "}
              {selectedMonster.environment || "Unknown"}
            </div>
            <div>
              <span className="font-semibold">Runes:</span>{" "}
              {selectedMonsterRunes || "Unknown"}
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {monsters.map((monster) => (
          <div
            key={monster.name}
            className="p-2 border-b border-gray-300 cursor-pointer hover:bg-gray-100"
            onClick={() => setSelectedMonster(monster)}
          >
            <span className="font-bold">{monster.name}</span>
            <div className="text-sm text-gray-600">
              <span>Size: {monster.size?.join(", ") || "Unknown"}</span> •{" "}
              <span>Type: {monster.type?.type || "Unknown"}</span> •{" "}
              <span>Source: {monster.source || "Unknown"}</span> •{" "}
              <span>Group: {monster.group || "Unknown"}</span> •{" "}
              <span>Enviroments: {monster.environment || "Unknown"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonstersRunesListPage;
