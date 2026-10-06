import type { SpeciesTrait } from "@/shared/types";

export interface NaturalArmorRule {
  featureName: string;
  sourceName: string;
  baseAc: number;
  includesDex: boolean;
  /** Worn armor grants no benefit; natural AC still applies. */
  blocksArmor: boolean;
  allowsShield: boolean;
}

type NaturalArmorTemplate = Omit<NaturalArmorRule, "featureName" | "sourceName">;

const NATURAL_ARMOR_BY_SPECIES: Record<string, NaturalArmorTemplate> = {
  tortle: {
    baseAc: 17,
    includesDex: false,
    blocksArmor: true,
    allowsShield: true,
  },
};

function parseNaturalArmorText(
  text: string,
): Omit<NaturalArmorRule, "featureName" | "sourceName"> | null {
  const normalized = text.toLowerCase();

  const blocksArmor =
    /no benefit from wearing armor/.test(normalized) ||
    /ill-suited to wearing armor/.test(normalized) ||
    /can't wear armor/.test(normalized);

  const whileUnarmored =
    /while you aren't wearing armor/.test(normalized) ||
    /while not wearing armor/.test(normalized);

  const allowsShield =
    /shield.*bonus.*normal/.test(normalized) ||
    /using a shield.*apply/.test(normalized) ||
    /apply the shield's bonus/.test(normalized);

  const dexIgnored = /dexterity modifier doesn't affect/.test(normalized);

  const fixedMatch = normalized.match(/base ac of (\d+)/);
  if (fixedMatch) {
    return {
      baseAc: Number(fixedMatch[1]),
      includesDex: !dexIgnored,
      blocksArmor,
      allowsShield: allowsShield || blocksArmor,
    };
  }

  const formulaMatch = normalized.match(
    /(?:ac is|armor class is|your ac equals) (\d+) \+ your dexterity modifier/,
  );
  if (formulaMatch) {
    return {
      baseAc: Number(formulaMatch[1]),
      includesDex: true,
      blocksArmor: blocksArmor || whileUnarmored,
      allowsShield: allowsShield || !blocksArmor,
    };
  }

  return null;
}

export function detectNaturalArmorFromTraits(
  traits: SpeciesTrait[],
  sourceName: string,
): NaturalArmorRule | null {
  for (const trait of traits) {
    const text = trait.entries.join(" ");
    const parsed = parseNaturalArmorText(text);
    if (parsed) {
      return {
        featureName: trait.name,
        sourceName,
        ...parsed,
      };
    }
  }

  const fallback = NATURAL_ARMOR_BY_SPECIES[sourceName.toLowerCase()];
  if (!fallback) return null;

  return {
    featureName: "Natural Armor",
    sourceName,
    ...fallback,
  };
}
