export type DiceSpec = {
  count: number;
  sides: number;
  modifier?: number | "charisma" | "lifestyle";
  label?: string;
};

export type TableRow = {
  range: [number, number];
  result: string;
  subTableId?: string;
};

export type XgeTable = {
  id: string;
  name: string;
  dice: DiceSpec;
  rows: TableRow[];
  note?: string;
  /** If true, this table is only relevant for a specific race / background / class */
  filterType?: "race" | "background" | "class";
  filterValue?: string;
  /** If true, the result may contain a dice formula that needs further rolling */
  resultIsDice?: boolean;
};

export type XgeSection = {
  id: string;
  name: string;
  description?: string;
  tables: XgeTable[];
};

// ---------------------------------------------------------------------------
// SECTION 1: ORIGINS
// ---------------------------------------------------------------------------

const ORIGINS_TABLES: XgeTable[] = [
  {
    id: "parents",
    name: "Parents",
    dice: { count: 1, sides: 100, label: "d100" },
    note: "Roll to know if you know who your parents were. For Half-Elves, Half-Orcs, or Tieflings, also roll on the appropriate race-specific table.",
    rows: [
      { range: [1, 95], result: "You know who your parents are or were." },
      { range: [96, 100], result: "You do not know who your parents were." },
    ],
  },
  {
    id: "parents-half-elf",
    name: "Half-Elf Parents",
    dice: { count: 1, sides: 8, label: "d8" },
    filterType: "race",
    filterValue: "Half-Elf",
    rows: [
      { range: [1, 5], result: "One parent was an elf and the other was a human." },
      { range: [6, 6], result: "One parent was an elf and the other was a half-elf." },
      { range: [7, 7], result: "One parent was a human and the other was a half-elf." },
      { range: [8, 8], result: "Both parents were half-elves." },
    ],
  },
  {
    id: "parents-half-orc",
    name: "Half-Orc Parents",
    dice: { count: 1, sides: 8, label: "d8" },
    filterType: "race",
    filterValue: "Half-Orc",
    rows: [
      { range: [1, 3], result: "One parent was an orc and the other was a human." },
      { range: [4, 5], result: "One parent was an orc and the other was a half-orc." },
      { range: [6, 7], result: "One parent was a human and the other was a half-orc." },
      { range: [8, 8], result: "Both parents were half-orcs." },
    ],
  },
  {
    id: "parents-tiefling",
    name: "Tiefling Parents",
    dice: { count: 1, sides: 8, label: "d8" },
    filterType: "race",
    filterValue: "Tiefling",
    rows: [
      { range: [1, 4], result: "Both parents were humans, their infernal heritage dormant until you came along." },
      { range: [5, 6], result: "One parent was a tiefling and the other was a human." },
      { range: [7, 7], result: "One parent was a tiefling and the other was a devil." },
      { range: [8, 8], result: "One parent was a human and the other was a devil." },
    ],
  },
  {
    id: "birthplace",
    name: "Birthplace",
    dice: { count: 1, sides: 100, label: "d100" },
    note: "After rolling, also roll percentile dice. On a 00, a strange event coincided with your birth.",
    rows: [
      { range: [1, 50], result: "Home" },
      { range: [51, 55], result: "Home of a family friend" },
      { range: [56, 63], result: "Home of a healer or midwife" },
      { range: [64, 65], result: "Carriage, cart, or wagon" },
      { range: [66, 68], result: "Barn, shed, or other outbuilding" },
      { range: [69, 70], result: "Cave" },
      { range: [71, 72], result: "Field" },
      { range: [73, 74], result: "Forest" },
      { range: [75, 77], result: "Temple" },
      { range: [78, 78], result: "Battlefield" },
      { range: [79, 80], result: "Alley or street" },
      { range: [81, 82], result: "Brothel, tavern, or inn" },
      { range: [83, 84], result: "Castle, keep, tower, or palace" },
      { range: [85, 85], result: "Sewer or rubbish heap" },
      { range: [86, 88], result: "Among people of a different race" },
      { range: [89, 91], result: "On board a boat or a ship" },
      { range: [92, 93], result: "In a prison or in the headquarters of a secret organization" },
      { range: [94, 95], result: "In a sage's laboratory" },
      { range: [96, 96], result: "In the Feywild" },
      { range: [97, 97], result: "In the Shadowfell" },
      { range: [98, 98], result: "On the Astral Plane or the Ethereal Plane" },
      { range: [99, 99], result: "On an Inner Plane of your choice" },
      { range: [100, 100], result: "On an Outer Plane of your choice" },
    ],
  },
  {
    id: "siblings-count",
    name: "Number of Siblings",
    dice: { count: 1, sides: 10, label: "d10" },
    note: "If you are a Dwarf or Elf, subtract 2 from your roll (minimum 1). A result of '1d3', '1d4+1', etc. means roll that formula to get the actual number of siblings.",
    resultIsDice: true,
    rows: [
      { range: [1, 2], result: "None" },
      { range: [3, 4], result: "1d3" },
      { range: [5, 6], result: "1d4+1" },
      { range: [7, 8], result: "1d6+2" },
      { range: [9, 10], result: "1d8+3" },
    ],
  },
  {
    id: "birth-order",
    name: "Birth Order",
    dice: { count: 2, sides: 6, label: "2d6" },
    note: "Roll once per sibling to determine their age relative to yours.",
    rows: [
      { range: [2, 2], result: "Twin, triplet, or quadruplet" },
      { range: [3, 7], result: "Older" },
      { range: [8, 12], result: "Younger" },
    ],
  },
  {
    id: "family",
    name: "Family",
    dice: { count: 1, sides: 100, label: "d100" },
    note: "If you know who your parents are but you get a result that does not mention one or both of them, also roll on the Absent Parent table.",
    rows: [
      { range: [1, 1], result: "None" },
      { range: [2, 2], result: "Institution, such as an asylum" },
      { range: [3, 3], result: "Temple" },
      { range: [4, 5], result: "Orphanage" },
      { range: [6, 7], result: "Guardian" },
      { range: [8, 15], result: "Paternal or maternal aunt, uncle, or both" },
      { range: [16, 25], result: "Paternal or maternal grandparent(s)" },
      { range: [26, 35], result: "Adoptive family (same or different race)" },
      { range: [36, 55], result: "Single father or stepfather" },
      { range: [56, 75], result: "Single mother or stepmother" },
      { range: [76, 100], result: "Mother and father" },
    ],
  },
  {
    id: "absent-parent",
    name: "Absent Parent",
    dice: { count: 1, sides: 4, label: "d4" },
    note: "Roll only if you know your parents but the Family table result doesn't mention them.",
    rows: [
      { range: [1, 1], result: "Your parent died (roll on the Cause of Death supplemental table).", subTableId: "cause-of-death" },
      { range: [2, 2], result: "Your parent was imprisoned, enslaved, or otherwise taken away." },
      { range: [3, 3], result: "Your parent abandoned you." },
      { range: [4, 4], result: "Your parent disappeared to an unknown fate." },
    ],
  },
  {
    id: "family-lifestyle",
    name: "Family Lifestyle",
    dice: { count: 3, sides: 6, label: "3d6" },
    note: "The number shown in parentheses is the modifier you add to your roll on the Childhood Home table.",
    rows: [
      { range: [3, 3], result: "Wretched (modifier: −40)" },
      { range: [4, 5], result: "Squalid (modifier: −20)" },
      { range: [6, 8], result: "Poor (modifier: −10)" },
      { range: [9, 12], result: "Modest (modifier: +0)" },
      { range: [13, 15], result: "Comfortable (modifier: +10)" },
      { range: [16, 17], result: "Wealthy (modifier: +20)" },
      { range: [18, 18], result: "Aristocratic (modifier: +40)" },
    ],
  },
  {
    id: "childhood-home",
    name: "Childhood Home",
    dice: { count: 1, sides: 100, modifier: "lifestyle", label: "d100 + Lifestyle modifier" },
    note: "Add the modifier from your Family Lifestyle result to this roll.",
    rows: [
      { range: [0, 0], result: "On the streets" },
      { range: [1, 20], result: "Rundown shack" },
      { range: [21, 30], result: "No permanent residence; you moved around a lot" },
      { range: [31, 40], result: "Encampment or village in the wilderness" },
      { range: [41, 50], result: "Apartment in a rundown neighborhood" },
      { range: [51, 70], result: "Small house" },
      { range: [71, 90], result: "Large house" },
      { range: [91, 110], result: "Mansion" },
      { range: [111, 140], result: "Palace or castle" },
    ],
  },
  {
    id: "childhood-memories",
    name: "Childhood Memories",
    dice: { count: 3, sides: 6, modifier: "charisma", label: "3d6 + Charisma modifier" },
    note: "Add your Charisma modifier to this roll.",
    rows: [
      { range: [1, 3], result: "I am still haunted by my childhood, when I was treated badly by my peers." },
      { range: [4, 5], result: "I spent most of my childhood alone, with no close friends." },
      { range: [6, 8], result: "Others saw me as being different or strange, and so I had few companions." },
      { range: [9, 12], result: "I had a few close friends and lived an ordinary childhood." },
      { range: [13, 15], result: "I had several friends, and my childhood was generally a happy one." },
      { range: [16, 17], result: "I always found it easy to make friends, and I loved being around people." },
      { range: [18, 25], result: "Everyone knew who I was, and I had friends everywhere I went." },
    ],
  },
];

