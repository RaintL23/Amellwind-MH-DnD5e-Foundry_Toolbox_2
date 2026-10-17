/**
 * Starting equipment of the Amellwind faction backgrounds, transcribed from
 * the "Equipment:" line of each background in AGMH chapter 1 (neither the
 * GitHub feed nor the Patreon overlay carries structured `startingEquipment`).
 * Same raw shape as 5etools `startingEquipment` so the shared parser handles it.
 */

const pouchWith = (gp: number) => [
  "pouch|phb",
  { value: gp * 100 },
];

export const AMELLWIND_BACKGROUND_STARTING_EQUIPMENT: Record<string, unknown[]> = {
  "Helix Agent": [
    {
      _: [
        { equipmentType: "toolArtisan" },
        "shovel|phb",
        "pot, iron|phb",
        "common clothes|phb",
        ...pouchWith(10),
      ],
    },
  ],
  "Helix Field Scout": [
    {
      _: [
        "pick, miner's|phb",
        "hunting trap|phb",
        { special: "trophy from an animal you killed" },
        "traveler's clothes|phb",
        ...pouchWith(10),
      ],
    },
  ],
  "Hunter Initiate": [
    {
      a: ["pick, miner's|phb"],
      b: [{ special: "bug net" }],
      c: ["herbalism kit|phb"],
      d: ["fishing tackle|phb"],
    },
    {
      _: [
        { special: "guild card" },
        "hunting trap|phb",
        { special: "memento from your past that represents why you became a hunter" },
        "traveler's clothes|phb",
        ...pouchWith(10),
      ],
    },
  ],
  "Apprentice Guild Knight": [
    {
      _: [
        "traveler's clothes|phb",
        { special: "signet, banner or seal representing your place or rank in the order" },
        ...pouchWith(10),
      ],
    },
  ],
  "Handler Initiate": [
    {
      _: [
        "traveler's clothes|phb",
        { special: "guild card" },
        { special: "empty book" },
        "ink pen|phb",
        "ink (1-ounce bottle)|phb",
        { special: "regional map", quantity: 3 },
        ...pouchWith(15),
      ],
    },
  ],
  Scrivener: [
    {
      _: [
        "ink (1-ounce bottle)|phb",
        "ink pen|phb",
        { special: "small knife" },
        { special: "notebook containing your notes on creatures you have encountered or studied" },
        "common clothes|phb",
        ...pouchWith(10),
      ],
    },
  ],
  Poacher: [
    {
      _: [
        "hunting trap|phb",
        { special: "skinning knife" },
        "common clothes|phb",
        { special: "trophy from an animal you killed" },
        { special: "letter of introduction from a black-market dealer" },
        ...pouchWith(10),
      ],
    },
  ],
  Infiltrator: [
    {
      _: [
        { special: "small knife or blade" },
        "basic poison (vial)|phb",
        "crowbar|phb",
        "grappling hook|phb",
        { special: "set of dark common clothes suitable for sneaking and hiding" },
        ...pouchWith(10),
      ],
    },
  ],
  "Wycademy Student": [
    {
      _: [
        { special: "empty book" },
        "ink pen|phb",
        "ink (1-ounce bottle)|phb",
        { item: "candle|phb", quantity: 3 },
        { special: "scroll case with 4 blank pieces of parchment and a few with notes and questions" },
        "fine clothes|phb",
        "traveler's clothes|phb",
        ...pouchWith(10),
      ],
    },
  ],
  "Wycademy Researcher": [
    {
      _: [
        "ink (1-ounce bottle)|phb",
        "ink pen|phb",
        { special: "small knife" },
        { special: "partially filled journal of notes and questions you have not yet been able to answer" },
        "common clothes|phb",
        ...pouchWith(10),
      ],
    },
  ],
};
