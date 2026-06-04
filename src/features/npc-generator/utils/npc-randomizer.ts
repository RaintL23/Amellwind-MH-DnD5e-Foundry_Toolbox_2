import type { Background, Species } from "@/shared/types";
import type {
  NpcAttributeArray,
  NpcDraft,
  NpcGender,
  NpcHideFeatures,
  NpcHitDie,
} from "@/shared/types/npc.types";
import { HIT_DIE_OPTIONS } from "@/shared/types/npc.types";
import { NPC_TEMPLATES } from "../data/npc-templates.data";

const RANDOM_NAMES = [
  "Aldric",
  "Bruna",
  "Cedric",
  "Diana",
  "Erik",
  "Fiora",
  "Gareth",
  "Helena",
  "Ivan",
  "Jade",
  "Kael",
  "Luna",
  "Magnus",
  "Nadia",
  "Orin",
  "Petra",
  "Quinn",
  "Rhea",
  "Soren",
  "Talia",
  "Ulric",
  "Vera",
  "Wren",
  "Yuri",
  "Zara",
  "Kokoto",
  "Moga",
  "Jumbo",
  "Trenya",
  "Hojo",
];

const GENDERS: NpcGender[] = ["male", "female", "other"];
const ATTRIBUTE_ARRAYS: NpcAttributeArray[] = ["standard", "heroic", "random"];
const HIDE_OPTIONS: NpcHideFeatures[] = [
  "all",
  "racial",
  "template",
  "background",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomNpcName(): string {
  return pick(RANDOM_NAMES);
}

export function randomGender(): NpcGender {
  return pick(GENDERS);
}

export function randomHitDie(): NpcHitDie {
  return pick(HIT_DIE_OPTIONS).die;
}

export function randomizeNpcDraft(
  _draft: NpcDraft,
  species: Species[],
  backgrounds: Background[],
  field?: keyof NpcDraft,
): Partial<NpcDraft> {
  const patch: Partial<NpcDraft> = {};

  const randomizeAll = !field;

  if (randomizeAll || field === "customName") {
    patch.customName = randomNpcName();
  }
  if (randomizeAll || field === "gender") {
    patch.gender = randomGender();
  }
  if (randomizeAll || field === "templateId") {
    patch.templateId = pick(NPC_TEMPLATES).id;
  }
  if (randomizeAll || field === "speciesId") {
    const playable = species.filter((s) => s.category !== "lineage");
    patch.speciesId = pick(playable.length ? playable : species).id;
  }
  if (randomizeAll || field === "backgroundId") {
    patch.backgroundId = backgrounds.length ? pick(backgrounds).id : "";
  }
  if (randomizeAll || field === "attributeArray") {
    patch.attributeArray = pick(ATTRIBUTE_ARRAYS);
  }
  if (randomizeAll || field === "hitDiceCount") {
    patch.hitDiceCount = Math.floor(Math.random() * 14) + 1;
  }
  if (randomizeAll || field === "hitDie") {
    patch.hitDie = randomHitDie();
  }
  if (randomizeAll || field === "hideFeatures") {
    patch.hideFeatures = pick(HIDE_OPTIONS);
  }

  return patch;
}

export function createDefaultNpcDraft(
  species: Species[],
  backgrounds: Background[],
): NpcDraft {
  const defaultSpecies =
    species.find((s) => s.name === "Human") ??
    species.find((s) => !s.isSubrace) ??
    species[0];
  const defaultBackground = backgrounds[0];

  return {
    customName: "",
    gender: "random",
    templateId: NPC_TEMPLATES[0]?.id ?? "",
    speciesId: defaultSpecies?.id ?? "",
    backgroundId: defaultBackground?.id ?? "",
    attributeArray: "standard",
    hitDiceCount: 8,
    hitDie: 8,
    hideFeatures: "all",
  };
}