// ---------------------------------------------------------------------------
// SECTION 2: PERSONAL DECISIONS — BACKGROUND (d6 each)
// ---------------------------------------------------------------------------

function makeBackgroundTable(id: string, bgName: string, rows: string[]): XgeTable {
  return {
    id,
    name: bgName,
    dice: { count: 1, sides: 6, label: "d6" },
    filterType: "background",
    filterValue: bgName,
    rows: rows.map((result, i) => ({ range: [i + 1, i + 1] as [number, number], result })),
  };
}

const BACKGROUND_TABLES: XgeTable[] = [
  makeBackgroundTable("bg-acolyte", "Acolyte", [
    "I ran away from home at an early age and found refuge in a temple.",
    "My family gave me to a temple, since they were unable or unwilling to care for me.",
    "I grew up in a household with strong religious convictions. Entering the service of one or more gods seemed natural.",
    "An impassioned sermon struck a chord deep in my soul and moved me to serve the faith.",
    "I followed a childhood friend, a respected acquaintance, or someone I loved into religious service.",
    "After encountering a true servant of the gods, I was so inspired that I immediately entered the service of a religious group.",
  ]),
  makeBackgroundTable("bg-charlatan", "Charlatan", [
    "I was left to my own devices, and my knack for manipulating others helped me survive.",
    "I learned early on that people are gullible and easy to exploit.",
    "I often got in trouble, but I managed to talk my way out of it every time.",
    "I took up with a confidence artist, from whom I learned my craft.",
    "After a charlatan fleeced my family, I decided to learn the trade so I would never be fooled by such deception again.",
    "I was poor or I feared becoming poor, so I learned the tricks I needed to keep myself out of poverty.",
  ]),
  makeBackgroundTable("bg-criminal", "Criminal", [
    "I resented authority in my younger days and saw a life of crime as the best way to fight against tyranny and oppression.",
    "Necessity forced me to take up the life, since it was the only way I could survive.",
    "I fell in with a gang of reprobates and ne'er-do-wells, and I learned my specialty from them.",
    "A parent or relative taught me my criminal specialty to prepare me for the family business.",
    "I left home and found a place in a thieves' guild or some other criminal organization.",
    "I was always bored, so I turned to crime to pass the time and discovered I was quite good at it.",
  ]),
  makeBackgroundTable("bg-entertainer", "Entertainer", [
    "Members of my family made ends meet by performing, so it was fitting for me to follow their example.",
    "I always had a keen insight into other people, enough so that I could make them laugh or cry with my stories or songs.",
    "I ran away from home to follow a minstrel troupe.",
    "I saw a bard perform once, and I knew from that moment on what I was born to do.",
    "I earned coin by performing on street corners and eventually made a name for myself.",
    "A traveling entertainer took me in and taught me the trade.",
  ]),
  makeBackgroundTable("bg-folk-hero", "Folk Hero", [
    "I learned what was right and wrong from my family.",
    "I was always enamored by tales of heroes and wished I could be something more than ordinary.",
    "I hated my mundane life, so when it was time for someone to step up and do the right thing, I took my chance.",
    "A parent or one of my relatives was an adventurer, and I was inspired by that person's courage.",
    "A mad old hermit spoke a prophecy when I was born, saying that I would accomplish great things.",
    "I have always stood up for those who are weaker than I am.",
  ]),
  makeBackgroundTable("bg-guild-artisan", "Guild Artisan", [
    "I was apprenticed to a master who taught me the guild's business.",
    "I helped a guild artisan keep a secret or complete a task, and in return I was taken on as an apprentice.",
    "One of my family members who belonged to the guild made a place for me.",
    "I was always good with my hands, so I took the opportunity to learn a trade.",
    "I wanted to get away from my home situation and start a new life.",
    "I learned the essentials of my craft from a mentor but had to join the guild to finish my training.",
  ]),
  makeBackgroundTable("bg-hermit", "Hermit", [
    "My enemies ruined my reputation, and I fled to the wilds to avoid further disparagement.",
    "I am comfortable with being isolated, as I seek inner peace.",
    "I never liked the people I called my friends, so it was easy for me to strike out on my own.",
    "I felt compelled to forsake my past, but did so with great reluctance, and sometimes I regret making that decision.",
    "I lost everything—my home, my family, my friends. Going it alone was all I could do.",
    "Society's decadence disgusted me, so I decided to leave it behind.",
  ]),
  makeBackgroundTable("bg-noble", "Noble", [
    "I come from an old and storied family, and it fell to me to preserve the family name.",
    "My family has been disgraced, and I intend to clear our name.",
    "My family recently came by its title, and that elevation thrust us into a new and strange world.",
    "My family has a title, but none of my ancestors have distinguished themselves since we gained it.",
    "My family is filled with remarkable people. I hope to live up to their example.",
    "I hope to increase my family's power and influence.",
  ]),
  makeBackgroundTable("bg-outlander", "Outlander", [
    "I spent a lot of time in the wilderness as a youngster, and I came to love that way of life.",
    "From a young age, I couldn't abide the stink of the cities and preferred to spend my time in nature.",
    "I came to understand the darkness that lurks in the wilds, and I vowed to combat it.",
    "My people lived on the edges of civilization, and I learned the methods of survival from my family.",
    "After a tragedy I retreated to the wilderness, leaving my old life behind.",
    "My family moved away from civilization, and I learned to adapt to my new environment.",
  ]),
  makeBackgroundTable("bg-sage", "Sage", [
    "I was naturally curious, so I packed up and went to a university to learn more about the world.",
    "My mentor's teachings opened my mind to new possibilities in that field of study.",
    "I was always an avid reader, and I learned much about my favorite topic on my own.",
    "I discovered an old library and pored over the texts I found there. That experience awakened a hunger for more knowledge.",
    "I impressed a wizard who told me I was squandering my talents and should seek out an education to take advantage of my gifts.",
    "One of my parents or a relative gave me a basic education that whetted my appetite, and I left home to build on what I had learned.",
  ]),
  makeBackgroundTable("bg-sailor", "Sailor", [
    "I was press-ganged by pirates and forced to serve on their ship until I finally escaped.",
    "I wanted to see the world, so I signed on as a deck-hand for a merchant ship.",
    "One of my relatives was a sailor who took me to sea.",
    "I needed to escape my community quickly, so I stowed away on a ship. When the crew found me, I was forced to work for my passage.",
    "Reavers attacked my community, so I found refuge on a ship until I could seek vengeance.",
    "I had few prospects where I was living, so I left to find my fortune elsewhere.",
  ]),
  makeBackgroundTable("bg-soldier", "Soldier", [
    "I joined the militia to help protect my community from monsters.",
    "A relative of mine was a soldier, and I wanted to carry on the family tradition.",
    "The local lord forced me to enlist in the army.",
    "War ravaged my homeland while I was growing up. Fighting was the only life I ever knew.",
    "I wanted fame and fortune, so I joined a mercenary company, selling my sword to the highest bidder.",
    "Invaders attacked my homeland. It was my duty to take up arms in defense of my people.",
  ]),
  makeBackgroundTable("bg-urchin", "Urchin", [
    "Wanderlust caused me to leave my family to see the world. I look after myself.",
    "I ran away from a bad situation at home and made my own way in the world.",
    "Monsters wiped out my village, and I was the sole survivor. I had to find a way to survive.",
    "A notorious thief looked after me and other orphans, and we spied and stole to earn our keep.",
    "One day I woke up on the streets, alone and hungry, with no memory of my early childhood.",
    "My parents died, leaving no one to look after me. I raised myself.",
  ]),
];

