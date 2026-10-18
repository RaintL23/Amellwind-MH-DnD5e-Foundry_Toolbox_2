import { generateXanatharBackstoryNotes } from "@/features/raintdm/builder/utils/randomizer/backstory-randomizer.utils";
import { applyLoadoutPhase } from "./randomize-loadout.phase";
import type {
  RandomizeCharacterContext,
  RandomizerPipelineState,
} from "./randomize-context.types";

/** Starting equipment + loadout (planned earlier by `planLoadoutPhase`) and backstory. */
export function randomizeEquipmentPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): void {
  const { setters } = ctx;
  const { classData, speciesName, backgroundName, primaryMod } = state;

  applyLoadoutPhase(ctx, state);

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
