import { getMonsters } from "@/api/monsters/monstersClient";
import Monster from "@/models/monster/monster";
import { useEffect, useState } from "react";
import { columns } from "./components/columns";
import { DataTable } from "@/components/data-table-2/data-table";
// import DataTable from '../../../components/data-table/data-table';

const MonstersListPage = () => {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetchData();
  }, []);

  if (loading) {
    return <p>Loading monsters...</p>;
  }

  return (
    <div>
      <h1>Monsters</h1>
      <DataTable columns={columns} data={monsters} />
    </div>
  );
};

export default MonstersListPage;
