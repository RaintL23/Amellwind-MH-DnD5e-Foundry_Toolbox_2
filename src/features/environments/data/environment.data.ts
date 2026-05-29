import type { Environment } from "@/shared/types";

export const ENVIRONMENTS: Environment[] = [
  // ─────────────────────────────────────────────
  // 1. ANCESTRAL STEPPES
  // ─────────────────────────────────────────────
  {
    name: "Ancestral Steppes",
    biome: "Plains, Forests, Mountains",
    navigationDC: 13,
    encounterDC: 19,
    investigationDC: 10,
    totalResources: 7,
    commonWeather: "Warm temperature, light wind, light rain",
    specialRules: [
      {
        name: "Bnahabra Party",
        description:
          "When entering the Ancestral Steppes for the first time on a hunt, roll a d20. On a 1-3, the bnahabra have infested the ancestral steppes. Every time the party enters a new area, 1d8 bnahabra pester the hunting party. The number of bnahabra increases to 1d10 if the party is 5th level or higher, 2d6 if the party is 10th level or higher, and 2d8 if the party is 15th level or higher.",
      },
      {
        name: "An Abundance of Insects",
        description:
          "When a character successfully obtains insects with their bug net, they can roll on the resources table again. The second insect does not count against the hunts total resources.",
      },
      {
        name: "Flyby",
        description:
          "Once per hunt, when a character rolls a 1 on a trailblazer skill check, the area they enter is covered in a purple haze. This is due to a gore magala that recently passed over the area. For every minute a creature remains in the area or touches something, they gain a frenzy charge. After they gain 3 frenzy charges, they must succeed on a DC 15 Constitution saving throw or be infected with the frenzy virus.",
      },
      {
        name: "Mating Season",
        description:
          "When entering the Ancestral Steppes for the first time on a hunt, roll a d20. On a 20, its mating season for 1 of the Large or bigger creatures in your challenges. Increase the number of the creature in the challenge by 1. If there is an odd number of creatures after the increase, two of them may fight to win the approval of the third.",
      },
    ],
    weatherTable: [
      { roll: "1", weather: "Thunder Storm." },
      { roll: "2-5", weather: "Unseasonably hot with no wind." },
      { roll: "6-15", weather: "Warm with a slight breeze." },
      { roll: "16-19", weather: "Warm with light rain that lasts until mid day." },
      { roll: "20", weather: "Cool with steady rain (lightly obscures the area)." },
    ],
    levelTiers: [
      {
        levelRange: "1-5",
        commonSmallMonsters:
          "Altaroth, Aptonoth, Bnahabra, Felyne, Gargwa, Jaggi, Jaggia, Kelbi, Konchu, Maccao, Melynx, Remobra, Rhenoplos",
        commonLargeMonsters:
          "Great Jaggi, Great Maccao, Gypceros, Kecha Wacha, Yian Kut-Ku, Blue Yian Kut-Ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 11 },
            { category: "Fish", dc: 12 },
            { category: "Insects", dc: 10 },
            { category: "Minerals", dc: 14 },
            { category: "Mushrooms", dc: 10 },
            { category: "Plants", dc: 10 },
          ],
          rows: [
            { roll: "1", items: ["Bone", "Sushifish", "Insect Husk", "Stone", "Blue Mushroom", "Herb"] },
            { roll: "2", items: ["Bone", "Burst Arowana", "Bitterbug", "Armor Sphere", "Blue Mushroom", "Antidote Herb"] },
            { roll: "3", items: ["Sm Bone Husk", "Bomb Arowana", "Honey", "Armor Sphere", "Blue Mushroom", "Ivy"] },
            { roll: "4", items: ["Bird Wyvern Bone", "Burst Arrowana", "Flashbug", "Earth Crystal", "Blue Mushroom", "Sap Plant"] },
            { roll: "5", items: ["Lg Bone Husk", "Wanchovy", "Spiderweb", "Earth Crystal", "Blue Mushroom", "Felvine"] },
            { roll: "6", items: ["Brute Bone", "Small Goldenfish", "Godbug", "Hard Armor Sphere", "Exciteshroom", "Scatternut"] },
          ],
        },
        encounters: [
          { roll: "1", description: "2 wild Melynx fight aggressively over a piece of felvine" },
          { roll: "2", description: "1 Aptonoth attacks after being agitated by two Bnahabra (who attack anything nearby)" },
          { roll: "3", description: "1d8 + 1 Maccao" },
          { roll: "4", description: "1 Jaggi or 1 Great Maccao" },
          { roll: "5", description: "2d4 Bnahabra" },
          { roll: "6", description: "3 Maccao" },
          { roll: "7", description: "1 Tetsucabra" },
          { roll: "8", description: "1d4 Jaggia and 1d4 Jaggi" },
          { roll: "9", description: "1d4 Vespoids, 1d4 Hornetaur, and 1d4 Altaroth" },
          { roll: "10", description: "1 Kecha Wacha" },
        ],
      },
      {
        levelRange: "6-10",
        commonSmallMonsters:
          "Altaroth, Aptonoth, Bnahabra, Felyne, Gargwa, Jaggi, Jaggia, Kelbi, Konchu, Maccao, Melynx, Rhenoplos, Seltas",
        commonLargeMonsters:
          "Astalos, Great Jaggi, Great Maccao, Gypceros, Kecha Wacha, Rathalos, Rathian, Yian Kut-Ku, Blue Yian Kut-Ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 15 },
            { category: "Fish", dc: 14 },
            { category: "Insects", dc: 13 },
            { category: "Minerals", dc: 16 },
            { category: "Mushrooms", dc: 13 },
            { category: "Plants", dc: 13 },
          ],
          rows: [
            { roll: "1", items: ["Lg Bone Husk", "Sushifish", "Spiderweb", "Armor Sphere", "Blue Mushroom", "Scatternut"] },
            { roll: "2", items: ["Sm Bone Husk", "Burst Arrowana", "Honey", "Earth Crystal", "Blue Mushroom", "Needleberry"] },
            { roll: "3", items: ["Brute Bone", "Pin Tuna", "Firefly", "Machalite Ore", "Blue Mushroom", "Antidote Herb"] },
            { roll: "4", items: ["Monsterbone+", "Burst Arrowana", "Godbug", "Hard Armor Sphere", "Blue Mushroom", "Herb x2"] },
            { roll: "5", items: ["Med Monsterbone", "Wanchovy", "Thunderbug", "Machalite Ore", "Exciteshroom", "Ivy x2"] },
            { roll: "6", items: ["Lg Monsterbone", "Small Goldenfish", "Flashbug", "Heavy Armor Sphere", "Exciteshroom", "Gloamgrass Root"] },
          ],
        },
        encounters: [
          { roll: "1", description: "2d4 Jagras or 2d4 Jaggi" },
          { roll: "2", description: "1 Kecha Wacha" },
          { roll: "3", description: "1d4+1 poachers (Veterans) riding on Kestodons" },
          { roll: "4", description: "1 Rhenoplos" },
          { roll: "5", description: "A tornado that touches down 1d6 miles away, tearing up the land for 1 mile before it dissipates" },
          { roll: "6", description: "1d4 Felyne and 1d4 Melynx" },
          { roll: "7", description: "1d6 + 2 Rhenoplos" },
          { roll: "8", description: "1 Bulldrome plus 1d8+2 Bullfango" },
          { roll: "9", description: "A tribe of 2d20+20 lynians on Maccao following a herd of Anteka. The lynians are willing to trade food, leather, and information for weapon upgrade materials." },
          { roll: "10", description: "1 Seregios" },
        ],
      },
      {
        levelRange: "11-16",
        commonSmallMonsters:
          "Altaroth, Aptonoth, Bnahabra, Felyne, Gargwa, Jaggi, Jaggia, Kelbi, Konchu, Maccao, Melynx, Rhenoplos, Seltas",
        commonLargeMonsters:
          "Astalos, Chameleos, Deviljho, Great Jaggi, Great Maccao, Gypceros, Kecha Wacha, Rathalos, Rathian, Seltas Queen, Tigrex, Yian Kut-Ku, Blue Yian Kut-Ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 17 },
            { category: "Fish", dc: 15 },
            { category: "Insects", dc: 15 },
            { category: "Minerals", dc: 20 },
            { category: "Mushrooms", dc: 17 },
            { category: "Plants", dc: 17 },
          ],
          rows: [
            { roll: "1", items: ["Monsterbone+", "Burst Arrowana", "Flashbug", "Hard Armor Sphere", "Blue Mushroom", "Herb x3"] },
            { roll: "2", items: ["Monsterbone+", "Bomb Arrowana", "Flashbug", "Dragonite Ore", "Blue Mushroom x2", "Might Seed"] },
            { roll: "3", items: ["Monster Toughbone", "Small Goldenfish", "Godbug", "Dragonite Ore", "Blue Mushroom x3", "Adamant Seed"] },
            { roll: "4", items: ["Lg Monster Bone", "Glutton Tuna", "Thunderbug", "Dragonite Ore", "Exciteshroom", "Paintberry"] },
            { roll: "5", items: ["Lg Monster Bone", "Ancient Fish", "Godbug x2", "Carbalite Ore", "Exciteshroom x2", "Gloamgrass Root x2"] },
            { roll: "6", items: ["Elder Dragon Bone", "Blue Cutthroat", "Blossom Cricket", "Carbalite Ore", "Exciteshroom x3", "Might Seed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d4 Blue Yian Kut-Ku" },
          { roll: "2", description: "1d12 Arzuros" },
          { roll: "3", description: "2d4 Tetsucabra" },
          { roll: "4", description: "A friendly hunting party of 4 characters of varying races, classes, and levels (average level 1d6 + 2). They share information about their recent hunt." },
          { roll: "5", description: "1d8+1 Kecha Wacha" },
          { roll: "6", description: "3d4 Royal Ludroth" },
          { roll: "7", description: "1 Najarala" },
          { roll: "8", description: "1d3 Astalos" },
          { roll: "9", description: "1 Zinogre" },
          { roll: "10", description: "1 Rajang" },
        ],
      },
      {
        levelRange: "17-20",
        commonSmallMonsters:
          "Altaroth, Aptonoth, Bnahabra, Felyne, Gargwa, Jaggi, Jaggia, Kelbi, Konchu, Maccao, Melynx, Remobra, Rhenoplos",
        commonLargeMonsters:
          "Astalos, Chameleos, Deviljho, Great Jaggi, Great Maccao, Gypceros, Kecha Wacha, Rathalos, Rathian, Seltas Queen, Tigrex, Yian Kut-Ku, Blue Yian Kut-Ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 19 },
            { category: "Fish", dc: 16 },
            { category: "Insects", dc: 18 },
            { category: "Minerals", dc: 25 },
            { category: "Mushrooms", dc: 20 },
            { category: "Plants", dc: 20 },
          ],
          rows: [
            { roll: "1", items: ["Sm Bone Husk x5", "Glutton Tuna", "Spiderweb x3", "Dragonite Ore", "Blue Mushroom", "Huskberry x4"] },
            { roll: "2", items: ["Lg Monster Bone", "Burst Arrowana", "Godbug x2", "Lifecrystals", "Exciteshroom", "Nullberry"] },
            { roll: "3", items: ["Monster Toughbone", "Bomb Arrowana", "Large Toxic Kumori", "Royal Armor Sphere", "Blue Mushroom x3", "Adamant Seed"] },
            { roll: "4", items: ["Monster Toughbone", "Ancient Fish", "Emperor Locust", "Royal Armor Sphere", "Blue Mushroom x4", "Gloamgrass Root x2"] },
            { roll: "5", items: ["Monster Toughbone", "Ancient Fish", "Honey x5", "Carbalite Ore", "Exciteshroom x3", "Nullberry x2"] },
            { roll: "6", items: ["Elder Dragonbone", "Gastronome Tuna", "Phantom Butterfly", "Carbalite Ore", "Dragon Toadstool", "Stargazer Flower"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1 Gypceros" },
          { roll: "2", description: "1 Astalos" },
          { roll: "3", description: "1d3 Seregios" },
          { roll: "4", description: "2d4 Kecha Wacha" },
          { roll: "5", description: "1d3 Zinogre" },
          { roll: "6", description: "1 Deviljho" },
          { roll: "7", description: "A Rathalos and Rathian each fire a fireball into the forest area starting a forest fire and then dive down into the forest together." },
          { roll: "8", description: "1 Furious Rajang" },
          { roll: "9", description: "A Kirin with a broken horn fleeing from a Rajang" },
          { roll: "10", description: "1 Blackveil Vaal Hazak" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 2. THE DUNES
  // ─────────────────────────────────────────────
  {
    name: "The Dunes",
    biome: "Old Desert",
    navigationDC: 14,
    encounterDC: 18,
    investigationDC: 14,
    totalResources: 7,
    commonWeather: "Extreme heat (day), extreme cold (night), no wind, no rain",
    specialRules: [
      {
        name: "Sandstorm",
        description:
          "For every 4 hours the party spends in the dunes roll a d20. On a 18-20, a 1 mile high sand storm rolls across the terrain, making the area within 60 miles heavily obscured for 1d12 hours. For each hour a character is exposed to a sandstorm it must make a DC 16 Constitution check and a DC 16 Dexterity check. On a failed Constitution check it suffers 1d10 slashing damage; on a failed Dexterity check it is blinded until restored by magic or three successful DC 16 Medicine checks.",
      },
      {
        name: "Wind",
        description: "At the start of the hunt, roll on the weather table to determine wind conditions.",
      },
    ],
    weatherTable: [
      { roll: "1", weather: "Strong wind." },
      { roll: "2-5", weather: "Light wind." },
      { roll: "6-19", weather: "No wind." },
      { roll: "20", weather: "Strong wind." },
    ],
    levelTiers: [
      {
        levelRange: "1-4",
        commonSmallMonsters: "Cephalos, Velociprey, Genprey, Felyne, Melynx, Apceros, Vespoid",
        commonLargeMonsters: "Gendrome, Cephadrome, Rathian, Plesioth",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 14 },
            { category: "Fish", dc: 14 },
            { category: "Insects", dc: 14 },
            { category: "Minerals", dc: 14 },
            { category: "Plants", dc: 14 },
          ],
          rows: [
            { roll: "1", items: ["Bone", "Sushifish", "Insect Husk", "Stone", "Herb"] },
            { roll: "2", items: ["Bone", "Whetfish", "Insect Husk", "Earth Crystal", "Tropical Berry"] },
            { roll: "3", items: ["Sm Bone Husk", "Whetfish", "Cricket", "Earth Crystal", "Cactus Flower"] },
            { roll: "4", items: ["Lg Bone Husk", "Whetfish", "Firefly", "Armor Sphere", "Cactus Flower"] },
            { roll: "5", items: ["Sm Bone Husk", "Pin Tuna", "Snakebee Larva", "Armor Sphere", "Fire Herb"] },
            { roll: "6", items: ["Sm Monsterbone", "Pin Tuna", "Flashbug", "Machalite Ore", "Fire Herb"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d6 Wingdrake" },
          { roll: "2", description: "2d4 Konchu" },
          { roll: "3", description: "1 Velociprey" },
          { roll: "4", description: "2d4 Apceros" },
          { roll: "5", description: "1 Cephalos" },
          { roll: "6", description: "A brass lamp lying on the ground" },
          { roll: "7", description: "A hunter recently killed by a creature" },
          { roll: "8", description: "1d4 Cephalos" },
          { roll: "9", description: "1 Tetsucabra" },
          { roll: "10", description: "1 Cephadrome" },
        ],
      },
      {
        levelRange: "5-10",
        commonSmallMonsters: "Cephalos, Velociprey, Genprey, Felyne, Melynx, Apceros, Hermitaur, Vespoid",
        commonLargeMonsters: "Daimyo Hermitaur, Gendrome, Cephadrome, Rathian, Plesioth",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 16 },
            { category: "Fish", dc: 16 },
            { category: "Insects", dc: 16 },
            { category: "Minerals", dc: 16 },
            { category: "Plants", dc: 16 },
          ],
          rows: [
            { roll: "1", items: ["Sm Bone Husk", "Burst Arrowana", "Insect Husk", "Hard Armor Sphere", "Fire Herb"] },
            { roll: "2", items: ["Monsterbone+", "Sushifish", "Thunderbug", "Hard Armor Sphere", "Fire Herb"] },
            { roll: "3", items: ["Med Monsterbone", "Popfish", "Thunderbug", "Hard Armor Sphere", "Tropical Berry"] },
            { roll: "4", items: ["Monsterbone+", "Pin Tuna", "Flashbug", "Machalite Ore", "Cactus Flower"] },
            { roll: "5", items: ["Med Monsterbone", "Blue Cutthroat", "Bitterbug", "Machalite Ore", "Hot Pepper"] },
            { roll: "6", items: ["Monster Toughbone", "Wanchovy", "Godbug", "Machalite Ore", "Hot Pepper"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d4+3 Hermitaur" },
          { roll: "2", description: "1 Cephalos" },
          { roll: "3", description: "1d10 Grimalkyne" },
          { roll: "4", description: "1d6+3 Gendrome" },
          { roll: "5", description: "1 Tetsucabra" },
          { roll: "6", description: "1 Congalala" },
          { roll: "7", description: "Strong winds that kick up dust and reduce visibility to 1d6 feet for 1d4 hours" },
          { roll: "8", description: "1d6+2 Barroth" },
          { roll: "9", description: "1 Jyuratodus" },
          { roll: "10", description: "1 Plesioth" },
        ],
      },
      {
        levelRange: "11-16",
        commonSmallMonsters: "Cephalos, Velociprey, Genprey, Felyne, Melynx, Apceros, Hermitaur, Vespoid",
        commonLargeMonsters: "Daimyo Hermitaur, Gendrome, Cephadrome, Rathian, Plesioth, Monoblos, Diablos",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 18 },
            { category: "Fish", dc: 18 },
            { category: "Insects", dc: 18 },
            { category: "Minerals", dc: 18 },
            { category: "Plants", dc: 18 },
          ],
          rows: [
            { roll: "1", items: ["Sm Bone Husk", "Pin Tuna", "Insect Husk", "Machalite Ore", "Herb"] },
            { roll: "2", items: ["Lg Bone Husk", "Burst Arrowana", "Thunderbug", "Machalite Ore", "Paintberry"] },
            { roll: "3", items: ["Brute Bone", "Sleepyfish", "Honey", "Machalite Ore", "Tropical Berry"] },
            { roll: "4", items: ["Monsterbone+", "Glutton Tuna", "Toxic Kumori", "Dragonite Ore", "Cactus Flower"] },
            { roll: "5", items: ["Lg Monster Bone", "Whetfish", "Great Hornfly", "Armor Sphere", "Fire Herb"] },
            { roll: "6", items: ["Monster Toughbone", "Speartuna", "Large Toxic Kumori", "Dragonite Ore", "Might Seed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "4d6 Velociprey" },
          { roll: "2", description: "2d4 Kulu-Ya-Ku" },
          { roll: "3", description: "1d6+1 Barroth" },
          { roll: "4", description: "1d6 square miles of desert glass" },
          { roll: "5", description: "1 Nibelsnarf" },
          { roll: "6", description: "1d4 Congalala" },
          { roll: "7", description: "1d4 Uragaan" },
          { roll: "8", description: "1 Teostra" },
          { roll: "9", description: "1 Kushala Daora" },
          { roll: "10", description: "1 Nakarkos" },
        ],
      },
      {
        levelRange: "17-20",
        commonSmallMonsters: "Cephalos, Velociprey, Genprey, Felyne, Melynx, Apceros, Hermitaur, Vespoid",
        commonLargeMonsters: "Daimyo Hermitaur, Gendrome, Cephadrome, Rathian, Plesioth, Monoblos, Diablos",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 20 },
            { category: "Fish", dc: 20 },
            { category: "Insects", dc: 20 },
            { category: "Minerals", dc: 20 },
            { category: "Plants", dc: 20 },
          ],
          rows: [
            { roll: "1", items: ["Sm Bone Husk", "Pin Tuna", "Godbug", "Heavy Armor Sphere", "Hot Pepper"] },
            { roll: "2", items: ["Lg Monster Bone", "Burst Arrowana", "Godbug", "Dragonite Ore", "Paintberry"] },
            { roll: "3", items: ["Lg Monster Bone", "Small Goldenfish", "Flashbug", "Heavy Armor Sphere", "Tropical Berry"] },
            { roll: "4", items: ["Monster Toughbone", "Ancient Fish", "Great Hornfly", "Dragonite Ore", "Tropical Berry"] },
            { roll: "5", items: ["Monster Toughbone", "Ancient Fish", "King Scarab", "Carbalite Ore", "Might Seed"] },
            { roll: "6", items: ["Elder Dragonbone", "Gastronome Tuna", "King Scarab", "Carbalite Ore", "Might Seed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d2 Cephadrome with 2d10+6 Cephalos and 4d6+6 Grimalkyne" },
          { roll: "2", description: "1d6+2 Tzitzi-Ya-Ku" },
          { roll: "3", description: "1d6+1 Barroth" },
          { roll: "4", description: "2d4 Uragaan" },
          { roll: "5", description: "1 Rajang" },
          { roll: "6", description: "1d4 Nargacuga" },
          { roll: "7", description: "1d3 Jyuratodus" },
          { roll: "8", description: "1 Bazelgeuse" },
          { roll: "9", description: "1 Tigrex" },
          { roll: "10", description: "1d4 Glavenus" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 3. JUNGLE
  // ─────────────────────────────────────────────
  {
    name: "Jungle",
    biome: "Coastal, Forest, Hills",
    navigationDC: 14,
    encounterDC: 18,
    investigationDC: 12,
    totalResources: 8,
    commonWeather: "Hot & humid temperature, light to strong wind, heavy rain depending on the season",
    specialRules: [
      {
        name: "Howler Congas",
        description:
          "When entering the Jungle for the first time on a hunt, roll a d20. On a 20, the Congas of the jungle are in a mood. They are constantly making noise, granting advantage on Dexterity (Stealth) checks to stay hidden to all creatures in the jungle, but creatures that normally would be sleeping during the time of day are grumpy and aggressive.",
      },
      {
        name: "Inhabited",
        description:
          "When entering the Jungle for the first time on a hunt, roll a d20. On a 20, the jungle is inhabited by a tribe of Shakalaka who have a 50% chance to be enemies or allies of the hunting party. If they are enemies, random Shakalaka will appear in areas to interfere with the hunters. If they are allies, they will provide opportunities to make the hunter's lives easier.",
      },
    ],
    weatherTable: [
      { roll: "1", weather: "Heavy Rain, Flooding." },
      { roll: "2-5", weather: "Extreme Heat during the day, Extreme Cold during the nights." },
      { roll: "6-15", weather: "Heavy Rain, no wind." },
      { roll: "16-19", weather: "Warm with no Wind." },
      { roll: "20", weather: "Comfortable with clear skies." },
    ],
    levelTiers: [
      {
        levelRange: "1-4",
        commonSmallMonsters: "Aptonoth, Bullfango, Conga, Hornetaur, Kelbi, Mosswine, Velociprey, Vespoid",
        commonLargeMonsters: "Bulldrome, Congalala, Gypceros, Hypnocatrice, Seltas, Velocidrome, Yian Kut-Ku, Blue Yian Kut-Ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 14 },
            { category: "Fish", dc: 10 },
            { category: "Insects", dc: 10 },
            { category: "Minerals", dc: 14 },
            { category: "Mushrooms", dc: 10 },
            { category: "Plants", dc: 12 },
          ],
          rows: [
            { roll: "1", items: ["Bone", "Pin Tuna", "Insect Husk", "Stone", "Nitroshroom", "Herb"] },
            { roll: "2", items: ["Lg Bone Husk", "Whetfish", "Firefly", "Stone", "Blue Mushroom", "Paintberry"] },
            { roll: "3", items: ["Sm Bone Husk", "Bomb Arrowana", "Carpenterbug", "Earth Crystal", "Nitroshroom", "Fire Herb"] },
            { roll: "4", items: ["Bird Wyvern bone", "Burst Arrowana", "Snakebee Larva", "Earth Crystal", "Nitroshroom", "Ivy"] },
            { roll: "5", items: ["Sm Bone Husk", "Pin Tuna", "Spiderweb", "Earth Crystal", "Nitroshroom", "Needleberry"] },
            { roll: "6", items: ["Jumbo Bone", "Small Goldenfish", "Bitterbug", "Hard Armor Sphere", "Blue Mushroom", "Dragonseed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "2d8 Nitrotoads" },
          { roll: "2", description: "1d6 Slagtoth protecting an injured Gajalaka" },
          { roll: "3", description: "All goes quiet as the branches above the group move and shake as if something is moving through them. Normal sounds continue a few minutes later." },
          { roll: "4", description: "3d4 Wingdrakes" },
          { roll: "5", description: "1 Great Maccao" },
          { roll: "6", description: "A group of Jagras pups gnaw on the body of an unidentified creature. They scatter into the jungle as the party nears." },
          { roll: "7", description: "1d4 Conga" },
          { roll: "8", description: "1d4 Young Seregios" },
          { roll: "9", description: "1 Pukei-Pukei" },
          { roll: "10", description: "1 Great Jagras plus 2 Jagras" },
        ],
      },
      {
        levelRange: "5-10",
        commonSmallMonsters: "Aptonoth, Bullfango, Conga, Hornetaur, Kelbi, Mosswine, Velociprey, Vespoid",
        commonLargeMonsters:
          "Astalos, Bulldrome, Congalala, Gypceros, Hypnocatrice, Nargacuga, Plesioth, Green Plesioth, Rathian, Seltas, Seltas Queen, Velocidrome, Zinogre, Yian Garuga, Yian Kut-Ku, Blue Yian Kut-Ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 16 },
            { category: "Fish", dc: 12 },
            { category: "Insects", dc: 12 },
            { category: "Minerals", dc: 16 },
            { category: "Mushrooms", dc: 12 },
            { category: "Plants", dc: 14 },
          ],
          rows: [
            { roll: "1", items: ["Lg Bone Husk", "Sleepyfish", "Honey", "Earth Crystal", "Nitroshroom", "Nullberry"] },
            { roll: "2", items: ["Sm Bone Husk", "Bomb Arrowana", "Bitterbug", "Earth Crystal", "Nitroshroom", "Needleberry"] },
            { roll: "3", items: ["Brute Bone", "Popfish", "Thunderbug", "Machalite Ore", "Blue Mushroom", "Antidote Herb"] },
            { roll: "4", items: ["Med Monster Bone", "Burst Arrowana", "Bitterbug", "Machalite Ore", "Blue Mushroom", "Hot Pepper"] },
            { roll: "5", items: ["Med Monsterbone", "Wanchovy", "Godbug", "Machalite Ore", "Exciteshroom", "Tropical Berry"] },
            { roll: "6", items: ["Monster Toughbone", "Glutton Tuna", "Flashbug", "Heavy Armor Sphere", "Exciteshroom", "Adamant Seed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d8 Hornetaur plus 1d8 Vespoid" },
          { roll: "2", description: "1d2 Bulldrome" },
          { roll: "3", description: "A small hunting party of aggressive Shakalaka chase a Kelbi, crossing paths with the party." },
          { roll: "4", description: "1d8 + 1 Young Kecha Wacha" },
          { roll: "5", description: "1d4 Seltas" },
          { roll: "6", description: "1d4+3 Tobi-Kitachi" },
          { roll: "7", description: "A large awakened tree asks for assistance ridding it of a Vespoid infestation and offers rare mushrooms as a reward." },
          { roll: "8", description: "1 Royal Ludroth" },
          { roll: "9", description: "A Nargacuga watches as her cubs attempt to kill a lone Shakalaka." },
          { roll: "10", description: "1 Glavenus" },
        ],
      },
      {
        levelRange: "11-16",
        commonSmallMonsters: "Aptonoth, Bullfango, Conga, Hornetaur, Kelbi, Mosswine, Velociprey, Vespoid",
        commonLargeMonsters:
          "Astalos, Bulldrome, Congalala, Daimyo Hermitaur, Duramboros, Gypceros, Hypnocatrice, Glavenus, Kushala Daora, Lagiacrus, Mizutsune, Nargacuga, Plesioth, Rathian, Seltas, Seltas Queen, Valstrax, Velocidrome, Zinogre, Yian Garuga, Yian Kut-Ku, Blue Yian Kut-Ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 18 },
            { category: "Fish", dc: 15 },
            { category: "Insects", dc: 15 },
            { category: "Minerals", dc: 19 },
            { category: "Mushrooms", dc: 15 },
            { category: "Plants", dc: 17 },
          ],
          rows: [
            { roll: "1", items: ["Sm BoneHusk x3", "Popfish", "Insect Husk", "Heavy Armor Sphere", "Blue Mushroom", "Ivy x2"] },
            { roll: "2", items: ["Med Monster Bone", "Wanchovy", "Flashbug x2", "Dragonite Ore", "Blue Mushroom x2", "Sap Plant x2"] },
            { roll: "3", items: ["Lg Monster Bone", "Small Goldenfish", "Large Toxic Kumori", "Dragonite Ore", "Nitroshroom", "Adamant Seed"] },
            { roll: "4", items: ["Lg Monster Bone", "Glutton Tuna", "Godbug x2", "Dragonite Ore", "Nitroshroom x3", "Tropical Berry"] },
            { roll: "5", items: ["Lg Monster Bone", "Ancient Fish", "Godbug x3", "Carbalite Ore", "Exciteshroom x2", "Hot Pepper x2"] },
            { roll: "6", items: ["Elder Dragon Bone", "Ancient Fish", "Bitterbug x3", "Carbalite Ore", "Exciteshroom x3", "Dosbiscus"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1 Congalala" },
          { roll: "2", description: "1 Najarala" },
          { roll: "3", description: "1d4 Young Nargacuga or 1d4 Blue Yian Kut-Ku" },
          { roll: "4", description: "1 Rathian" },
          { roll: "5", description: "1 Seltas Queen" },
          { roll: "6", description: "2d6 Juvenile Zinogre are rampaging through a lynian village." },
          { roll: "7", description: "1d3 Adolescent Rajang" },
          { roll: "8", description: "A veggie elder sleeping while holding a fishing pole." },
          { roll: "9", description: "1 Scarred Yian Garuga" },
          { roll: "10", description: "1 Savage Deviljho" },
        ],
      },
      {
        levelRange: "17-20",
        commonSmallMonsters: "Aptonoth, Bullfango, Conga, Hornetaur, Kelbi, Mosswine, Velociprey, Vespoid",
        commonLargeMonsters:
          "Astalos, Bulldrome, Chameleos, Congalala, Daimyo Hermitaur, Deviljho, Duramboros, Gypceros, Hypnocatrice, Glavenus, Kushala Daora, Lagiacrus, Mizutsune, Nargacuga, Silverwind Nargacuga, Plesioth, Green Plesioth, Furious Rajang, Rathian, Seltas, Seltas Queen, Valstrax, Velocidrome, Zinogre, Yian Garuga, Yian Kut-Ku, Blue Yian Kut-Ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 21 },
            { category: "Fish", dc: 18 },
            { category: "Insects", dc: 18 },
            { category: "Minerals", dc: 23 },
            { category: "Mushrooms", dc: 18 },
            { category: "Plants", dc: 20 },
          ],
          rows: [
            { roll: "1", items: ["Lg Bone Husk x5", "Glutton Tuna", "Spiderweb x3", "Dragonite Ore", "Blue Mushroom", "Ivy x4"] },
            { roll: "2", items: ["Monster Toughbone", "Small Goldenfish", "Large Toxic Kumori", "Lifecrystals x2", "Exciteshroom", "Nullberry x2"] },
            { roll: "3", items: ["Lg Monster Bone", "Speartuna", "Honey x4", "Royal Armor Sphere", "Blue Mushroom x3", "Adamant Seed"] },
            { roll: "4", items: ["Lg Monster Bone", "Ancient Fish", "Emperor Locust", "Carbalite Ore", "Nitroshroom x4", "Hot Pepper x2"] },
            { roll: "5", items: ["Lg Monster Bone", "Ancient Fish", "Honey x5", "Carbalite Ore", "Exciteshroom x3", "Might Seed"] },
            { roll: "6", items: ["Elder Dragon Bone", "Gastronome Tuna", "King Scarab", "Carbalite Ore", "Dragon Toadstool", "Dosbiscus"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1 Nargacuga" },
          { roll: "2", description: "1 Glavenus" },
          { roll: "3", description: "A Rajang fighting a Scarred Yian Garuga to the death." },
          { roll: "4", description: "2d6 Aknosom" },
          { roll: "5", description: "1d3 Seltas Queens" },
          { roll: "6", description: "1 Brachydios" },
          { roll: "7", description: "The party comes across 1d10 Giant Vigorwasps. The wasps carry the frenzy virus which spreads with their deathburst." },
          { roll: "8", description: "1d6 Viper Tobi-Kadachi" },
          { roll: "9", description: "1 Raging Brachydios" },
          { roll: "10", description: "1 Lao-Shan Lung" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 4. OCEAN
  // ─────────────────────────────────────────────
  {
    name: "Ocean",
    biome: "Coastal, Islands, Underwater",
    navigationDC: 15,
    encounterDC: 17,
    investigationDC: 13,
    totalResources: 8,
    commonWeather: "Hot & humid temperature, light to strong wind, light to heavy rain",
    specialRules: [
      {
        name: "Feeding Frenzy",
        description:
          "When entering the Ocean for the first time on a hunt, roll a d20. On a 20, the hunters encounter numerous Zamite feeding off the carcass of a large dead creature (3 carves, 1 carve lost every 10 minutes once found). The carcass creature depends on the party level: 1-4: Royal Ludroth or Zamtrios; 5-8: Gobul or Plesioth; 9-13: Lagiacrus or Namielle; 14-18: Tempered Namielle or Bazelgeuse; 19-20: Archtempered Namielle or Ceadeus.",
      },
      {
        name: "Underwater Herbalism",
        description:
          "When a creature successfully collects a plant resource that is located underwater, roll a 1-2 instead of the usual 1-6.",
      },
    ],
    weatherTable: [
      { roll: "1", weather: "Thunder Storm / Hurricane." },
      { roll: "2-5", weather: "Heavy Rain, light winds." },
      { roll: "6-15", weather: "Warm with a slight breeze." },
      { roll: "16-19", weather: "Warm with light rain that lasts most of the day." },
      { roll: "20", weather: "Clear skies and calm waters." },
    ],
    levelTiers: [
      {
        levelRange: "1-5",
        commonSmallMonsters: "Ceanataur, Epioth, Gajau, Hermitaur, Jaggi, Jaggia, Ludroth, Shakalaka, Velociprey, Vespoid, Zamite",
        commonLargeMonsters: "Great Jaggi, Royal Ludroth, Tetsucabra, Yian Kut-ku, Zamtrios",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 13 },
            { category: "Fish", dc: 10 },
            { category: "Insects", dc: 11 },
            { category: "Minerals", dc: 14 },
            { category: "Plants", dc: 11 },
          ],
          rows: [
            { roll: "1", items: ["Bone", "Popfish", "Insect Husk", "Stone", "Airweed"] },
            { roll: "2", items: ["Bone", "Sleepyfish", "Worm", "Stone", "Herb"] },
            { roll: "3", items: ["Lg Bone Husk", "Bomb Arowana", "Insect Husk", "Ice Crystal", "Scatternut"] },
            { roll: "4", items: ["Sm Monsterbone", "Burst Arrowana", "Firefly", "Earth Crystal", "Bomberry"] },
            { roll: "5", items: ["Sm Bone Husk", "Whetfish", "Spiderweb", "Armor Sphere", "Felvine"] },
            { roll: "6", items: ["Sm Monsterbone", "Pin Tuna", "Godbug", "Machalite Ore", "Airweed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "2d8 recently hatched Hermitaurs (Crabs)" },
          { roll: "2", description: "2d10 Epioth" },
          { roll: "3", description: "1d4 Ludroth feeding on corpses aboard the wreckage of a merchant ship. A search uncovers 2d6 bolts of ruined silk, a 50-foot length of rope, and a barrel of salted sushifish." },
          { roll: "4", description: "2d6 Epioth" },
          { roll: "5", description: "1 Great Jaggi" },
          { roll: "6", description: "1d4 crates litter the ocean floor. They contain missing Wycademy research notes." },
          { roll: "7", description: "1d6 Gajau" },
          { roll: "8", description: "1 Blue Yian Kut-Ku" },
          { roll: "9", description: "1 Royal Ludroth" },
          { roll: "10", description: "1 Zamtrios" },
        ],
      },
      {
        levelRange: "6-10",
        commonSmallMonsters: "Ceanataur, Epioth, Gajau, Hermitaur, Jaggi, Jaggia, Ludroth, Shakalaka, Velociprey, Vespoid, Zamite",
        commonLargeMonsters: "Daimyo Hermitaur, Gobul, Great Jaggi, Plesioth, Rathalos, Rathian, Royal Ludroth, Tetsucabra, Yian Kut-ku, Zamtrios",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 16 },
            { category: "Fish", dc: 14 },
            { category: "Insects", dc: 14 },
            { category: "Minerals", dc: 17 },
            { category: "Plants", dc: 14 },
          ],
          rows: [
            { roll: "1", items: ["Lg Bone Husk", "Pin Tuna", "Spiderweb x2", "Hard Armor Sphere", "Airweed x2"] },
            { roll: "2", items: ["Sm Bone Husk", "Burst Arrowana", "Honey x2", "Machalite Ore", "Nullberry"] },
            { roll: "3", items: ["Brute Bone", "Wanchovy", "Godbug", "Lifecrystals", "Tropical Berry"] },
            { roll: "4", items: ["Monsterbone+", "Burst Arrowana", "Thunderbug", "Lifecrystals", "Tropical Berry"] },
            { roll: "5", items: ["Monster Toughbone", "Blue Cutthroat", "Blossom Cricket", "Dragonite Ore", "Adamant Seed"] },
            { roll: "6", items: ["Lg Monsterbone", "Glutton Tuna", "Emperor Locust", "Heavy Armor Sphere", "Airweed x3"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d10 Ceanataur" },
          { roll: "2", description: "2d4 Ludroth" },
          { roll: "3", description: "A completely submerged shipwreck" },
          { roll: "4", description: "1 Vespoid Queen plus 1d8 Vespoids" },
          { roll: "5", description: "2 Seltas attracted to something near the party" },
          { roll: "6", description: "A pirate ship captained by a muscular Felyne (Veteran) and its lynian crew (1d6 Felynes and 1d6 Melynx)" },
          { roll: "7", description: "A desecrated shrine of the Guardian of the Deep" },
          { roll: "8", description: "1d4 Zamtrios" },
          { roll: "9", description: "1 Dire Miralis" },
          { roll: "10", description: "1 Shogun Ceanataur" },
        ],
      },
      {
        levelRange: "11-20",
        commonSmallMonsters: "Ceanataur, Epioth, Gajau, Hermitaur, Jaggi, Jaggia, Ludroth, Shakalaka, Velociprey, Vespoid, Zamite",
        commonLargeMonsters:
          "Ceadeus, Daimyo Hermitaur, Gobul, Great Jaggi, Lagiacrus, Namielle, Plesioth, Rathalos, Rathian, Royal Ludroth, Shen Gaoren, Shogun Ceanataur, Tetsucabra, Yian Kut-ku, Zamtrios",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 21 },
            { category: "Fish", dc: 20 },
            { category: "Insects", dc: 19 },
            { category: "Minerals", dc: 22 },
            { category: "Plants", dc: 19 },
          ],
          rows: [
            { roll: "1", items: ["Med Monsterbone", "Small Goldenfish", "Honey x3", "Hard Armor Sphere", "Airweed x4"] },
            { roll: "2", items: ["Lg Monster Bone", "Glutton Tuna", "Flashbug x2", "Lifecrystals", "Herb x4"] },
            { roll: "3", items: ["Monster Toughbone", "Blue Cutthroat", "Thunderbug", "Dragonite Ore", "Tropical Berry x3"] },
            { roll: "4", items: ["Lg Monster Bone", "Glutton Tuna", "Godbug", "Carbalite Ore", "Adamant Seed x2"] },
            { roll: "5", items: ["Elder Dragon Bone", "Ancient Fish", "Blossom Cricket", "Carbalite Ore", "Might Seed x2"] },
            { roll: "6", items: ["Elder Dragon Bone", "Gastronome Tuna", "Phantom Butterfly", "Royal Armor Sphere", "Stargazer Flower"] },
          ],
        },
        encounters: [
          { roll: "1", description: "2 Zamtrios with 2d8 Zamite" },
          { roll: "2", description: "1d10 Seltas" },
          { roll: "3", description: "1 Lagiacrus" },
          { roll: "4", description: "A patch of peaceful coral near a deep hole. Nearby is the fresh corpse of a Gobul." },
          { roll: "5", description: "1 Rathian with 1 Rathalos" },
          { roll: "6", description: "2 Plesioth" },
          { roll: "7", description: "A gloomy carved underwater cave, inside is a Shogun Ceanataur and a Daimyo Hermitaur" },
          { roll: "8", description: "1d4 Lagiacrus" },
          { roll: "9", description: "1 Archtempered Namielle" },
          { roll: "10", description: "1 Ceadeus" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 5. SNOWY MOUNTAINS
  // ─────────────────────────────────────────────
  {
    name: "Snowy Mountains",
    biome: "Tundra, Snowy Mountains, Frozen Ponds",
    navigationDC: 16,
    encounterDC: 16,
    investigationDC: 14,
    totalResources: 7,
    commonWeather: "Extreme Cold, light wind, light to heavy snow",
    specialRules: [
      {
        name: "Hatching Season",
        description:
          "When entering this area for the first time on a hunt, roll a d20. On a 1 or 20, a Khezu egg hatches and the mountain is swarmed by Khezu Whelps (Giggi that deal lightning damage). During combat on initiative 20, 1d4 khezu whelpings unburrow from underground.",
      },
      {
        name: "Veggie Elder",
        description:
          "Once per hunt, when a character rolls a 20 on a navigation skill check, they encounter the veggie elder. The elder offers to trade a resource item or material from a common creature in exchange for adventuring gear.",
      },
    ],
    weatherTable: [
      { roll: "1", weather: "Blizzard." },
      { roll: "2-8", weather: "Extreme cold, heavy snowfall, light wind." },
      { roll: "9-15", weather: "Extreme cold, no wind." },
      { roll: "16-19", weather: "Extreme cold, light snow." },
      { roll: "20", weather: "Extreme cold, strong winds, chance of avalanches." },
    ],
    levelTiers: [
      {
        levelRange: "1-4",
        commonSmallMonsters: "Anteka, Aptonoth, Blango, Bullfango, Giaprey, Kelbi, Popo, Velociprey, Vespoid",
        commonLargeMonsters: "Bulldrome, Giadrome",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 16 },
            { category: "Fish", dc: 18 },
            { category: "Insects", dc: 17 },
            { category: "Minerals", dc: 12 },
            { category: "Mushrooms", dc: 14 },
            { category: "Plants", dc: 14 },
          ],
          rows: [
            { roll: "1", items: ["Bone", "Sushifish", "Insect Husk", "Stone", "Blue Mushroom", "Herb"] },
            { roll: "2", items: ["Bone", "Burst Arowana", "Firefly", "Ice Crystal", "Blue Mushroom", "Snow Herb"] },
            { roll: "3", items: ["Sm Bone Husk", "Burst Arrowana", "Carpenterbug", "Ice Crystal", "Blue Mushroom", "Ivy"] },
            { roll: "4", items: ["Sm Bone Husk", "Bomb Arrowana", "Bitterbug", "Armor Sphere", "Blue Mushroom", "Paintberry"] },
            { roll: "5", items: ["Sm Monsterbone", "Small Goldenfish", "Cricket", "Earth Crystal", "Blue Mushroom", "Sap Plant"] },
            { roll: "6", items: ["Sm Monsterbone", "Small Goldenfish", "Flashbug", "Hard Armor Sphere", "Parashroom", "Frozen Berry"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d4+3 Kelbi" },
          { roll: "2", description: "2d6 Anteka" },
          { roll: "3", description: "2d8 Aptonoth" },
          { roll: "4", description: "Single-file tracks in the snow that stop abruptly" },
          { roll: "5", description: "1d6+1 Giaprey" },
          { roll: "6", description: "1 Bulldrome" },
          { roll: "7", description: "1 Druid that is tracking a Lagombi" },
          { roll: "8", description: "1d6 Blango" },
          { roll: "9", description: "1 Zamtrios" },
          { roll: "10", description: "1 Tzitzi-Ya-Ku" },
        ],
      },
      {
        levelRange: "5-10",
        commonSmallMonsters: "Anteka, Aptonoth, Blango, Bullfango, Giaprey, Kelbi, Popo, Velociprey, Vespoid",
        commonLargeMonsters: "Blangonga, Bulldrome, Giadrome, Khezu",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 18 },
            { category: "Fish", dc: 20 },
            { category: "Insects", dc: 19 },
            { category: "Minerals", dc: 14 },
            { category: "Mushrooms", dc: 16 },
            { category: "Plants", dc: 16 },
          ],
          rows: [
            { roll: "1", items: ["Sm Bone Husk", "Sushifish", "Firefly", "Ice Crystal", "Blue Mushroom", "Nullberry"] },
            { roll: "2", items: ["Jumbo Bone", "Burst Arrowana", "Bitterbug", "Hard Armor Sphere", "Blue Mushroom", "Snow Herb"] },
            { roll: "3", items: ["Brute Bone", "Pin Tuna", "Flashbug", "Ice Crystal", "Blue Mushroom", "Ivy"] },
            { roll: "4", items: ["Brute Bone", "Small Goldenfish", "Flashbug", "Armor Sphere", "Blue Mushroom", "Paintberry"] },
            { roll: "5", items: ["Monsterbone+", "Glutton Tuna", "Godbug", "Machalite Ore", "Parashroom", "Frozen Berry"] },
            { roll: "6", items: ["Monsterbone+", "Small Goldenfish", "Godbug", "Machalite Ore", "Parashroom", "Adamant Seed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d3+1 Giadrome" },
          { roll: "2", description: "2d4 Bulldrome" },
          { roll: "3", description: "2d8 Zamite" },
          { roll: "4", description: "2d6+1 Popo are stampeding away from the direction the group is heading" },
          { roll: "5", description: "1 Lagombi" },
          { roll: "6", description: "1d6+2 Rhenoplos" },
          { roll: "7", description: "1 Zamtrios" },
          { roll: "8", description: "1 Lagombi and 1 Bulldrome" },
          { roll: "9", description: "2d4 Lagombi" },
          { roll: "10", description: "1 Khezu" },
        ],
      },
      {
        levelRange: "11-16",
        commonSmallMonsters: "Anteka, Aptonoth, Blango, Bullfango, Giaprey, Great Thunderbug, Kelbi, Popo, Velociprey, Vespoid",
        commonLargeMonsters: "Blangonga, Bulldrome, Giadrome, Khezu, Kushala Daora, Rajang, Zinogre, Tigrex",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 20 },
            { category: "Fish", dc: 22 },
            { category: "Insects", dc: 21 },
            { category: "Minerals", dc: 16 },
            { category: "Mushrooms", dc: 18 },
            { category: "Plants", dc: 18 },
          ],
          rows: [
            { roll: "1", items: ["Monsterbone+", "Sushifish", "Cricket", "Machalite Ore", "Blue Mushroom", "Nullberry"] },
            { roll: "2", items: ["Monsterbone+", "Burst Arrowana", "Bitterbug", "Hard Armor Sphere", "Blue Mushroom", "Herb"] },
            { roll: "3", items: ["Monster Toughbone", "Small Goldenfish", "Godbug", "Heavy Armor Sphere", "Blue Mushroom", "Snow Herb"] },
            { roll: "4", items: ["Monster Toughbone", "Glutton Tuna", "Flashbug", "Dragonite Ore", "Parashroom", "Frozen Berry"] },
            { roll: "5", items: ["Lg Monster Bone", "Speartuna", "Godbug", "Carbalite Ore", "Parashroom", "Adamant Seed"] },
            { roll: "6", items: ["Lg Monster Bone", "Ancient Fish", "Godbug", "Royal Armor Sphere", "Parashroom", "Adamant Seed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d4+1 Zamtrios" },
          { roll: "2", description: "1d3 Tzitzi-Ya-Ku" },
          { roll: "3", description: "A blizzard that reduces visibility to 5 feet for 1d6 hours" },
          { roll: "4", description: "1 Mizutsune" },
          { roll: "5", description: "1 Blangonga with 2d8 Blango" },
          { roll: "6", description: "A herd of 9d6 + 60 Kelbi moving through the snow" },
          { roll: "7", description: "1 Kirin" },
          { roll: "8", description: "1 Rajang" },
          { roll: "9", description: "1d6+1 Blangonga" },
          { roll: "10", description: "1 Ukanlos" },
        ],
      },
      {
        levelRange: "17-20",
        commonSmallMonsters: "Anteka, Aptonoth, Blango, Bullfango, Giaprey, Great Thunderbug, Kelbi, Popo, Velociprey, Vespoid",
        commonLargeMonsters: "Blangonga, Bulldrome, Giadrome, Khezu, Kushala Daora, Rajang, Zinogre, Tigrex",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 22 },
            { category: "Fish", dc: 24 },
            { category: "Insects", dc: 23 },
            { category: "Minerals", dc: 18 },
            { category: "Mushrooms", dc: 20 },
            { category: "Plants", dc: 20 },
          ],
          rows: [
            { roll: "1", items: ["Lg Monster Bone", "Sushifish", "Honey", "Dragonite Ore", "Blue Mushroom", "Snow Herb"] },
            { roll: "2", items: ["Lg Monster Bone", "Small Goldenfish", "Bitterbug", "Dragonite Ore", "Blue Mushroom", "Adamant Seed"] },
            { roll: "3", items: ["Monster Toughbone", "Popfish", "Godbug", "Heavy Armor Sphere", "Blue Mushroom", "Frozen Berry"] },
            { roll: "4", items: ["Monster Toughbone", "Ancient Fish", "Flashbug", "Carbalite Ore", "Parashroom", "Paintberry"] },
            { roll: "5", items: ["Elder Dragonbone", "Speartuna", "Godbug", "Carbalite Ore", "Bindshroom", "Nullberry"] },
            { roll: "6", items: ["Elder Dragonbone", "Gastronome Tuna", "Emperor Locust", "Royal Armor Sphere", "Dragon Toadstool", "Stargazer Flower"] },
          ],
        },
        encounters: [
          { roll: "1", description: "2 Barioth with 2 Arzuros" },
          { roll: "2", description: "1 Tigrex" },
          { roll: "3", description: "1 Ukanlos" },
          { roll: "4", description: "1d3 Blangonga" },
          { roll: "5", description: "1d4 Nargacuga" },
          { roll: "6", description: "1d4 Kirin" },
          { roll: "7", description: "1d4 Mizutsune" },
          { roll: "8", description: "1d8 Blangonga with 2d4 Bulldrome" },
          { roll: "9", description: "1d8 Khezu" },
          { roll: "10", description: "1 Behemoth" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 6. VERDANT HILLS
  // ─────────────────────────────────────────────
  {
    name: "Verdant Hills",
    biome: "Forest and Hills",
    navigationDC: 10,
    encounterDC: 19,
    investigationDC: 10,
    totalResources: 7,
    commonWeather: "Warm temperature, light wind, light rain",
    specialRules: [
      {
        name: "King & Queen",
        description:
          "When entering the Verdant Hills for the first time on a hunt, roll a d20. On a 1, a Rathian has built a nest somewhere nearby. On a 20, a Rathalos is hunting from the sky.",
      },
      {
        name: "Veggie Elder",
        description:
          "Once per hunt, when a character rolls a 20 on a trailblazer skill check, they encounter the veggie elder. The elder offers to trade an item from the resource table or material from a common creature in exchange for adventuring gear.",
      },
    ],
    weatherTable: [
      { roll: "1", weather: "Thunder Storm." },
      { roll: "2-5", weather: "Unseasonably hot with no wind." },
      { roll: "6-15", weather: "Warm with a slight breeze." },
      { roll: "16-19", weather: "Warm with light rain that lasts until mid day." },
      { roll: "20", weather: "Cool with heavy rain (lightly obscures the area)." },
    ],
    levelTiers: [
      {
        levelRange: "1-4",
        commonSmallMonsters: "Aptonoth, Bullfango, Felyne, Kelbi, Melynx, Mosswine, Velociprey, Vespoid",
        commonLargeMonsters: "Gypceros, Velocidrome, Yian Garuga, Yian Kut-Ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 11 },
            { category: "Fish", dc: 10 },
            { category: "Insects", dc: 12 },
            { category: "Minerals", dc: 14 },
            { category: "Mushrooms", dc: 10 },
            { category: "Plants", dc: 10 },
          ],
          rows: [
            { roll: "1", items: ["Bone", "Sushifish", "Insect Husk", "Stone", "Blue Mushroom", "Herb"] },
            { roll: "2", items: ["Sm Bone Husk", "Pin Tuna", "Bitterbug", "Earth Crystal", "Blue Mushroom", "Ivy"] },
            { roll: "3", items: ["Sm Bone Husk", "Pin Tuna", "Carpenterbug", "Earth Crystal", "Blue Mushroom", "Sleep Herb"] },
            { roll: "4", items: ["Lg Bone Husk", "Burst Arrowana", "Honey", "Armor Sphere", "Toadstool", "Huskberry"] },
            { roll: "5", items: ["Bird Wyvern Bone", "Popfish", "Spiderweb", "Armor Sphere", "Toadstool", "Sap Plant"] },
            { roll: "6", items: ["Sm Monsterbone", "Small Goldenfish", "Flashbug", "Machalite Ore", "Nitroshroom", "Antidote Herb"] },
          ],
        },
        encounters: [
          { roll: "1", description: "2 Aptonoth aggressively guard their baby" },
          { roll: "2", description: "1d4 wild Melynx attempt to ambush the party" },
          { roll: "3", description: "1d8 + 1 Bullfango" },
          { roll: "4", description: "1 Velociprey or 1 Velocidrome" },
          { roll: "5", description: "3 Velociprey" },
          { roll: "6", description: "2d4 Vespoid" },
          { roll: "7", description: "1 Yian Kut-Ku" },
          { roll: "8", description: "1d6 Felyne" },
          { roll: "9", description: "1 Vespoid Queen and 1d4 Vespoids" },
          { roll: "10", description: "1 Gypceros" },
        ],
      },
      {
        levelRange: "5-10",
        commonSmallMonsters: "Aptonoth, Bullfango, Felyne, Great Thunderbug, Kelbi, Melynx, Mosswine, Shakalaka, Velociprey, Vespoid",
        commonLargeMonsters: "Gypceros, Rathalos, Rathian, Yian Garuga, Yian Kut-Ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 14 },
            { category: "Fish", dc: 12 },
            { category: "Insects", dc: 15 },
            { category: "Minerals", dc: 16 },
            { category: "Mushrooms", dc: 15 },
            { category: "Plants", dc: 15 },
          ],
          rows: [
            { roll: "1", items: ["Sm Bone Husk", "Sushifish", "Spiderweb", "Earth Crystal", "Toadstool", "Herb"] },
            { roll: "2", items: ["Lg Bone Husk", "Burst Arrowana", "Honey", "Armor Sphere", "Nitroshroom", "Felvine"] },
            { roll: "3", items: ["Sm Monsterbone", "Pin Tuna", "Bitterbug", "Machalite Ore", "Toadstool", "Nullberry"] },
            { roll: "4", items: ["Med Monsterbone", "Popfish", "Godbug", "Hard Armor Sphere", "Blue Mushroom", "Gloamgrass Root"] },
            { roll: "5", items: ["Monsterbone+", "Wanchovy", "Flashbug", "Machalite Ore", "Parashroom", "Needleberry"] },
            { roll: "6", items: ["Brute Bone", "Small Goldenfish", "Thunderbug", "Heavy Armor Sphere", "Parashroom", "Gloamgrass Root"] },
          ],
        },
        encounters: [
          { roll: "1", description: "2d4 Velociprey or 2d6 Vespoid" },
          { roll: "2", description: "1d6 Melynx riding on Velociprey" },
          { roll: "3", description: "1 Bulldrome and 2d8 Bullfango" },
          { roll: "4", description: "Caveman-like doodles found on the side of a rock. A DC 14 Intelligence (Investigation) check reveals the doodle points toward a Veggie Elder." },
          { roll: "5", description: "1d8+1 Velocidrome" },
          { roll: "6", description: "2d4 Bulldrome" },
          { roll: "7", description: "A clear pool of water with 1d6 sleeping animals lying around its edge" },
          { roll: "8", description: "1d8+1 Rhenoplos" },
          { roll: "9", description: "1d8+1 Yian Kut-Ku" },
          { roll: "10", description: "1 Malfestio" },
        ],
      },
      {
        levelRange: "11-16",
        commonSmallMonsters: "Aptonoth, Bullfango, Felyne, Great Thunderbug, Kelbi, Melynx, Mosswine, Shakalaka, Velociprey, Vespoid",
        commonLargeMonsters: "Astalos, Deviljho, Gypceros, Najarala, Rathalos, Rathian, Yian Garuga, Yian Kut-ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 16 },
            { category: "Fish", dc: 14 },
            { category: "Insects", dc: 16 },
            { category: "Minerals", dc: 20 },
            { category: "Mushrooms", dc: 16 },
            { category: "Plants", dc: 17 },
          ],
          rows: [
            { roll: "1", items: ["Monsterbone+", "Bomb Arrowana", "Flashbug", "Hard Armor Sphere", "Toadstool", "Herb"] },
            { roll: "2", items: ["Med Monsterbone", "Burst Arrowana", "Godbug", "Dragonite Ore", "Bindshroom", "Might Seed"] },
            { roll: "3", items: ["Lg Monster Bone", "Small Goldenfish", "Godbug", "Heavy Armor Sphere", "Exciteshroom", "Adamant Seed"] },
            { roll: "4", items: ["Lg Monster Bone", "Glutton Tuna", "Thunderbug", "Dragonite Ore", "Bindshroom", "Paintberry"] },
            { roll: "5", items: ["Monster Toughbone", "Blue Cutthroat", "Toxic Kumori", "Lifecrystals", "Parashroom", "Airweed"] },
            { roll: "6", items: ["Monster Toughbone", "Ancient Fish", "Blossom Cricket", "Royal Armor Sphere", "Exciteshroom", "Might Seed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d3 Hypnocatrice + 2d6 Velociprey" },
          { roll: "2", description: "2d4 Yian Kut-Ku" },
          { roll: "3", description: "1d4+1 Yian Kut-Ku with 1d3 Arzuros" },
          { roll: "4", description: "2 Yian Garuga" },
          { roll: "5", description: "1 Seregios and 1 Paolumu" },
          { roll: "6", description: "1 Qurupeco and 1 Hypnocatrice" },
          { roll: "7", description: "A group of seven people (Commoners) wearing shakalaka masks and ambling through the hills" },
          { roll: "8", description: "1d4 Volvidon" },
          { roll: "9", description: "1 Rathalos" },
          { roll: "10", description: "1 Alatreon" },
        ],
      },
      {
        levelRange: "17-20",
        commonSmallMonsters: "Aptonoth, Bullfango, Felyne, Melynx, Hornetaur, Kelbi, Mosswine, Velociprey, Vespoid",
        commonLargeMonsters: "Astalos, Chameleos, Deviljho, Gypceros, King Shakalaka, Rathalos, Velocidrome, Yian Garuga, Yian Kut-Ku",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 18 },
            { category: "Fish", dc: 15 },
            { category: "Insects", dc: 20 },
            { category: "Minerals", dc: 25 },
            { category: "Mushrooms", dc: 18 },
            { category: "Plants", dc: 18 },
          ],
          rows: [
            { roll: "1", items: ["Sm Bone Husk", "Speartuna", "Flashbug", "Lightcrystal", "Bindshroom", "Herb"] },
            { roll: "2", items: ["Lg Monster Bone", "Burst Arrowana", "Great Hornfly", "Lifecrystals", "Exciteshroom", "Huskberry"] },
            { roll: "3", items: ["Monster Toughbone", "Bomb Arrowana", "Large Toxic Kumori", "Carbalite Ore", "Chaos Mushroom", "Adamant Seed"] },
            { roll: "4", items: ["Monster Toughbone", "Ancient Fish", "Emperor Locust", "Carbalite Ore", "Dragon Toadstool", "Gloamgrass Root"] },
            { roll: "5", items: ["Monster Toughbone", "Speartuna", "Phantom Butterfly", "Royal Armor Sphere", "Chaos Mushroom", "Nullberry"] },
            { roll: "6", items: ["Elder Dragonbone", "Gastronome Tuna", "Phantom Butterfly", "Royal Armor Sphere", "Dragon Toadstool", "Stargazer Flower"] },
          ],
        },
        encounters: [
          { roll: "1", description: "2d6 Volvidon" },
          { roll: "2", description: "2d6 Kulu-Ya-Ku" },
          { roll: "3", description: "1d4 Astalos with 1d8 Yian Garuga" },
          { roll: "4", description: "A fiery comet races across the sky (a Valstrax)" },
          { roll: "5", description: "1d3 Zinogre" },
          { roll: "6", description: "2d4 Qurupeco" },
          { roll: "7", description: "A valley where all the grass has died and the ground is littered with stumps and fallen trees, all petrified and a black dust fills the air (Frenzy Virus)" },
          { roll: "8", description: "1d6+2 Rathians" },
          { roll: "9", description: "1 Brachydios" },
          { roll: "10", description: "1 Vaal Hazak" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 7. VOLCANO
  // ─────────────────────────────────────────────
  {
    name: "Volcano",
    biome: "Dry, craggy, rocky areas; lava pools and streams",
    navigationDC: 14,
    encounterDC: 18,
    investigationDC: 16,
    totalResources: 6,
    commonWeather: "Extreme Heat, minimal wind, no rain",
    specialRules: [
      {
        name: "Falling Ash",
        description:
          "At the start of a hunt and the start of each day, roll a d20. On a 18-20, the area becomes lightly obscured by ash for 24 hours. If the ash falls for more than 1 day consecutively, the terrain becomes difficult and heavily obscured. For every hour of travel in ash, a character must make a DC 10 Constitution saving throw or become poisoned. The DC increases by 1 each hour. Failing two in a row grants 1 level of exhaustion; failing three in a row causes suffocation.",
      },
      {
        name: "Volcanic Gas",
        description:
          "When the PCs enter an area for the first time, roll a d20. On a 18-20, the ground cracks open and releases volcanic gas. Each PC must make a DC 15 Constitution saving throw or be poisoned for 1 hour.",
      },
    ],
    levelTiers: [
      {
        levelRange: "1-4",
        commonSmallMonsters: "Apceros, Bullfango, Ceanataur, Felyne, Ioprey, Melynx, Remobra, Shakalaka, Uroktor, Vespoid",
        commonLargeMonsters: "Agnaktor, Basarios, Iodrome, Uragaan, Volvidon",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 14 },
            { category: "Insects", dc: 17 },
            { category: "Minerals", dc: 13 },
            { category: "Mushrooms", dc: 16 },
            { category: "Plants", dc: 16 },
          ],
          rows: [
            { roll: "1", items: ["Bone", "Insect Husk", "Stone", "Nitroshroom", "Fire Herb"] },
            { roll: "2", items: ["Bone", "Insect Husk", "Armor Sphere", "Nitroshroom", "Sap Plant"] },
            { roll: "3", items: ["Sm Bone Husk", "Insect Husk", "Earth Crystal", "Nitroshroom", "Huskberry"] },
            { roll: "4", items: ["Sm Bone Husk", "Insect Husk", "Earth Crystal", "Nitroshroom", "Tropical Berry"] },
            { roll: "5", items: ["Sm Bone Husk", "Bitterbug", "Armor Sphere", "Nitroshroom", "Dragon Seed"] },
            { roll: "6", items: ["Jumbo Bone", "Snakebee Larva", "Machalite Ore", "Nitroshroom", "Dragon Seed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d3 Apceros" },
          { roll: "2", description: "1d6+3 Remobra" },
          { roll: "3", description: "2d10 wild Melynx" },
          { roll: "4", description: "1 Iodrome" },
          { roll: "5", description: "2 Ioprey with 1 wild Melynx" },
          { roll: "6", description: "1d6+2 Ceanataur" },
          { roll: "7", description: "1d8 Kestodon" },
          { roll: "8", description: "1 Iodrome with 1d2 Ioprey" },
          { roll: "9", description: "1 Volvidon" },
          { roll: "10", description: "1 Dodogama" },
        ],
      },
      {
        levelRange: "5-10",
        commonSmallMonsters: "Apceros, Bullfango, Ceanataur, Felyne, Ioprey, Melynx, Remobra, Shakalaka, Uroktor, Vespoid",
        commonLargeMonsters: "Agnaktor, Basarios, Iodrome, Lavasioth, Rathalos, Shogun Ceanataur, Uragaan, Volvidon",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 16 },
            { category: "Insects", dc: 19 },
            { category: "Minerals", dc: 15 },
            { category: "Mushrooms", dc: 18 },
            { category: "Plants", dc: 18 },
          ],
          rows: [
            { roll: "1", items: ["Bone", "Insect Husk", "Armor Sphere", "Nitroshroom", "Fire Herb"] },
            { roll: "2", items: ["Sm Bone Husk", "Insect Husk", "Earth Crystal", "Nitroshroom", "Hot Pepper"] },
            { roll: "3", items: ["Sm Bone Husk", "Bitterbug", "Hard Armor Sphere", "Nitroshroom", "Huskberry"] },
            { roll: "4", items: ["Sm Bone Husk", "Bughopper", "Machalite Ore", "Nitroshroom", "Tropical Berry"] },
            { roll: "5", items: ["Lg Bone Husk", "Flashbug", "Hard Armor Sphere", "Nitroshroom", "Dragon Seed"] },
            { roll: "6", items: ["Monsterbone+", "Godbug", "Machalite Ore", "Dragon Toadstool", "Dragon Seed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d8+1 Uroktor" },
          { roll: "2", description: "1d8+1 Gastodon" },
          { roll: "3", description: "1d8 fissures venting steam that partially obscures a 20-foot cube above each fissure" },
          { roll: "4", description: "1d12 Melynx" },
          { roll: "5", description: "1 Iodrome with 3 Vespoid" },
          { roll: "6", description: "1d10 Bulldrome" },
          { roll: "7", description: "1d4 Tetsucabra" },
          { roll: "8", description: "1 Basarios" },
          { roll: "9", description: "1 Rathalos" },
          { roll: "10", description: "1 Lavasioth" },
        ],
      },
      {
        levelRange: "11-16",
        commonSmallMonsters: "Apceros, Bullfango, Ceanataur, Felyne, Ioprey, Melynx, Remobra, Shakalaka, Uroktor, Vespoid",
        commonLargeMonsters: "Agnaktor, Basarios, Gravios, Iodrome, Lavasioth, Rathalos, Shogun Ceanataur, Uragaan, Volvidon",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 18 },
            { category: "Insects", dc: 21 },
            { category: "Minerals", dc: 17 },
            { category: "Mushrooms", dc: 20 },
            { category: "Plants", dc: 20 },
          ],
          rows: [
            { roll: "1", items: ["Sm Bone Husk", "Insect Husks", "Machalite Ore", "Nitroshroom", "Fire Herb"] },
            { roll: "2", items: ["Monster Toughbone", "Carpenterbug", "Heavy Armor Sphere", "Nitroshroom", "Hot Pepper"] },
            { roll: "3", items: ["Monster Toughbone", "Flashbug", "Dragonite Ore", "Nitroshroom", "Might Seed"] },
            { roll: "4", items: ["Lg Bone Husk", "Great Hornfly", "Dragonite Ore", "Nitroshroom", "Tropical Berry"] },
            { roll: "5", items: ["Lg Monster Bone", "Toxic Kumori", "Heavy Armor Sphere", "Dragon Toadstool", "Dragon Seed"] },
            { roll: "6", items: ["Lg Monster Bone", "Godbug", "Lifecrystals", "Dragon Toadstool", "Adamant Seed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "2d6 Yian Kut-Ku" },
          { roll: "2", description: "1d6 Tetsucabra" },
          { roll: "3", description: "1d4 Uragaan" },
          { roll: "4", description: "1d6+2 Volvidon" },
          { roll: "5", description: "1d4 Anjanath" },
          { roll: "6", description: "2 Dodogama playing catch with a molten rock a few hundred feet away" },
          { roll: "7", description: "1 Gravios" },
          { roll: "8", description: "1d3 Odogaron" },
          { roll: "9", description: "1 Bazelgeuse" },
          { roll: "10", description: "1 Nergigante" },
        ],
      },
      {
        levelRange: "17-20",
        commonSmallMonsters: "Apceros, Bullfango, Ceanataur, Felyne, Ioprey, Melynx, Remobra, Shakalaka, Uroktor, Vespoid",
        commonLargeMonsters: "Agnaktor, Basarios, Iodrome, Uragaan, Volvidon",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 20 },
            { category: "Insects", dc: 23 },
            { category: "Minerals", dc: 19 },
            { category: "Mushrooms", dc: 22 },
            { category: "Plants", dc: 22 },
          ],
          rows: [
            { roll: "1", items: ["Med Monsterbone", "Insect Husk", "Dragonite Ore", "Nitroshroom", "Fire Herb"] },
            { roll: "2", items: ["Sm Bone Husk", "Godbug", "Heavy Armor Sphere", "Nitroshroom", "Hot Pepper"] },
            { roll: "3", items: ["Lg Bone Husk", "Great Hornfly", "Dragonite Ore", "Nitroshroom", "Might Seed"] },
            { roll: "4", items: ["Lg Monster Bone", "Large Toxic Kumori", "Heavy Armor Sphere", "Dragon Toadstool", "Tropical Berry"] },
            { roll: "5", items: ["Monster Toughbone", "Emperor Locust", "Carbalite Ore", "Dragon Toadstool", "Dragon Seed"] },
            { roll: "6", items: ["Elder Dragonbone", "King Scarab", "Royal Armor Sphere", "Dragon Toadstool", "Adamant Seed"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d8+1 Agnaktor" },
          { roll: "2", description: "1 Valstrax" },
          { roll: "3", description: "2d4 Uragaan" },
          { roll: "4", description: "1 Shogun Ceanataur" },
          { roll: "5", description: "1d10 Volvidon" },
          { roll: "6", description: "1 Rajang" },
          { roll: "7", description: "A wall of flowing lava hundreds of feet high that drops onto the ground ahead" },
          { roll: "8", description: "1d3 Dire Miralis" },
          { roll: "9", description: "1d4 Rathalos" },
          { roll: "10", description: "1 Teostra in its lair with 1 Tempered Lunastra" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 8. THE WETLANDS
  // ─────────────────────────────────────────────
  {
    name: "The Wetlands",
    biome: "Old Swamp",
    navigationDC: 14,
    encounterDC: 18,
    investigationDC: 12,
    totalResources: 8,
    commonWeather: "Warm temperature, foggy, light rain",
    specialRules: [
      {
        name: "Chilling Caves",
        description:
          "The caves within the wetlands are freezing cold. Their average temperature ranges from -20 degrees Fahrenheit to -10 degrees Fahrenheit.",
      },
      {
        name: "Low Visibility",
        description:
          "The Wetlands area is lightly obscured by mist. Each day the party spends in this location roll a d20. On a 20, the area is heavily obscured for 24 hours.",
      },
      {
        name: "Excessive Minerals",
        description:
          "When a character successfully obtains minerals from mining, they can roll on the resources table again. The second mineral does not count against the hunts total resources.",
      },
    ],
    weatherTable: [
      { roll: "1", weather: "Thunder storm." },
      { roll: "2-5", weather: "Unseasonably hot with no wind and high humidity." },
      { roll: "6-15", weather: "Expected temperature, no wind." },
      { roll: "16-19", weather: "Light rain." },
      { roll: "20", weather: "Strong winds and heavy rainfall." },
    ],
    levelTiers: [
      {
        levelRange: "1-4",
        commonSmallMonsters: "Bullfango, Ceanataur, Velociprey, Giaprey, Genprey, Ioprey, Melynx, Kelbi, Vespoid, Hornetaur, Aptonoth, Mosswine",
        commonLargeMonsters: "Gendrome, Gypceros, Basarios",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 13 },
            { category: "Insects", dc: 10 },
            { category: "Minerals", dc: 12 },
            { category: "Mushrooms", dc: 10 },
            { category: "Plants", dc: 14 },
          ],
          rows: [
            { roll: "1", items: ["Bone", "Insect Husk", "Stone", "Blue Mushroom", "Herb"] },
            { roll: "2", items: ["Bone", "Spiderweb", "Earth Crystal", "Toadstool", "Huskberry"] },
            { roll: "3", items: ["Sm Bone Husk", "Firefly", "Earth Crystal", "Nitroshroom", "Antidote Herb"] },
            { roll: "4", items: ["Lg Bone Husk", "Worm", "Armor Sphere", "Toadstool", "Felvine"] },
            { roll: "5", items: ["Bird Wyvern Bone", "Bitterbug", "Machalite Ore", "Blue Mushroom", "Nullberry"] },
            { roll: "6", items: ["Sm Monsterbone", "Godbug", "Hard Armor Sphere", "Parashroom", "Gloamgrass Root"] },
          ],
        },
        encounters: [
          { roll: "1", description: "2d8 Kelbi" },
          { roll: "2", description: "1 Gendrome" },
          { roll: "3", description: "1d4+1 mud hovels partially hidden in murky water. A tribe of Gajalaka live here." },
          { roll: "4", description: "1 Melynx attempts to sneak up and steal an item from a player." },
          { roll: "5", description: "2d10 Gajalaka" },
          { roll: "6", description: "2d6+3 Hornetaur" },
          { roll: "7", description: "1 Bulldrome" },
          { roll: "8", description: "1 Great Wroggi" },
          { roll: "9", description: "1 Agnaktor" },
          { roll: "10", description: "1 Basarios" },
        ],
      },
      {
        levelRange: "5-10",
        commonSmallMonsters: "Bullfango, Ceanataur, Conga, Velociprey, Giaprey, Genprey, Ioprey, Melynx, Kelbi, Vespoid, Hornetaur, Aptonoth, Mosswine",
        commonLargeMonsters: "Gendrome, Gypceros, Basarios, Gravios, Rathalos, Rathian, Khezu, Kirin, Nargacuga, Shogun Ceanataur",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 17 },
            { category: "Insects", dc: 16 },
            { category: "Minerals", dc: 18 },
            { category: "Mushrooms", dc: 14 },
            { category: "Plants", dc: 19 },
          ],
          rows: [
            { roll: "1", items: ["Sm Bone Husk", "Worm", "Earth Crystal", "Toadstool", "Herb"] },
            { roll: "2", items: ["Bone", "Spiderweb", "Machalite Ore", "Nitroshroom", "Huskberry"] },
            { roll: "3", items: ["Jumbo Bone", "Godbug", "Machalite Ore", "Toadstool", "Antidote Herb"] },
            { roll: "4", items: ["Brute Bone", "Flashbug", "Hard Armor Sphere", "Blue Mushroom", "Dragon Seed"] },
            { roll: "5", items: ["Med Monsterbone", "Flashbug", "Hard Armor Sphere", "Parashroom", "Scatternut"] },
            { roll: "6", items: ["Monsterbone+", "Godbug", "Dragonite Ore", "Parashroom", "Gloamgrass Root"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d10 Ioprey with 1d8+1 Hornetaur" },
          { roll: "2", description: "2d8 Giaprey" },
          { roll: "3", description: "Tainted water that exposes creatures moving through it to Sight Rot (DMG ch. 8)" },
          { roll: "4", description: "1d4+1 Iodrome with 1d4 Gendrome" },
          { roll: "5", description: "1d4+1 Bulldrome" },
          { roll: "6", description: "1 Bulldrome with 1d3 Rhenoplos and 1d8+2 Conga" },
          { roll: "7", description: "2d4 Rhenoplos" },
          { roll: "8", description: "1 Anjanath" },
          { roll: "9", description: "1d4 Yian Kut-Ku with 1d6+2 Giadrome" },
          { roll: "10", description: "1 Odogaron with 1 Rathian and 1 Gypceros" },
        ],
      },
      {
        levelRange: "11-20",
        commonSmallMonsters: "Bullfango, Ceanataur, Conga, Velociprey, Giaprey, Genprey, Ioprey, Melynx, Kelbi, Vespoid, Hornetaur, Aptonoth, Mosswine",
        commonLargeMonsters: "Gendrome, Gypceros, Basarios, Gravios, Rathalos, Rathian, Khezu, Kirin, Nargacuga, Shogun Ceanataur",
        resources: {
          columns: [
            { category: "Bonepiles", dc: 21 },
            { category: "Insects", dc: 20 },
            { category: "Minerals", dc: 23 },
            { category: "Mushrooms", dc: 18 },
            { category: "Plants", dc: 25 },
          ],
          rows: [
            { roll: "1", items: ["Sm Bone Husk", "Flashbug", "Machalite Ore", "Toadstool", "Sap Plant"] },
            { roll: "2", items: ["Sm Monsterbone", "Godbug", "Heavy Armor Sphere", "Blue Mushroom", "Gloamgrass Root"] },
            { roll: "3", items: ["Brute Bone", "Thunderbug", "Dragonite Ore", "Exciteshroom", "Antidote Herb"] },
            { roll: "4", items: ["Med Monsterbone", "Toxic Kumori", "Lifecrystals", "Bindshroom", "Adamant Seed"] },
            { roll: "5", items: ["Monsterbone+", "Great Hornfly", "Carbalite Ore", "Dragon Toadstool", "Might Seed"] },
            { roll: "6", items: ["Lg Monster Bone", "Large Toxic Kumori", "Royal Armor Sphere", "Chaos Mushroom", "Dosbiscus"] },
          ],
        },
        encounters: [
          { roll: "1", description: "1d4 Pukei-Pukei" },
          { roll: "2", description: "1d6+1 Yian Kut-Ku" },
          { roll: "3", description: "A large, spreading tree where 2d6 hunters lie dead under it" },
          { roll: "4", description: "1 Rathalos with 1 Rathian" },
          { roll: "5", description: "2 Khezu" },
          { roll: "6", description: "1 Glavenus" },
          { roll: "7", description: "A group of seven people (Commoners) wearing shakalaka masks and ambling through the hills" },
          { roll: "8", description: "1 Nargacuga with 1 Kirin" },
          { roll: "9", description: "1 Deviljho" },
          { roll: "10", description: "1 Nergigante" },
        ],
      },
    ],
  },
];
