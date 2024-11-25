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
                console.log("Monster Data");
                console.log(monsterData);
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
            {/* <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                <tr>
                    <th className="border border-gray-300 px-4 py-2">Name</th>
                    <th className="border border-gray-300 px-4 py-2">Size</th>
                    <th className="border border-gray-300 px-4 py-2">Type</th>
                    <th className="border border-gray-300 px-4 py-2">Environment</th>
                </tr>
                </thead>
                <tbody>
                {monsters.map((monster) => (
                    <tr key={monster.name}>
                    <td className="border border-gray-300 px-4 py-2">{monster.name}</td>
                    <td className="border border-gray-300 px-4 py-2">
                        {monster.size.join(", ")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                        {monster.type?.type}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                        {monster.environment?.join(", ")}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table> */}
            <DataTable columns={columns} data={monsters} />
            {/* <DataTable
                columns={columns}
                data={monsters}
                tableId="Monster-List"
            /> */}
        </div>
    );
}

export default MonstersListPage;