/**
 * User-requested runes batch 6
 * Run via: node public/data/foundry-jsons-example/runes/_build/build.mjs user-batch6
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRuneBatch,
  loadBatchData,
  DAE,
  DURATION,
  STATS,
  bothSides,
  equipEffect,
  midi,
  saveActivity,
  sideEffect,
  utilityActivity,
} from "../../../../scripts/runes/build-rune-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runesRoot = path.resolve(__dirname, "../..");
const { metaList, idsByName } = loadBatchData(path.resolve(__dirname, "../data/user-batch6"));
const { pushRune, writeAll, idsOf } = createRuneBatch({ runesRoot, metaList, idsByName });

/** HG Earplugs: thunder-save advantage while earplugs AE is active; dispel via activity. */
function hgEarplugsTail() {
  return `
{
  const act = workflow?.activity ?? arg0?.activity ?? rolledActivity;
  const actId = String(act?.midiProperties?.identifier ?? act?.identifier ?? "").toLowerCase();
  const actName = String(act?.name ?? "").toLowerCase();
  const isDispel = actId === "dispel-hg-earplugs" || actName.includes("dispel hg earplugs") || actName.includes("dispel earplugs");
  if (isDispel && actorDoc) {
    const plugs = [...(actorDoc.effects ?? [])].filter((e) => e.flags?.["amellwind-toolbox"]?.hgEarplugs);
    for (const e of plugs) {
      try { await e.delete(); } catch (_) {}
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: \`<div class="dnd5e2"><p><strong>\${runeName}</strong> — HG Earplugs dispelled.</p></div>\`,
    });
    return;
  }
}
if (pass.includes("issave")) {
  const applied = getRuneFlag(item, "applied");
  if (!applied || applied.side !== "armor") return;
  if (!actorDoc) return;
  const plugs = [...(actorDoc.effects ?? [])].some((e) => e.flags?.["amellwind-toolbox"]?.hgEarplugs);
  if (!plugs) return;
  const wf = workflow ?? arg0?.workflow;
  const dump = JSON.stringify({
    dmg: wf?.damageDetail,
    item: wf?.item?.system?.damage,
    desc: wf?.item?.system?.description?.value,
    flavor: wf?.flavor,
  }).toLowerCase();
  if (!dump.includes("thunder")) return;
  foundry.utils.setProperty(arg0, "advantage", true);
  if (wf) wf.advantage = true;
  return;
}`;
}

let sortBase = 9970000;

// ─── 1. Giant Beak+ ───
pushRune({
  name: "Giant Beak+",
  sort: sortBase,
  sides: bothSides("Critical Eye", "Constitution"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Giant Beak+").act1,
      "Reroll failed Con save",
      "reaction",
      "Constitution: reroll a failed Constitution saving throw; must use the new roll. 1/LR.",
      {
        condition: "When you fail a Constitution saving throw — Armor side active",
        consumeItemUse: true,
      },
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Giant Beak+ - Critical Eye",
      "weapon",
      "Critical Eye",
      [{ key: "flags.dnd5e.weaponCriticalThreshold", mode: 5, value: "19", priority: 20 }],
      "Critical hit range increased by 1.",
    ),
    sideEffect(
      ids.armor,
      "Giant Beak+ - Constitution",
      "armor",
      "Constitution",
      [],
      "Reroll failed Con save. 1/LR (item activity).",
    ),
  ],
});

// ─── 2. Golden Corneum ───
pushRune({
  name: "Golden Corneum",
  sort: (sortBase += 10000),
  sides: bothSides("Ambusher", "HG Earplugs"),
  macroTail: hgEarplugsTail(),
  systemExtra: {
    activities: {
      ...utilityActivity(
        idsOf("Golden Corneum").act1,
        "Conjure HG Earplugs",
        "bonus",
        "Conjure earplugs: selective hearing (manual) + advantage on saves vs thunder damage.",
        {
          condition: "Armor side active",
          effectIds: [idsOf("Golden Corneum").ae1],
        },
      ),
      ...utilityActivity(
        idsOf("Golden Corneum").act2,
        "Dispel HG Earplugs",
        "bonus",
        "Dispel HG Earplugs (end selective hearing / thunder-save advantage).",
        { condition: "Armor side active" },
      ),
      ...utilityActivity(
        idsOf("Golden Corneum").act3,
        "Ambusher Reminder (+2d6 Sneak)",
        "special",
        "(Rogue Only) When you deal Sneak Attack damage, add an extra 2d6 (apply manually).",
        { condition: "Weapon side — Rogue only, on Sneak Attack" },
      ),
    },
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Golden Corneum - Ambusher",
      "weapon",
      "Ambusher",
      [],
      "(Rogue Only) Sneak Attack deals an extra 2d6 (manual / activity reminder).",
    ),
    sideEffect(
      ids.armor,
      "Golden Corneum - HG Earplugs",
      "armor",
      "HG Earplugs",
      midi(macroName, "isSave"),
      "Bonus action: conjure/dispel HG Earplugs (use activities).",
    ),
    {
      _id: ids.ae1,
      name: "HG Earplugs (Golden Corneum)",
      img: "icons/svg/deaf.svg",
      type: "base",
      system: {},
      changes: [],
      disabled: false,
      duration: { ...DURATION },
      description:
        "Selective hearing (choose who you can hear — manual). Advantage on saving throws against thunder damage.",
      origin: null,
      tint: "#ffffff",
      transfer: false,
      statuses: [],
      sort: 0,
      flags: {
        dae: { ...DAE, showIcon: true },
        "amellwind-toolbox": { hgEarplugs: true },
      },
      _stats: { ...STATS },
    },
  ],
});

