import type { GuideSection } from "@/shared/types";
import generated from "./lore.generated.json";

export const LORE_INTRO = generated.intro;

export const LORE_SECTIONS = generated.sections as GuideSection[];
