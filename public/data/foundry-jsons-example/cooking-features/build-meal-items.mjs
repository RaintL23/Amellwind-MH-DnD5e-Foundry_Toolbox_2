/**
 * Builds / refreshes Foundry meal feat JSONs for Artisan Cooking ranks 1–4.
 * - Rank 1: updates img + category flags on existing files (keeps AEs/activities).
 * - Ranks 2–4: generates description-only feat templates.
 *
 * Run: node public/data/foundry-jsons-example/cooking-features/build-meal-items.mjs
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IMG = {
  meat: "mh-icons/meat.webp",
  seafood: "mh-icons/fish.webp",
  vegetable: "mh-icons/herb.webp",
};

const RANK_DC = { 1: 10, 2: 13, 3: 14, 4: 16 };

/** @type {Record<number, Array<{ name: string, boon: string, category: "meat"|"seafood"|"vegetable", chat?: string }>>} */
const MEALS_BY_RANK = {
  1: [
    { name: "Aged Cheese", category: "vegetable", boon: "You count as if you were one size larger for the purpose of determining your carrying capacity.", chat: "Count as one size larger for carrying capacity." },
    { name: "Carefree Yogurt", category: "vegetable", boon: "You gain the same benefits as if you drank a cool drink.", chat: "Gain the benefits of a cool drink." },
    { name: "Cube Steak", category: "meat", boon: "You can doff or don your armor as an action.", chat: "Doff or don armor as an action." },
    { name: "Fruity Jam", category: "vegetable", boon: "You have advantage on Dexterity (Sleight of Hand) checks to catch insects.", chat: "Advantage on Sleight of Hand to catch insects." },
    { name: "Furahiya Cola", category: "vegetable", boon: "You gain the same benefits as if you drank a hot drink.", chat: "Gain the benefits of a hot drink." },
    { name: "Hardtack", category: "vegetable", boon: "Reduces the casting time of rituals by half.", chat: "Ritual casting time halved." },
    { name: "Mild Herbs", category: "vegetable", boon: "Once per meal, you can roll a d4 and add the number rolled to one saving throw of your choice. You can roll the die before or after making the saving throw.", chat: "Once per meal: add 1d4 to one saving throw." },
    { name: "Moofa Butter", category: "vegetable", boon: "Once per meal, when you fail a Constitution saving throw to maintain concentration, you can reroll the d20, taking the new result.", chat: "Once per meal: reroll a failed concentration save." },
    { name: "Northern Orange", category: "vegetable", boon: "Your passive Perception is increased by 1.", chat: "Passive Perception +1." },
    { name: "Sliced Cactus", category: "vegetable", boon: "As a bonus action, you can make a DC 15 Dexterity (Acrobatics) check. If you succeed, difficult terrain doesn't cost you extra movement until the end of the current turn.", chat: "Bonus action DC 15 Acrobatics: ignore difficult terrain this turn." },
    { name: "Snake Salmon", category: "seafood", boon: "You have advantage on Strength (Athletics) checks to catch fish.", chat: "Advantage on Athletics to catch fish." },
    { name: "Snowy Rice", category: "vegetable", boon: "While holding your weapon in darkness it sheds moonlight, creating bright light in a 15-foot radius and dim light for an additional 15 feet.", chat: "Weapon sheds moonlight in darkness (15 / 15 ft)." },
    { name: "Spicy Sausage", category: "meat", boon: "Once per meal, you can roll a d4 and add the number rolled to one ability check of your choice. You can roll the die before or after making the ability check.", chat: "Once per meal: add 1d4 to one ability check." },
    { name: "Spotted Onion", category: "vegetable", boon: "You have blindsight out to a range of 5 feet.", chat: "Blindsight 5 feet." },
    { name: "Tuna Head", category: "seafood", boon: "Your swim speed is increased by 5 feet.", chat: "Swim speed +5 feet." },
    { name: "Wild Bacon", category: "meat", boon: "Your walking speed is increased by 5 feet.", chat: "Walking speed +5 feet." },
    { name: "Young Potato", category: "vegetable", boon: "If you do not expend any hit die on a short rest, you regain one instead.", chat: "Short rest: regain 1 hit die if you spend none." },
    { name: "Zamtrios Caviar", category: "seafood", boon: "One creature that eats this meal (artisan's choice) adds an extra 1d4 to Intelligence (Investigation) checks to find resources.", chat: "One eater: +1d4 Investigation to find resources." },
  ],
  2: [
    { name: "Buffalo Butter", category: "vegetable", boon: "Once per meal, you may ignore the verbal and/or somatic components of a spell you are casting.", chat: "Once per meal: ignore V and/or S components." },
    { name: "Chili Cheese", category: "vegetable", boon: "When you would take fall damage, you reduce the damage you take by your proficiency bonus.", chat: "Fall damage reduced by proficiency bonus." },
    { name: "Cudgel Onion", category: "vegetable", boon: "Your life signs become imperceptible by nonmagical means.", chat: "Life signs hidden from nonmagical means." },
    { name: "Curved Shrimp", category: "seafood", boon: "You can breathe underwater.", chat: "Breathe underwater." },
    { name: "Frozen Apples", category: "vegetable", boon: "Your passive Perception is increased by 2.", chat: "Passive Perception +2." },
    { name: "Great Mutton", category: "meat", boon: "You gain the same benefits as if you had the Athlete feat, but it does not increase your ability score.", chat: "Athlete feat benefits (no ASI)." },
    { name: "Juicy Rib Roast", category: "meat", boon: "You gain the same benefits as if you had the Actor feat, but it does not increase your ability score.", chat: "Actor feat benefits (no ASI)." },
    { name: "Meatwagon", category: "meat", boon: "You can sense the presence and location of poisons, poisonous creatures, and diseases within 30 feet of you.", chat: "Sense poisons/diseases within 30 feet." },
    { name: "Panish", category: "seafood", boon: "Once per meal, when you fail a carve check, you can reroll the d20 and take the new roll.", chat: "Once per meal: reroll a failed carve check." },
    { name: "Poogiechops", category: "meat", boon: "You have advantage on Intelligence (Nature) checks to gather plants and mushrooms.", chat: "Advantage on Nature to gather plants/mushrooms." },
    { name: "Rare Onion", category: "vegetable", boon: "You can use a bonus action to conjure two earplugs in the shape of your choice. While using these earplugs, you are considered deafened. You can dispel the ear plugs as a bonus action ending the deafened effect.", chat: "Bonus action earplugs (deafened while used)." },
    { name: "Spicy Carrots", category: "vegetable", boon: "When you take the Dodge action on your turn, until the start of your next turn, any damage you take is reduced by an amount equal to your Dexterity modifier.", chat: "Dodge: reduce damage by Dexterity modifier." },
    { name: "Spicy Herbs", category: "vegetable", boon: "Choose a rank 1 meal that has a once per meal effect. You gain that meal's effect and it can now be used twice per meal.", chat: "Pick a Rank 1 once-per-meal effect; use it twice." },
    { name: "Spiky Blowfish", category: "seafood", boon: "Ranged weapons can be fired underwater at no penalty.", chat: "Ranged weapons work underwater." },
    { name: "Succulent Rice", category: "vegetable", boon: "A creature that eats this meal gains the same benefits as if the aid spell was cast on them. This meal can be cooked at a higher rank (+2 to the DC for each rank higher), increasing level of the spell cast by 1 for each rank.", chat: "Aid spell benefits (scalable by cook rank)." },
    { name: "Velklondike Bar", category: "vegetable", boon: "Once per meal when you roll on a creature's loot table, you can choose to reroll it and take the new roll.", chat: "Once per meal: reroll a creature loot table." },
    { name: "Western Parsley", category: "vegetable", boon: "You have advantage on Strength (Athletics) checks to mine ore.", chat: "Advantage on Athletics to mine ore." },
    { name: "Wild Mushrooms", category: "vegetable", boon: "The artisan receives an omen as if by the augury spell. The omen they receive is about all who eat the meal, not just themselves.", chat: "Artisan receives an Augury omen for the table." },
  ],
  3: [
    { name: "Ancient Beans", category: "vegetable", boon: "You gain the same benefits as if you had the Tavern Brawler feat, but it does not increase your ability score.", chat: "Tavern Brawler benefits (no ASI)." },
    { name: "Burning Mango", category: "vegetable", boon: "Your passive Perception is increased by 3.", chat: "Passive Perception +3." },
    { name: "Cannon Lettuce", category: "vegetable", boon: "If your Dexterity score is over 15, you have advantage on Initiative rolls.", chat: "Dexterity > 15: advantage on Initiative." },
    { name: "Dragon Foot", category: "meat", boon: "You can understand any spoken language you hear, but you cannot speak it.", chat: "Understand any spoken language (cannot speak it)." },
    { name: "Emperor's Strudel", category: "vegetable", boon: "You have advantage on Intimidation and Persuasion checks when interacting with lynians for 8 hours.", chat: "Advantage Intimidation/Persuasion vs lynians (8 hours)." },
    { name: "Empress' Strudel", category: "vegetable", boon: "You have advantage on Intimidation and Persuasion checks when interacting with wyverians for 8 hours.", chat: "Advantage Intimidation/Persuasion vs wyverians (8 hours)." },
    { name: "Gator Ribmeat", category: "meat", boon: "You ignore difficult terrain if it was not created by a magical effect.", chat: "Ignore nonmagical difficult terrain." },
    { name: "Horseshoe Crab", category: "seafood", boon: "You ignore difficult terrain if it was not created by a magical effect.", chat: "Ignore nonmagical difficult terrain." },
    { name: "King Squid", category: "seafood", boon: "You have advantage on ability checks made to resist being grappled.", chat: "Advantage to resist being grappled." },
    { name: "Kokoto Rice", category: "vegetable", boon: "You automatically succeed on all Strength (Athletics) checks when mining.", chat: "Auto-succeed Athletics when mining." },
    { name: "Lifejam", category: "vegetable", boon: "Once per meal, when you must make a saving throw, you can choose to do so with advantage.", chat: "Once per meal: one save with advantage." },
    { name: "Megabagel", category: "vegetable", boon: "You have advantage on all carve checks.", chat: "Advantage on all carve checks." },
    { name: "Pink Caviar", category: "seafood", boon: "You can breathe underwater and you have a swim speed of 60 feet.", chat: "Breathe underwater; swim speed 60 feet." },
    { name: "Princess Pork", category: "meat", boon: "A single creature that eats this meal gains the same benefits as if they had the Inspiring Leader feat.", chat: "One eater gains Inspiring Leader benefits." },
    { name: "Queen Shrimp", category: "seafood", boon: "You have darkvision out to 60 feet for 24 hours.", chat: "Darkvision 60 feet for 24 hours." },
    { name: "Royale Cheese", category: "vegetable", boon: "You gain the same benefits as if you had the Dungeon Delver feat.", chat: "Dungeon Delver feat benefits." },
    { name: "Scented Celery", category: "vegetable", boon: "A single creature (artisan's choice) that eats this meal gains the ability to cast the earthbind spell once within the next 8 hours and they do not have to concentrate on the spell. The spell save DC is 15 or their spellcasting save DC, whichever is higher.", chat: "One eater: cast earthbind once (no concentration)." },
    { name: "Tasty Rice", category: "vegetable", boon: "You gain the same benefits as if you had the Keen Mind feat, but you can only recall anything you have seen or heard since your last meal.", chat: "Keen Mind (recall since last meal only)." },
  ],
  4: [
    { name: "1000-Year Crab", category: "seafood", boon: "Once per meal, when you miss with a melee weapon attack, you can choose to hit instead.", chat: "Once per meal: turn a melee miss into a hit." },
    { name: "Bigmeat", category: "meat", boon: "Once per meal, you can use your action to teleport yourself back to the location where you ate this meal, so long as it is within 1 mile of where you are at.", chat: "Once per meal: teleport back to where you ate (1 mile)." },
    { name: "Crimson Seabream", category: "seafood", boon: "Once per meal, as an action, you can cast the misty step spell, without using a spell slot or any components.", chat: "Once per meal: cast misty step (action)." },
    { name: "Demonshroom", category: "vegetable", boon: "You have advantage on Constitution saving throws.", chat: "Advantage on Constitution saving throws." },
    { name: "Dragon Head", category: "meat", boon: "You can speak telepathically with any creature who ate this meal so long as they are within 60 feet of you.", chat: "Telepathy with fellow eaters within 60 feet." },
    { name: "Dragon Tail", category: "meat", boon: "When you would take fall damage, you reduce the damage you take by half your character level.", chat: "Fall damage reduced by half your level." },
    { name: "Emerald Durian", category: "vegetable", boon: "Your passive Perception is increased by 4.", chat: "Passive Perception +4." },
    { name: "Fatty Tomato", category: "vegetable", boon: "Once per meal, when you take damage from any source, you can reduce that damage to 0.", chat: "Once per meal: reduce one damage instance to 0." },
    { name: "Gold Rice", category: "vegetable", boon: "You have advantage on saving throws against the poisoned condition.", chat: "Advantage vs poisoned condition." },
    { name: "Goldenfish Brew", category: "seafood", boon: "Dim light doesn't impose disadvantage on your Wisdom (Perception) checks relying on sight.", chat: "No dim-light Perception disadvantage." },
    { name: "Hairy Tuna", category: "seafood", boon: "Once per meal, you can add a d10 roll to any ability check, attack roll, or saving throw you make.", chat: "Once per meal: add 1d10 to a check/attack/save." },
    { name: "Heaven Bread", category: "vegetable", boon: "Once per meal, you can use a bonus action to regenerate a number of hit points equal to 10 + your character level.", chat: "Once per meal: bonus action heal 10 + level HP." },
    { name: "King Truffle", category: "vegetable", boon: "Roll two daily skills.", chat: "Roll two Daily Skills." },
    { name: "King Turkey", category: "meat", boon: "You gain a flying speed of 30 feet.", chat: "Flying speed 30 feet." },
    { name: "Kirin Cheese", category: "vegetable", boon: "You gain inspiration.", chat: "Gain inspiration." },
    { name: "Soul Beans", category: "vegetable", boon: "You are able to find the most direct physical route to a specific fixed location that you are familiar with on the same plane of existence.", chat: "Find the most direct route to a familiar location." },
  ],
};

