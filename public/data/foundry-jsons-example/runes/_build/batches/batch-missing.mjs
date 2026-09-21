/**
 * Batch of previously missing runes
 * Run via: node public/data/foundry-jsons-example/runes/_build/build.mjs batch-missing
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRuneBatch,
  loadBatchData,
  bothSides,
  checkActivity,
  equipEffect,
  midi,
  midiMulti,
  sideEffect,
  utilityActivity,
} from "../../../../scripts/runes/build-rune-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runesRoot = path.resolve(__dirname, "../..");
const { metaList, idsByName } = loadBatchData(path.resolve(__dirname, "../data/batch-missing"));
const { pushRune, writeAll, idsOf } = createRuneBatch({ runesRoot, metaList, idsByName });

function allmotherLightningTail() {
  return `
if (pass.includes("predamageroll") || pass.includes("damagebonus") || pass.includes("preamblecomplete")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return;
  const src = wf.item;
  if (!src || src.type !== "spell") return;
  const dump = JSON.stringify(src.system?.damage ?? src.system?.activities ?? {}).toLowerCase();
  const desc = String(src.system?.description?.value ?? "").toLowerCase();
  const hasLightning = dump.includes("lightning") || desc.includes("lightning")
    || (wf.damageDetail ?? []).some((d) => String(d.type ?? "").toLowerCase() === "lightning");
  if (!hasLightning) return;
  try {
    wf.ignoreResistances = true;
    foundry.utils.setProperty(arg0, "ignoreResistances", true);
  } catch (_) {}
  return;
}
if (pass.includes("postdamageroll")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return;
  const src = wf.item;
  if (!src || src.type !== "spell") return;
  const dump = JSON.stringify(src.system?.damage ?? src.system?.activities ?? {}).toLowerCase();
  const desc = String(src.system?.description?.value ?? "").toLowerCase();
  const hasLightning = dump.includes("lightning") || desc.includes("lightning")
    || (wf.damageDetail ?? []).some((d) => String(d.type ?? "").toLowerCase() === "lightning");
  if (!hasLightning) return;
  const targets = [...(wf.targets ?? [])];
  for (const t of targets) {
    const a = t.actor;
    if (!a) continue;
    const di = a.system?.traits?.di?.value;
    const immune = di instanceof Set ? di.has("lightning") : Array.isArray(di) && di.includes("lightning");
    if (!immune) continue;
    try {
      wf.ignoreImmunities = true;
      foundry.utils.setProperty(arg0, "ignoreImmunities", true);
      if (Array.isArray(wf.damageDetail)) {
        for (const d of wf.damageDetail) {
          if (String(d.type ?? "").toLowerCase() === "lightning" || !d.type) {
            d.value = Math.floor(Number(d.value ?? 0) / 2);
          }
        }
      }
      if (wf.damageRoll?.total != null) {
        ChatMessage.create({
          content: \`<em>\${runeName}: lightning immunity → half damage applied (verify Midi totals).</em>\`,
          speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
        });
      }
    } catch (_) {}
  }
  return;
}`;
}

/** Blood Awakening: heal-from-damage arms +10 on next attack. */
function bloodAwakeningTail() {
  return `
if (pass.includes("ishealed")) {
  const amount = Number(arg0?.damageTotal ?? arg0?.totalDamage ?? arg0?.hpTotal ?? 0);
  if (!(amount > 0)) return;
  // Arm when healing occurs while weapon side is active (life-steal / damage-heal sources).
  await setRuneFlag(item, "bloodAwakeningArmed", true);
  return;
}
if (pass.includes("damagebonus")) {
  const armed = getRuneFlag(item, "bloodAwakeningArmed");
  if (!armed) return null;
  await setRuneFlag(item, "bloodAwakeningArmed", false);
  return { damageRoll: "10", flavor: \`\${runeName} — Blood Awakening\` };
}`;
}

