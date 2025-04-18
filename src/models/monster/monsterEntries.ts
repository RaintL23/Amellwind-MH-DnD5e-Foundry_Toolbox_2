export default interface MonsterEntries {
  type?: string;
  name?: string;
  style?: string;
  entries?: MonsterEntries | string;
  items?: any[];
  colStyles?: string[];
  colLabels?: string[];
  rows?: string[][];
}
