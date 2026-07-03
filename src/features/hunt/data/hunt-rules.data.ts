export interface HuntRuleTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface HuntRuleList {
  name?: string;
  items: string[];
}

export interface HuntRuleBlock {
  title?: string;
  text?: string;
  lists?: HuntRuleList[];
  table?: HuntRuleTable;
  children?: HuntRuleBlock[];
}

export interface HuntRuleSection {
  title: string;
  page?: number;
  intro?: string;
  blocks: HuntRuleBlock[];
}

export const FINDING_SIGNS_TABLE: HuntRuleTable = {
  caption: "Finding Signs Table",
  headers: ["ROLL", "RESULTS"],
  rows: [
    ["1", "Major challenge"],
    ["2-9", "Minor challenge"],
    ["10-17", "1 sign, minor challenge"],
    ["18-19", "1 sign"],
    ["20", "2 signs, benefit"],
  ],
};

export const HUNT_RULE_SECTIONS: HuntRuleSection[] = [
  {
    title: "Creating a Hunt",
    page: 79,
    intro:
      "Creating a Hunt can be just as or more difficult than creating your own dungeon. The biggest challenge is how do you create a hunt that feels natural without building it like a normal dungeon?",
    blocks: [
      {
        title: "Choosing the Creature to Hunt",
        text: "Choosing which creature(s) is the first step and easiest step in creating your hunt. Typically a creature the PCs are hunting will be a deadly encounter with one or more creatures for the parties level.",
        children: [
          {
            title: "Options",
            lists: [
              {
                name: "Add minions",
                items: [
                  "Adding in lower CR creatures to the fight that if left alone may cause issues for the party.",
                ],
              },
              {
                name: "Choose a weaker monster, but it acts as if it was multiple monsters",
                items: [
                  "A simpler version of the paragon monster system: choose a monster that is weaker but acts as if it was multiple monsters. It has multiple turns per round equal to the number of monsters it is supposed to represent, and its hit points is equal to the total of all the monsters it would represent.",
                ],
              },
              {
                name: "Solo boss fight",
                items: [
                  "For 3 PCs, maximize the creature's hit points. For 4 PCs, maximize its hit points and then add an additional 50% more hit points. For 5 PCs maximize its hit points and then double it.",
                  "Additionally due to their damage output on their turn, you might consider reducing the number of attacks its multiattack can make, and instead give it a number of legendary attack actions equal to the number of attacks removed from its multi attack.",
                ],
              },
            ],
          },
          {
            text: "Add one of the following Enrage mechanics to the creature's stat block:",
            lists: [
              {
                name: "Enrage (Mythic Trait) — at 0 HP",
                items: [
                  "If the creature is reduced to 0 hit points, it doesn't die or fall unconscious. Instead, it regains its full hit points, immediately saves against all ongoing conditions and effects, and gains 1 extra turn in the initiative order. XP is 2x and carves are doubled.",
                ],
              },
              {
                name: "Enrage (Mythic Trait) — at half HP",
                items: [
                  "When reduced to half of its maximum hit points, it immediately saves against all ongoing conditions and effects and gains 1 extra turn in the initiative order. XP is 1.5x and it can be carved 1 extra time.",
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Creating the Creature's Territory",
        text: "Creating the creatures territory is the second step in setting up your hunt. The territory is just like a dungeon, but instead of rooms, it uses areas.",
        children: [
          {
            title: "Areas",
            text: "An area is a location within the monster's territory where something may be found or some type of event occurs. Each area should have some type of description, much like a room in a dungeon, and have an idea of what resources would be available. Typically a hunt should have between 8-10 areas, some of which the party may or may not explore.",
          },
          {
            title: "Traveling between areas",
            text: "Traveling between areas should take time. It might be 5 minutes, an hour, or 4 hours. This helps explain why creatures aren't aware of the party when they enter a new area or why the environment might change dramatically between them.",
          },
        ],
      },
    ],
  },
  {
    title: "Going on a Hunt",
    page: 80,
    blocks: [
      {
        title: "Do we supply the Hunters?",
        text: "When the group heads out on a hunt, does the guild provide them with supplies? At lower rank hunts, probably. At higher ranks, they most likely have enough gold to supply themselves. The guild supply chest is a great way as a GM to give your PCs supplies they might need in an immersive fashion.",
      },
      {
        title: "Setting Roles",
        text: "When a hunt begins, the PCs choose between 4 different roles: Trailblazer, Scout, Spotter, and Artisan.",
        lists: [
          {
            name: "Trailblazer",
            items: [
              "Decides which way the party goes. They make survival checks that determine what type of complications or benefits the party encounters.",
            ],
          },
          {
            name: "Scout",
            items: [
              "The frontrunner of the group. They quietly scout the areas ahead and typically report their findings back to the group.",
            ],
          },
          {
            name: "Spotter",
            items: [
              "The person responsible for keeping an eye out while the rest of the group focuses on their tasks. Can notice things the scout may have missed, or perhaps resources in an area.",
            ],
          },
          {
            name: "Artisan",
            items: [
              "The chef. They provide boons at the start of hunts or during short or long rests.",
            ],
          },
        ],
        children: [
          {
            title: "Split Party",
            text: "Sometimes the party may split up. When split into groups of two, the only roles available are the trailblazer and the spotter. If someone is alone, they are both the trailblazer and spotter, but they either have to choose to take disadvantage on their survival roll for finding signs or take a -4 to their passive perception.",
          },
        ],
      },
      {
        title: "Tracking down prey",
        text: "Tracking down the creature the party is hunting is the main goal of monster hunters. The party travels around the creature's territory, dealing with environmental hazards, skill challenges, and other creatures while searching for signs of their prey.",
        children: [
          {
            title: "Finding Signs",
            text: "{@b The party will need to typically find between 3 and 5 signs. Once they do, they locate the monster and the final battle of the hunt begins.} Signs include distant roars, tracks, markings, fresh kills, etc.",
          },
          {
            title: "False Signs",
            text: "When you are on a hunt, the creature you are looking for is not the only one in the area. False signs work the same as finding signs for the current creature. Once you find 3-5 of these false signs, a hard or deadly encounter occurs.",
          },
          {
            title: "How to find signs",
            text: "Whenever the trailblazer rolls a survival check for entering an area, the GM rolls on the Finding Signs Table to determine what signs, challenges, or benefits they may find in the area. On a failed survival check, roll a d10 instead of a d20.",
            table: FINDING_SIGNS_TABLE,
          },
        ],
      },
      {
        title: "Challenges and Benefits",
        text: "If the trailblazer rolls anything less than an 18 on their Tracking Roll, they must overcome a challenge on their hunt. If a group rolls a 20 on their Tracking roll, they come across a benefit that can seriously aid them in their hunt.",
        lists: [
          {
            name: "Signs",
            items: [
              "Tracks",
              "A recent kill",
              "Markings, rubbings, etc on object(s)",
              "Tufts of fur or scales",
              "Scuff marks",
              "The shadow of the creature may pass the party on the ground as it flies high above them",
            ],
          },
          {
            name: "Minor Challenges",
            items: [
              "Signs of another similar creature",
              "Multiple signs leading in different directions",
              "Minor Environmental Hazard",
              "Skill Check",
              "Random encounter (medium or lower difficulty)",
              "Non Combat encounter",
            ],
          },
          {
            name: "Major Challenges",
            items: [
              "Hard or Deadly Random Encounter",
              "Dangerous environmental hazards",
              "Make them use resources: items, spell slots, etc",
              "Hostile Non Combat encounter",
              "False Signs",
              "Multi skill challenge",
              "Lose a Sign (have to backtrack or move forward blindly)",
            ],
          },
          {
            name: "Benefits",
            items: [
              "Additional resource that doesn't count against areas max resources",
              "Corpse of a powerful creature that can be carved for material(s)",
              "Veggie Elder (see Verdant Hills stat block)",
              "Friendly NPC encounter",
              "Items, weapons, useful things",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Example Hunt",
    page: 82,
    intro:
      "An example hunt against a Yian Kut-ku (CR 3) requiring 3 signs to find, with a Blue Yian Kut-ku (CR 5) as the false-sign creature requiring 5 signs.",
    blocks: [
      {
        title: "GM Prep",
        text: "Decide on the creature, its territory (8-10 areas), then prepare 2-4 benefits, 2-4 major challenges, and 8-10 minor challenges based on the party's level.",
      },
      {
        title: "The Hunt Begins",
        text: "Each PC chooses a role. The party sets basecamp, receives supplies from the guild chest, and the Artisan cooks a meal. The Trailblazer makes a Survival check when entering each area; the GM rolls on the Finding Signs Table. The Scout scouts ahead while the Spotter watches for resources and threats.",
      },
    ],
  },
  {
    title: "Traveling",
    page: 83,
    intro:
      "Standard 5e travel pace rules apply, plus variant rules for using hunt roles during overland travel.",
    blocks: [
      {
        title: "Travel Pace",
        table: {
          caption: "Travel Pace Table",
          headers: [
            "Pace",
            "Distance per Minute",
            "Distance per Hour",
            "Distance per day",
            "Effect",
          ],
          rows: [
            [
              "Fast",
              "400 feet",
              "4 miles",
              "30 miles",
              "-5 penalty to passive Wisdom (Perception) scores",
            ],
            ["Normal", "300 feet", "3 miles", "24 miles", "-"],
            [
              "Slow",
              "200 feet",
              "2 miles",
              "18 miles",
              "Able to use Stealth",
            ],
          ],
        },
        children: [
          {
            title: "Forced March",
            text: "The Travel Pace table assumes 8 hours of travel per day. For each additional hour beyond 8, each character must make a Constitution saving throw (DC 10 + 1 per hour past 8). On a failed save, a character suffers one level of exhaustion.",
          },
          {
            title: "Short and Long Rests During Travel",
            text: "During a week of travel, PCs can take two short rests. They can take a long rest at the end of each week and when they reach their destination. On average the group should encounter between 3-6 random encounters during a week of travel.",
          },
        ],
      },
    ],
  },
];