/** Benediction: store healed amount; reduce next damage taken by that amount. */
function benedictionTail() {
  return `
if (pass.includes("ishealed") || pass.includes("posthealroll")) {
  // When the wearer heals someone (midi may fire on healer or target — arm if this actor is the healer).
  const healer = arg0?.actor ?? workflow?.actor ?? actorDoc;
  if (healer?.uuid !== actorDoc?.uuid) return;
  const amount = Number(arg0?.damageTotal ?? arg0?.totalDamage ?? arg0?.hpTotal ?? arg0?.appliedDamage ?? 0);
  if (!(amount > 0)) return;
  await setRuneFlag(item, "benedictionBuffer", amount);
  return;
}
if (pass.includes("predamagetotalapplied") || pass.includes("isdamaged")) {
  const buf = Number(getRuneFlag(item, "benedictionBuffer") ?? 0);
  if (!(buf > 0)) return;
  const incoming = Number(arg0?.totalDamage ?? arg0?.damageTotal ?? arg0?.hpDamage ?? 0);
  if (!(incoming > 0)) return;
  const reduce = Math.min(buf, incoming);
  await setRuneFlag(item, "benedictionBuffer", 0);
  try {
    if (arg0 && typeof arg0 === "object") {
      if (arg0.totalDamage != null) arg0.totalDamage = Math.max(0, Number(arg0.totalDamage) - reduce);
      if (arg0.damageTotal != null) arg0.damageTotal = Math.max(0, Number(arg0.damageTotal) - reduce);
      if (arg0.hpDamage != null) arg0.hpDamage = Math.max(0, Number(arg0.hpDamage) - reduce);
    }
    ChatMessage.create({
      content: \`<em>\${runeName} — Benediction: reduced damage by \${reduce}.</em>\`,
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    });
  } catch (_) {}
  return;
}`;
}
let sortBase = 9700000;

// ─── 1. Allmother Sparksac ───
pushRune({
  name: "Allmother Sparksac",
  sort: sortBase,
  sides: bothSides("Lightning Bypass + Half vs Immunity", "Fly 80"),
  macroTail: allmotherLightningTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Allmother Sparksac - Lightning Bypass",
      "weapon",
      "Lightning Bypass",
      midiMulti(macroName, ["preDamageRoll", "postDamageRoll"]),
      "Lightning spells bypass resistance; half damage vs lightning immunity (midi).",
    ),
    sideEffect(
      ids.armor,
      "Allmother Sparksac - Fly 80",
      "armor",
      "Fly 80",
      [{ key: "system.attributes.movement.fly", mode: 5, value: "80", priority: 20 }],
      "Flying speed 80 feet.",
    ),
  ],
});

// ─── 2. Malzeno Beautifang ───
pushRune({
  name: "Malzeno Beautifang",
  sort: (sortBase += 10000),
  sides: bothSides("Blood Awakening", "White Knight"),
  macroTail: bloodAwakeningTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Malzeno Beautifang - Blood Awakening",
      "weapon",
      "Blood Awakening",
      midiMulti(macroName, ["isHealed", "damageBonus"]),
      "After healing from dealing damage: next attack +10 damage.",
    ),
    sideEffect(
      ids.armor,
      "Malzeno Beautifang - White Knight",
      "armor",
      "White Knight",
      [{ key: "system.abilities.cha.value", mode: 4, value: "19", priority: 20 }],
      "Charisma becomes 19 (upgrade) if lower. Advantage on Cha checks vs nobles (manual).",
    ),
  ],
});

