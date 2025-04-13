import {
  getMonstersRunes,
  getMonstersRunes2,
} from "@/api/monsters/monstersClient";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table-2/data-table";
import { columns } from "./components/columns";
import MonsterRune1 from "@/models/monster/monsterRune1";

const MonstersRunesListPage = () => {
  const [monstersRunes1, setMonstersRunes1] = useState<MonsterRune1[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const monsterRunesData1 = await getMonstersRunes2();
        setMonstersRunes1(monsterRunesData1);
        const monsterRunesData = await getMonstersRunes();
        console.log("monsterRunesData1");
        console.log(monsterRunesData1);
        console.log("monsterRunesData");
        console.log(monsterRunesData);
      } catch (error) {
        console.error("Error fetching monsters runes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <p>Loading monsters runes...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <DataTable columns={columns} data={monstersRunes1} />
      </div>

      {/*<div className="space-y-2">
        {monstersRunes.flatMap((monsterRune) => [
          ...monsterRune.armorEffects.map((rune) => (
            <div
              key={`${rune.id}-${rune.monsterName}-${rune.name}-armor`}
              className="p-2 border-b border-gray-300 cursor-pointer hover:bg-gray-100"
            >
              <span className="font-bold">
                {rune.monsterName} {rune.name}
              </span>
              <div className="text-sm text-gray-600">
                {rune.effect || "Unknown"}
              </div>
            </div>
          )),
          ...monsterRune.weaponEffects.map((rune) => (
            <div
              key={`${rune.id}-${rune.monsterName}-${rune.name}-weapon`}
              className="p-2 border-b border-gray-300 cursor-pointer hover:bg-gray-100"
            >
              <span className="font-bold">
                {rune.monsterName} {rune.name}
              </span>
              <div className="text-sm text-gray-600">
                {rune.effect || "Unknown"}
              </div>
            </div>
          )),
        ])}
      </div>*/}
    </div>
  );
};

export default MonstersRunesListPage;
