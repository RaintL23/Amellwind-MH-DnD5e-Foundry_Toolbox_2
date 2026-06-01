/** Monster Hunter loot table (AGMH). */
export const LOOT_TABLE_PDF_URL =
  "https://drive.google.com/file/d/1rY83ev0d7-S34HrMnq6_2ikki9mUU53a/view";

export const OBTAINMENT_INTRO =
  "Obtaining materials to upgrade your weapon and armor is a core part of Monster Hunter. The 2 most common ways to obtain material for you is carving materials off your kills or capturing larger creatures in the field. Occasionally a hunter may get lucky and come across a discard material in the field, possibly from a creature shedding, or what was left over from another creature's kill. There is rumored to be a tradesman that travels from location to location that offers materials for a price.";

export const CARVING_RULE_BEFORE_LINK =
  "Carving your kills is one of 2 ways to obtain materials while on a hunt. When you attempt to carve a creature, make a Dexterity (Survival) check against the creatures Carve DC. On a success, roll a d20 and compare the results to the creatures";

export const CARVING_RULE_AFTER_LINK =
  "On a failed save, treat the roll as if they rolled a 1 on the loot table.";

export const CARVING_VARIANT = {
  name: "Variant Carve Rule: Rewarding the natural 20",
  entries: [
    "When you roll a natural 20 on a Carve check, you roll an additional d20 and add that number to the loot table roll. The new number is the material found on that carve check.",
    "Any total higher than 20, counts as if a 20 was rolled.",
  ],
} as const;

export const CAPTURING_RULES = [
  "Certain creatures can be captured. A creature that can be captured will have a captured section of their loot table. A captured creature may provide loot that you are unable to obtain, an increased or decreased chance to obtain certain loot that you may have gotten from carving. When you capture a creature, you obtain a number of materials as labeled in the creatures loot table. No check is made, but the material is not gathered until you return to town.",
  "{@i See {@item Tranq Bomb|AGMH} (AGMH p.62) for capturing rules.}",
] as const;
