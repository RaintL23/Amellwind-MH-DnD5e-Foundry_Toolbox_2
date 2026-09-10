/**
 * Build HW weapon items from the Patreon Appendix B dump.
 */
import { parseWeaponAppendix } from "./weapon-appendix.mjs";

export function buildWeapons() {
  return parseWeaponAppendix().items;
}
