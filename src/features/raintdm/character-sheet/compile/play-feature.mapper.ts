import type { FeatureActivationType } from "@/features/raintdm/builder/foundry-export/feature-usage.utils";
import { parseFeatureUsage } from "@/features/raintdm/builder/foundry-export/feature-usage.utils";
import type {
  FeatureSourceKind,
  PlayActivationBucket,
  PlayFeature,
  PlayFeatureStatEffect,
  PlayFeatureUses,
} from "../utils/play-character.types";
import { detectFeatureStatEffects } from "./detect-feature-stat-effects";

function resolveUsesMax(
  formula: string,
  proficiencyBonus: number,
  abilityMod: number,
): number {
  if (!formula) return 0;
  if (formula === "@prof") return Math.max(1, proficiencyBonus);
  if (formula.includes("@abilities")) {
    return Math.max(1, abilityMod);
  }
  const n = parseInt(formula, 10);
  return Number.isFinite(n) ? n : 0;
}

export function activationToBucket(
  activation: FeatureActivationType | "",
): PlayActivationBucket {
  if (activation === "action") return "action";
  if (activation === "bonus") return "bonus";
  if (activation === "reaction") return "reaction";
  if (activation === "special") return "other";
  return "passive";
}

export function castingTimeToBucket(castingTime?: string): PlayActivationBucket {
  const t = (castingTime ?? "").toLowerCase();
  if (t.includes("bonus")) return "bonus";
  if (t.includes("reaction")) return "reaction";
  if (t.includes("action") || t.includes("1 action")) return "action";
  if (!t) return "action";
  return "other";
}

export function mapFeatureFromText(options: {
  id: string;
  name: string;
  description: string;
  sourceKind: FeatureSourceKind;
  sourceLabel: string;
  level?: number;
  proficiencyBonus: number;
  primaryAbilityMod?: number;
  speciesDarkvision?: number;
  speciesResistances?: string[];
  /** Extra passive effects merged after text detection (e.g. species speed). */
  extraStatEffects?: PlayFeatureStatEffect[];
}): PlayFeature {
  const usage = parseFeatureUsage(options.description);
  const max = resolveUsesMax(
    usage.usesMax,
    options.proficiencyBonus,
    options.primaryAbilityMod ?? 0,
  );
  const uses: PlayFeatureUses | undefined =
    max > 0
      ? { max, recovery: usage.recoveryPeriod || "lr" }
      : undefined;

  const detected = detectFeatureStatEffects({
    name: options.name,
    description: options.description,
    speciesDarkvision: options.speciesDarkvision,
    speciesResistances: options.speciesResistances,
  });
  const extra = options.extraStatEffects ?? [];
  const statEffects = [...detected];
  for (const e of extra) {
    if (!statEffects.some((x) => x.kind === e.kind && x.label === e.label)) {
      statEffects.push(e);
    }
  }

  return {
    id: options.id,
    name: options.name,
    sourceKind: options.sourceKind,
    sourceLabel: options.sourceLabel,
    level: options.level,
    description: options.description,
    activation: usage.activationType,
    bucket: activationToBucket(usage.activationType),
    uses,
    ...(statEffects.length > 0 ? { statEffects } : {}),
  };
}

export function slugId(prefix: string, name: string, index: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefix}-${slug || "item"}-${index}`;
}
