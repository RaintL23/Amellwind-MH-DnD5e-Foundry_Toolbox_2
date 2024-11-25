import Monster from "@/models/monster/monster";
import { fetchApiData } from "../client";

export const getMonsters = async (): Promise<Monster[]> => {
    const data = await fetchApiData();
    console.log("monsters data");
    console.log(data);
    return data.monster;
};