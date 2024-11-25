import MonsterTypes from "./monsterTypes";

export default interface Monster {
    name: string;
    size: string[];
    type?: MonsterTypes | string;
    group?: string[];
    environment?: string[];
    source?: string;
}