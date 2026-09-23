/**
 * Apply Foundry weapon activity/automation fixes vs raintdm-weapons rules.
 * Run: node public/data/foundry-jsons-example/weapons/_apply-activity-fixes.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

function load(slug, rar) {
  const fp = path.join(ROOT, slug, `fvtt-Item-${slug}-${rar}.json`);
  return { fp, item: JSON.parse(readFileSync(fp, "utf8")) };
}

function save(fp, item) {
  writeFileSync(fp, JSON.stringify(item, null, 2) + "\n");
}

function id16() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

function midiBase(identifier, extras = {}) {
  return {
    ignoreTraits: [],
    triggeredActivityId: "none",
    triggeredActivityConditionText: "",
    triggeredActivityTargets: "targets",
    triggeredActivityRollAs: "self",
    autoConsume: false,
    forceConsumeDialog: "default",
    forceRollDialog: "default",
    forceDamageDialog: "default",
    confirmTargets: "default",
    autoTargetType: "any",
    autoTargetAction: "default",
    automationOnly: false,
    otherActivityCompatible: true,
    identifier,
    displayActivityName: true,
    rollMode: "default",
    chooseEffects: false,
    toggleEffect: false,
    ignoreFullCover: false,
    removeChatButtons: "default",
    magicEffect: false,
    magicDamage: false,
    noConcentrationCheck: false,
    autoCEEffects: "default",
    ...extras,
  };
}

function utilityActivity({
  id,
  name,
  sort,
  activationType,
  condition = "",
  chatFlavor,
  identifier,
  img = "icons/skills/movement/figure-running-gray.webp",
  consumptionTargets = [],
  affectSelf = true,
}) {
  return {
    _id: id,
    sort,
    name,
    img,
    activation: {
      type: activationType,
      value: 1,
      condition,
      override: false,
    },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: consumptionTargets,
    },
    description: { chatFlavor },
    duration: {
      value: "",
      units: "inst",
      concentration: false,
      override: false,
    },
    effects: [],
    range: affectSelf
      ? { units: "self", special: "", override: false }
      : { value: null, units: "", special: "", override: false },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "",
        type: affectSelf ? "self" : "",
        choice: false,
        special: "",
      },
      prompt: !affectSelf,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midiBase(identifier),
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
    type: "utility",
    roll: { formula: "", name: "", prompt: false, visible: false },
    macroData: { name: "", command: "" },
    ignoreTraits: { idi: false, idr: false, idv: false, ida: false },
    isOverTimeFlag: false,
    overTimeProperties: {
      saveRemoves: true,
      preRemoveConditionText: "",
      postRemoveConditionText: "",
    },
    otherActivityId: "none",
  };
}

function statusEffect({
  id,
  name,
  status,
  img = "icons/magic/control/silhouette-fall-slip-prone.webp",
  rounds = 1,
  specialDuration = ["turnEndSource"],
}) {
  return {
    _id: id,
    name,
    img,
    description: "",
    changes: [],
    disabled: false,
    duration: {
      startTime: null,
      seconds: null,
      combat: null,
      rounds,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    origin: null,
    transfer: false,
    statuses: [status],
    type: "base",
    system: {},
    tint: "#ffffff",
    sort: 0,
    flags: {
      dae: {
        specialDuration,
        stackable: "noneName",
        showIcon: true,
        dontApply: false,
      },
    },
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      coreVersion: "12.331",
      systemId: "dnd5e",
      systemVersion: "4.4.4",
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: null,
    },
  };
}

function ensureMgc(item) {
  const props = item.system.properties || [];
  if (!props.includes("mgc")) item.system.properties = [...props, "mgc"];
}

function maxSort(item) {
  return Math.max(
    0,
    ...Object.values(item.system.activities || {}).map((a) => a.sort || 0),
  );
}

// ─── Wire Knuckles ───
function fixWireKnucklesClean() {
  for (const rar of ["uncommon", "rare", "very-rare", "legendary"]) {
    const { fp, item } = load("wire-knuckles", rar);
    const acts = item.system.activities;

    // magicalBonus legendary
    if (rar === "legendary") {
      item.system.magicalBonus = 3;
      ensureMgc(item);
    }

    // Silkbind Tether: raintdm costs 2 Wirebugs
    for (const a of Object.values(acts)) {
      if (a.name === "Silkbind Tether") {
        const t = a.consumption?.targets?.[0];
        if (t) t.value = "2";
      }
    }

    // Silkbind Upgrade flavors (VR: 10 ft + DC+1; Legendary: DC+2)
    // Prefer forge overlay + Item Macro for tether zone / Snap Tether; keep
    // chatFlavor sync here for hand-edited goldens.
    if (rar === "very-rare" || rar === "legendary") {
      const dcNote =
        rar === "legendary"
          ? "Silkbind DC +2 (Legendary upgrade). Tether radius 10 ft."
          : "Silkbind DC +1. Tether radius 10 ft.";
      for (const a of Object.values(acts)) {
        if (a.name === "Silkbind Tether") {
          a.description.chatFlavor = `Expend 2 Wirebugs: apply Tethered (cannot move more than 10 ft from the embed point). ${dcNote} Target gains Snap Tether (STR save). Hunter may Snap Tether to release safely.`;
        }
        if (a.name === "Snap Tether" || a.name === "Snap Silkbind") {
          a.name = "Snap Tether";
          a.description.chatFlavor =
            "Safely release your ironsilk tether (no save). Removes Tethered, the tether zone template, and the target's Snap Tether feat.";
        }
      }
    } else if (rar === "rare") {
      for (const a of Object.values(acts)) {
        if (a.name === "Silkbind Tether") {
          a.description.chatFlavor =
            "Expend 2 Wirebugs: apply Tethered (cannot move more than 15 ft from the embed point). Target gains Snap Tether (STR save). Hunter may Snap Tether to release safely.";
        }
        if (a.name === "Snap Silkbind") {
          a.name = "Snap Tether";
          a.description.chatFlavor =
            "Safely release your ironsilk tether (no save). Removes Tethered, the tether zone template, and the target's Snap Tether feat.";
        }
      }
    }

    // Wyvern Ride + Punishing Ride / Fierce Ram on legendary
    if (rar === "very-rare" || rar === "legendary") {
      const ride = Object.values(acts).find((a) => a.name === "Wyvern Ride");
      if (ride) {
        if (rar === "legendary") {
          ride.description.chatFlavor =
            "Punishing Ride: target has Disadvantage on the STR save; on a failure Silkbind does not snap, you stay Grappled (not Prone). Fierce Ram: Ramming Maneuver deals 5d10 (half on save).";
          // ensure 5d10 damage present
          if (!ride.damage?.parts?.length) {
            ride.damage = {
              parts: [
                {
                  number: 5,
                  denomination: 10,
                  types: [],
                  custom: { enabled: false, formula: "" },
                  scaling: { mode: "", number: 1 },
                  bonus: "",
                },
              ],
              onSave: "half",
            };
          } else {
            ride.damage.parts[0].number = 5;
            ride.damage.parts[0].denomination = 10;
            ride.damage.onSave = "half";
          }
        } else {
          ride.description.chatFlavor =
            "While Grappling a Tethered creature at least one size larger, force a STR save vs Silkbind DC. On a failure, choose Forced Movement, Directed Attack, or Ramming Maneuver (see feature text).";
        }
      }
    }

    // Wirebug Recall
    const recallAmt = rar === "uncommon" || rar === "rare" ? 1 : 2;
    const recallName =
      recallAmt === 1 ? "Wirebug Recall" : "Wirebug Recall Upgrade";
    let recall = Object.values(acts).find((a) =>
      /Wirebug Recall/i.test(a.name),
    );
    if (!recall) {
      const id = id16();
      recall = utilityActivity({
        id,
        name: recallName,
        sort: maxSort(item) + 100000,
        activationType: "bonus",
        chatFlavor: `Regain ${recallAmt} expended Wirebug${recallAmt > 1 ? "s" : ""}.`,
        identifier: "wirebug-recall",
        consumptionTargets: [
          {
            type: "itemUses",
            target: "",
            value: String(-recallAmt),
            scaling: { mode: "", formula: "" },
          },
        ],
      });
      acts[id] = recall;
    } else {
      recall.name = recallName;
      recall.description.chatFlavor = `Regain ${recallAmt} expended Wirebug${recallAmt > 1 ? "s" : ""}.`;
      recall.consumption.targets = [
        {
          type: "itemUses",
          target: "",
          value: String(-recallAmt),
          scaling: { mode: "", formula: "" },
        },
      ];
      recall.midiProperties.identifier = "wirebug-recall";
    }

    // Wirebug Reflex — very-rare+
    if (rar === "very-rare" || rar === "legendary") {
      let reflex = Object.values(acts).find((a) =>
        /Wirebug Reflex/i.test(a.name),
      );
      if (!reflex) {
        const id = id16();
        reflex = utilityActivity({
          id,
          name: "Wirebug Reflex",
          sort: maxSort(item) + 100000,
          activationType: "reaction",
          condition: "When a creature misses you with an attack roll",
          chatFlavor: "Regain 1 expended Wirebug.",
          identifier: "wirebug-reflex",
          consumptionTargets: [
            {
              type: "itemUses",
              target: "",
              value: "-1",
              scaling: { mode: "", formula: "" },
            },
          ],
        });
        acts[id] = reflex;
      }
    }

    save(fp, item);
    console.log(`wire-knuckles/${rar}: fixed`);
  }
}

// ─── Lance: restore Guard Dash on VR+ (without clobbering Leaping Thrust) ───
function fixLance() {
  const { item: rare } = load("lance", "rare");
  const gdTemplate = Object.values(rare.system.activities).find(
    (a) => a.name === "Guard Dash",
  );
  if (!gdTemplate) throw new Error("Guard Dash missing on lance rare");

  for (const rar of ["very-rare", "legendary"]) {
    const { fp, item } = load("lance", rar);
    const lt = Object.values(item.system.activities).find((a) =>
      /Leaping Thrust/i.test(a.name),
    );
    if (lt) {
      lt.activation.condition = "When you use Guard Dash";
      lt.description = lt.description || {};
      lt.description.chatFlavor =
        lt.description.chatFlavor ||
        "After Guard Dash movement, make one Lance attack as part of the same Bonus Action.";
    }

    const existingGd = Object.entries(item.system.activities).find(
      ([, a]) => a.name === "Guard Dash",
    );
    if (existingGd) {
      console.log(`lance/${rar}: Guard Dash already present`);
      save(fp, item);
      continue;
    }

    // Never reuse Leaping Thrust's id (historically shared with Guard Dash)
    const gdId = id16();
    const clone = structuredClone(gdTemplate);
    clone._id = gdId;
    clone.sort = lt ? Math.max(100000, (lt.sort || 400000) - 50000) : maxSort(item) + 100000;
    item.system.activities[gdId] = clone;
    save(fp, item);
    console.log(`lance/${rar}: restored Guard Dash (${gdId})`);
  }
}

// ─── Gunlance ───
function fixGunlance() {
  for (const rar of ["rare", "very-rare", "legendary"]) {
    const { fp, item } = load("gunlance", rar);
    const shellDie = rar === "legendary" ? 10 : 8;

    // Keep base Guard Reload (miss → reload shells)
    const gr = Object.values(item.system.activities).find(
      (a) => a.name === "Guard Reload",
    );
    if (gr) {
      gr.activation.condition =
        "When a creature misses you with a melee attack while you are wielding the shield";
      gr.description.chatFlavor = "Reload up to 2 expended shells.";
    }

    // Guard Reload Upgrade — separate reaction on hit (rare+)
    let gru = Object.values(item.system.activities).find((a) =>
      /Guard Reload Upgrade/i.test(a.name),
    );
    if (!gru) {
      const id = id16();
      gru = utilityActivity({
        id,
        name: "Guard Reload Upgrade",
        sort: maxSort(item) + 100000,
        activationType: "reaction",
        condition:
          "When a creature hits you with a melee attack while you are wielding the shield",
        chatFlavor: `Roll [[/r 1d${shellDie}]] (Shelling die) and add it to your AC against that attack, potentially causing it to miss.`,
        identifier: "guard-reload-upgrade",
        img: "icons/equipment/shield/heater-wooden-brown-scarred.webp",
        consumptionTargets: [],
      });
      gru.roll = {
        formula: `1d${shellDie}`,
        name: `Shelling die (1d${shellDie}) → AC`,
        prompt: false,
        visible: true,
      };
      item.system.activities[id] = gru;
    } else {
      gru.activation.condition =
        "When a creature hits you with a melee attack while you are wielding the shield";
      gru.roll = {
        formula: `1d${shellDie}`,
        name: `Shelling die (1d${shellDie}) → AC`,
        prompt: false,
        visible: true,
      };
      gru.description.chatFlavor = `Roll [[/r 1d${shellDie}]] (Shelling die) and add it to your AC against that attack, potentially causing it to miss.`;
    }

    // Shelling Strike Upgrade II on legendary: Nd10
    if (rar === "legendary") {
      for (const a of Object.values(item.system.activities)) {
        if (/Shelling Strike/i.test(a.name) && a.damage?.parts?.[0]) {
          const shells = Number(
            a.consumption?.targets?.[0]?.value ||
              a.name.match(/×(\d)/)?.[1] ||
              1,
          );
          a.damage.parts[0].denomination = 10;
          a.damage.parts[0].number = shells;
          a.description.chatFlavor = `Expend ${shells} shell${shells > 1 ? "s" : ""}: +${shells}d10 thunder (Shelling Strike Upgrade II).`;
        }
      }
    }

    save(fp, item);
    console.log(`gunlance/${rar}: fixed`);
  }
}

// ─── Tonfas Apex ───
function fixTonfas() {
  const { fp, item } = load("tonfas", "legendary");
  const EFF_ID = "tnfApexIncapEff1";
  let eff = (item.effects || []).find((e) => /Apex Spirit/i.test(e.name));
  if (!eff) {
    eff = statusEffect({
      id: EFF_ID,
      name: "Apex Spirit (Incapacitated)",
      status: "incapacitated",
      img: "icons/magic/control/encase-creature-monster-hold.webp",
      rounds: 1,
      specialDuration: ["turnEnd"],
    });
    item.effects = [...(item.effects || []), eff];
  }
  const burst5 = Object.values(item.system.activities).find(
    (a) => a.name === "Spirit Burst ×5",
  );
  if (burst5) {
    burst5.effects = [{ _id: eff._id }];
    burst5.description.chatFlavor =
      "Apex Spirit: expend 5 Spirit Charges for +5d10 Force damage; target is Incapacitated until the end of its next turn.";
  }
  save(fp, item);
  console.log("tonfas/legendary: Apex Incapacitated linked");
}

// ─── Great Sword Dull the Blade ───
function fixGreatSword() {
  const EFF_ID = "gsDullBladeEff01";
  for (const rar of ["rare", "very-rare", "legendary"]) {
    const { fp, item } = load("great-sword", rar);
    let dull = (item.effects || []).find((e) => /Dull the Blade/i.test(e.name));
    if (!dull) {
      dull = {
        _id: EFF_ID,
        name: "Dull the Blade",
        img: "icons/skills/melee/blade-tip-chipped-orange-blue.webp",
        description:
          "<p>The weapon has lost its Graze Mastery property. Ends after a Short or Long Rest, or after spending 1 minute sharpening with a whetstone.</p>",
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
        origin: null,
        transfer: false,
        statuses: [],
        type: "base",
        system: {},
        tint: "#ffffff",
        sort: 0,
        flags: {
          dae: {
            stackable: "noneName",
            showIcon: true,
            dontApply: false,
          },
          world: {
            greatSword: { dullBlade: true },
          },
        },
        _stats: {
          compendiumSource: null,
          duplicateSource: null,
          coreVersion: "12.331",
          systemId: "dnd5e",
          systemVersion: "4.4.4",
          createdTime: Date.now(),
          modifiedTime: Date.now(),
          lastModifiedBy: null,
        },
      };
      item.effects = [...(item.effects || []), dull];
    }

    // Disable Graze while Dull is the reminder — also mark Graze with note in description
    const graze = (item.effects || []).find((e) => /Graze/i.test(e.name));
    if (graze) {
      graze.description =
        graze.description ||
        "<p>Lost while Dull the Blade is active (after Emergency Guard).</p>";
    }

    const eg = Object.values(item.system.activities).find(
      (a) => a.name === "Emergency Guard",
    );
    if (eg) {
      eg.effects = [{ _id: dull._id }];
      eg.description.chatFlavor =
        "+3 AC vs triggering attack; if it still hits, reduce damage by 1d10 + STR. Dull the Blade: lose Graze until a Short/Long Rest or 1 minute with a whetstone.";
    }
    save(fp, item);
    console.log(`great-sword/${rar}: Dull the Blade linked`);
  }
}

// ─── Bow Charging Sidestep AE ───
function fixBow() {
  const { item: rare } = load("bow", "rare");
  const template = (rare.effects || []).find((e) =>
    /Charging Sidestep/i.test(e.name),
  );
  if (!template) throw new Error("Charging Sidestep AE missing on bow rare");

  for (const rar of ["very-rare", "legendary"]) {
    const { fp, item } = load("bow", rar);
    if ((item.effects || []).some((e) => /Charging Sidestep/i.test(e.name))) {
      console.log(`bow/${rar}: Charging Sidestep AE already present`);
      continue;
    }
    item.effects = [...(item.effects || []), structuredClone(template)];
    save(fp, item);
    console.log(`bow/${rar}: restored Charging Sidestep AE`);
  }
}

// ─── Charge Blade SAED flavor (quick) ───
function fixChargeBladeSaedFlavor() {
  const { fp, item } = load("charge-blade", "legendary");
  const aed = Object.values(item.system.activities).find((a) =>
    /AED|Amped Element/i.test(a.name),
  );
  if (aed) {
    aed.name = "Super Amped Element Discharge (SAED)";
    aed.description.chatFlavor =
      "SAED: replace one Attack-action attack; choose Phial spend (dialog). 1d10 attuned element per charge in a 30-ft cone; DEX save (STR DC), half on success. If the cone completely covers a Huge or larger creature, it has Disadvantage on the save. Or cancel for Charged Shield (Red Shield). PB uses / Long Rest.";
    if (aed.midiProperties) aed.midiProperties.identifier = "saed";
  }
  save(fp, item);
  console.log("charge-blade/legendary: SAED rename + Huge disadv flavor");
}

console.log("Applying weapon activity fixes…");
fixWireKnucklesClean();
fixLance();
fixGunlance();
fixTonfas();
fixGreatSword();
fixBow();
fixChargeBladeSaedFlavor();
console.log("Done.");
