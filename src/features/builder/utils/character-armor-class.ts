import type {
  AbilityKey,
  Class,
  EquippedArmor,
  SpeciesTrait,
  Subclass,
} from "@/shared/types";
import { formatModifier } from "@/shared/utils/cr.utils";
import { ABILITY_SHORT_LABELS as ABILITY_LABELS } from "@/shared/constants/dnd";
import { isClothingArmor } from "../data/armor.data";
import { getFeaturesUpToLevel } from "./builder-class.utils";
import {
  detectNaturalArmorFromTraits,
  type NaturalArmorRule,
} from "./species-natural-armor";

interface UnarmoredDefenseRule {
  featureName: string;
  bonusAbility: AbilityKey;
  allowsShield: boolean;
}

interface AcCandidate {
  total: number;
  lines: string[];
}

/** Fallback when class features are not loaded yet. */
const UNARMORED_DEFENSE_BY_CLASS: Record<string, UnarmoredDefenseRule> = {
  barbarian: {
    featureName: "Unarmored Defense",
    bonusAbility: "con",
    allowsShield: true,
  },
  monk: {
    featureName: "Unarmored Defense",
    bonusAbility: "wis",
    allowsShield: false,
  },
};

export interface CharacterAcBreakdown {
  total: number;
  tooltip: string;
}

function isWearingArmor(armor: EquippedArmor | null): boolean {
  if (!armor) return false;
  return !isClothingArmor(armor.armor);
}

function parseUnarmoredDefenseFromText(text: string): AbilityKey | null {
  const normalized = text.toLowerCase();
  if (normalized.includes("constitution modifier")) return "con";
  if (normalized.includes("wisdom modifier")) return "wis";
  if (normalized.includes("charisma modifier")) return "cha";
  return null;
}

function getUnarmoredDefenseRule(
  classData: Class | null,
  className: string | null | undefined,
  level: number,
  subclass: Subclass | null,
): UnarmoredDefenseRule | null {
  if (classData) {
    const feature = getFeaturesUpToLevel(classData, subclass, level).find((entry) =>
      /^unarmored defense$/i.test(entry.name.trim()),
    );

    if (feature) {
      const text = feature.description.join(" ");
      const bonusAbility =
        parseUnarmoredDefenseFromText(text) ??
        UNARMORED_DEFENSE_BY_CLASS[classData.name.toLowerCase()]?.bonusAbility;

      if (bonusAbility) {
        const fallback =
          UNARMORED_DEFENSE_BY_CLASS[classData.name.toLowerCase()];
        return {
          featureName: feature.name,
          bonusAbility,
          allowsShield: fallback?.allowsShield ?? bonusAbility !== "wis",
        };
      }
    }
  }

  if (className) {
    return UNARMORED_DEFENSE_BY_CLASS[className.toLowerCase()] ?? null;
  }

  return null;
}

function shieldSubline(integratedBonus: number, standaloneBonus: number): string {
  if (integratedBonus > 0) return "  Integrated shield";
  if (standaloneBonus > 0) return "  Shield";
  return "";
}

function buildNaturalArmorCandidate(
  rule: NaturalArmorRule,
  dexMod: number,
  shieldBonus: number,
  integratedShieldBonus: number,
  standaloneShieldBonus: number,
  wearingArmor: boolean,
  armor: EquippedArmor | null,
): AcCandidate {
  const lines: string[] = [];
  let total = rule.baseAc;

  lines.push(
    `${rule.featureName} (${rule.sourceName}): ${rule.baseAc}${
      rule.includesDex ? ` + Dex (${formatModifier(dexMod)})` : ""
    }`,
  );

  if (rule.includesDex) {
    total += dexMod;
  } else {
    lines.push("Dex: ignored");
  }

  if (wearingArmor && armor && rule.blocksArmor) {
    lines.push(`Armor (${armor.armor.name}): ignored`);
  }

  if (shieldBonus > 0 && rule.allowsShield) {
    total += shieldBonus;
    lines.push(`Shield: +${shieldBonus}`);
    lines.push(shieldSubline(integratedShieldBonus, standaloneShieldBonus));
  } else if (shieldBonus > 0) {
    lines.push("Shield: inactive (Natural Armor)");
  }

  return { total, lines };
}

function buildUnarmoredDefenseCandidate(
  rule: UnarmoredDefenseRule,
  classLabel: string,
  modifiers: Record<AbilityKey, number>,
  dexMod: number,
  shieldBonus: number,
  integratedShieldBonus: number,
  standaloneShieldBonus: number,
  hasShieldEquipped: boolean,
): AcCandidate {
  const bonusMod = modifiers[rule.bonusAbility];
  let total = 10 + dexMod + bonusMod;
  const lines = [
    "Base: 10",
    `Dex: ${formatModifier(dexMod)}`,
    `${ABILITY_LABELS[rule.bonusAbility]}: ${formatModifier(bonusMod)}`,
    `${rule.featureName} (${classLabel})`,
  ];

  if (hasShieldEquipped && rule.allowsShield) {
    total += shieldBonus;
    lines.push(`Shield: +${shieldBonus}`);
    lines.push(shieldSubline(integratedShieldBonus, standaloneShieldBonus));
  }

  return { total, lines };
}

