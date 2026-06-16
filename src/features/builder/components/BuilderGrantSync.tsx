import { useClassGrantSync } from "./equipment/library/hooks/useClassGrantSync";
import { useFeatGrantSync } from "./equipment/library/hooks/useFeatGrantSync";
import { useIdentityGrantSync } from "./equipment/library/hooks/useIdentityGrantSync";
import { useSpeciesSpellGrantSync } from "./equipment/library/hooks/useSpeciesSpellGrantSync";

/** Keeps builder proficiencies in sync even when the library panel is not open. */
export function BuilderGrantSync() {
  useIdentityGrantSync();
  useClassGrantSync();
  useFeatGrantSync();
  useSpeciesSpellGrantSync();
  return null;
}