// ---------------------------------------------------------------------------
// SECTION 3: PERSONAL DECISIONS — CLASS TRAINING (d6 each)
// ---------------------------------------------------------------------------

function makeClassTable(id: string, className: string, rows: string[]): XgeTable {
  return {
    id,
    name: className,
    dice: { count: 1, sides: 6, label: "d6" },
    filterType: "class",
    filterValue: className,
    rows: rows.map((result, i) => ({ range: [i + 1, i + 1] as [number, number], result })),
  };
}

const CLASS_TABLES: XgeTable[] = [
  makeClassTable("cls-barbarian", "Barbarian", [
    "My devotion to my people lifted me in battle, making me powerful and dangerous.",
    "The spirits of my ancestors called on me to carry out a great task.",
    "I lost control in battle one day, and it was as if something else was manipulating my body, forcing it to kill every foe I could reach.",
    "I went on a spiritual journey to find myself and instead found a spirit animal to guide, protect, and inspire me.",
    "I was struck by lightning and lived. Afterward, I found a new strength within me that let me push beyond my limitations.",
    "My anger needed to be channeled into battle, or I risked becoming an indiscriminate killer.",
  ]),
  makeClassTable("cls-bard", "Bard", [
    "I awakened my latent bardic abilities through trial and error.",
    "I was a gifted performer and attracted the attention of a master bard who schooled me in the old techniques.",
    "I joined a loose society of scholars and orators to learn new techniques of performance and magic.",
    "I felt a calling to recount the deeds of champions and heroes, to bring them alive in song and story.",
    "I joined one of the great colleges to learn old lore, the secrets of magic, and the art of performance.",
    "I picked up a musical instrument one day and instantly discovered that I could play it.",
  ]),
  makeClassTable("cls-cleric", "Cleric", [
    "A supernatural being in service to the gods called me to become a divine agent in the world.",
    "I saw the injustice and horror in the world and felt moved to take a stand against them.",
    "My god gave me an unmistakable sign. I dropped everything to serve the divine.",
    "Although I was always devout, it wasn't until I completed a pilgrimage that I knew my true calling.",
    "I used to serve in my religion's bureaucracy but found I needed to work in the world, to bring the message of my faith to the darkest corners of the land.",
    "I realize that my god works through me, and I do as commanded, even though I don't know why I was chosen to serve.",
  ]),
  makeClassTable("cls-druid", "Druid", [
    "I saw too much devastation in the wild places, too much of nature's splendor ruined by the despoilers. I joined a circle of druids to fight back against the enemies of nature.",
    "I found a place among a group of druids after I fled a catastrophe.",
    "I have always had an affinity for animals, so I explored my talent to see how I could best use it.",
    "I befriended a druid and was moved by druidic teachings. I decided to follow my friend's guidance and give something back to the world.",
    "While I was growing up, I saw spirits all around me—entities no one else could perceive. I sought out the druids to help me understand the visions and communicate with these beings.",
    "I have always felt disgust for creatures of unnatural origin. For this reason, I immersed myself in the study of the druidic mysteries and became a champion of the natural order.",
  ]),
  makeClassTable("cls-fighter", "Fighter", [
    "I wanted to hone my combat skills, and so I joined a war college.",
    "I squired for a knight who taught me how to fight, care for a steed, and conduct myself with honor. I decided to take up that path for myself.",
    "Horrible monsters descended on my community, killing someone I loved. I took up arms to destroy those creatures and others of a similar nature.",
    "I joined the army and learned how to fight as part of a group.",
    "I grew up fighting, and I refined my talents by defending myself against people who crossed me.",
    "I could always pick up just about any weapon and know how to use it effectively.",
  ]),
  makeClassTable("cls-monk", "Monk", [
    "I was chosen to study at a secluded monastery. There, I was taught the fundamental techniques required to eventually master a tradition.",
    "I sought instruction to gain a deeper understanding of existence and my place in the world.",
    "I stumbled into a portal to the Shadowfell and took refuge in a strange monastery, where I learned how to defend myself against the forces of darkness.",
    "I was overwhelmed with grief after losing someone close to me, and I sought the advice of philosophers to help me cope with my loss.",
    "I could feel that a special sort of power lay within me, so I sought out those who could help me call it forth and master it.",
    "I was wild and undisciplined as a youngster, but then I realized the error of my ways. I applied to a monastery and became a monk as a way to live a life of discipline.",
  ]),
  makeClassTable("cls-paladin", "Paladin", [
    "A fantastical being appeared before me and called on me to undertake a holy quest.",
    "One of my ancestors left a holy quest unfulfilled, so I intend to finish that work.",
    "The world is a dark and terrible place. I decided to serve as a beacon of light shining out against the gathering shadows.",
    "I served as a paladin's squire, learning all I needed to swear my own sacred oath.",
    "Evil must be opposed on all fronts. I feel compelled to seek out wickedness and purge it from the world.",
    "Becoming a paladin was a natural consequence of my unwavering faith. In taking my vows, I became the holy sword of my religion.",
  ]),
  makeClassTable("cls-ranger", "Ranger", [
    "I found purpose while I honed my hunting skills by bringing down dangerous animals at the edge of civilization.",
    "I always had a way with animals, able to calm them with a soothing word and a touch.",
    "I suffer from terrible wanderlust, so being a ranger gave me a reason not to remain in one place for too long.",
    "I have seen what happens when the monsters come out from the dark. I took it upon myself to become the first line of defense against the evils that lie beyond civilization's borders.",
    "I met a grizzled ranger who taught me woodcraft and the secrets of the wild lands.",
    "I served in an army, learning the precepts of my profession while blazing trails and scouting enemy encampments.",
  ]),
  makeClassTable("cls-rogue", "Rogue", [
    "I've always been nimble and quick of wit, so I decided to use those talents to help me make my way in the world.",
    "An assassin or a thief wronged me, so I focused my training on mastering the skills of my enemy to better combat foes of that sort.",
    "An experienced rogue saw something in me and taught me several useful tricks.",
    "I decided to turn my natural lucky streak into the basis of a career, though I still realize that improving my skills is essential.",
    "I took up with a group of ruffians who showed me how to get what I want through sneakiness rather than direct confrontation.",
    "I'm a sucker for a shiny bauble or a sack of coins, as long as I can get my hands on it without risking life and limb.",
  ]),
  makeClassTable("cls-sorcerer", "Sorcerer", [
    "When I was born, all the water in the house froze solid, the milk spoiled, or all the iron turned to copper. My family is convinced that this event was a harbinger of stranger things to come for me.",
    "I suffered a terrible emotional or physical strain, which brought forth my latent magical power. I have fought to control it ever since.",
    "My immediate family never spoke of my ancestors, and when I asked, they would change the subject. It wasn't until I started displaying strange talents that the full truth of my heritage came out.",
    "When a monster threatened one of my friends, I became filled with anxiety. I lashed out instinctively and blasted the wretched thing with a force that came from within me.",
    "Sensing something special in me, a stranger taught me how to control my gift.",
    "After I escaped from a magical conflagration, I realized that though I was unharmed, I was not unchanged. I began to exhibit unusual abilities that I am just beginning to understand.",
  ]),
  makeClassTable("cls-warlock", "Warlock", [
    "While wandering around in a forbidden place, I encountered an otherworldly being that offered to enter into a pact with me.",
    "I was examining a strange tome I found in an abandoned library when the entity that would become my patron suddenly appeared before me.",
    "I stumbled into the clutches of my patron after I accidentally stepped through a magical doorway.",
    "When I was faced with a terrible crisis, I prayed to any being who would listen, and the creature that answered became my patron.",
    "My future patron visited me in my dreams and offered great power in exchange for my service.",
    "One of my ancestors had a pact with my patron, so that entity was determined to bind me to the same agreement.",
  ]),
  makeClassTable("cls-wizard", "Wizard", [
    "An old wizard chose me from among several candidates to serve an apprenticeship.",
    "When I became lost in a forest, a hedge wizard found me, took me in, and taught me the rudiments of magic.",
    "I grew up listening to tales of great wizards and knew I wanted to follow their path. I strove to be accepted at an academy of magic and succeeded.",
    "One of my relatives was an accomplished wizard who decided I was smart enough to learn the craft.",
    "While exploring an old tomb, library, or temple, I found a spellbook. I was immediately driven to learn all I could about becoming a wizard.",
    "I was a prodigy who demonstrated mastery of the arcane arts at an early age. When I became old enough to set out on my own, I did so to learn more magic and expand my power.",
  ]),
];

