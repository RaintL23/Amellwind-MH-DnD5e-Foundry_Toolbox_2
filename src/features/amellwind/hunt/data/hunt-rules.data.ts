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
                  "For 3 PCs, maximize the creature's hit points. For 4 PCs, maximize its hit points and then add an additional 50% more hit points. For 5 PCs maximize its hit points and then double it. For 6 PCs (toolbox extension), maximize and multiply by 2.5.",
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
      "In many Dungeons and Dragon campaigns your PCs are going to travel across the world. That is no different in a campaign that takes place in the Monster Hunter Universe. The rules below include the standard traveling pace rules from 5e Dungeons and Dragons as well as a new way for your PCs to travel across your world, using the same type of roles as when they go on a hunt (though with slightly different rules).",
    blocks: [
      {
        title: "Travel Pace",
        text: "While traveling, a group of adventurers can move at a normal, fast, or slow pace, as shown on the Travel Pace table. The table states how far the party can move in a period of time and whether the pace has any effect. A fast pace makes characters less perceptive, while a slow pace makes it possible to sneak around and to search an area more carefully.",
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
            text: "The Travel Pace table assumes that characters travel for 8 hours in day. They can push on beyond that limit, at the risk of exhaustion. For each additional hour of travel beyond 8 hours, the characters cover the distance shown in the Hour column for their pace, and each character must make a Constitution saving throw at the end of the hour. The DC is 10 + 1 for each hour past 8 hours. On a failed saving throw, a character suffers one level of exhaustion.",
          },
          {
            title: "Mounts and Vehicles",
            text: "For short spans of time (up to an hour), many animals move much faster than humanoids. A mounted character can ride at a gallop for about an hour, covering twice the usual distance for a fast pace. If fresh mounts are available every 8 to 10 miles, characters can cover larger distances at this pace, but this is very rare except in densely populated areas. Characters in wagons, carriages, or other land vehicles choose a pace as normal. Characters in a waterborne vessel are limited to the speed of the vessel, and they don't suffer penalties for a fast pace or gain benefits from a slow pace. Depending on the vessel and the size of the crew, ships might be able to travel for up to 24 hours per day. Certain special mounts, such as a pegasus or griffon, or special vehicles, such as a carpet of flying, allow you to travel more swiftly.",
          },
          {
            title: "Difficult Terrain",
            text: "The travel speeds given in the Travel Pace table assume relatively simple terrain: roads, open plains, or clear dungeon corridors. But adventurers often face dense forests, deep swamps, rubble-filled ruins, steep mountains, and ice-covered ground — all considered difficult terrain.",
          },
        ],
      },
      {
        title: "Short and Long Rests During Travel",
        text: "One of the biggest issue with traveling is that the party is able to get a long rest every single night, which makes it difficult for a DM to have to through 5-6 encounters in a single day vs 5-6 encounters over the course of the journey. To fix this problem, we are going to \"extend\" out the encounter day, into an encounter week. During this week, the PCs are able to take two short rests. They can take a long rest at the end of each week and when they reach their destination. With the additional rules below, the party has the chance of 14 random encounters during a week of travel. On average the group should encounter between 3-6 encounters (and not all of these have to be combat encounters), but should they feel unable to continue their travels without a long rest, they can remain at their last camp site for the remainder of the week and take a long rest.",
      },
      {
        title: "Random Encounters",
        text: "As they travel, the PCs may encounter random creatures, places of interest, merchants, etc. A random encounter can happen during a days travel, or at night while the group is resting at camp. This leaves the potential for 2 random encounters each day. To determine if a random encounter occurs, the DM will contest the trailblazer's and scout's checks with a random encounter check by rolling a d20 + modifiers based on the tables below. On a successful contest, roll a random encounter, or chose one you like.",
        children: [
          {
            title: "Modifier Tables",
            text: "The following tables are used to determine the bonus the DM adds to its contested roll against the trailblazer and scouts checks.",
            children: [
              {
                table: {
                  caption: "Environment",
                  headers: ["Modifier Bonus", "Type of Environment"],
                  rows: [
                    ["+0", "An inn or home at a well-established settlement"],
                    ["+1", "Peaceful countryside or safe roads"],
                    ["+2", "Tamed wilderness, or the streets of an urban city"],
                    ["+3", "Untamed wilderness of hazardous or unknown terrain"],
                    ["+4", "Deadly wilderness or caves infested by dangerous monsters"],
                    ["+5", "Alien planes of unspeakable horror"],
                  ],
                },
              },
              {
                table: {
                  caption: "Season",
                  headers: ["Modifier Bonus", "Season"],
                  rows: [
                    ["+0", "Spring"],
                    ["+0", "Summer"],
                    ["+0", "Autumn"],
                    ["+1", "Winter"],
                  ],
                },
              },
              {
                table: {
                  caption: "Travel Pace",
                  headers: ["Modifier Bonus", "Pace"],
                  rows: [
                    ["-2", "Stealth"],
                    ["+0", "Normal"],
                    ["+3", "Fast"],
                  ],
                },
              },
              {
                table: {
                  caption: "Weather",
                  headers: [
                    "Modifier Bonus",
                    "Weather",
                    "Cold Climate",
                    "Temperate Climate",
                    "Desert",
                  ],
                  rows: [
                    ["+0", "Normal", "Cold, calm", "Normal for season", "Calm"],
                    ["+1", "Abnormal", "Heat wave or cold snap", "Heat wave or cold snap", "-"],
                    ["+2", "Inclement", "Precipitation (snow)", "Precipitation (normal for season)", "Windy"],
                    ["+3", "Storm", "Snowstorm", "Thunderstorm, snowstorm", "Duststorm"],
                    ["+4", "Powerful storm", "Blizzard", "Windstorm, blizzard, hurricane, tornado", "Sandstorm"],
                    ["+5", "Strange Phenomena", "-", "-", "-"],
                  ],
                },
              },
              {
                table: {
                  caption: "Time of Day When the Journey Starts",
                  headers: ["Modifier Bonus", "Time of Day"],
                  rows: [
                    ["+0", "Morning"],
                    ["+1", "Afternoon"],
                    ["+2", "Evening"],
                    ["+3", "Night"],
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        title: "Roles for the Journey",
        text: "Traveling across the world uses the same roles as PCs choose from when going on a hunt, but with slightly different uses.",
        lists: [
          {
            name: "Trailblazer",
            items: [
              "The trailblazer is the PC that decides the pace the group is going to travel at (slow, normal, fast). Once they decide the pace for the day, they make a Wisdom (Survival) check. This is then contested by the DM's random encounter check. If the DM succeeds, they roll on a random encounter table.",
            ],
          },
          {
            name: "Scout",
            items: [
              "The scouts role while traveling is not to forge ahead of the group, but instead they are tasked with finding a safe and secluded location to make camp at the end of the traveling day. When finding a camp, the scout will make a Wisdom (Perception) check and a Dexterity (Stealth) check. The DM can then contest the average of the two checks, the lowest check, or highest check (the choice you make should be the standard for the entire campaign). If the DM succeeds, they roll on a random encounter table.",
            ],
          },
          {
            name: "Spotter",
            items: [
              "The spotter is still the eyes and ears of the party during travel. Their passive Perception is used to determine if a random encounter is able to stealthily sneak up on the party or not. Additionally, once a week the spotter is able to roll on the mineral or bone resource table. Skill checks are not required to gather in this way. They may also gather from a lower level location stat block for the area. EX: A level 9 PC can choose to gather from the Level 1-5 location stat block or the 6-10 location stat block.",
            ],
          },
          {
            name: "Artisan",
            items: [
              "A meal cooked by the artisan during travel can last up to one week, but they are able to cook a new meal when camp is setup at the end of the traveling day. Additionally, each day the artisan can roll on an edible resource table (fish, insects, mushrooms, plants) appropriate for the location they are traveling through, to gather a resource. Skill checks are not required to gather in this way. They may also gather from a lower level location stat block for the area. EX: A level 9 PC can choose to gather from the Level 1-5 location stat block or the 6-10 location stat block.",
            ],
          },
        ],
      },
    ],
  },
];
