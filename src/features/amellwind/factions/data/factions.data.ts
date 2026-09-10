import type { GuideSection } from "@/shared/types";
import generated from "./factions.generated.json";

export const FACTIONS_INTRO = generated.intro;

export const FACTION_SECTIONS = generated.sections as GuideSection[];
