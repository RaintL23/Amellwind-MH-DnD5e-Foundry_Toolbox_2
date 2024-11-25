import MonsterTypes from "./monsterTypes";

export default class MonsterType {
    public name: string = "";
    public size: string[] = [];
    public type?: MonsterTypes | string = { type: "", tags: [] };
    public group?: string[] = [];
    public environment?: string[] = [];
    public source?: string = "";
}