// ─── 3. Drilltusk Carapace ───
pushRune({
  name: "Drilltusk Carapace",
  sort: (sortBase += 10000),
  sides: bothSides("Mini-Bombardier", "Prone Immunity"),
  systemExtra: {
    uses: {
      spent: 0,
      max: "5",
      recovery: [{ period: "dawn", type: "formula", formula: "1d4 + 1" }],
    },
    activities: {
      ...saveActivity(idsOf("Drilltusk Carapace").act1, "Burning Hands (1 rune)", {
        activationType: "action",
        condition: "Weapon side — Sorcerer/Wizard only; expend 1 rune",
        chatFlavor:
          "Burning hands (use your spell save DC). If this spends the last rune, runes cannot recharge for one week (manual).",
        consumeItemUse: true,
        rangeValue: "15",
        rangeUnits: "ft",
        template: { count: "", contiguous: false, type: "cone", size: "15", width: "", height: "", units: "ft" },
        affects: { count: "", type: "creature", choice: false, special: "" },
        damageParts: [
          {
            number: 3,
            denomination: 6,
            bonus: "",
            types: ["fire"],
            custom: { enabled: false, formula: "" },
            scaling: { mode: "", number: null, formula: "" },
          },
        ],
        ability: ["dex"],
        dcFormula: "@attributes.spell.dc",
      }),
      ...utilityActivity(
        idsOf("Drilltusk Carapace").act2,
        "Other Mini-Bombardier Spells",
        "action",
        "(Sorcerer/Wizard) Scorching ray (2R), aganazzar's scorcher (2R), or flaming sphere (2R) — cast with your spell save DC; spend the listed item uses manually. Last-rune week lockout if depleted.",
        {
          condition: "Weapon side — Sorcerer/Wizard only",
        },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Drilltusk Carapace - Mini-Bombardier",
      "weapon",
      "Mini-Bombardier",
      [],
      "(Sorcerer/Wizard) 5 runes; burning hands activity + other spells via reminder. Regain 1d4+1 at dawn.",
    ),
    sideEffect(
      ids.armor,
      "Drilltusk Carapace - Prone Immunity",
      "armor",
      "Prone Immunity",
      [{ key: "system.traits.ci.value", mode: 2, value: "prone", priority: 20 }],
      "Cannot be knocked prone.",
    ),
  ],
});

// ─── 4. Blue Kut-Ku Carapace ───
pushRune({
  name: "Blue Kut-Ku Carapace",
  sort: (sortBase += 10000),
  sides: bothSides("Scorching Ray", "Strong Winds Immunity"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Blue Kut-Ku Carapace").act1,
      "Cast Scorching Ray",
      "action",
      "(Spellcaster Only) Cast scorching ray from this weapon. 1/LR.",
      {
        condition: "Weapon side — Spellcaster only",
        consumeItemUse: true,
      },
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Blue Kut-Ku Carapace - Scorching Ray",
      "weapon",
      "Scorching Ray",
      [],
      "(Spellcaster Only) Action: cast scorching ray. 1/LR (item activity).",
    ),
    sideEffect(
      ids.armor,
      "Blue Kut-Ku Carapace - Strong Winds",
      "armor",
      "Strong Winds Immunity",
      [],
      "You and your equipment suffer no ill effects from Strong Winds (manual / GM).",
    ),
  ],
});

// ─── 5. Nerscylla Carapace ───
pushRune({
  name: "Nerscylla Carapace",
  sort: (sortBase += 10000),
  sides: bothSides("Ambusher", "Honey Hunter++"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "day", type: "recoverAll" }] },
    activities: {
      ...utilityActivity(
        idsOf("Nerscylla Carapace").act1,
        "Honey Hunter++",
        "special",
        "Once per day, when you use an herbalism kit to gather plants, gather 1d4+1 honey.",
        {
          condition: "Armor side — when using an herbalism kit to gather plants",
          consumeItemUse: true,
          rollFormula: "1d4 + 1",
          rollName: "Honey gathered",
        },
      ),
      ...utilityActivity(
        idsOf("Nerscylla Carapace").act2,
        "Ambusher Reminder (+2d6 Sneak)",
        "special",
        "(Rogue Only) When you deal Sneak Attack damage, add an extra 2d6 (apply manually).",
        { condition: "Weapon side — Rogue only, on Sneak Attack" },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Nerscylla Carapace - Ambusher",
      "weapon",
      "Ambusher",
      [],
      "(Rogue Only) Sneak Attack deals an extra 2d6 (manual / activity reminder).",
    ),
    sideEffect(
      ids.armor,
      "Nerscylla Carapace - Honey Hunter++",
      "armor",
      "Honey Hunter++",
      [],
      "1/day: gather 1d4+1 honey with herbalism kit (item activity).",
    ),
  ],
});

writeAll({ summarizeSides: true });
