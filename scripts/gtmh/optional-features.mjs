/**
 * Build weapon optional features from the Patreon Appendix B dump.
 */
import { parseWeaponAppendix } from "./weapon-appendix.mjs";

export function buildOptionalFeatures() {
  return parseWeaponAppendix().optionalFeatures;
}
