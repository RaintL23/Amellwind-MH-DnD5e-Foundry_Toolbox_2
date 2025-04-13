import Monster from "./monster";
import MonsterRunes1 from "./monsterRunes1";

export default class MonsterRune1 {
  public name: string = "";
  public effect: string = "";
  public monsterName: string = "";
  public monsterOrigin?: Monster;
  public type?: MonsterRunes1 | string = { type: "", tags: [] };
}
