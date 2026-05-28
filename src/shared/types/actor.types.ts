// ─── Ability Scores ──────────────────────────────────────────────────────────

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export type AbilityKey = keyof AbilityScores;

// ─── Skills ──────────────────────────────────────────────────────────────────

export type SkillKey =
  | "acr"
  | "ani"
  | "arc"
  | "ath"
  | "dec"
  | "his"
  | "ins"
  | "itm"
  | "inv"
  | "med"
  | "nat"
  | "prc"
  | "prf"
  | "per"
  | "rel"
  | "slt"
  | "ste"
  | "sur";

export type Skills = Partial<Record<SkillKey, 0 | 1 | 2>>;

// ─── Speed ───────────────────────────────────────────────────────────────────

export interface Speed {
  walk?: number;
  swim?: number;
  fly?: number;
  burrow?: number;
  climb?: number;
  hover?: boolean;
}

// ─── HP ──────────────────────────────────────────────────────────────────────

export interface HP {
  formula?: string;
  average?: number;
  current?: number;
  temp?: number;
}

// ─── Armor Class ─────────────────────────────────────────────────────────────

export interface ArmorClass {
  ac: number;
  from?: string[];
}

// ─── Senses ──────────────────────────────────────────────────────────────────

export interface Senses {
  darkvision?: number;
  blindsight?: number;
  tremorsense?: number;
  truesight?: number;
  special?: string;
}

// ─── Damage Resistance / Immunity / Vulnerability ────────────────────────────

export type DamageType =
  | "acid"
  | "bludgeoning"
  | "cold"
  | "fire"
  | "force"
  | "lightning"
  | "necrotic"
  | "piercing"
  | "poison"
  | "psychic"
  | "radiant"
  | "slashing"
  | "thunder";

export interface ConditionalDamage {
  resist?: DamageType[];
  note?: string;
  cond?: boolean;
}

export type DamageEntry = DamageType | ConditionalDamage;

// ─── Traits / Actions ────────────────────────────────────────────────────────

export interface Entry {
  name: string;
  entries: string[];
}

// ─── Actor (base class) ──────────────────────────────────────────────────────

export interface Actor {
  name: string;
  shortName?: string;
  size: string;
  type: {
    type: string;
    tags?: string[];
  };
  alignment: string[];
  armorClass: ArmorClass[];
  hp: HP;
  speed: Speed;
  initiative: number;
  proficiencyBonus: number;
  abilities: AbilityScores;
  savingThrows: Partial<Record<AbilityKey, string>>;
  skills: Skills;
  passivePerception: number;
  senses: Senses;
  damageImmunities: DamageEntry[];
  damageResistances: DamageEntry[];
  damageVulnerabilities: DamageEntry[];
  conditionImmunities: string[];
  languages: string[];
  traits: Entry[];
  actions: Entry[];
  reactions: Entry[];
}
