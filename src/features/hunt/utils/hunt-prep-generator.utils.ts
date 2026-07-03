import type { Background, Environment, Monster, Species } from "@/shared/types";
import type { LevelTier } from "@/shared/types/environment.types";
import { parseCR } from "@/shared/utils/cr.utils";
import { getNpcTemplateById } from "@/features/npc-generator/services/npc-generator.service";
import { buildNpcFromDraft } from "@/features/npc-generator/utils/build-npc";
import { buildNpcDescriptor } from "@/features/npc-generator/utils/npc-descriptor";
import {
  createDefaultNpcDraft,
  randomGender,
  randomNpcName,
} from "@/features/npc-generator/utils/npc-randomizer";
import { pickRandom } from "./hunt-roll.utils";
import {
  createPrepEntry,
  type HuntPrepTables,
} from "../data/hunt-prep-defaults.data";

export type HuntEncounterDifficulty = "easier" | "normal" | "harder";

export interface GenerateHuntPrepInput {
  target: Monster;
  environment: Environment;
  tier: LevelTier;
  difficulty: HuntEncounterDifficulty;
  allMonsters: Monster[];
  species: Species[];
  backgrounds: Background[];
}

const FRIENDLY_NPC_TEMPLATE_IDS = [
  "free-hunter",
  "guild-scout",
  "hermit-tracker",
  "troverian-artisan",
  "village-elder",
  "pathfinder",
  "handler-aide",
] as const;

const PREY_MONSTERS = [
  "Aptonoth",
  "Kelbi",
  "Gargwa",
  "Rhenoplos",
  "Anteka",
  "Slagtoth",
  "Popo",
  "Moofah",
];

