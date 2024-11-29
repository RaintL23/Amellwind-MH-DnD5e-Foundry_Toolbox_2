import { getMonsters } from "@/api/monsters/monstersClient";
import Monster from "@/models/monster/monster";
import { useEffect, useState } from "react";

const MonstersRunesListPage = () => {
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
        return <p>Loading monsters runes...</p>;
    }

    return (
        <div className="space-y-2">
            {monsters.map((monster) => (
                <div key={monster.name} className="p-2 border-b border-gray-300">
                <span className="font-bold">{monster.name}</span>
                <div className="text-sm text-gray-600">
                    <span>Size: {monster.size?.join(", ") || "Unknown"}</span> •{" "}
                    <span>Type: {monster.type?.type || "Unknown"}</span> •{" "}
                    <span>Source: {monster.source || "Unknown"}</span> •{" "}
                    <span>Group: {monster.group || "Unknown"}</span> •{" "}
                    <span>Enviroments: {monster.environment || "Unknown"}</span> •{" "}
                </div>
                </div>
            ))}
        </div>
    );
}

export default MonstersRunesListPage;