// ─── 3. Qurupeco Feather ───
pushRune({
  name: "Qurupeco Feather",
  sort: (sortBase += 10000),
  sides: bothSides("Summon Jaggi", "Performance Inspiration"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "week", type: "recoverAll" }] },
    activities: {
      ...checkActivity(
        idsOf("Qurupeco Feather").act1,
        "Performance Inspiration (DC 15)",
        "cha",
        15,
        "Armor side — after a long rest: DC 15 Cha (Performance) with a proficient instrument. On success, gain Inspiration if you lack it.",
        "per",
      ),
      ...utilityActivity(
        idsOf("Qurupeco Feather").act2,
        "Summon Jaggi",
        "action",
        "Weapon side — summon a jaggi ally for 1 hour (acts on your turn; flees if harmed). 1/week.",
        "Weapon side — while holding this weapon",
        true,
        {
          duration: { value: "1", units: "hour", concentration: false, override: false },
          range: { value: "30", units: "ft", special: "", override: false },
        },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Qurupeco Feather - Summon Jaggi",
      "weapon",
      "Summon Jaggi",
      [],
      "Action: summon jaggi for 1 hour. 1/week (use activity).",
    ),
    sideEffect(
      ids.armor,
      "Qurupeco Feather - Performance Inspiration",
      "armor",
      "Performance Inspiration",
      [],
      "After long rest: DC 15 Performance for Inspiration (use check activity).",
    ),
  ],
});

// ─── 4. Azure Lao-Shan Hardhorn ───
pushRune({
  name: "Azure Lao-Shan Hardhorn",
  sort: (sortBase += 10000),
  sides: bothSides("Benediction", "Psychic Vision"),
  macroTail: benedictionTail(),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Azure Lao-Shan Hardhorn").act1,
      "Benediction Reminder",
      "special",
      "When you heal a creature: next damage you take is reduced by the HP healed (midi buffer + verify).",
      "Weapon side",
    ),
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Azure Lao-Shan Hardhorn - Benediction",
      "weapon",
      "Benediction",
      midiMulti(macroName, ["isHealed", "isDamaged"]),
      "Heal → buffer; next damage reduced by healed amount (midi).",
    ),
    sideEffect(
      ids.armor,
      "Azure Lao-Shan Hardhorn - Psychic Vision",
      "armor",
      "Psychic Vision",
      [
        { key: "system.attributes.senses.tremorsense", mode: 4, value: "60", priority: 20 },
        { key: "system.traits.dv.value", mode: 2, value: "psychic", priority: 20 },
      ],
      "Know creature locations within 60 ft (tremorsense approx) + vulnerability to psychic.",
    ),
  ],
});

// ─── 5. Nightcloak Plume ───
pushRune({
  name: "Nightcloak Plume",
  sort: (sortBase += 10000),
  sides: bothSides("Horn Maestro+", "Insight Advantage"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Nightcloak Plume").act1,
      "Horn Maestro+ Reminder",
      "special",
      "(Hunting Horn only) Melody duration +1 minute (manual / Hunting Horn sheet).",
      "Weapon side",
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Nightcloak Plume - Horn Maestro+",
      "weapon",
      "Horn Maestro+",
      [],
      "(Hunting Horn only) Melody lasts 1 minute longer (manual).",
    ),
    sideEffect(
      ids.armor,
      "Nightcloak Plume - Insight Advantage",
      "armor",
      "Insight Advantage",
      [{ key: "flags.midi-qol.advantage.skill.ins", mode: 0, value: "1", priority: 20 }],
      "Advantage on Insight checks.",
    ),
  ],
});

// ─── 6. Uth Duna Tentacle ───
pushRune({
  name: "Uth Duna Tentacle",
  sort: (sortBase += 10000),
  sides: bothSides("Inspiring Melody", "Health Boost"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Uth Duna Tentacle").act1,
      "Inspiring Melody Reminder",
      "special",
      "(Hunting Horn Only) Melody → allies within 20 ft deal +1d6 damage until end of your next turn (manual).",
      "Weapon side",
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Uth Duna Tentacle - Inspiring Melody",
      "weapon",
      "Inspiring Melody",
      [],
      "(Hunting Horn Only) Ally damage buff on melody (manual).",
    ),
    sideEffect(
      ids.armor,
      "Uth Duna Tentacle - Health Boost",
      "armor",
      "Health Boost",
      [{ key: "system.attributes.hp.bonuses.overall", mode: 2, value: "@details.level", priority: 20 }],
      "Hit point maximum increases by 1 per character level.",
    ),
  ],
});

writeAll();
