/**
 * Curated GTMH races missing from the GitHub homebrew feed (Kechaborn,
 * Malfestian, Neopteroid + its subraces), transcribed from the "Player Race
 * Options" section of `gtmh-patreon-chapter2.md`. Everything else (Lynian,
 * Wyverian, Elder Dragonborn ancestries, …) keeps coming from GitHub: the
 * runtime merge is local-wins by name and GitHub fills the remaining names.
 */

const SOURCE = "AGMH";

const entry = (name, ...entries) => ({ type: "entries", name, entries });

const DARKVISION_60 =
  "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray.";

const KECHABORN = {
  name: "Kechaborn",
  source: SOURCE,
  size: ["M"],
  speed: { walk: 30, climb: 30 },
  ability: [{ dex: 2, wis: 1 }],
  age: { mature: 20, max: 200 },
  skillProficiencies: [{ acrobatics: true }],
  toolProficiencies: [
    {
      choose: {
        from: ["smith's tools", "woodcarver's tools", "herbalism kit"],
        count: 1,
      },
    },
  ],
  languageProficiencies: [{ common: true }],
  fluff: {
    entries: [
      "Kechaborn have agile, muscular bodies covered in short, dense fur ranging from tawny brown to deep russet. Their limbs are long and end in dexterous hands and feet with retractable claws, ideal for climbing. Their large, expressive eyes provide excellent night vision, and their faces feature prominent, tufted ears. Kechaborn possess prehensile tails and skin membranes between their limbs, allowing them to glide short distances. Often found in forested regions, their natural agility and climbing abilities make them adept at navigating treetops.",
    ],
  },
  entries: [
    entry(
      "Age",
      "Kechaborn's mature at the same rate humans do and reach adulthood around the age of 20. They live much longer than humans, however, often exceeding 200 years.",
    ),
    entry(
      "Alignment",
      "Kechaborns are naturally chaotic, but can grow into other alignments.",
    ),
    entry(
      "Size",
      "Kechaborns range from just under 5 to over 6 feet tall and have varied body shapes. Your size is Medium.",
    ),
    entry(
      "Speed",
      "Your base walking speed is 30 feet, and you have a climbing speed of 30 feet.",
    ),
    entry(
      "Glide",
      "When you are falling and aren't incapacitated, you can subtract up to 30 feet from the fall when calculating falling damage, and you can move up to 2 feet horizontally for every 1 foot you descend.",
    ),
    entry(
      "Claws",
      "Your claws are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to {@damage 1d6} + your Strength modifier, instead of the bludgeoning damage normal for an unarmed strike.",
    ),
    entry(
      "Large Ears",
      "Your ears are highly flexible. As a bonus action, you can cover your face with them until you use another bonus action to reveal your face again. While it is covered, you gain tremorsense out to 10 feet, are {@condition blinded} and are unable to hear anything further than 10 feet from you.",
      "Additionally, when you are subjected to an effect that requires you to see it (such as an effect that would blind you or the {@spell hypnotic pattern} spell) you can use your reaction to cover your face with your ears to avoid the effect. You can use this property a number of times equal to half your proficiency level rounded up (minimum of 1), regaining all expended uses when you finish a long rest.",
    ),
    entry(
      "Prehensile Tail",
      "Your particular heritage has allowed you to develop a prehensile tail. Your tail is muscular and very long, about your body length, and can support your weight if you aren't encumbered (e.g. while hanging from a branch). While the tail is used primarily to assist in climbing and keeping the hands free for foraging and carrying, you can use it to do the following simple tasks: lift, drop, hold, push, or pull an object or a creature up to 50 pounds; open or close a door or a container. Your tail can't wield weapons or shields or do anything that requires manual precision, such as using tools or magic items or performing the somatic components of a spell.",
    ),
    entry("Skill Proficiency", "You have proficiency in the {@skill Acrobatics} skill."),
    entry(
      "Tool Proficiency",
      "You gain proficiency with one of the following tools of your choice: smith's tools, woodcarver's supplies, or herbalism kit.",
    ),
    entry("Languages", "You can speak, read, and write Common."),
  ],
};