function parseMonsterNames(csv: string): string[] {
  return csv
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function findMonsterByName(name: string, catalog: Monster[]): Monster | undefined {
  const normalized = name.toLowerCase();
  return catalog.find((monster) => monster.name.toLowerCase() === normalized);
}

function resolveMonstersFromNames(
  names: string[],
  catalog: Monster[],
): Monster[] {
  const seen = new Set<string>();
  const resolved: Monster[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    const monster = findMonsterByName(name, catalog);
    if (monster) {
      seen.add(key);
      resolved.push(monster);
    }
  }
  return resolved;
}

/** Carve benefit must always grant at least one carve roll. */
function getCarveRollCount(monster: Monster | null | undefined): number {
  const rolls = monster?.loot?.rolls;
  if (rolls == null || rolls < 1) return 1;
  return rolls;
}

function hasCarveTable(monster: Monster): boolean {
  return (monster.loot?.rolls ?? 0) > 0;
}

function pickCarvableCorpseMonster(
  tier: LevelTier,
  catalog: Monster[],
  targetCr: number,
  targetName: string,
): Monster | null {
  const names = [
    ...parseMonsterNames(tier.commonLargeMonsters),
    ...parseMonsterNames(tier.commonSmallMonsters),
  ];
  const resolved = resolveMonstersFromNames(names, catalog).filter(
    (monster) => monster.name.toLowerCase() !== targetName.toLowerCase(),
  );
  if (resolved.length === 0) return null;

  const harder = resolved.filter(
    (monster) => parseCR(monster.cr) > targetCr + 0.25,
  );
  const harderWithCarves = harder.filter(hasCarveTable);
  if (harderWithCarves.length > 0) return pickRandom(harderWithCarves);

  const anyWithCarves = resolved.filter(hasCarveTable);
  if (anyWithCarves.length > 0) return pickRandom(anyWithCarves);

  if (harder.length > 0) return pickRandom(harder);
  return pickRandom(resolved);
}

function matchesDifficulty(
  monsterCr: number,
  targetCr: number,
  difficulty: HuntEncounterDifficulty,
): boolean {
  switch (difficulty) {
    case "easier":
      return monsterCr < targetCr - 0.25;
    case "normal":
      return Math.abs(monsterCr - targetCr) <= 2;
    case "harder":
      return monsterCr > targetCr + 0.25;
  }
}

function pickFromEnvironmentPool(
  tier: LevelTier,
  catalog: Monster[],
  targetCr: number,
  difficulty: HuntEncounterDifficulty,
  size: "small" | "large" | "any",
  excludeNames: string[] = [],
): Monster | null {
  const exclude = new Set(excludeNames.map((name) => name.toLowerCase()));
  const small = parseMonsterNames(tier.commonSmallMonsters);
  const large = parseMonsterNames(tier.commonLargeMonsters);
  const names =
    size === "small" ? small : size === "large" ? large : [...small, ...large];

  const resolved = resolveMonstersFromNames(names, catalog).filter(
    (monster) => !exclude.has(monster.name.toLowerCase()),
  );

  const filtered = resolved.filter((monster) =>
    matchesDifficulty(parseCR(monster.cr), targetCr, difficulty),
  );
  const pool = filtered.length > 0 ? filtered : resolved;
  return pickRandom(pool);
}

function pickPreyName(tier: LevelTier, catalog: Monster[]): string {
  const smallNames = parseMonsterNames(tier.commonSmallMonsters);
  const fromEnv = pickRandom(
    resolveMonstersFromNames(smallNames, catalog).map((monster) => monster.name),
  );
  if (fromEnv) return fromEnv;
  return pickRandom(PREY_MONSTERS) ?? "herbivore";
}

function pickEncounterDescriptions(
  tier: LevelTier,
  count: number,
): string[] {
  const shuffled = [...tier.encounters].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((row) => row.description);
}

function pickSpecialRuleHazard(environment: Environment): string | null {
  const rule = pickRandom(environment.specialRules);
  if (!rule) return null;
  return `${rule.name}: ${rule.description}`;
}

async function buildFriendlyNpcEntry(
  target: Monster,
  environment: Environment,
  species: Species[],
  backgrounds: Background[],
): Promise<string> {
  const templateId = pickRandom([...FRIENDLY_NPC_TEMPLATE_IDS]) ?? "free-hunter";
  const template = getNpcTemplateById(templateId);
  if (!template) {
    return `A friendly hunter offers rumors about ${target.name} in ${environment.name}.`;
  }

  const draft = createDefaultNpcDraft(species, backgrounds);
  const gender = randomGender();
  const speciesEntry =
    species.find((entry) => entry.id === draft.speciesId) ?? species[0];
  const background =
    backgrounds.find((entry) => entry.id === draft.backgroundId) ?? null;
  if (!speciesEntry) {
    return `A friendly ${template.name} offers help tracking ${target.name}.`;
  }

  const name = await randomNpcName(species, {
    speciesId: speciesEntry.id,
    gender,
  });
  const finalDraft = {
    ...draft,
    templateId,
    gender,
    customName: name,
    speciesId: speciesEntry.id,
    backgroundId: background?.id ?? "",
  };
  const npc = buildNpcFromDraft(
    finalDraft,
    template,
    speciesEntry,
    background,
    undefined,
    null,
  );
  const descriptor = buildNpcDescriptor(
    gender,
    speciesEntry,
    template,
    background,
  );

  return [
    `Friendly NPC: ${npc.name} — ${descriptor}.`,
    `CR ${npc.cr}, AC ${npc.armorClass}, HP ${npc.hp.average ?? "?"}.`,
    `They share a lead on ${target.name} in ${environment.name} and may trade supplies or escort the party briefly.`,
    "Use the NPC Generator (/npc-generator) to expand this character.",
  ].join(" ");
}

function toTableEntries(texts: string[]): HuntPrepTables["signs"] {
  return texts.map((text) => createPrepEntry(text));
}

export async function generateHuntPrepTables(
  input: GenerateHuntPrepInput,
): Promise<HuntPrepTables> {
  const { target, environment, tier, difficulty, allMonsters, species, backgrounds } =
    input;
  const targetCr = parseCR(target.cr);
  const prey = pickPreyName(tier, allMonsters);
  const similar =
    pickFromEnvironmentPool(tier, allMonsters, targetCr, "normal", "large", [
      target.name,
    ])?.name ?? pickFromEnvironmentPool(tier, allMonsters, targetCr, "normal", "any", [target.name])?.name ?? "similar predator";

  const minorMonster =
    pickFromEnvironmentPool(tier, allMonsters, targetCr, difficulty, "small")?.name ??
    pickRandom(parseMonsterNames(tier.commonSmallMonsters)) ??
    "local wildlife";
  const normalThreat =
    pickFromEnvironmentPool(tier, allMonsters, targetCr, difficulty, "large")?.name ??
    pickRandom(parseMonsterNames(tier.commonLargeMonsters)) ??
    similar;
  const majorThreat =
    pickFromEnvironmentPool(tier, allMonsters, targetCr, "harder", "large")?.name ??
    normalThreat;
  const carveTarget =
    pickCarvableCorpseMonster(tier, allMonsters, targetCr, target.name) ??
    pickFromEnvironmentPool(tier, allMonsters, targetCr, "harder", "any", [
      target.name,
    ]) ??
    pickFromEnvironmentPool(tier, allMonsters, targetCr, "normal", "large", [
      target.name,
    ]);

  const carveMonster = carveTarget?.name ?? majorThreat;
  const carveCr = carveTarget?.cr ?? "?";
  const carveRolls = getCarveRollCount(carveTarget);

  const encounterSamples = pickEncounterDescriptions(tier, 3);
  const hazard = pickSpecialRuleHazard(environment);
  const friendlyNpc = await buildFriendlyNpcEntry(
    target,
    environment,
    species,
    backgrounds,
  );

  const signs = [
    `${target.name} left deep tracks in the soil, heading toward denser terrain.`,
    `A fresh kill: ${target.name} partially devoured a ${prey}; blood and scraps are still warm.`,
    `Territorial markings from ${target.name} — gouges and scale rubbings on stone and bark.`,
    `A distant roar matching ${target.name} echoes across ${environment.name}.`,
    `Tufts of ${target.type.type} residue from ${target.name} cling to thorny brush.`,
    `${target.name} scuff marks show something heavy was dragged through the mud.`,
    `Broken scales from ${target.name} litter the ground near a watering hole.`,
    `The shadow of a ${target.name} passes overhead, briefly blotting out the sun.`,
  ];

  const minorChallenges = [
    `Signs of ${similar} crisscross the trail, pointing in conflicting directions.`,
    `Multiple ${target.name} signs split toward two different valleys — the trail forks.`,
    `A pack of ${minorMonster} blocks the safest route forward.`,
    `1 ${normalThreat} is feeding on a carcass ahead; it may notice the party.`,
    encounterSamples[0]
      ? `Environment encounter: ${encounterSamples[0]}`
      : `A sudden weather shift reduces visibility in ${environment.name}.`,
    encounterSamples[1]
      ? `Environment encounter: ${encounterSamples[1]}`
      : `A narrow ravine requires a group Athletics or Acrobatics check to cross safely.`,
    hazard
      ? `Minor hazard — ${hazard}`
      : `Loose terrain in ${environment.name} forces careful footing (Dexterity save or lose time).`,
    `Non-combat: Felyne scouts demand a small offering (materials or rations) to reveal a shortcut.`,
    `Non-combat: A lost caravan hand offers information in exchange for escort to the next safe camp.`,
  ];

  const majorChallenges = [
    `Hard encounter: ${majorThreat} (CR ${findMonsterByName(majorThreat, allMonsters)?.cr ?? "?"}) ambushes the party.`,
    encounterSamples[2]
      ? `Major environment event: ${encounterSamples[2]}`
      : `A deadly hazard sweeps the area — the party must spend resources or retreat.`,
    `False signs from ${similar} lead toward a hard encounter if the party follows them.`,
    `The party loses a ${target.name} sign and must backtrack or push forward blind.`,
    hazard
      ? `Major hazard — ${hazard}`
      : `Hostile non-combat: territorial hunters accuse the party of poaching in ${environment.name}.`,
  ];

  const benefits: string[] = [
    friendlyNpc,
    `Carvable corpse: a slain ${carveMonster} (CR ${carveCr}) can be carved ${carveRolls} time(s) for materials.`,
    `Hunter's cache hidden nearby: 2 potions of healing, 1 lifepowder, and trail rations.`,
    `Bonus resource node that does not count against the area's max resources for this hunt.`,
  ];

  if (environment.name === "Verdant Hills") {
    benefits.push(
      "Veggie Elder: a friendly elder offers bonus plants and a hint about the prey's last direction.",
    );
  }

  if (environment.name === "Snowy Mountains") {
    benefits.push(
      "Veggie Elder: a frost-hardened elder trades warm herbs and points toward fresh tracks.",
    );
  }

  return {
    signs: toTableEntries(signs),
    minorChallenges: toTableEntries(minorChallenges.slice(0, 10)),
    majorChallenges: toTableEntries(majorChallenges.slice(0, 4)),
    benefits: toTableEntries(benefits.slice(0, 5)),
  };
}

export const HUNT_ENCOUNTER_DIFFICULTY_LABELS: Record<
  HuntEncounterDifficulty,
  string
> = {
  easier: "Easier (lower CR local monsters)",
  normal: "Normal (similar CR to quarry)",
  harder: "Harder (higher CR local monsters)",
};
