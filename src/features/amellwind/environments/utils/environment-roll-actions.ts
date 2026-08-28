import type { Environment, LevelTier } from "@/shared/types";
import {
  findEncounterByRoll,
  findWeatherByRoll,
  rollDie,
  rollD20WithMode,
  type RollMode,
} from "./environmentRoll.utils";

export interface EnvironmentRollResult {
  label: string;
  details: string;
  result: string;
  success?: boolean;
}

export interface EnvironmentRollContext {
  environment: Environment;
  tier: LevelTier;
  skillMod: number;
  rollMode: RollMode;
}

function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function createEnvironmentNavigationRoll(
  context: EnvironmentRollContext,
): EnvironmentRollResult {
  const d20 = rollD20WithMode(context.rollMode);
  const total = d20.selected + context.skillMod;
  const success = total >= context.environment.navigationDC;
  return {
    label: "Navigation Check",
    details: `d20 ${d20.rolls.join(" / ")} (${context.rollMode}) ${formatMod(context.skillMod)}`,
    result: `Total ${total} vs DC ${context.environment.navigationDC}`,
    success,
  };
}

export function createEnvironmentInvestigationRoll(
  context: EnvironmentRollContext,
): EnvironmentRollResult {
  const d20 = rollD20WithMode(context.rollMode);
  const total = d20.selected + context.skillMod;
  const success = total >= context.environment.investigationDC;
  return {
    label: "Investigation Check",
    details: `d20 ${d20.rolls.join(" / ")} (${context.rollMode}) ${formatMod(context.skillMod)}`,
    result: `Total ${total} vs DC ${context.environment.investigationDC}`,
    success,
  };
}

export function createEnvironmentEncounterRoll(
  context: EnvironmentRollContext,
): EnvironmentRollResult {
  const encounterCheck = rollDie(20);
  const triggered = encounterCheck >= context.environment.encounterDC;
  if (!triggered) {
    return {
      label: "Encounter Check",
      details: `d20 ${encounterCheck} vs Encounter DC ${context.environment.encounterDC}`,
      result: "No encounter triggered.",
      success: false,
    };
  }

  const encounterRoll = rollDie(10);
  const encounter = findEncounterByRoll(context.tier.encounters, encounterRoll);
  return {
    label: "Encounter Check",
    details: `d20 ${encounterCheck} >= DC ${context.environment.encounterDC}; d10 ${encounterRoll}`,
    result: encounter
      ? `Encounter: ${encounter.description}`
      : "Encounter triggered but no matching row was found.",
    success: true,
  };
}

export function createEnvironmentWeatherRoll(
  context: EnvironmentRollContext,
): EnvironmentRollResult {
  if (!context.environment.weatherTable?.length) {
    return {
      label: "Weather Roll",
      details: "No weather table for this environment.",
      result: "No weather roll available.",
    };
  }

  const weatherRoll = rollDie(20);
  const weather = findWeatherByRoll(
    context.environment.weatherTable,
    weatherRoll,
  );
  return {
    label: "Weather Roll",
    details: `d20 ${weatherRoll}`,
    result: weather ? weather.weather : "No weather row matched that roll.",
  };
}

export function createScoutStealthRoll(
  skillMod: number,
  rollMode: RollMode,
): EnvironmentRollResult {
  const d20 = rollD20WithMode(rollMode);
  const total = d20.selected + skillMod;
  return {
    label: "Scout Stealth",
    details: `d20 ${d20.rolls.join(" / ")} (${rollMode}) ${formatMod(skillMod)}`,
    result: `Stealth total ${total}`,
    success: true,
  };
}

export function createScoutPerceptionRoll(
  skillMod: number,
  rollMode: RollMode,
): EnvironmentRollResult {
  const d20 = rollD20WithMode(rollMode);
  const total = d20.selected + skillMod;
  return {
    label: "Scout Perception",
    details: `d20 ${d20.rolls.join(" / ")} (${rollMode}) ${formatMod(skillMod)}`,
    result: `Perception total ${total}`,
    success: true,
  };
}

export function createSpotterPassivePerceptionCheck(
  passivePerception: number,
  ambushDc: number,
  scoutAmbushBonus: boolean,
): EnvironmentRollResult {
  const bonusNote = scoutAmbushBonus ? " (+4 Scout ambush warning)" : "";
  const success = passivePerception >= ambushDc;
  return {
    label: "Spotter Passive Perception",
    details: `Passive Perception ${passivePerception}${bonusNote} vs ambush DC ${ambushDc}`,
    result: success
      ? "The spotter notices a potential ambush or hidden threat."
      : "No ambush detected at passive Perception.",
    success,
  };
}

export function createSpotterPassiveInvestigationCheck(
  passiveInvestigation: number,
  investigationDc: number,
): EnvironmentRollResult {
  const success = passiveInvestigation >= investigationDc;
  return {
    label: "Spotter Passive Investigation",
    details: `Passive Investigation ${passiveInvestigation} vs area DC ${investigationDc}`,
    result: success
      ? "The spotter spots gatherable resources without an active search."
      : "No resources spotted passively.",
    success,
  };
}