const MALFESTIAN = {
  name: "Malfestian",
  source: SOURCE,
  size: ["M"],
  speed: { walk: 30, fly: 30 },
  ability: [{ wis: 2, dex: 1 }],
  age: { mature: 18, max: 250 },
  darkvision: 60,
  languageProficiencies: [{ common: true }],
  fluff: {
    entries: [
      "Malfestians are covered in a mesmerizing mix of shimmering blue, green, and violet feathers. They have sharp, piercing eyes and beak-like mouths. Their wing-like arms end in taloned hands, and their strong, muscular legs end in clawed feet for gripping surfaces. Malfestians move with an eerie silence, making them skilled hunters and elusive prey. Known for their keen intelligence and stealth, they often use their feathers' vibrant colors to blend into their surroundings or create dazzling displays to confuse predators and prey alike.",
    ],
  },
  entries: [
    entry(
      "Age",
      "Malfestians typically achieve adulthood and earn an adult designation around the age of 18, yet they can live up to 250 years, allowing ample time to accrue wisdom and expertise over their long lifespans.",
    ),
    entry(
      "Alignment",
      "Malfestians might lean towards alignments that prioritize personal goals and intelligence-driven decision-making. Lawful Neutral or Neutral Evil could be common alignments.",
    ),
    entry(
      "Size",
      "Malfestians typically range in height from 4 to 5 feet tall, their physique resembles that of an owl, with slender frames, feathers in various hues, and distinctive facial features that include large eyes adapted for night vision. Your size is Medium.",
    ),
    entry("Speed", "Your base walking speed is 30 feet."),
    entry("Darkvision", DARKVISION_60),
    entry(
      "Flight",
      "You have a flying speed equal to your walking speed. You can't use this flying speed if you're wearing medium or heavy armor.",
    ),
    entry(
      "Malfestio Genetics",
      "When you reach 3rd level, choose one of the genetic options below.",
      entry(
        "Nightcloak",
        "You can cast the {@spell invisibility} spell with this trait. When you use this version of Invisibility, you leave no physical evidence of your passage, so you can be tracked only by magic. You must finish a long rest to cast this spell again with this trait.",
      ),
      entry(
        "Sonic Waves",
        "You can cast the {@spell confusion} spell with this trait. When you use this version of Confusion, you can target one creature within range instead of an area. You must finish a long rest to cast this spell again with this trait. Intelligence, Wisdom, or Charisma is your spellcasting ability for this spell when you cast it with this trait (choose when you select this race).",
      ),
    ),
    entry(
      "Wings",
      "Your wings are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to {@damage 1d6} + your Strength modifier, instead of the bludgeoning damage normal for an unarmed strike.",
    ),
    entry("Languages", "You can speak, read, and write Common."),
  ],
};

/**
 * Neopteroid ASI is "+2 and +1, or +1 to three different scores" — the same
 * spread as Customizing Your Origin, which the Builder turns on when a species
 * has no fixed ASI, so `ability` stays empty and the rule lives in the text.
 */
const NEOPTEROID = {
  name: "Neopteroid",
  source: SOURCE,
  size: ["S"],
  speed: { walk: 25, climb: 20 },
  age: { mature: 3, max: 30 },
  languageProficiencies: [{ common: true, anyStandard: 1 }],
  fluff: {
    entries: [
      "Neopteroids are small, insect-like humanoids known for their agility and resilience. They have slender bodies covered in a chitinous exoskeleton and multifaceted eyes. Their limbs are equipped with tiny bristles that allow them to cling to surfaces with ease. Neopteroids are often found within bustling settlements, where their unique abilities make them valuable as scouts, messengers, and gatherers. Their skills allow them to navigate complex environments effortlessly and provide essential support to their communities.",
    ],
  },
  entries: [
    entry(
      "Ability Score Increase",
      "Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1.",
    ),
    entry("Alignment", "Neopteroids are typically neutral."),
    entry(
      "Age",
      "Neopteroid reach maturity by age 3. Compared to humans, neopteroid don't usually live longer than 30 years.",
    ),
    entry(
      "Size",
      "Neopteroid average about 2 feet tall and weight about 30 pounds. Your size is Small.",
    ),
    entry("Speed", "Your base walking speed is 25 feet."),
    entry(
      "Tarsal Claws",
      "Because of the tiny microscopic bristles on your limbs, you have a climbing speed of 20 feet.",
    ),
    entry(
      "Languages",
      "You can speak, read, and write Common, one other language of their choice.",
    ),
    entry(
      "Subrace",
      "Two subraces of Neopteroids exist: flying or ground. Choose one of these subraces.",
    ),
  ],
};