const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const stableId = (seed) => {
  const hash = createHash("sha1").update(seed).digest();
  let id = "";
  for (let i = 0; i < 16; i += 1) id += ID_ALPHABET[hash[i] % ID_ALPHABET.length];
  return id;
};

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const escHtml = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const fileNameFor = (name) => `fvtt-Item-${slugify(name)}.json`;

const patchExistingRank1 = () => {
  const dir = path.join(__dirname, "rank-1");
  let patched = 0;
  for (const meal of MEALS_BY_RANK[1]) {
    const file = path.join(dir, fileNameFor(meal.name));
    if (!fs.existsSync(file)) {
      console.warn(`  ! missing rank-1 file: ${path.basename(file)}`);
      continue;
    }
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    const img = IMG[meal.category];
    doc.img = img;
    doc.flags = doc.flags || {};
    doc.flags.world = doc.flags.world || {};
    doc.flags.world.cooking = {
      ...(doc.flags.world.cooking || {}),
      rank: 1,
      mealKey: slugify(meal.name),
      dc: RANK_DC[1],
      category: meal.category,
    };
    for (const ef of doc.effects || []) {
      ef.img = img;
    }
    for (const act of Object.values(doc.system?.activities || {})) {
      if (act && typeof act === "object") act.img = img;
    }
    fs.writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
    patched += 1;
  }
  console.log(`  ok patched ${patched} rank-1 meals`);
};

