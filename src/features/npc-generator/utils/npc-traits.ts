import type { Entry, SkillKey } from "@/shared/types";
import type { Background } from "@/shared/types";
import type { Species } from "@/shared/types";
import type { NpcHideFeatures, NpcTemplate } from "@/shared/types/npc.types";
import { getTemplateRoleNouns, toNpcFeatureText } from "./npc-feature-text.utils";
import { SKILL_NAME_TO_KEY } from "@/shared/constants/dnd";

const SKIP_SPECIES_TRAIT_NAMES = new Set([
  "Age",
  "Size",
  "Speed",
  "Languages",
  "Ability Score Increase",
  "Ability Scores",
  "Ability Modifiers",
]);

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
  /** Used to rewrite second-person trait text to third-person NPC prose. */
  subjectRef = "the creature",
): Entry[] {
  const traits: Entry[] = [];
  const roleNouns = getTemplateRoleNouns(template);

  if (!hideFeatures.includes("template")) {
    for (const t of template.traits) {
      // Skip the static Spellcasting trait — it will be replaced by the
      // structured SpellcastingBlock generated separately.
      if (t.name === "Spellcasting") continue;
      traits.push({
        name: t.name,
        entries: t.entries.map((e) => toNpcFeatureText(e, subjectRef, roleNouns)),
      });
    }
  }

  if (!hideFeatures.includes("racial")) {
    for (const trait of species.traits) {
      if (SKIP_SPECIES_TRAIT_NAMES.has(trait.name)) continue;
      traits.push({
        name: trait.name,
        entries: trait.entries.map((e) => toNpcFeatureText(e, subjectRef)),
        content: trait.content,
      });
    }

    if (species.resistances.length > 0) {
      const resistText =
        species.resistanceSummary ||
        `${subjectRef.charAt(0).toUpperCase() + subjectRef.slice(1)} is resistant to ${species.resistances.join(", ")} damage.`;
      traits.push({
        name: "Damage Resistance",
        entries: [resistText],
      });
    }
  }

  if (!hideFeatures.includes("background") && background) {
    const feature =
      background.features.find(
        (f) =>
          /feature:/i.test(f.name) ||
          /guild membership|patron|feature/i.test(f.name),
      ) ?? background.features[0];

    if (feature) {
      traits.push({
        name: feature.name.replace(/^Feature:\s*/i, ""),
        entries: feature.entries.map((e) => toNpcFeatureText(e, subjectRef)),
        content: feature.content,
      });
    }
  }

  return traits;
}
