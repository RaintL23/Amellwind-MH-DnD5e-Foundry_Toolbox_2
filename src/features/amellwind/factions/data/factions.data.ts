import type { GuideSection, GuideTable } from "@/shared/types";

export const FACTIONS_INTRO =
  "Factions shape how your hunter fits into the Old World. Membership ties into backgrounds, renown, contacts, and — for spellcasters — expanded spell lists. Rules below follow Amellwind's Guide to Monster Hunting (Chapter 2, p. 24).";

const HUNTERS_GUILD_SPELLS_TABLE: GuideTable = {
  colLabels: ["Spell Level", "Spells"],
  rows: [
    ["Cantrip", "{@spell produce flame}, {@spell resistance}"],
    ["1st", "{@spell detect poison and disease}, {@spell longstrider}"],
    ["2nd", "{@spell enhance ability}, {@spell gust of wind}"],
    ["3rd", "{@spell fear}, {@spell plant growth}"],
    ["4th", "{@spell elemental bane|XGE}, {@spell guardian of nature|XGE}"],
    ["5th", "{@spell awaken}, {@spell skill empowerment|XGE}"],
  ],
};

export const FACTION_SECTIONS: GuideSection[] = [
  {
    id: "overview",
    name: "Factions Overview",
    page: 24,
    paragraphs: [
      "There are many factions in the Monster Hunter Universe. Some of them make up the foundation of society, while others seek to destroy it. Many of these factions are voluntary associations led by guildmasters, but that's the extent of their resemblance to the craft and merchant guilds found in most Dungeons & Dragons worlds. They include many different kinds of organizations:",
    ],
    bulletList: [
      "A central governing body, the Hunter's Guild",
      "A corporation led by His Immenseness, the Elder Dragon Observation Team",
      "Two research institutions, Wycademy, and the Royal Paleontology Scriveners",
      "A poachers ring, the Talon Society",
      "A cult of fanatics, the Cult of Fatalis",
    ],
    subsections: [
      {
        name: "Living Among Factions",
        paragraphs: [
          "The denizens of the Old World aren't born into factions. An individual can choose to belong to any, or be tricked into some faction or more commonly belong to no faction at all. Some Factions actively recruit new members, while others simply accept those who seek membership. People within a family might join different factions, which can lead to strong connections between the factions in question or to painful animosity in families whose members follow different paths.",
        ],
      },
      {
        name: "Faction Membership",
        paragraphs: [
          "You establish your character's membership in a faction by choosing one of their faction backgrounds from among those detailed in this chapter. This guide assumes that you have chosen a faction and that you maintain your association with it throughout your life. As a result, your choice of faction can play a more significant role than most backgrounds do in shaping what your character does now.",
          "The backgrounds associated with factions in this chapter work like those in the {@i Player's Handbook}, giving you proficiencies, languages, equipment, and suggested characteristics (personality traits, ideals, bonds, and flaws). Each faction entry also provides personal contacts; suggestions for your alignment, race, and class; and a list of spells that you can add to your spell list if you're a member of a spellcasting class.",
        ],
        subsections: [
          {
            name: "Faction Spells",
            paragraphs: [
              "The spellcasters of the Old World's factions have magic specific to their guild. A faction's description includes a list of faction spells.",
              "If you play a character who has the Spellcasting or the Pact Magic class feature, your guild spells are added to the spell list for your class, thereby expanding the spell options available to you.",
            ],
          },
          {
            name: "Additional Rules",
            paragraphs: [
              "The factions in the Monster Hunter Universe use the same rules for renown and contacts as found in {@i The Guildmaster's Guide to Ravnica} starting on page 29. As such I cannot just put all that information into this guide, but I will sum up a generic explanation of each rule.",
            ],
            subsections: [
              {
                name: "Contacts",
                paragraphs: [
                  "Contacts are people you know. They might be a rival, a mentor, a friend, just another member of the faction or possibly a member of a different faction entirely. These contacts should be created with your DM and may provide additional depth for your character. When you create a character you have a number of contacts equal to your Intelligence modifier (minimum of 1).",
                ],
              },
              {
                name: "Renown",
                paragraphs: [
                  "Renown is your status in a faction. The higher your renown is, typically the more known and respected you are within the faction. It's also possible to gain renown in other factions, though this renown won't allow you to gain any ranks within the other factions.",
                  "To gain renown you must advance the guild's agenda in some way. You will find in the Rank and Renown section of each faction, some suggestions that would merit an increase in your renown, but you should also check the goals of the faction to help determine other ways to gain renown. When you join a faction as a starting character, your renown score with that faction is 1. It is up to the DM when you gain renown, not the player.",
                  "There are other rules for gaining renown outside of the list above, but that can be found in {@i The Guildmaster's Guide to Ravnica}.",
                ],
              },
              {
                name: "Benefits of Renown",
                paragraphs: [
                  "There are many benefits when you gain renown in a faction, most often it is tied to an increase in rank within the faction you are in, but not all are guild specific such as the two below:",
                  "{@b Renown 3 or Higher.} You have established yourself as a respected member of the guild and as such, the guild members are friendly to you by default (though some members might have a reason to dislike you).",
                  "{@b Renown 5 or Higher.} You gain another contact. This might be a member of your faction, or perhaps someone else you met on your adventures.",
                ],
              },
              {
                name: "Losing Renown",
                paragraphs: [
                  "If you go against your faction, or commit a crime against society or nature, you might lose renown. It is up to the DM to determine how much based on the offense. You cannot drop below 0 renown with a faction, but if your renown drops below the required amount for your rank, then you lose the rank and any benefits it gave you. It also may be much harder to obtain that rank again.",
                ],
              },
              {
                name: "Changing Factions",
                paragraphs: [
                  "If for some reason you chose to change factions, be it due to the narrative of the story, or some other reason, you then lose all renown with your previous faction and start with 0 renown with the new faction. The only exception with this is if you already gained renown with the new faction prior to joining them. Then instead you start with the renown you already had with them, though it may still take time for you to rise in the ranks.",
                ],
              },
            ],
          },
        ],
      },
    ],
    footerNote:
      "{@i Additional Factions will be added in future updates to Amellwind's Guide to Monster Hunting.}",
  },
  {
    id: "hunters-guild",
    name: "The Hunter's Guild",
    page: 24,
    quote: {
      paragraphs: [
        "I am the esteemed instructor of the Pokke Training School. I am currently looking for as many students as possible to join my hunter's training school. It was ten years ago that this school started with a dream...",
        "... a dream held by hunters who burn with the desires of youth, a dream held by those who wish to become real hunters, a dream held by hunters looking to perfect their skills, a dream held by hunters looking to tie their hopes onto me in their three legged race to first class status! The gate to my Training School is always open, especially to my fans!",
      ],
      attribution: "Hunter Training School Master Azrar",
    },
    paragraphs: [
      "The Hunter's Guild is the central governing body within the Monster Hunter universe. The Hunter's Guild unifies and regulates all hunting activities on which many people make their living. The guild aggregates hunting and gathering requests from far and wide, and posts them within their gathering halls and outposts throughout the land for professional hunters to undertake. These \"quests\" can have many purposes, including defense of citizens or towns, or research into monster anatomy and biology. The Hunter's Guild is also well-known for preventing poaching. Any unsanctioned hunting is illegal to the Hunter's Guild and can lead to a multitude of punishments, but most commonly death at the hand of a Guild Knight.",
      "The Hunter's Guild headquarters are located in the city of Dundorma, and all major announcements and actions are made from this location. Beyond this, the Hunter's Guild commands a sprawling territory comprising many districts located in a multitude of regions. Each district has a guild master that manages the district, though not all of them are the best managers. Hunter's Guild-certified gathering halls can be found in all major city centers such as the ones noted above. Smaller Hunter's Guild outposts, commonly set up in less populous and more remote towns and villages, such as Pokke Village, Moga Village, or Yukumo Village, and are handled by one or more Hunter's Guild-employed representatives. These smaller outposts are considered to be a part of the larger districts in which they are located.",
      "Though the Hunter's Guild is connected together, each district of it prefers to work alone. This means that not every district is aware of new discoveries made by the other, such as locations and monsters.",
    ],
    subsections: [
      {
        name: "The Four Swords of the Guild",
        paragraphs: [
          "The Hunter's Guild crest has four symbols on it. Each symbol on the crest has a meaning that the Hunter's Guild follows. The north represents {@i Respect for nature}, the west represents {@i Life as a community}, the south represents {@i Crafting from nature}, and the east represents {@i Prosperity from nature}.",
        ],
      },
      {
        name: "Fate of Most Captured Monsters",
        paragraphs: [
          "Usually when a monster is captured, it is torn apart in its sleep with ease by the corporation that requested it. This is due to said corporation wanting to research the body parts and organs of said monster, allowing them to better understand a certain species. The corporations that request for monsters to be captured include Elder Dragon Observation Team, Wycademy, and the Royal Paleontology Scriveners. Only on some rare occasions, is the monster tamed and becomes a person's pet.",
        ],
      },
      {
        name: "Goal of the Hunter's Guild",
        paragraphs: [
          "The Hunter's Guild doesn't exist to annihilate all monsters, they exist to harmonize society with nature. Their primary goal is to prevent further damage to the monster populations, so they can prevent other monster species from going extinct like some ancient species. However, if a monster threatens lives, towns, cities, etc, then hunters are allowed to hunt it to prevent destruction. If the monster is rare, the guild will sometimes seek to repel the monster rather than kill it.",
          "The Hunter's Guild also seeks to minimize poaching. Any kill or capture unsanctioned by the Hunter's Guild is illegal in the eyes of the guild. Poaching can lead to a multitude of punishments, but most commonly death at the hand of a Guild Knight.",
          "Furthermore, the Hunter's Guild is responsible for discovering and determining specific hunting grounds throughout the land. Only when a swath of area is officially within the guild's jurisdiction can it be embarked upon for the purposes of undertaking quests. Even despite this, the guild will sometimes only allow hunters within a specific city or region to accept certain quests.",
          "Finally, the Hunter's Guild seeks to rid the world of the monsters that succumb to corruption. These creatures are treated with the highest priority and are one of the few creatures allowed to be killed outside of a hunting ground.",
        ],
      },
      {
        name: "Hierarchy of the Guild",
        subsections: [
          {
            name: "Guild Masters",
            paragraphs: [
              "Guild masters are the leaders of their district. Beyond bureaucratic work, they mainly help hunters register into the Hunter's Guild, in order to let them hunt legally under this corporation and test a hunter's strength. They are known to test a hunter's strength with Urgent Quests in order to see if the hunter is worthy of ranking up. Guild masters are also known to give the hunters various types of advice to help them overcome challenges.",
              "Under the laws set by His Immenseness, the guild master job/title is limited only to wyverians and elves. There are currently four known guild masters located in Dundorma, Loc Lac, Minegarde, and Val Harbor, each a wyverian, responsible for their own districts.",
            ],
          },
          {
            name: "Guild Managers",
            paragraphs: [
              "The guild managers are much like the guild masters, helping hunters register into the Hunter's Guild and providing various types of advice to help them overcome challenges. In addition to their Hunter's Guild responsibilities., the guild managers act like mayors of the town or village they live in, answering only to the guild master in the district where they reside. The guild manager job is also limited to elves and wyverians.",
            ],
          },
          {
            name: "Guild Knights",
            paragraphs: [
              "The main job of a guild knight is to hunt down poachers, other illegal hunters, and wanted murderers; bringing them to justice, typically by killing them. This also applies to hunters that break the rules of the Hunter's Guild. If an emergency situation happens during their post, guild knights try to keep order by acting as leaders. Guild knights have also been known to act as negotiators for settlements and collect info on monsters unknown to the public.",
              "In each district and outpost of the Hunter's Guild, there can be at least twelve guild knights in one location at a time, though there can sometimes be less. Who the guild knights are is mostly unknown to the common members of the guild. Preferring to keep their job a secret, many of the guild knights do other jobs within the guild, acting as receptionists, hunters, teachers, or merchants.",
            ],
          },
          {
            name: "Guild Receptionists",
            paragraphs: [
              "Since monster hunting is a popular job among the world and the geography of the world being mostly unknown, along with its history, a special few individuals have the job of collecting information. This information is not only about an area but the monsters that inhabit it. It is the guild receptionist's job to give hunters quests and to inform them about any monsters within their rank. The job mainly allows females to be guild receptionists, however, some males can be qualified as one too.",
              "The uniforms are different for each district for guild receptionists. Some uniforms are perfect for going to many different environments, others just make it easier to move from place to place while on the job. Many handlers chose to become receptionists after retiring from the field.",
            ],
          },
        ],
      },
      {
        name: "Figures of Interest",
        subsections: [
          {
            name: "Felcote",
            paragraphs: [
              "{@i Guild Knight, Felyne Battlemaster} A secret guild knight found typically in pokke village. Felcote is a very secretive individual that is seemingly calm and polite. Her job is to search for extremely talented hunters in the world and send them on secret requests to test their skills. Felcote does this to recruit new hunters into the Hunter's Guild highest ranks of honor.",
            ],
          },
          {
            name: "Becky",
            paragraphs: [
              "{@i Guild Knight, Human Paladin} She is a guild receptionist, and secretly a guild knight found in Minegarde and occasionally Kokoto Village. She doesn't really like to work much, though she can be quite blunt, giving those that do not know her the impression that she is rude. She sometimes investigates the room of hunters and kills those that break the rules of the Hunter's Guild with a single smash of her hammer. She also occasionally goes out on hunts by herself.",
            ],
          },
          {
            name: "Patty",
            paragraphs: [
              "{@i Guild Receptionist, Human Cleric} Patty is known for being a workaholic. She is also known for being kind-hearted, though someone, like Becky, can scare her or make her cry quite easily. Though she is just a receptionist, Patty now watches over Jumbo Village due to her \"father\", Jumbo Chief, leaving her to travel around the world. She has a dream to travel around the world someday, just like him.",
            ],
          },
          {
            name: "Kokoto Chief",
            paragraphs: [
              "{@i Guild Manager, Wyverian Samurai} At one time, he was adventurous and didn't fear any challenges. Nowadays, Kokoto Chief doesn't really show too many emotions. In his youth, he was a legendary hunter that helped shape hunting today. From the beginning of his hunting career, he loved hunting together with his three companions and his wife, even allowing her to attend some hunts. This sadly led to an incident only known as the Five. Today, Kokoto Chief is retired and watches over Kokoto Village. Kokoto Chief also now trains the next generation of hunters.",
            ],
          },
        ],
      },
      {
        name: "Hunter's Guild Characters",
        paragraphs: [
          "{@b Alignment:} Usually lawful or good, often neutral",
          "{@b Suggested Races:} Any race, but rarely do monstrous races join",
          "{@b Suggested Classes:} All",
          "Consider the Hunter's Guild for your character if one or more of the following sentences ring true:",
        ],
        bulletList: [
          "You seek fame and fortune.",
          "You have a thirst for adventure.",
          "You enjoy the great outdoors, exploration, and finding rare and undiscovered creatures",
        ],
        subsections: [
          {
            name: "Joining the Hunter's Guild",
            paragraphs: [
              "In order to undertake guild-sponsored quests, you must first register yourself as an official Monster Hunter under the Hunter's Guild. Following this, you are sent to a training school where you undergo rigorous physical and mental training. Afterwards you are given a specific measure of personal skill or \"Hunter Rank\" (often shortened to HR), based on how well you do in the training.",
            ],
            subsections: [
              {
                name: "Hunter Rank",
                paragraphs: [
                  "A hunter rank is how the Hunter's Guild can gauge one's ability to undertake varying levels of hunting requests. In accordance with this, the guild will assign rankings, often on a number-of-stars basis, to quests listings to ensure that dangerous or difficult quests are only embarked upon by skilled hunters who have proven their aptitude. This is both to ensure the safety of its hunters and to ensure that the request is properly completed.",
                  "If hunters are extremely skilled, they will sometimes be sent to do secret requests or investigations for extremely dangerous monsters. They will do these quests secretly so it won't cause a panic to the public, in order to get a better understanding of said situation, because in some cases it is just a false alarm, and so the Hunter's Guild can come up with the proper actions needed to protect the truth or the public without causing a panic.",
                ],
              },
              {
                name: "Guild Card",
                paragraphs: [
                  "Each hunter is also given a Guild Card that they can customize at their own free will. They are used as an ID for hunters to list their name, awards they've collected, and the monsters they have slain. These cards can be made out of various materials like timber, ore, and monster materials. The Guild Cards of some elite hunters are known to be made of parts belonging to more dangerous monsters, such as Nargacuga scales and the shell of Zinogre. Some legendary hunters have cards made out of Elder Dragon materials. Each hunter is known to have their own personalized title given to them by their guildmaster.",
                ],
              },
            ],
          },
          {
            name: "Hunter's Guild Spells",
            paragraphs: [
              "{@i Prerequisite: Spellcasting or Pact Magic class feature}",
              "For you, the spells on the Hunter's Guild Spells table are added to the spell list of your spellcasting class. (If you are a multiclass character with multiple spell lists, these spells are added to all of them.)",
            ],
            table: HUNTERS_GUILD_SPELLS_TABLE,
          },
          {
            name: "Hunter's Guild Backgrounds",
            paragraphs: [
              "As your training comes to an end and your adventuring career begins, you must decide where your ambitions lie in your future with the Hunter's Guild. In this section you will find a number of backgrounds based on the many employment opportunities a hunter has as their Hunter Rank increases.",
              "No matter the background you pick, each member of the Hunter's Guild has the same background feature.",
            ],
            subsections: [
              {
                name: "Feature: Guild Membership",
                paragraphs: [
                  "Your guild will provide you with food and accommodation if necessary. You have access to a guild hall if one is present (located in most cities, towns, and villages). The guild will support you in legal matters, so long as your rank is high enough and you are in good standing with the guild, and is a good way to gain introduction to influential members of society. Connections made through the guild for personal reasons may require a donation to the guild coffers. The guild requires dues of 5gp a month or at least one completed hunt per month.",
                ],
              },
            ],
            bulletList: [
              "{@background Hunter Initiate|AGMH}",
              "{@background Apprentice Guild Knight|AGMH}",
              "{@background Handler Initiate|AGMH}",
            ],
          },
          {
            name: "How do I Fit In?",
            paragraphs: [
              "As a member of the Hunter's Guild, your primary goal is to prevent untoward damage to the monster populations, while providing a service and protection to society. Due to this, you are expected to keep tabs on the monster populations in areas and report any strange events to the guild leaders. The laws also prevent you from taking the same quest more than once, unless it is necessary. However, if a monster threatens lives, towns, cities, etc. then you are allowed to hunt it to prevent destruction, even if the monster is rare.",
              "As a hunter, handler, guild knight, or other role, you will spend most of your time completing bounties and other requests as a way to make a living within the guild. A hunter initiate is the core role in the hunters guild where you might strive to become like one of the hunters of legends, or perhaps to seek to preserve the balance in nature. It is not uncommon for you to take the scout role on a hunt.",
              "As a handler initiate you are typically the caretaker of the group. You might spend most of your down time in the books learning as much as you can about the creatures in the area, or in shops buying up new supplies to ease the difficulty of an upcoming hunt. It is not uncommon for you to take the artisan or spotter roles on a hunt.",
              "As a guild knight you are charged with enforcing the laws of the guild, on the streets or in the wilds. When you aren't off on a hunt, you most likely spend your time rooting out poachers or members of the cult of Fatalis. It is not uncommon for you to take the spotter role on a hunt.",
            ],
            subsections: [
              {
                name: "A Hunter's Guild Party",
                paragraphs: [
                  "An adventuring party made up entirely of Hunter's Guild members could be a specialized team dedicated to the preservation of nature and society. A hunter initiate (a rogue or ranger) and a guild knight apprentice (fighter, or paladin) would form the core of the party, supported by a handler (cleric or druid) who helps direct their missions.",
                ],
              },
            ],
          },
          {
            name: "Hunter Rank and Renown",
            paragraphs: [
              "A member of the Hunter's Guild gains renown typically when they complete dangerous hunts, discover new information about creatures, or prevent something from disrupting nature's balance, such as poachers. By gaining renown as a member of the Hunter's Guild, you can advance your hunter rank within the guild. Promotion through the ranks requires the approval of the guild master. Advancement is a reward for services rendered to the guild, rather than an automatic consequence of increased renown.",
            ],
            subsections: [
              {
                name: "HR 1",
                paragraphs: [
                  "{@i Prerequisite: Renown 1 or higher in the Hunter's Guild}",
                  "Having completed your first dangerous hunt, the guild recognizes you as a true hunter. Your rank allows you to take on higher difficulty hunts and the guild provides you with a home and a modest living wage while you are in a town or village where a guild hall can be found. The guild also provides you with supplies you need to complete those missions (within reason) and access to their guild store.",
                ],
              },
              {
                name: "HR 2",
                paragraphs: [
                  "{@i Prerequisite: Rank 1 and renown 10 or higher in the Hunter's Guild, 4th level or higher}",
                  "At this rank, you have begun to make a name for yourself and as such the guild provides you with access to purchase CR 2 or lower materials that the guild store offers ({@i DMs choice of what materials and when the stock changes}). Additionally you are given a lynian caretaker for your home and even though they may not go hunt in the field with you, it is not unheard of for a caretaker to give its hunter gifts when they return from a hunt.",
                ],
              },
              {
                name: "HR 3",
                paragraphs: [
                  "{@i Prerequisite: Rank 2 and renown 25 or higher in the Hunter's Guild, 8th level or higher}",
                  "At HR 3, you are responsible for hunting some of the more dangerous monsters in the world when they become a threat to a settlement or the ecosystem it is located in. As such, you are given access to the guilds wingdrakes (see page 191 of the MHMM for its stat block) or other mounts for faster travel between locations. Additionally, the guild grants you permission to purchase CR 4 or lower materials that the guild store offers ({@i DMs choice of what materials and when the stock changes}).",
                ],
              },
              {
                name: "HR 4",
                paragraphs: [
                  "{@i Prerequisite: Rank 3 and renown 50 or higher in the Hunter's Guild, 12th level or higher}",
                  "As a HR 4, you are an elite hunter and given access to G ranked hunts (hunts kept hidden from the populace for their own safety and to prevent panic should the knowledge get out) and other secret information hidden away by the guild. As an elite hunter your words and actions reflect immensely on the guild, but also carry an immeasurable weight with them. As such, nobles and other members of high society treat you with great respect, unless you prove yourself untrustworthy.",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
