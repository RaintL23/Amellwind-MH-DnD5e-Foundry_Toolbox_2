import type {
  Monster,
  MonstieDraft,
  MonstieSidekick,
  MonstieClassFeature,
  SkillKey,
} from "@/shared/types";
import { getAbilityModifier, formatModifier } from "@/shared/utils/cr.utils";
import { mapAbilitiesFromOriginal } from "./monstie-abilities";
import {
  getMonstieArmorClass,
  getMonstieHitPoints,
  getMonstieSenses,
  getMonstieSize,
  getMonstieSpeed,
  getSidekickProficiencyBonus,
  getMaxSkillSlots,
} from "./monstie-stats";
import { getSignatureAttackOptions } from "./monstie-actions";

const SKILL_LABELS: Record<string, string> = {
  acr: "Acrobatics",
  ani: "Animal Handling",
  arc: "Arcana",
  ath: "Athletics",
  dec: "Deception",
  his: "History",
  ins: "Insight",
  itm: "Intimidation",
  inv: "Investigation",
  med: "Medicine",
  nat: "Nature",
  prc: "Perception",
  prf: "Performance",
  per: "Persuasion",
  rel: "Religion",
  slt: "Sleight of Hand",
  ste: "Stealth",
  sur: "Survival",
};

export function buildMonstieFromDraft(
  draft: MonstieDraft,
  base: Monster,
  classFeatures: MonstieClassFeature[],
): MonstieSidekick {
  const level = Math.min(20, Math.max(1, draft.level));
  const abilities = mapAbilitiesFromOriginal(base.abilities);
  const pb = getSidekickProficiencyBonus(level);
  const maxSkills = getMaxSkillSlots(level, Object.keys(base.skills).length);
  const selectedSkills = draft.selectedSkills.slice(0, maxSkills);

  const skillAbility: Partial<Record<SkillKey, keyof typeof abilities>> = {
    ath: "str",
    acr: "dex",
    slt: "dex",
    ste: "dex",
    arc: "int",
    his: "int",
    inv: "int",
    rel: "int",
    dec: "cha",
    itm: "cha",
    per: "cha",
    prf: "cha",
    prc: "wis",
    ins: "wis",
    med: "wis",
    sur: "wis",
    ani: "wis",
    nat: "int",
  };

  const skills: Monster["skills"] = {};
  for (const key of selectedSkills) {
    const abilityKey = skillAbility[key] ?? "wis";
    const total = getAbilityModifier(abilities[abilityKey]) + pb;
    skills[key] = total as unknown as 0 | 1 | 2;
  }

  const signature = getSignatureAttackOptions(base).find(
    (a) => a.name === draft.signatureAttackName,
  );

  const selectedTraitEntries = base.traits.filter((t) =>
    draft.selectedTraits.includes(t.name),
  );
  const selectedCreatureEntries = [...base.traits, ...base.actions].filter(
    (e) => draft.selectedCreatureFeatures.includes(e.name),
  );

  const featuresUpToLevel = classFeatures.filter((f) => f.level <= level);

  const name =
    draft.customName.trim() ||
    `${base.shortName ?? base.name} Monstie (Lvl ${level})`;

  const passivePerception =
    10 +
    getAbilityModifier(abilities.wis) +
    (selectedSkills.includes("prc") ? getSidekickProficiencyBonus(level) : 0);

  const monstie: MonstieSidekick = {
    ...base,
    name,
    size: getMonstieSize(level),
    abilities,
    armorClass: getMonstieArmorClass(abilities, level),
    hp: getMonstieHitPoints(abilities, level),
    speed: getMonstieSpeed(base.speed, level),
    senses: getMonstieSenses(base.senses, level),
    skills,
    proficiencyBonus: pb,
    passivePerception,
    cr: `Sidekick ${level}`,
    level,
    baseMonsterName: base.name,
    classFeatures: featuresUpToLevel,
    traits: [
      ...selectedTraitEntries,
      {
        name: "Monstie Sidekick",
        entries: [
          `Based on ${base.name}. Consult the Monstie Sidekick rules (AGMH p.169) for signature attacks, improvements and restrictions.`,
        ],
      },
    ],
    actions: [
      ...(signature
        ? [
            {
              ...signature,
              name: `${signature.name} (Signature)`,
              entries: [
                ...signature.entries,
                `Uses and damage adjusted by PB (${pb}) according to Monstie Signature Attack.`,
              ],
            },
          ]
        : []),
      ...selectedCreatureEntries.map((e) => ({
        ...e,
        entries: [
          ...e.entries,
          "(Adjusted by Creature / Creature Improvement rules)",
        ],
      })),
    ],
    reactions: [],
    legendaryActions: undefined,
    group: undefined,
    environment: undefined,
    loot: undefined,
    languages:
      base.languages.length > 0
        ? [
            ...base.languages.filter((l) => !/common/i.test(l)),
            "understands Common but can't speak it",
          ]
        : ["understands Common but can't speak it"],
  };

  return monstie;
}

export function formatSkillsForDisplay(monstie: MonstieSidekick): string {
  const entries = Object.entries(monstie.skills);
  if (entries.length === 0) return "—";
  return entries
    .map(([k, v]) => {
      const label = SKILL_LABELS[k] ?? k;
      const mod = typeof v === "number" ? formatModifier(v) : String(v);
      return `${label} ${mod}`;
    })
    .join(", ");
}
