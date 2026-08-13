import type { Environment, LevelTier } from "@/shared/types";

export type RollMode = "normal" | "advantage" | "disadvantage";

export type RollSection =
  | "navigation"
  | "encounter-check"
  | "weather"
  | "investigation"
  | "resources";

export interface RollEntry {
  id: string;
  createdAt: Date;
  environmentName: string;
  levelRange: string;
  section: RollSection;
  label: string;
  details: string;
  result: string;
  success?: boolean;
}

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollD20WithMode(mode: RollMode): {
  selected: number;
  rolls: number[];
  mode: RollMode;
} {
  if (mode === "normal") {
    const value = rollDie(20);
    return { selected: value, rolls: [value], mode };
  }
  const first = rollDie(20);
  const second = rollDie(20);
  const selected =
    mode === "advantage" ? Math.max(first, second) : Math.min(first, second);
  return { selected, rolls: [first, second], mode };
}

export function rollFromRangeLabel(raw: string): number {
  if (raw.includes("-")) {
    const [minRaw, maxRaw] = raw.split("-");
    const min = Number.parseInt(minRaw.trim(), 10);
    const max = Number.parseInt(maxRaw.trim(), 10);
    if (Number.isFinite(min) && Number.isFinite(max) && max >= min) {
      return min + Math.floor(Math.random() * (max - min + 1));
    }
  }
  const parsed = Number.parseInt(raw.trim(), 10);
  if (Number.isFinite(parsed)) return parsed;
  return 1;
}

export function findResourceRowByRoll(
  rows: LevelTier["resources"]["rows"],
  roll: number,
) {
  return rows.find((row) => {
    if (row.roll.includes("-")) {
      const [minRaw, maxRaw] = row.roll.split("-");
      const min = Number.parseInt(minRaw.trim(), 10);
      const max = Number.parseInt(maxRaw.trim(), 10);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return roll >= min && roll <= max;
      }
    }
    return Number.parseInt(row.roll, 10) === roll;
  });
}

export function findEncounterByRoll(
  encounters: LevelTier["encounters"],
  roll: number,
) {
  return encounters.find((enc) => {
    if (enc.roll.includes("-")) {
      const [minRaw, maxRaw] = enc.roll.split("-");
      const min = Number.parseInt(minRaw.trim(), 10);
      const max = Number.parseInt(maxRaw.trim(), 10);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return roll >= min && roll <= max;
      }
    }
    return Number.parseInt(enc.roll, 10) === roll;
  });
}

export function findWeatherByRoll(
  weatherTable: NonNullable<Environment["weatherTable"]>,
  roll: number,
) {
  return weatherTable.find((row) => {
    if (row.roll.includes("-")) {
      const [minRaw, maxRaw] = row.roll.split("-");
      const min = Number.parseInt(minRaw.trim(), 10);
      const max = Number.parseInt(maxRaw.trim(), 10);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return roll >= min && roll <= max;
      }
    }
    return Number.parseInt(row.roll, 10) === roll;
  });
}