// ---------------------------------------------------------------------------
// SECTION 4: LIFE EVENTS
// ---------------------------------------------------------------------------

const LIFE_EVENTS_TABLES: XgeTable[] = [
  {
    id: "life-events-by-age",
    name: "Life Events by Age",
    dice: { count: 1, sides: 100, label: "d100" },
    note: "Roll to determine your current age and how many times to roll on the Life Events table.",
    rows: [
      { range: [1, 20], result: "20 years or younger → 1 life event" },
      { range: [21, 59], result: "21–30 years → roll 1d4 life events" },
      { range: [60, 69], result: "31–40 years → roll 1d6 life events" },
      { range: [70, 89], result: "41–50 years → roll 1d8 life events" },
      { range: [90, 99], result: "51–60 years → roll 1d10 life events" },
      { range: [100, 100], result: "61 years or older → roll 1d12 life events" },
    ],
  },
  {
    id: "life-events",
    name: "Life Events",
    dice: { count: 1, sides: 100, label: "d100" },
    note: "Roll once per life event determined by the Life Events by Age table.",
    rows: [
      { range: [1, 10], result: "You suffered a tragedy.", subTableId: "tragedies" },
      { range: [11, 20], result: "You gained a bit of good fortune.", subTableId: "boons" },
      { range: [21, 30], result: "You fell in love or got married. If you get this result more than once, you can choose to have a child instead." },
      { range: [31, 40], result: "You made an enemy of an adventurer. Roll a d6: odd means you are to blame; even means you are blameless." },
      { range: [41, 50], result: "You made a friend of an adventurer." },
      { range: [51, 70], result: "You spent time working in a job related to your background. Start the game with an extra 2d6 gp." },
      { range: [71, 75], result: "You met someone important. Use the supplemental tables to determine their identity." },
      { range: [76, 80], result: "You went on an adventure.", subTableId: "adventures" },
      { range: [81, 85], result: "You had a supernatural experience.", subTableId: "supernatural-events" },
      { range: [86, 90], result: "You fought in a battle.", subTableId: "war" },
      { range: [91, 95], result: "You committed a crime or were wrongly accused of doing so.", subTableId: "crime" },
      { range: [96, 99], result: "You encountered something magical.", subTableId: "arcane-matters" },
      { range: [100, 100], result: "Something truly strange happened to you.", subTableId: "weird-stuff" },
    ],
  },
  {
    id: "adventures",
    name: "Adventures",
    dice: { count: 1, sides: 100, label: "d100" },
    rows: [
      { range: [1, 10], result: "You nearly died. You have nasty scars on your body, and you are missing an ear, 1d3 fingers, or 1d4 toes." },
      { range: [11, 20], result: "You suffered a grievous injury. Although the wound healed, it still pains you from time to time." },
      { range: [21, 30], result: "You were wounded, but in time you fully recovered." },
      { range: [31, 40], result: "You contracted a disease while exploring a filthy warren. You recovered, but you have a persistent cough, pockmarks on your skin, or prematurely gray hair." },
      { range: [41, 50], result: "You were poisoned by a trap or a monster. You recovered, but the next time you must make a saving throw against poison, you make it with disadvantage." },
      { range: [51, 60], result: "You lost something of sentimental value to you during your adventure. Remove one trinket from your possessions." },
      { range: [61, 70], result: "You were terribly frightened by something you encountered and ran away, abandoning your companions to their fate." },
      { range: [71, 80], result: "You learned a great deal during your adventure. The next time you make an ability check or a saving throw, you have advantage on the roll." },
      { range: [81, 90], result: "You found some treasure on your adventure. You have 2d6 gp left from your share of it." },
      { range: [91, 99], result: "You found a considerable amount of treasure on your adventure. You have 1d20+50 gp left from your share of it." },
      { range: [100, 100], result: "You came across a common magic item (of the DM's choice)." },
    ],
  },
  {
    id: "arcane-matters",
    name: "Arcane Matters",
    dice: { count: 1, sides: 10, label: "d10" },
    rows: [
      { range: [1, 1], result: "You were charmed or frightened by a spell." },
      { range: [2, 2], result: "You were injured by the effect of a spell." },
      { range: [3, 3], result: "You witnessed a powerful spell being cast by a cleric, a druid, a sorcerer, a warlock, or a wizard." },
      { range: [4, 4], result: "You drank a potion (of the DM's choice)." },
      { range: [5, 5], result: "You found a spell scroll (of the DM's choice) and succeeded in casting the spell it contained." },
      { range: [6, 6], result: "You were affected by teleportation magic." },
      { range: [7, 7], result: "You turned invisible for a time." },
      { range: [8, 8], result: "You identified an illusion for what it was." },
      { range: [9, 9], result: "You saw a creature being conjured by magic." },
      { range: [10, 10], result: "Your fortune was read by a diviner. Roll twice on the Life Events table, but don't apply the results. Instead, the DM picks one event as a portent of your future (which might or might not come true)." },
    ],
  },
  {
    id: "boons",
    name: "Boons",
    dice: { count: 1, sides: 10, label: "d10" },
    rows: [
      { range: [1, 1], result: "A friendly wizard gave you a spell scroll containing one cantrip (of the DM's choice)." },
      { range: [2, 2], result: "You saved the life of a commoner, who now owes you a life debt. This individual accompanies you on your travels and performs mundane tasks for you." },
      { range: [3, 3], result: "You found a riding horse." },
      { range: [4, 4], result: "You found some money. You have 1d20 gp in addition to your regular starting funds." },
      { range: [5, 5], result: "A relative bequeathed you a simple weapon of your choice." },
      { range: [6, 6], result: "You found something interesting. You gain one additional trinket." },
      { range: [7, 7], result: "You once performed a service for a local temple. The next time you visit the temple, you can receive healing up to your hit point maximum." },
      { range: [8, 8], result: "A friendly alchemist gifted you with a potion of healing or a flask of acid, as you choose." },
      { range: [9, 9], result: "You found a treasure map." },
      { range: [10, 10], result: "A distant relative left you a stipend that enables you to live at the comfortable lifestyle for 1d20 years. If you choose to live at a higher lifestyle, you reduce the price of the lifestyle by 2 gp during that time period." },
    ],
  },
  {
    id: "crime",
    name: "Crime",
    dice: { count: 1, sides: 8, label: "d8" },
    note: "Roll to determine the crime committed, then roll on the Punishment table.",
    rows: [
      { range: [1, 1], result: "Murder" },
      { range: [2, 2], result: "Theft" },
      { range: [3, 3], result: "Burglary" },
      { range: [4, 4], result: "Assault" },
      { range: [5, 5], result: "Smuggling" },
      { range: [6, 6], result: "Kidnapping" },
      { range: [7, 7], result: "Extortion" },
      { range: [8, 8], result: "Counterfeiting" },
    ],
  },
  {
    id: "punishment",
    name: "Punishment",
    dice: { count: 1, sides: 12, label: "d12" },
    rows: [
      { range: [1, 3], result: "You did not commit the crime and were exonerated after being accused." },
      { range: [4, 6], result: "You committed the crime or helped do so, but nonetheless the authorities found you not guilty." },
      { range: [7, 8], result: "You were nearly caught in the act. You had to flee and are wanted in the community where the crime occurred." },
      { range: [9, 12], result: "You were caught and convicted. You spent time in jail, chained to an oar, or performing hard labor. You served a sentence of 1d4 years or succeeded in escaping after that much time." },
    ],
  },
  {
    id: "supernatural-events",
    name: "Supernatural Events",
    dice: { count: 1, sides: 100, label: "d100" },
    rows: [
      { range: [1, 5], result: "You were ensorcelled by a fey and enslaved for 1d6 years before you escaped." },
      { range: [6, 10], result: "You saw a demon and ran away before it could do anything to you." },
      { range: [11, 15], result: "A devil tempted you. Make a DC 10 Wisdom saving throw. On a failed save, your alignment shifts one step toward evil (if it's not evil already), and you start the game with an additional 1d20+50 gp." },
      { range: [16, 20], result: "You woke up one morning miles from your home, with no idea how you got there." },
      { range: [21, 30], result: "You visited a holy site and felt the presence of the divine there." },
      { range: [31, 40], result: "You witnessed a falling red star, a face appearing in the frost, or some other bizarre happening. You are certain that it was an omen of some sort." },
      { range: [41, 50], result: "You escaped certain death and believe it was the intervention of a god that saved you." },
      { range: [51, 60], result: "You witnessed a minor miracle." },
      { range: [61, 70], result: "You explored an empty house and found it to be haunted." },
      { range: [71, 75], result: "You were briefly possessed. Roll a d6 to determine what kind of creature possessed you: 1, celestial; 2, devil; 3, demon; 4, fey; 5, elemental; 6, undead." },
      { range: [76, 80], result: "You saw a ghost." },
      { range: [81, 85], result: "You saw a ghoul feeding on a corpse." },
      { range: [86, 90], result: "A Celestial or Fiend visited you in your dreams to give a warning of dangers to come." },
      { range: [91, 95], result: "You briefly visited the Feywild or Shadowfell." },
      { range: [96, 100], result: "You saw a portal that you believe leads to another plane of existence." },
    ],
  },
  {
    id: "tragedies",
    name: "Tragedies",
    dice: { count: 1, sides: 12, label: "d12" },
    rows: [
      { range: [1, 2], result: "A family member or a close friend died.", subTableId: "cause-of-death" },
      { range: [3, 3], result: "A friendship ended bitterly, and the other person is now hostile to you. The cause might have been a misunderstanding or something you or the former friend did." },
      { range: [4, 4], result: "You lost all your possessions in a disaster, and you had to rebuild your life." },
      { range: [5, 5], result: "You were imprisoned for a crime you didn't commit and spent 1d6 years at hard labor, in jail, or shackled to an oar in a slave galley." },
      { range: [6, 6], result: "War ravaged your home community, reducing everything to rubble and ruin. In the aftermath, you either helped your town rebuild or moved somewhere else." },
      { range: [7, 7], result: "A lover disappeared without a trace. You have been looking for that person ever since." },
      { range: [8, 8], result: "A terrible blight in your home community caused crops to fail, and many starved. You lost a sibling or some other family member." },
      { range: [9, 9], result: "You did something that brought terrible shame to you in the eyes of your family. You might have been involved in a scandal, dabbled in dark magic, or offended someone important." },
      { range: [10, 10], result: "For a reason you were never told, you were exiled from your community. You then either wandered in the wilderness for a time or promptly found a new place to live." },
      { range: [11, 11], result: "A romantic relationship ended. Roll a d6: an odd number means it ended with bad feelings, while an even number means it ended amicably." },
      { range: [12, 12], result: "A current or prospective romantic partner of yours died.", subTableId: "cause-of-death" },
    ],
  },
  {
    id: "war",
    name: "War",
    dice: { count: 1, sides: 12, label: "d12" },
    rows: [
      { range: [1, 1], result: "You were knocked out and left for dead. You woke up hours later with no recollection of the battle." },
      { range: [2, 3], result: "You were badly injured in the fight, and you still bear the awful scars of those wounds." },
      { range: [4, 4], result: "You ran away from the battle to save your life, but you still feel shame for your cowardice." },
      { range: [5, 7], result: "You suffered only minor injuries, and the wounds all healed without leaving scars." },
      { range: [8, 9], result: "You survived the battle, but you suffer from terrible nightmares in which you relive the experience." },
      { range: [10, 11], result: "You escaped the battle unscathed, though many of your friends were injured or lost." },
      { range: [12, 12], result: "You acquitted yourself well in battle and are remembered as a hero. You might have received a medal for your bravery." },
    ],
  },
  {
    id: "weird-stuff",
    name: "Weird Stuff",
    dice: { count: 1, sides: 12, label: "d12" },
    rows: [
      { range: [1, 1], result: "You were turned into a toad and remained in that form for 1d4 weeks." },
      { range: [2, 2], result: "You were petrified and remained a stone statue for a time until someone freed you." },
      { range: [3, 3], result: "You were enslaved by a hag, a satyr, or some other being and lived in that creature's thrall for 1d6 years." },
      { range: [4, 4], result: "A dragon held you as a prisoner for 1d4 months until adventurers killed it." },
      { range: [5, 5], result: "You were taken captive by a race of evil humanoids such as drow, kuo-toa, or quaggoths. You lived as a slave in the Underdark until you escaped." },
      { range: [6, 6], result: "You served a powerful adventurer as a hireling. You have only recently left that service." },
      { range: [7, 7], result: "You went insane for 1d6 years and recently regained your sanity. A tic or some other bit of odd behavior might linger." },
      { range: [8, 8], result: "A lover of yours was secretly a silver dragon." },
      { range: [9, 9], result: "You were captured by a cult and nearly sacrificed on an altar to the foul being the cultists served. You escaped, but you fear they will find you." },
      { range: [10, 10], result: "You met a demigod, an archdevil, an archfey, a demon lord, or a titan, and you lived to tell the tale." },
      { range: [11, 11], result: "You were swallowed by a giant fish and spent a month in its gullet before you escaped." },
      { range: [12, 12], result: "A powerful being granted you a wish, but you squandered it on something frivolous." },
    ],
  },
];

