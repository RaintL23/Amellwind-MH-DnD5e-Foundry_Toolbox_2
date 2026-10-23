import type { Species } from "@/shared/types";
import type { NpcTemplate } from "@/shared/types/npc.types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Capitalize subject ref when it starts a sentence. */
export function formatSubjectAtSentenceStart(subjectRef: string): string {
  if (!subjectRef) return subjectRef;
  if (subjectRef.startsWith("the ")) {
    return `T${subjectRef.slice(1)}`;
  }
  return subjectRef.charAt(0).toUpperCase() + subjectRef.slice(1);
}

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

const TEMPLATE_ROLE_NOUN_PATTERN =
  /\b[Tt]he ([a-z]+(?:\s+[a-z]+)?)\s+(?:has|is|are|can|adds|knows|deals|must|makes|casts|utter)\b/g;

/** Role nouns used in template trait/reaction prose (e.g. "knight", "war chanter"). */
export function getTemplateRoleNouns(template: NpcTemplate): string[] {
  const nouns = new Set<string>();

  const srdName = template.srdReference.split("|")[0]?.trim();
  if (srdName) nouns.add(srdName.toLowerCase());

  const lastWord = template.name.split(/\s+/).pop()?.toLowerCase();
  if (lastWord) nouns.add(lastWord);

  const texts: string[] = [];
  for (const trait of template.traits) texts.push(...trait.entries);
  for (const reaction of template.reactions ?? []) texts.push(...reaction.entries);

  for (const text of texts) {
    for (const match of text.matchAll(TEMPLATE_ROLE_NOUN_PATTERN)) {
      nouns.add(match[1].toLowerCase());
    }
  }

  return [...nouns];
}

function replaceTemplateRoleNouns(
  text: string,
  subjectRef: string,
  roleNouns: string[],
): string {
  const sorted = [...roleNouns].sort((a, b) => b.length - a.length);

  let result = text;
  for (const noun of sorted) {
    const escaped = escapeRegex(noun);
    result = result.replace(
      new RegExp(`\\bThe ${escaped}\\b`, "g"),
      formatSubjectAtSentenceStart(subjectRef),
    );
    result = result.replace(
      new RegExp(`\\bthe ${escaped}\\b`, "g"),
      subjectRef,
    );
  }
  return result;
}

/**
 * Rewrite feature text sourced from species/background/template/weapon data
 * into third-person NPC prose for the generated stat block.
 *
 * E.g. "You can breathe fire"     → "Kael can breathe fire"
 *      "The knight has advantage" → "Fiora has advantage"
 *      "{@condition frightened}"  → "frightened"
 */
export function toNpcFeatureText(
  text: string,
  subjectRef: string,
  roleNouns: string[] = [],
): string {
  let result = parseFiveToolsMarkup(text);

  if (roleNouns.length > 0) {
    result = replaceTemplateRoleNouns(result, subjectRef, roleNouns);
  }

  // Multi-word phrases first (order matters to avoid partial replacements)
  result = result.replace(/\byou and all allies\b/gi, `${subjectRef} and each ally`);
  result = result.replace(/\byou,\s*and all allies\b/gi, `${subjectRef} and each ally`);
  result = result.replace(/\byou're\b/gi, `${subjectRef} is`);
  result = result.replace(/\byou've\b/gi, `${subjectRef} has`);

  // Compound predicates of a "you" subject ("you are falling and aren't …").
  result = result.replace(/[^.!?]+[.!?]*/g, (sentence) =>
    /\byou\b/i.test(sentence)
      ? sentence.replace(
          /\b(and|or)\s+(are|aren't|have)\b/gi,
          (_m, conj: string, verb: string) =>
            `${conj} ${IRREGULAR_VERBS[verb.toLowerCase()]}`,
        )
      : sentence,
  );

  // "you" as a subject: third-person verb agreement ("when you hit" → "when Kael hits").
  result = result.replace(
    SUBJECT_YOU_PATTERN,
    (_match, lead: string, adverb: string | undefined, verb: string) => {
      const atSentenceStart = lead.trim() === "" || /[.!?:]\s*$/.test(lead);
      const subject = atSentenceStart
        ? formatSubjectAtSentenceStart(subjectRef)
        : subjectRef;
      return `${lead}${subject}${adverb ?? ""} ${toThirdPersonVerb(verb)}`;
    },
  );

  // Generic fallbacks
  result = result.replace(/\byourself\b/gi, "itself");
  result = result.replace(/\byou\b/gi, subjectRef);
  result = result.replace(/\byour\b/gi, `${subjectRef}'s`);

  // Inserted "the …" subjects that now begin a sentence.
  result = result.replace(/([.!?]\s+)the\b/g, "$1The");

  return result.charAt(0).toUpperCase() + result.slice(1);
}

const SUBJECT_YOU_PATTERN =
  /(^|[.!?;:(]\s*|,\s*|\b(?:when|whenever|if|while|and|or|that|as|until|unless|before|after|once|where|but|so|then)\s+)you(\s+(?:also|now|then|still|only|instead|automatically|immediately|always|never|first|no longer)\b)?\s+([a-z']+)/gi;

const IRREGULAR_VERBS: Record<string, string> = {
  are: "is",
  "aren't": "isn't",
  were: "was",
  "weren't": "wasn't",
  have: "has",
  "haven't": "hasn't",
  do: "does",
  "don't": "doesn't",
  go: "goes",
};

/** Modals, past forms and words that aren't verbs keep their form. */
const KEEP_FORM = new Set([
  "can",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "may",
  "might",
  "must",
  "shall",
  "should",
  "will",
  "won't",
  "would",
  "wouldn't",
  "had",
  "did",
  "no",
  "not",
  "didn't",
  "and",
  "or",
  "in",
  "to",
  "with",
  "within",
  "of",
  "a",
  "an",
  "the",
  "as",
  "that",
  "who",
  "if",
  "by",
  "for",
  "on",
  "at",
  "from",
  "into",
]);

function toThirdPersonVerb(verb: string): string {
  const lower = verb.toLowerCase();
  if (IRREGULAR_VERBS[lower]) return IRREGULAR_VERBS[lower];
  if (KEEP_FORM.has(lower) || /ed$/.test(lower) || lower.includes("'")) {
    return verb;
  }
  if (/[^aeiou]y$/.test(lower)) return `${verb.slice(0, -1)}ies`;
  if (/(?:s|sh|ch|x|z|o)$/.test(lower)) return `${verb}es`;
  return `${verb}s`;
}
