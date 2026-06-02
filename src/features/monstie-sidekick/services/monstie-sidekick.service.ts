import type { MonstieSidekickGuide, MonstieRulesContent } from "@/shared/types";
import {
  getClassFeaturesRaw,
  getClassesRaw,
  getVariantRulesRaw,
} from "@/shared/db/sync.service";
import { mapMonstieClassFeatures } from "../mappers/monstie-class-feature.mapper";
import { mapMonstieSidekickClass } from "../mappers/monstie-class.mapper";
import { mapMonstieRules } from "../mappers/monstie-rules.mapper";

let guideCache: MonstieSidekickGuide | null = null;

const MONSTIE_RULES_NAME = "Monstie Sidekicks";

export async function getMonstieRules(): Promise<MonstieRulesContent[]> {
  const guide = await getMonstieSidekickGuide();
  return guide.rules;
}

export async function getMonstieSidekickGuide(): Promise<MonstieSidekickGuide> {
  if (guideCache) return guideCache;

  const [rawRules, rawClasses, rawFeatures] = await Promise.all([
    getVariantRulesRaw(),
    getClassesRaw(),
    getClassFeaturesRaw(),
  ]);

  const match = rawRules.find(
    (r) =>
      typeof r === "object" &&
      r !== null &&
      (r as Record<string, unknown>).name === MONSTIE_RULES_NAME,
  );

  const rules =
    match && typeof match === "object"
      ? mapMonstieRules(match as Record<string, unknown>)
      : [];

  guideCache = {
    rules,
    sidekickClass: mapMonstieSidekickClass(rawClasses),
    classFeatures: mapMonstieClassFeatures(rawFeatures),
  };

  return guideCache;
}

export async function getMonstieClassFeatures() {
  const guide = await getMonstieSidekickGuide();
  return guide.classFeatures;
}

export function clearMonstieSidekickCache(): void {
  guideCache = null;
}