// ---------------------------------------------------------------------------
// SECTION 5: SUPPLEMENTAL TABLES
// ---------------------------------------------------------------------------

const SUPPLEMENTAL_TABLES: XgeTable[] = [
  {
    id: "alignment",
    name: "Alignment",
    dice: { count: 3, sides: 6, label: "3d6" },
    rows: [
      { range: [3, 3], result: "Chaotic evil (50%) or chaotic neutral (50%)" },
      { range: [4, 5], result: "Lawful evil" },
      { range: [6, 8], result: "Neutral evil" },
      { range: [9, 12], result: "Neutral" },
      { range: [13, 15], result: "Neutral good" },
      { range: [16, 17], result: "Lawful good (50%) or lawful neutral (50%)" },
      { range: [18, 18], result: "Chaotic good (50%) or chaotic neutral (50%)" },
    ],
  },
  {
    id: "cause-of-death",
    name: "Cause of Death",
    dice: { count: 1, sides: 12, label: "d12" },
    rows: [
      { range: [1, 1], result: "Unknown" },
      { range: [2, 2], result: "Murdered" },
      { range: [3, 3], result: "Killed in battle" },
      { range: [4, 4], result: "Accident related to class or occupation" },
      { range: [5, 5], result: "Accident unrelated to class or occupation" },
      { range: [6, 7], result: "Natural causes, such as disease or old age" },
      { range: [8, 8], result: "Apparent suicide" },
      { range: [9, 9], result: "Torn apart by an animal or a natural disaster" },
      { range: [10, 10], result: "Consumed by a monster" },
      { range: [11, 11], result: "Executed for a crime or tortured to death" },
      { range: [12, 12], result: "Bizarre event, such as being hit by a meteorite, struck down by an angry god, or killed by a hatching slaad egg" },
    ],
  },
  {
    id: "supp-class",
    name: "Class",
    dice: { count: 1, sides: 100, label: "d100" },
    rows: [
      { range: [1, 7], result: "Barbarian" },
      { range: [8, 14], result: "Bard" },
      { range: [15, 29], result: "Cleric" },
      { range: [30, 36], result: "Druid" },
      { range: [37, 52], result: "Fighter" },
      { range: [53, 58], result: "Monk" },
      { range: [59, 64], result: "Paladin" },
      { range: [65, 70], result: "Ranger" },
      { range: [71, 84], result: "Rogue" },
      { range: [85, 89], result: "Sorcerer" },
      { range: [90, 94], result: "Warlock" },
      { range: [95, 100], result: "Wizard" },
    ],
  },
  {
    id: "occupation",
    name: "Occupation",
    dice: { count: 1, sides: 100, label: "d100" },
    rows: [
      { range: [1, 5], result: "Academic" },
      { range: [6, 10], result: "Adventurer (roll on the Class supplemental table)", subTableId: "supp-class" },
      { range: [11, 11], result: "Aristocrat" },
      { range: [12, 26], result: "Artisan or guild member" },
      { range: [27, 31], result: "Criminal" },
      { range: [32, 36], result: "Entertainer" },
      { range: [37, 38], result: "Exile, hermit, or refugee" },
      { range: [39, 43], result: "Explorer or wanderer" },
      { range: [44, 55], result: "Farmer or herder" },
      { range: [56, 60], result: "Hunter or trapper" },
      { range: [61, 75], result: "Laborer" },
      { range: [76, 80], result: "Merchant" },
      { range: [81, 85], result: "Politician or bureaucrat" },
      { range: [86, 90], result: "Priest" },
      { range: [91, 95], result: "Sailor" },
      { range: [96, 100], result: "Soldier" },
    ],
  },
  {
    id: "race",
    name: "Race",
    dice: { count: 1, sides: 100, label: "d100" },
    rows: [
      { range: [1, 40], result: "Human" },
      { range: [41, 50], result: "Dwarf" },
      { range: [51, 60], result: "Elf" },
      { range: [61, 70], result: "Halfling" },
      { range: [71, 75], result: "Dragonborn" },
      { range: [76, 80], result: "Gnome" },
      { range: [81, 85], result: "Half-Elf" },
      { range: [86, 90], result: "Half-Orc" },
      { range: [91, 95], result: "Tiefling" },
      { range: [96, 100], result: "DM's choice" },
    ],
  },
  {
    id: "relationship",
    name: "Relationship",
    dice: { count: 3, sides: 4, label: "3d4" },
    rows: [
      { range: [3, 4], result: "Hostile" },
      { range: [5, 10], result: "Friendly" },
      { range: [11, 12], result: "Indifferent" },
    ],
  },
  {
    id: "status",
    name: "Status",
    dice: { count: 3, sides: 6, label: "3d6" },
    rows: [
      { range: [3, 3], result: "Dead (roll on the Cause of Death table)", subTableId: "cause-of-death" },
      { range: [4, 5], result: "Missing or unknown" },
      { range: [6, 8], result: "Alive, but doing poorly due to injury, financial trouble, or relationship difficulties" },
      { range: [9, 12], result: "Alive and well" },
      { range: [13, 15], result: "Alive and quite successful" },
      { range: [16, 17], result: "Alive and infamous" },
      { range: [18, 18], result: "Alive and famous" },
    ],
  },
];

