import type { Entry, SkillKey } from "@/shared/types";
import type { Background } from "@/shared/types";
import type { Species } from "@/shared/types";
import type { NpcHideFeatures, NpcTemplate } from "@/shared/types/npc.types";

const SKIP_SPECIES_TRAIT_NAMES = new Set([
  "Age",
  "Size",
  "Speed",
  "Languages",
  "Ability Score Increase",
  "Ability Scores",
  "Ability Modifiers",
]);

const SKILL_NAME_TO_KEY: Record<string, SkillKey> = {
  acrobatics: "acr",
  "animal handling": "ani",
  arcana: "arc",
  athletics: "ath",
  deception: "dec",
  history: "his",
  insight: "ins",
  intimidation: "itm",
  investigation: "inv",
  medicine: "med",
  nature: "nat",
  perception: "prc",
  performance: "prf",
  persuasion: "per",
  religion: "rel",
  "sleight of hand": "slt",
  stealth: "ste",
  survival: "sur",
};

export function parseBackgroundSkills(summary: string): SkillKey[] {
  const keys = new Set<SkillKey>();
  const normalized = summary.toLowerCase();

  for (const [name, key] of Object.entries(SKILL_NAME_TO_KEY)) {
    if (normalized.includes(name)) keys.add(key);
  }

  return [...keys];
}

export function buildNpcTraits(
  template: NpcTemplate,
  species: Species,
  background: Background | null,
  hideFeatures: NpcHideFeatures,
): Entry[] {
  const traits: Entry[] = [];

  if (hideFeatures !== "template") {
    for (const t of template.traits) {
      traits.push({ name: t.name, entries: t.entries });
    }
  }

  if (hideFeatures !== "racial") {
    for (const trait of species.traits) {
      if (SKIP_SPECIES_TRAIT_NAMES.has(trait.name)) continue;
      traits.push({
        name: trait.name,
        entries: trait.entries,
        content: trait.content,
      });
    }

    if (species.resistances.length > 0) {
      traits.push({
        name: "Damage Resistance",
        entries: [
          species.resistanceSummary ||
            `Resistant to ${species.resistances.join(", ")} damage.`,
        ],
      });
    }
  }

  if (hideFeatures !== "background" && background) {
    const feature = background.features.find((f) =>
      /feature:/i.test(f.name) || /guild membership|patron|feature/i.test(f.name),
    ) ?? background.features[0];

    if (feature) {
      traits.push({
        name: feature.name.replace(/^Feature:\s*/i, ""),
        entries: feature.entries,
        content: feature.content,
      });
    }
  }

  return traits;
}
