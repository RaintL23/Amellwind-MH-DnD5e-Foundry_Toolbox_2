import type { Entry, SkillKey } from "@/shared/types";
import type { Background } from "@/shared/types";
import type { Species } from "@/shared/types";
import type { NpcHideFeatures, NpcTemplate } from "@/shared/types/npc.types";
import { getTemplateRoleNouns, toNpcFeatureText } from "./npc-feature-text.utils";
import { SKILL_NAME_TO_KEY } from "@/shared/constants/dnd";
import { mapStatBlockContentText } from "@/shared/utils/statblock-entries.mapper";

const SKIP_SPECIES_TRAIT_NAMES = new Set([
  "Age",
  "Size",
  "Speed",
  "Languages",
  "Ability Score Increase",
  "Ability Scores",
  "Ability Modifiers",
  "Alignment",
  "Creature Type",
  "Tool Proficiency",
]);

const SKILL_TRAIT_NAME = /^skill (?:proficiency|proficiencies|versatility)$/i;

/** Single fixed skill granted by a species trait ("You have proficiency in the Acrobatics skill"). */
function getSpeciesTraitSkill(trait: Entry): SkillKey | null {
  if (!SKILL_TRAIT_NAME.test(trait.name)) return null;
  const skills = parseBackgroundSkills(trait.entries.join(" "));
  return skills.length === 1 ? skills[0] : null;
}

export function parseSpeciesSkills(species: Species): SkillKey[] {
  return species.traits
    .map(getSpeciesTraitSkill)
    .filter((key): key is SkillKey => key !== null);
}

/** Rewrites both text representations; the stat block renders `content` when present. */
function toNpcEntry(entry: Entry, subjectRef: string): Entry {
  const rewrite = (text: string) => toNpcFeatureText(text, subjectRef);
  return {
    name: entry.name,
    entries: entry.entries.map(rewrite),
    content: entry.content
      ? mapStatBlockContentText(entry.content, rewrite)
      : undefined,
  };
}

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
      // Fixed skill grants are applied to the Skills line instead.
      if (getSpeciesTraitSkill(trait)) continue;
      traits.push(toNpcEntry(trait, subjectRef));
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
        ...toNpcEntry(feature, subjectRef),
        name: feature.name.replace(/^Feature:\s*/i, ""),
      });
    }
  }

  return traits;
}