// ---------------------------------------------------------------------------
// EXPORTED SECTIONS
// ---------------------------------------------------------------------------

export const XGE_SECTIONS: XgeSection[] = [
  {
    id: "origins",
    name: "Origins",
    description: "Determine the circumstances of your birth, your family, and your early years.",
    tables: ORIGINS_TABLES,
  },
  {
    id: "personal-decisions",
    name: "Personal Decisions",
    description: "Roll on the table for your chosen background and class to explain how you came to make those choices.",
    tables: [...BACKGROUND_TABLES, ...CLASS_TABLES],
  },
  {
    id: "life-events",
    name: "Life Events",
    description: "Determine the memorable events that shaped who you are. Your age determines how many life events you have.",
    tables: LIFE_EVENTS_TABLES,
  },
  {
    id: "supplemental",
    name: "Supplemental Tables",
    description: "Use these tables to determine characteristics of other people in your life.",
    tables: SUPPLEMENTAL_TABLES,
  },
];

export const ALL_BACKGROUNDS = BACKGROUND_TABLES.map((t) => t.filterValue!);
export const ALL_CLASSES = CLASS_TABLES.map((t) => t.filterValue!);
export const ALL_RACES = [
  "Human",
  "Dwarf",
  "Elf",
  "Halfling",
  "Dragonborn",
  "Gnome",
  "Half-Elf",
  "Half-Orc",
  "Tiefling",
  "Other",
];

/** Map of lifestyle result text → numeric modifier for Childhood Home */
export const LIFESTYLE_MODIFIERS: Record<string, number> = {
  "Wretched (modifier: −40)": -40,
  "Squalid (modifier: −20)": -20,
  "Poor (modifier: −10)": -10,
  "Modest (modifier: +0)": 0,
  "Comfortable (modifier: +10)": 10,
  "Wealthy (modifier: +20)": 20,
  "Aristocratic (modifier: +40)": 40,
};

/** Flat map of all tables by id for quick lookup */
export const TABLE_BY_ID: Record<string, XgeTable> = {};
for (const section of XGE_SECTIONS) {
  for (const table of section.tables) {
    TABLE_BY_ID[table.id] = table;
  }
}
