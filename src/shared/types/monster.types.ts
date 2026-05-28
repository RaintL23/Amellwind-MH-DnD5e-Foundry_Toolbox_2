import { Actor, Entry } from "./actor.types";

export interface MonsterLoot {
  rolls: number;
}

export interface Monster extends Actor {
  group?: string[];
  source: string;
  page?: number;
  cr: string;
  environment?: string[];
  legendaryActions?: Entry[];
  loot?: MonsterLoot;
  fluff?: string;
}
