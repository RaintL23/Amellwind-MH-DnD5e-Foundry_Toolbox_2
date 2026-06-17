import type { DndRace } from "@/shared/types";
import type { DefenseGrant } from "@/shared/types/proficiency.types";

export function resolveSpeciesDefenseGrants(
  base: DndRace,
  subrace: DndRace | null,
  groupChoice: string | null,
): DefenseGrant[] {
  const raceSource = { type: "species" as const, name: base.name };

  if (base.namedSpellGroups && base.namedSpellGroups.length > 0 && groupChoice) {
    const chosen = base.namedSpellGroups.find(
      (group) => group.name.toLowerCase() === groupChoice.toLowerCase(),
    );
    if (chosen?.resistance) {
      const fixedGrant: DefenseGrant = {
        kind: "fixed",
        types: [chosen.resistance],
        defenseKind: "resistance",
        source: raceSource,
      };
      return [fixedGrant, ...(subrace?.defenseGrants ?? [])];
    }
  }

  return [...base.defenseGrants, ...(subrace?.defenseGrants ?? [])];
}
