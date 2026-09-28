import type { DamageType, Feat } from "@/shared/types";

const DAMAGE_TYPE_ALIASES: Array<{ type: DamageType; pattern: RegExp }> = [
  { type: "acid", pattern: /\bacids?\b/i },
  { type: "cold", pattern: /\bcolds?\b/i },
  { type: "fire", pattern: /\bfires?\b/i },
  { type: "lightning", pattern: /\blightnings?\b/i },
  { type: "thunder", pattern: /\bthunders?\b/i },
  { type: "poison", pattern: /\bpoisons?\b/i },
  { type: "necrotic", pattern: /\bnecrotic\b/i },
  { type: "radiant", pattern: /\bradiant\b/i },
  { type: "psychic", pattern: /\bpsychic\b/i },
  { type: "force", pattern: /\bforce\b/i },
];

const DAMAGE_TYPE_LABELS: Partial<Record<DamageType, string>> = {
  acid: "Acid",
  cold: "Cold",
  fire: "Fire",
  lightning: "Lightning",
  thunder: "Thunder",
  poison: "Poison",
  necrotic: "Necrotic",
  radiant: "Radiant",
  psychic: "Psychic",
  force: "Force",
};

function featPlainCorpus(feat: Feat): string {
  const parts = [...feat.paragraphs];
  for (const section of feat.sections) {
    if (section.name) parts.push(section.name);
    parts.push(...section.paragraphs);
  }
  return parts.join("\n");
}

/**
 * Damage types offered by feats like Elemental Adept ("Choose one of the
 * following damage types: Acid, Cold, …").
 */
export function parseFeatDamageTypeOptions(feat: Feat): DamageType[] | null {
  const text = featPlainCorpus(feat);
  const match = text.match(
    /choose one of the following damage types:\s*([^.]+)/i,
  );
  if (!match?.[1]) return null;

  const list = match[1];
  const found: DamageType[] = [];
  for (const { type, pattern } of DAMAGE_TYPE_ALIASES) {
    if (pattern.test(list) && !found.includes(type)) found.push(type);
  }
  return found.length >= 2 ? found : null;
}

export function featDamageTypeLabel(type: DamageType): string {
  return DAMAGE_TYPE_LABELS[type] ?? type;
}

/** Rewrite feat text so the chosen damage type is explicit and list noise drops. */
export function applyFeatDamageTypeChoiceToText(
  text: string,
  choice: DamageType | null | undefined,
  options: DamageType[] | null | undefined,
): string {
  if (!choice || !options?.length) return text;
  const label = featDamageTypeLabel(choice);
  const listPattern =
    /choose one of the following damage types:\s*[^.]+(?:\.|$)/gi;
  const replaced = text.replace(
    listPattern,
    `Your chosen damage type is ${label}.`,
  );
  if (replaced !== text) return replaced;
  return `${text.trim()}\n\nChosen damage type: ${label}`.trim();
}

export function isFeatDamageTypeChoiceComplete(
  feat: Feat,
  choice: DamageType | null | undefined,
): boolean {
  const options = parseFeatDamageTypeOptions(feat);
  if (!options) return true;
  return Boolean(choice && options.includes(choice));
}