function buildArmorCandidate(
  armor: EquippedArmor,
  dexMod: number,
  shieldBonus: number,
  integratedShieldBonus: number,
  standaloneShieldBonus: number,
): AcCandidate {
  const { baseAC, maxDexBonus } = armor.armor;
  const dexBonus =
    maxDexBonus === null ? dexMod : Math.min(dexMod, maxDexBonus);
  const total = baseAC + dexBonus + shieldBonus;
  const lines = [
    `Armor (${armor.armor.name}): ${baseAC}`,
    `Dex: ${formatModifier(dexBonus)}${
      maxDexBonus !== null ? ` (max +${maxDexBonus})` : ""
    }`,
  ];

  if (shieldBonus > 0) {
    lines.push(`Shield: +${shieldBonus}`);
    lines.push(shieldSubline(integratedShieldBonus, standaloneShieldBonus));
  }

  return { total, lines };
}

function buildDefaultUnarmoredCandidate(
  dexMod: number,
  shieldBonus: number,
  integratedShieldBonus: number,
  standaloneShieldBonus: number,
): AcCandidate {
  const total = 10 + dexMod + shieldBonus;
  const lines = [`Unarmored: 10 + Dex (${formatModifier(dexMod)})`];

  if (shieldBonus > 0) {
    lines.push(`Shield: +${shieldBonus}`);
    lines.push(shieldSubline(integratedShieldBonus, standaloneShieldBonus));
  }

  return { total, lines };
}

function pickCandidate(candidates: AcCandidate[]): AcCandidate {
  return candidates.reduce((best, current) =>
    current.total > best.total ? current : best,
  );
}

export function getCharacterAcBreakdown(input: {
  modifiers: Record<AbilityKey, number>;
  level: number;
  armor: EquippedArmor | null;
  integratedShieldAcBonus: number;
  standaloneShieldAcBonus?: number;
  classData: Class | null;
  className?: string | null;
  subclass: Subclass | null;
  speciesTraits?: SpeciesTrait[];
  speciesName?: string | null;
}): CharacterAcBreakdown {
  const {
    modifiers,
    level,
    armor,
    integratedShieldAcBonus,
    standaloneShieldAcBonus = 0,
    classData,
    className,
    subclass,
    speciesTraits = [],
    speciesName,
  } = input;

  const dexMod = modifiers.dex;
  const wearingArmor = isWearingArmor(armor);
  const shieldBonus = integratedShieldAcBonus + standaloneShieldAcBonus;
  const hasShieldEquipped = shieldBonus > 0;
  const classLabel = classData?.name ?? className ?? "Class";

  const naturalArmor = detectNaturalArmorFromTraits(
    speciesTraits,
    speciesName ?? "Species",
  );

  const unarmoredDefense = getUnarmoredDefenseRule(
    classData,
    className ?? classData?.name,
    level,
    subclass,
  );

  const unarmoredDefenseActive =
    unarmoredDefense !== null &&
    !wearingArmor &&
    (unarmoredDefense.allowsShield || !hasShieldEquipped);

  const inactiveNotes: string[] = [];
  let winner: AcCandidate;

  if (naturalArmor?.blocksArmor) {
    winner = buildNaturalArmorCandidate(
      naturalArmor,
      dexMod,
      shieldBonus,
      integratedShieldAcBonus,
      standaloneShieldAcBonus,
      wearingArmor,
      armor,
    );

    if (unarmoredDefense) {
      inactiveNotes.push("Unarmored Defense: inactive (using Natural Armor)");
    }
  } else if (wearingArmor && armor) {
    winner = buildArmorCandidate(
      armor,
      dexMod,
      shieldBonus,
      integratedShieldAcBonus,
      standaloneShieldAcBonus,
    );

    if (naturalArmor) {
      inactiveNotes.push("Natural Armor: inactive (armor equipped)");
    }
    if (unarmoredDefense) {
      inactiveNotes.push("Unarmored Defense: inactive (armor equipped)");
    }
  } else {
    const candidates: AcCandidate[] = [
      buildDefaultUnarmoredCandidate(
        dexMod,
        shieldBonus,
        integratedShieldAcBonus,
        standaloneShieldAcBonus,
      ),
    ];

    if (naturalArmor) {
      candidates.push(
        buildNaturalArmorCandidate(
          naturalArmor,
          dexMod,
          shieldBonus,
          integratedShieldAcBonus,
          standaloneShieldAcBonus,
          false,
          null,
        ),
      );
    }

    if (unarmoredDefenseActive && unarmoredDefense) {
      candidates.push(
        buildUnarmoredDefenseCandidate(
          unarmoredDefense,
          classLabel,
          modifiers,
          dexMod,
          shieldBonus,
          integratedShieldAcBonus,
          standaloneShieldAcBonus,
          hasShieldEquipped,
        ),
      );
    } else if (unarmoredDefense && hasShieldEquipped && !unarmoredDefense.allowsShield) {
      inactiveNotes.push("Unarmored Defense: inactive (shield equipped)");
    }

    winner = pickCandidate(candidates);

    if (naturalArmor && !winner.lines[0]?.startsWith(naturalArmor.featureName)) {
      inactiveNotes.push("Natural Armor: inactive (higher AC method used)");
    }
  }

  const lines = [...winner.lines, ...inactiveNotes, `Total: ${winner.total}`];
  return { total: winner.total, tooltip: lines.join("\n") };
}
