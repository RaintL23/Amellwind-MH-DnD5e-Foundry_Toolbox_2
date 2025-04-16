import MonsterCarveTableItem from "./monsterCarveTableItem";

export default interface MonsterCarveTable {
  carveAttempts: number;
  cr: number;
  items: MonsterCarveTableItem[];
}