const makeMealDoc = (rank, meal) => {
  const key = slugify(meal.name);
  const img = IMG[meal.category];
  const dc = RANK_DC[rank];
  const chat = meal.chat || meal.boon;
  return {
    _id: stableId(`cooking-meal::${rank}::${key}`),
    name: meal.name,
    type: "feat",
    img,
    system: {
      description: {
        value: `<p><strong>${escHtml(meal.name)}</strong> <em>(Cooking Rank ${rank})</em></p><p>${escHtml(meal.boon)}</p><p><em>Artisan Cooking Rank ${rank} meal boon (DC ${dc}). Apply after eating a successful meal. Duration is typically until your next meal or 24 hours (DM&apos;s call), unless noted otherwise.</em></p>`,
        chat: `<p><strong>${escHtml(meal.name)}</strong></p><p>${escHtml(chat)}</p>`,
      },
      source: {
        custom: "",
        book: "AGMH",
        page: "",
        license: "",
        rules: "2024",
        revision: 1,
      },
      identifier: key,
      type: { value: "feat", subtype: "" },
      requirements: `Artisan Cooking (Rank ${rank})`,
      properties: [],
      activities: {},
      enchant: {},
      prerequisites: { level: null, repeatable: false },
      uses: { spent: 0, max: "", recovery: [] },
    },
    effects: [
      {
        _id: stableId(`cooking-meal-effect::${rank}::${key}`),
        name: meal.name,
        img,
        type: "base",
        system: {},
        changes: [],
        disabled: false,
        duration: {
          startTime: null,
          seconds: null,
          combat: null,
          rounds: null,
          turns: null,
          startRound: null,
          startTurn: null,
        },
        description: chat,
        origin: null,
        tint: "#ffffff",
        transfer: true,
        statuses: [],
        sort: 0,
        flags: {
          dae: {
            enableCondition: "",
            selfTarget: false,
            selfTargetAlways: false,
            stackable: "noneName",
            showIcon: true,
            durationExpression: "",
            specialDuration: [],
            disableIncapacitated: false,
            dontApply: false,
          },
        },
        _stats: {
          compendiumSource: null,
          duplicateSource: null,
          coreVersion: "12.331",
          systemId: "dnd5e",
          systemVersion: "4.4.4",
          createdTime: null,
          modifiedTime: null,
          lastModifiedBy: null,
        },
      },
    ],
    folder: null,
    flags: {
      exportSource: {
        world: "amellwind-toolbox",
        system: "dnd5e",
        coreVersion: "12.331",
        systemVersion: "4.4.4",
      },
      world: {
        cooking: {
          rank,
          mealKey: key,
          dc,
          category: meal.category,
        },
      },
      dnd5e: {
        riders: { activity: [], effect: [] },
      },
    },
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      coreVersion: "12.331",
      systemId: "dnd5e",
      systemVersion: "4.4.4",
      createdTime: null,
      modifiedTime: null,
      lastModifiedBy: null,
    },
  };
};

const writeHigherRanks = () => {
  for (const rank of [2, 3, 4]) {
    const dir = path.join(__dirname, `rank-${rank}`);
    fs.mkdirSync(dir, { recursive: true });
    let written = 0;
    for (const meal of MEALS_BY_RANK[rank]) {
      const doc = makeMealDoc(rank, meal);
      fs.writeFileSync(path.join(dir, fileNameFor(meal.name)), `${JSON.stringify(doc, null, 2)}\n`);
      written += 1;
    }
    console.log(`  ok wrote ${written} rank-${rank} meals`);
  }
};

console.log("Building cooking meal items…");
patchExistingRank1();
writeHigherRanks();
console.log("Done.");
