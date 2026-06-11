import type { Class } from "@/shared/types";

/** Pact casters (Warlock) use a unified prepared list + shared slot level. */
export function isPactMagicClass(
  classData: Pick<Class, "casterProgression"> | null | undefined,
): boolean {
  return classData?.casterProgression === "pact";
}

export function getSpellcastingSectionLabel(
  classData: Pick<Class, "name" | "casterProgression"> | null | undefined,
): string {
  return isPactMagicClass(classData) ? "Pact Magic" : "Spellcasting";
}

export function getSpellcastingPanelTitle(
  classData: Pick<Class, "name" | "casterProgression">,
): string {
  return `${getSpellcastingSectionLabel(classData)}: ${classData.name}`;
}
