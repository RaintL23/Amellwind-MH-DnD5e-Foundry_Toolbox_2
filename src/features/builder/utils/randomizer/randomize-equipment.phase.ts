import { buildRandomStartingEquipmentEntries } from "@/features/builder/utils/randomizer/starting-equipment-randomizer.utils";
import { generateXanatharBackstoryNotes } from "@/features/builder/utils/randomizer/backstory-randomizer.utils";
import type {
  RandomizeCharacterContext,
  RandomizerPipelineState,
} from "./randomize-context.types";

export function randomizeEquipmentPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): void {
  const { addEquipmentBundle } = ctx;
  const { setters } = ctx;
  const {
    classData,
    randomizedBackgroundDetail,
    speciesName,
    backgroundName,
    primaryMod,
  } = state;

  const classEquipment = buildRandomStartingEquipmentEntries(
    classData.startingEquipmentOffers,
    { type: "class", id: classData.id, name: classData.name },
  );
  const backgroundEquipment = randomizedBackgroundDetail
    ? buildRandomStartingEquipmentEntries(
        randomizedBackgroundDetail.startingEquipmentOffers,
        {
          type: "background",
          id: randomizedBackgroundDetail.id,
          name: randomizedBackgroundDetail.name,
        },
      )
    : [];

  if (classEquipment.length > 0 || backgroundEquipment.length > 0) {
    addEquipmentBundle([...classEquipment, ...backgroundEquipment]);
  }

  const backstory = generateXanatharBackstoryNotes({
    raceName: speciesName,
    backgroundName,
    className: classData.name,
    charismaModifier: primaryMod,
  });
  if (backstory) {
    setters.setBackstoryNotes(backstory);
  }
}
