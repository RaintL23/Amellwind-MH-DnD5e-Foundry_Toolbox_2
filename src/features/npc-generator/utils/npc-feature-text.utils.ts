import type { Species } from "@/shared/types";
import type { NpcTemplate } from "@/shared/types/npc.types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

/**
 * Build the pronoun-replacement subject reference for a generated NPC.
 *
 * With a custom name ("Kael") → "Kael"
 * Without → "the Dragonborn Knight" / "the Kushala Daora warden"
 */
export function buildNpcSubjectRef(
  customName: string,
  species: Species,
  template: NpcTemplate,
): string {
  if (customName.trim()) return customName.trim();
  return `the ${species.name} ${template.name.toLowerCase()}`;
}

/**
 * Rewrite feature text sourced from species/background data (which uses
 * second-person "you/your") into third-person NPC prose.
 *
 * E.g. "You can breathe fire" → "Kael can breathe fire"
 *      "Your AC is 17"       → "The Kushala Daora warden's AC is 17"
 */
export function toNpcFeatureText(text: string, subjectRef: string): string {
  let result = parseFiveToolsMarkup(text);

  // Multi-word phrases first (order matters to avoid partial replacements)
  result = result.replace(/\byou and all allies\b/gi, `${subjectRef} and each ally`);
  result = result.replace(/\byou,\s*and all allies\b/gi, `${subjectRef} and each ally`);
  result = result.replace(/\byou are\b/gi, `${subjectRef} is`);
  result = result.replace(/\byou have\b/gi, `${subjectRef} has`);
  result = result.replace(/\byou can\b/gi, `${subjectRef} can`);
  result = result.replace(/\byou gain\b/gi, `${subjectRef} gains`);
  result = result.replace(/\byou deal\b/gi, `${subjectRef} deals`);
  result = result.replace(/\byou take\b/gi, `${subjectRef} takes`);
  result = result.replace(/\byou make\b/gi, `${subjectRef} makes`);
  result = result.replace(/\byou roll\b/gi, `${subjectRef} rolls`);
  result = result.replace(/\byou use\b/gi, `${subjectRef} uses`);
  result = result.replace(/\byou ignore\b/gi, `${subjectRef} ignores`);

  // Generic fallbacks
  result = result.replace(/\byou\b/gi, subjectRef);
  result = result.replace(/\byour\b/gi, `${subjectRef}'s`);
  result = result.replace(/\byourself\b/gi, `${subjectRef}self`);

  return result.charAt(0).toUpperCase() + result.slice(1);
}
