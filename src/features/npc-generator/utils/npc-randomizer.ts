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
import {
  clampHitDiceForTier,
  getDefaultHitDiceForTier,
  getHitDiceOptionsForTier,
} from "./npc-power-scaling";

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
    const templateId = patch.templateId ?? _draft.templateId;
    const template = NPC_TEMPLATES.find((t) => t.id === templateId);
    const tier = template?.tier ?? 1;
    const options = getHitDiceOptionsForTier(tier);
    patch.hitDiceCount = pick(options.length ? options : [8]);
  }
  if (randomizeAll || field === "hitDie") {
    patch.hitDie = randomHitDie();
  }
  if (randomizeAll || field === "hideFeatures") {
    patch.hideFeatures = pick(HIDE_OPTIONS);
  }

  if (patch.templateId) {
    const template = NPC_TEMPLATES.find((t) => t.id === patch.templateId);
    if (template) {
      patch.hitDiceCount = clampHitDiceForTier(
        template.tier,
        patch.hitDiceCount ?? _draft.hitDiceCount,
      );
    }
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

  const defaultTemplate = NPC_TEMPLATES[0];
  const defaultTier = defaultTemplate?.tier ?? 2;

  return {
    customName: "",
    gender: "random",
    templateId: defaultTemplate?.id ?? "",
    speciesId: defaultSpecies?.id ?? "",
    backgroundId: defaultBackground?.id ?? "",
    attributeArray: "standard",
    hitDiceCount: getDefaultHitDiceForTier(defaultTier),
    hitDie: 8,
    hideFeatures: "all",
  };
}
