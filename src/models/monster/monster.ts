import MonsterAction from "./monsterAction";
import MonsterArmor from "./monsterArmor";
import MonsterFluff from "./MonsterFluff";
import MonsterHealth from "./monsterHealth";
import MonsterSkill from "./monsterSkill";
import MonsterSpeed from "./monsterSpeed";
import MonsterTrait from "./monsterTrait";
import MonsterTypes from "./monsterTypes";

export default interface Monster {
    name: string;
    size: string[];
    type?: MonsterTypes | string;
    group?: string[];
    environment?: string[];
    source?: string;
    alignment?: string[];
    ac: MonsterArmor;
    hp: MonsterHealth;
    speed?: MonsterSpeed;
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
    skill?: MonsterSkill;
    passive?: number;
    cr?: string;
    page?: number;
    trait?: MonsterTrait[];
    action?: MonsterAction[];
    traitTags?: string[];
    fluff: MonsterFluff;
    damageTags?: string[];
    miscTags?: string[];
    conditionInflict?: string[];
    savingThrowForced?: string[];
}