const neopteroidSubrace = (fields) => ({
  source: SOURCE,
  raceName: "Neopteroid",
  raceSource: SOURCE,
  ...fields,
});

const FLYING_NEOPTEROID = neopteroidSubrace({
  name: "Flying",
  speed: { walk: 25, climb: 20, fly: 25 },
  fluff: {
    entries: [
      "Flying Neopteroids are distinguished by their translucent, iridescent wings that shimmer in the light. Their wings beat rapidly, producing a distinctive buzzing sound as they zip through the air. Known for their speed and grace, Flying Neopteroids deftly evade predators and obstacles alike, often using their natural agility to escape danger. They are highly valued by the Hunter's Guild for their ability to quickly traverse large distances, making them excellent couriers and lookouts.",
    ],
  },
  entries: [
    entry(
      "Flight",
      "Because of your wings, you have a flying speed equal to your walking speed. You can't use this flying speed if you're wearing medium or heavy armor.",
    ),
    entry(
      "Flyby",
      "You don't provoke opportunity attacks when you fly out of an enemy's reach. You can use this trait only if your flying speed is greater than 0. You can use it a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.",
    ),
    entry(
      "Stinger",
      "Your stinger is a natural melee weapon, which you can use to make unarmed strikes. If you hit with them, you deal poison damage equal to {@damage 1d6} + your Constitution modifier, instead of the bludgeoning damage normal for an unarmed strike.",
    ),
  ],
});

const GROUND_NEOPTEROID = neopteroidSubrace({
  name: "Ground",
  skillProficiencies: [{ athletics: true }],
  fluff: {
    entries: [
      "Ground Neopteroids are more robust and muscular than their flying counterparts. They possess powerful limbs adapted for digging and climbing, with large, sturdy mandibles for breaking through tough vegetation and soil. Despite lacking the ability to fly, Ground Neopteroids are incredibly strong and resilient, making them formidable in their own right. Their natural strength and endurance allow them to perform heavy labor, construct defenses, and serve as frontline workers in their communities, ensuring the safety and prosperity of their people.",
    ],
  },
  entries: [
    entry(
      "Altaroth Strength",
      "You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift.",
    ),
    entry("Athletic", "You gain proficiency in the {@skill Athletics} skill."),
    entry(
      "Hornetaur Power",
      "As a bonus action, you can jump a number of feet equal to five times your proficiency bonus, without provoking opportunity attacks. You can use this trait only if your speed is greater than 0. You can use it a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.",
    ),
    entry(
      "Forager (AGtMH Rule Set)",
      "When you harvest mushrooms, you instead gather 2.",
    ),
    entry(
      "Neopteroid Magic",
      "You know the {@spell lesser restoration} spell. You can cast this spell once, but you can only end the {@condition poisoned} condition on a creature, and regain the ability to do so when you finish a long rest.",
    ),
    entry(
      "Neopteroid Resilience",
      "You have advantage on saving throws against poison.",
    ),
  ],
});

export function buildRaces() {
  return {
    race: [KECHABORN, MALFESTIAN, NEOPTEROID],
    subrace: [FLYING_NEOPTEROID, GROUND_NEOPTEROID],
  };
}
