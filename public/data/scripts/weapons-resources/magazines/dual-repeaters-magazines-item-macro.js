// Dual Repeaters — Item Macros (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
//
// EMBEDS:
// 1) Magazine consumable (Normal / Blaze / Cryo / Storm / Slime / …)
//    On Use: [preTargeting]ItemMacro,[postActiveEffects]ItemMacro
//    Activity identifier: load-magazine
// 2) Dual Repeaters weapon (Uncommon+)
//    On Use: [preTargeting]ItemMacro,[postAttackRoll]ItemMacro,[postDamageRoll]ItemMacro
//    Magazines / Empowered Reload: dialog → expend one magazine → fill weapon Charges (6)
//    Attack: spends 1 weapon Charge via itemUses; AE tracks loaded magazine type
//    Specialty magazines overwrite system.damage.base.types (piercing → fire/cold/…)
//
// Flags:
// - flags.world.dualRepeaters.isMagazine / magazineKey / chargesPerMagazine / damageType
// - AE flags.world.dualRepeaters.isMagazineActive + magazineKey / damageType
// - AE flags.world.dualRepeaters.isEmpowered
// - flags.world.dualRepeaters.unlockedMagazines / loadedMagazineKey / loadedDamageType / baseDamageTypes
// - weapon system.uses = Charges (Volleys remaining)
// - weapon system.damage.base.types overwritten while a specialty magazine is loaded

const esc = (value) => {
  const s = String(value ?? "");
  if (globalThis.Handlebars?.Utils?.escapeExpression) return Handlebars.Utils.escapeExpression(s);
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const macroPass = String(
  args?.[0]?.macroPass
  ?? workflow?.macroPass
  ?? "",
).toLowerCase();

const rolled = (typeof rolledActivity !== "undefined" && rolledActivity)
  ? rolledActivity
  : (workflow?.activity ?? args?.[0]?.activity ?? null);

const actName = (rolled?.name ?? workflow?.activity?.name ?? "").toLowerCase();
const actId = String(
  rolled?.identifier
  ?? rolled?.midiProperties?.identifier
  ?? workflow?.activity?.identifier
  ?? workflow?.activity?.midiProperties?.identifier
  ?? "",
).toLowerCase();
const actType = String(rolled?.type ?? workflow?.activity?.type ?? "").toLowerCase();

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Dual Repeaters: actor not found.");
  return;
}

const abort = (msg) => {
  if (msg) ui.notifications.warn(msg);
  if (workflow) workflow.aborted = true;
  return false;
};

const MAGAZINE_LABELS = {
  normal: "Normal Magazine",
  blaze: "Blaze Magazine",
  cryo: "Cryo Magazine",
  storm: "Storm Magazine",
  slime: "Slime Magazine",
  "blaze-i": "Blaze Magazine Upgrade I",
  "cryo-i": "Cryo Magazine Upgrade I",
  "storm-i": "Storm Magazine Upgrade I",
  "slime-i": "Slime Magazine Upgrade I",
  dawnstar: "Dawnstar Magazine",
  twilight: "Twilight Magazine",
};

const magazineLoadedName = (key) => {
  const base = MAGAZINE_LABELS[key] ?? "Magazine";
  return base + " (Loaded)";
};

const isMagazineDoc = (doc) =>
  foundry.utils.getProperty(doc, "flags.world.dualRepeaters.isMagazine") === true
  || /magazine/i.test(String(doc?.system?.identifier ?? ""))
  || /magazine/i.test(doc?.name ?? "");

const isDualRepeatersDoc = (doc) =>
  foundry.utils.getProperty(doc, "flags.world.dualRepeaters.isDualRepeaters") === true
  || String(doc?.system?.identifier ?? "") === "dualrepeaters"
  || /^dual\s+repeaters\b/i.test(doc?.name ?? "");

const isMagazineItem = isMagazineDoc(item);
const isDualRepeatersWeapon = isDualRepeatersDoc(item);

const isMagazineActiveAe = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.dualRepeaters.isMagazineActive") === true
  || /magazine \(loaded\)/i.test(ef.name ?? "");

const isEmpoweredAe = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.dualRepeaters.isEmpowered") === true
  || /^empowered$/i.test(ef.name ?? "");

const isLoadActivity =
  actId === "load-magazine"
  || actName.includes("load magazine")
  || actName === "load";

const isMagazinesReload =
  actId === "magazines"
  || actName === "magazines";

const isEmpoweredReload =
  actId === "empowered-reload"
  || actName.includes("empowered reload");

const isAttackActivity =
  actType === "attack"
  || actId === "attack"
  || actName === "attack";

const chargesPer = (doc) => Math.max(
  1,
  Number(foundry.utils.getProperty(doc, "flags.world.dualRepeaters.chargesPerMagazine") ?? 6),
);

const magazineKeyOf = (doc) => String(
  foundry.utils.getProperty(doc, "flags.world.dualRepeaters.magazineKey")
  ?? String(doc?.system?.identifier ?? "").replace(/-magazine$/, "")
  ?? "normal",
).toLowerCase();

const damageTypeOf = (doc) => {
  const flagged = foundry.utils.getProperty(doc, "flags.world.dualRepeaters.damageType");
  if (flagged) return String(flagged).toLowerCase();
  const key = magazineKeyOf(doc);
  if (key === "blaze" || key === "blaze-i") return "fire";
  if (key === "cryo" || key === "cryo-i") return "cold";
  if (key === "storm" || key === "storm-i") return "lightning";
  if (key === "slime" || key === "slime-i") return "acid";
  return "piercing";
};

const riderKindOf = (doc) => String(
  foundry.utils.getProperty(doc, "flags.world.dualRepeaters.riderKind") ?? "",
).toLowerCase();

const findDualRepeatersWeapon = () => {
  if (isDualRepeatersWeapon) return actorDoc.items.get(item.id) ?? item;
  return actorDoc.items.find((i) => isDualRepeatersDoc(i)) ?? null;
};

const unlockedMagazines = (weaponDoc) => {
  const listed = foundry.utils.getProperty(
    weaponDoc ?? item,
    "flags.world.dualRepeaters.unlockedMagazines",
  );
  if (Array.isArray(listed) && listed.length) {
    return listed.map((k) => String(k).toLowerCase());
  }
  return ["normal", "blaze", "cryo", "storm", "slime"];
};

const inventoryMagazineOptions = (weaponDoc) => {
  const unlocked = new Set(unlockedMagazines(weaponDoc));
  const byKey = new Map();
  for (const i of actorDoc.items) {
    if (!isMagazineDoc(i)) continue;
    const key = magazineKeyOf(i);
    if (!unlocked.has(key)) continue;
    const qty = Math.max(0, Number(i.system?.quantity ?? 0));
    if (qty <= 0) continue;
    const prev = byKey.get(key);
    if (!prev || qty > prev.qty) {
      byKey.set(key, {
        key,
        item: i,
        qty,
        label: MAGAZINE_LABELS[key] ?? i.name,
        damageType: damageTypeOf(i),
        charges: chargesPer(i),
      });
    }
  }
  return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label));
};

const clearLoadedMagazine = async () => {
  const stale = actorDoc.effects.filter(isMagazineActiveAe);
  if (stale.length) {
    await actorDoc.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
  }
};

const clearEmpowered = async () => {
  const buffs = actorDoc.effects.filter(isEmpoweredAe);
  if (buffs.length) {
    await actorDoc.deleteEmbeddedDocuments("ActiveEffect", buffs.map((e) => e.id));
  }
};

const fillWeaponCharges = async (weaponDoc, maxCharges) => {
  const max = Math.max(1, Number(maxCharges) || 6);
  await weaponDoc.update({
    "system.uses.spent": 0,
    "system.uses.max": String(max),
    "system.uses.recovery": [],
  });
};

const weaponChargesAvailable = (weaponDoc) => {
  const max = Number(weaponDoc.system?.uses?.max ?? 0);
  const spent = Number(weaponDoc.system?.uses?.spent ?? 0);
  if (!Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, max - spent);
};

/** Remember the weapon's native damage types so we can restore after specialty magazines. */
const ensureBaseDamageTypes = async (weaponDoc) => {
  const saved = foundry.utils.getProperty(weaponDoc, "flags.world.dualRepeaters.baseDamageTypes");
  if (Array.isArray(saved) && saved.length) return saved.map(String);
  const current = weaponDoc.system?.damage?.base?.types;
  const base = Array.isArray(current) && current.length ? current.map(String) : ["piercing"];
  await weaponDoc.update({ "flags.world.dualRepeaters.baseDamageTypes": base });
  return base;
};

/**
 * Specialty Magazines overwrite the weapon's base damage type (piercing → fire/cold/…).
 * Normal Magazine restores the native type.
 */
const applyWeaponDamageType = async (weaponDoc, damageType) => {
  const baseTypes = await ensureBaseDamageTypes(weaponDoc);
  const nextType = (damageType && damageType !== "piercing")
    ? String(damageType).toLowerCase()
    : (baseTypes[0] || "piercing");
  const update = {
    "system.damage.base.types": [nextType],
    "flags.world.dualRepeaters.loadedDamageType": nextType,
  };
  await weaponDoc.update(update);
  return nextType;
};

const restoreWeaponDamageType = async (weaponDoc) => {
  const baseTypes = await ensureBaseDamageTypes(weaponDoc);
  await weaponDoc.update({
    "system.damage.base.types": baseTypes,
    "flags.world.dualRepeaters.loadedMagazineKey": null,
    "flags.world.dualRepeaters.loadedDamageType": null,
    "flags.world.dualRepeaters.loadedRiderKind": null,
  });
};

const applyMagazineFromItem = async (magItem, weaponDoc, { empower = false } = {}) => {
  const magazineKey = magazineKeyOf(magItem);
  const maxCharges = chargesPer(magItem);
  const damageType = damageTypeOf(magItem);

  await clearLoadedMagazine();
  await clearEmpowered();
  await fillWeaponCharges(weaponDoc, maxCharges);
  // Overwrite weapon damage type so Attack/includeBase rolls the magazine element.
  const appliedType = await applyWeaponDamageType(weaponDoc, damageType);

  const template = magItem.effects.find((ef) =>
    foundry.utils.getProperty(ef, "flags.world.dualRepeaters.isMagazineTemplate") === true
    || foundry.utils.getProperty(ef, "flags.world.dualRepeaters.magazineKey") === magazineKey
    || /magazine/i.test(ef.name ?? ""),
  );

  const aeData = template
    ? template.toObject()
    : {
      name: magazineLoadedName(magazineKey),
      img: magItem.img,
      type: "base",
      system: {},
      changes: [],
      disabled: false,
      transfer: false,
      statuses: [],
      flags: {
        dae: {
          selfTarget: true,
          selfTargetAlways: true,
          stackable: "noneName",
          showIcon: true,
          specialDuration: ["shortRest", "longRest"],
        },
        world: { dualRepeaters: {} },
      },
    };

  delete aeData._id;
  aeData.disabled = false;
  aeData.transfer = false;
  aeData.name = magazineLoadedName(magazineKey);
  foundry.utils.setProperty(aeData, "flags.world.dualRepeaters.isMagazineActive", true);
  foundry.utils.setProperty(aeData, "flags.world.dualRepeaters.isMagazineTemplate", false);
  foundry.utils.setProperty(aeData, "flags.world.dualRepeaters.magazineKey", magazineKey);
  foundry.utils.setProperty(aeData, "flags.world.dualRepeaters.damageType", appliedType);
  // Charge count lives on the weapon sheet (system.uses), not on the AE.
  foundry.utils.setProperty(aeData, "flags.world.dualRepeaters.chargesMax", maxCharges);
  const riderKind = riderKindOf(magItem)
    || foundry.utils.getProperty(aeData, "flags.world.dualRepeaters.riderKind")
    || null;
  foundry.utils.setProperty(aeData, "flags.world.dualRepeaters.riderKind", riderKind);
  const rider = foundry.utils.getProperty(magItem, "flags.world.dualRepeaters.rider")
    ?? foundry.utils.getProperty(aeData, "flags.world.dualRepeaters.rider")
    ?? null;
  if (rider) foundry.utils.setProperty(aeData, "flags.world.dualRepeaters.rider", rider);

  const [ae] = await actorDoc.createEmbeddedDocuments("ActiveEffect", [aeData]);

  await weaponDoc.update({
    "flags.world.dualRepeaters.loadedMagazineKey": magazineKey,
    "flags.world.dualRepeaters.loadedDamageType": appliedType,
    "flags.world.dualRepeaters.loadedRiderKind": riderKind,
  });

  if (empower) {
    await actorDoc.createEmbeddedDocuments("ActiveEffect", [{
      name: "Empowered",
      img: "icons/magic/fire/projectile-fireball-smoke-orange.webp",
      type: "base",
      disabled: false,
      transfer: false,
      changes: [{
        key: "system.bonuses.rwak.damage",
        mode: 2,
        value: "1d4[" + appliedType + "]",
        priority: 20,
      }],
      flags: {
        dae: {
          selfTarget: true,
          selfTargetAlways: true,
          stackable: "noneName",
          showIcon: true,
        },
        world: {
          dualRepeaters: {
            isEmpowered: true,
            damageType: appliedType,
          },
        },
      },
    }]);
  }

  const newQty = Math.max(0, Number(magItem.system?.quantity ?? 0) - 1);
  await magItem.update({ "system.quantity": newQty });

  return { ae, magazineKey, maxCharges, damageType: appliedType, empower, newQty, weaponDoc };
};

const pickMagazineDialog = async (title, weaponDoc) => {
  const options = inventoryMagazineOptions(weaponDoc);
  if (!options.length) {
    return abort("Dual Repeaters: no unlocked magazines in inventory (quantity > 0).");
  }

  const optsHtml = options.map((o) => {
    const typeNote = o.damageType !== "piercing" ? (" [" + o.damageType + "]") : "";
    return '<option value="' + esc(o.key) + '">'
      + esc(o.label) + typeNote
      + " — pack " + o.qty + ", load " + o.charges + " Charges</option>";
  }).join("");

  const content = ""
    + '<form class="flexcol">'
    + "<p>Expend one Magazine to fill the Dual Repeaters with <strong>6 Charges</strong> (Volleys).</p>"
    + '<div class="form-group">'
    + "<label>Magazine</label>"
    + '<div class="form-fields">'
    + '<select name="dr-magazine">' + optsHtml + "</select>"
    + "</div></div></form>";

  const chosenKey = await new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    new Dialog({
      title,
      content,
      buttons: {
        ok: {
          icon: '<i class="fas fa-sync"></i>',
          label: "Load",
          callback: (html) => {
            const $h = html?.find ? html : $(html);
            done($h.find('select[name="dr-magazine"]').val() || null);
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => done(null),
        },
      },
      default: "ok",
      close: () => done(null),
    }).render(true);
  });

  if (!chosenKey) return abort("Dual Repeaters: reload cancelled.");
  const pick = options.find((o) => o.key === chosenKey);
  if (!pick) return abort("Dual Repeaters: invalid magazine selection.");
  return pick;
};

const hostileWithin15 = () => {
  const tokenDoc = typeof token !== "undefined" ? token : canvas?.tokens?.controlled?.[0];
  if (!tokenDoc?.document && !tokenDoc?.center) return false;
  const origin = tokenDoc.center ?? tokenDoc.getCenterPoint?.() ?? null;
  if (!origin) return false;
  const foes = canvas?.tokens?.placeables ?? [];
  for (const t of foes) {
    if (!t.actor || t.id === tokenDoc.id) continue;
    const disposition = t.document?.disposition ?? t.disposition;
    if (disposition >= 0) continue;
    const dist = canvas.grid.measureDistance(origin, t.center);
    if (dist <= 15) return true;
  }
  return false;
};

// ── Magazine consumable: Load Magazine ──────────────────────────────────────
if (isMagazineItem && isLoadActivity && (macroPass.includes("pretargeting") || macroPass.includes("preitemroll"))) {
  const weaponDoc = findDualRepeatersWeapon();
  if (!weaponDoc) {
    return abort("Dual Repeaters: equip/own a Dual Repeaters weapon before loading a magazine.");
  }
  return;
}

if (isMagazineItem && isLoadActivity && (macroPass.includes("postactiveeffects") || macroPass === "")) {
  if (macroPass && !macroPass.includes("postactiveeffects") && macroPass !== "") return;

  const weaponDoc = findDualRepeatersWeapon();
  if (!weaponDoc) {
    return abort("Dual Repeaters: equip/own a Dual Repeaters weapon before loading a magazine.");
  }

  const result = await applyMagazineFromItem(item, weaponDoc, { empower: false });
  if (!result) return;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: '<div class="dnd5e2"><p><strong>'
      + esc(actorDoc.name) + "</strong> loads <em>"
      + esc(result.ae.name) + "</em>.</p><p>Weapon Charges <strong>"
      + result.maxCharges + "/" + result.maxCharges
      + "</strong>. Each Dual Repeaters attack spends 1 Charge. Remaining Charges are lost if you load a different magazine. Magazines do not regenerate.</p></div>",
  });
  return;
}

// ── Dual Repeaters weapon ───────────────────────────────────────────────────
if (!isDualRepeatersWeapon) return;

const weaponDoc = actorDoc.items.get(item.id) ?? item;

// Magazines / Empowered Reload — pick + expend magazine from inventory
if ((isMagazinesReload || isEmpoweredReload) && (macroPass.includes("pretargeting") || macroPass.includes("preitemroll") || macroPass === "")) {
  if (macroPass && !macroPass.includes("pretargeting") && !macroPass.includes("preitemroll") && macroPass !== "") return;

  const title = isEmpoweredReload ? "Empowered Reload — Magazine" : "Magazines — Load";
  const pick = await pickMagazineDialog(title, weaponDoc);
  if (!pick) return false;

  const empower = isEmpoweredReload && hostileWithin15();
  const result = await applyMagazineFromItem(pick.item, weaponDoc, { empower });
  if (!result) return false;

  const empowerNote = result.empower
    ? " <strong>Empowered</strong> (+1d4 ammo-type damage until next reload)."
    : (isEmpoweredReload ? " (no hostile within 15 ft — not Empowered)." : "");

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: '<div class="dnd5e2"><p><strong>'
      + esc(actorDoc.name) + "</strong> reloads Dual Repeaters with <em>"
      + esc(pick.label) + "</em>.</p><p>Charges <strong>"
      + result.maxCharges + "/" + result.maxCharges
      + "</strong> · spent 1 from inventory (" + result.newQty + " left)."
      + empowerNote + "</p></div>",
  });
  // Abort the empty utility roll — reload already applied via macro.
  if (workflow) workflow.aborted = true;
  return false;
}

// Attack gate — need Charges remaining. Damage type already overwritten on the weapon.
if (isAttackActivity && (macroPass.includes("pretargeting") || macroPass.includes("preitemroll"))) {
  const avail = weaponChargesAvailable(weaponDoc);
  if (avail <= 0) {
    return abort("Dual Repeaters: no Charges left — reload with Magazines / Empowered Reload.");
  }
  // Belt-and-suspenders: force Midi/activity to the loaded magazine element.
  const ae = actorDoc.effects.find(isMagazineActiveAe);
  const damageType = String(
    foundry.utils.getProperty(weaponDoc, "flags.world.dualRepeaters.loadedDamageType")
    ?? foundry.utils.getProperty(ae, "flags.world.dualRepeaters.damageType")
    ?? weaponDoc.system?.damage?.base?.types?.[0]
    ?? "piercing",
  ).toLowerCase();
  if (workflow) {
    workflow.defaultDamageType = damageType;
    if (globalThis.MidiQOL) MidiQOL.MQdefaultDamageType = damageType;
  }
  // Keep sheet type in sync if something else reset it mid-combat.
  const current = String(weaponDoc.system?.damage?.base?.types?.[0] ?? "").toLowerCase();
  if (damageType && current !== damageType) {
    await weaponDoc.update({ "system.damage.base.types": [damageType] });
  }
  return;
}

// After attack resolves: Rare magazine on-hit riders, then empty-magazine cleanup
if (!isAttackActivity) return;

const hitCount = workflow?.hitTargets?.size
  ?? args?.[0]?.hitTargets?.size
  ?? 0;
const isHit = hitCount > 0;
const isPostAttack = macroPass.includes("postattackroll");
const isPostDamage = macroPass.includes("postdamageroll");

const applyAeToTargets = async (aeData) => {
  const targets = [...(workflow?.hitTargets ?? args?.[0]?.hitTargets ?? [])];
  for (const t of targets) {
    const targetActor = t.actor ?? t.document?.actor;
    if (!targetActor) continue;
    const data = foundry.utils.deepClone(aeData);
    delete data._id;
    await targetActor.createEmbeddedDocuments("ActiveEffect", [data]);
  }
};

const isUndeadActor = (a) => {
  const type = String(a?.system?.details?.type?.value ?? a?.system?.details?.type ?? "").toLowerCase();
  if (type === "undead") return true;
  const subtypes = a?.system?.details?.type?.subtype ?? a?.system?.details?.type?.custom ?? "";
  return /undead/i.test(String(subtypes));
};

// Rare magazine riders (Upgrade I / Dawnstar / Twilight) — on hit after damage
if (isPostDamage && isHit) {
  const ae = actorDoc.effects.find(isMagazineActiveAe);
  const magKey = String(
    foundry.utils.getProperty(weaponDoc, "flags.world.dualRepeaters.loadedMagazineKey")
    ?? foundry.utils.getProperty(ae, "flags.world.dualRepeaters.magazineKey")
    ?? "",
  ).toLowerCase();
  const riderKind = String(
    foundry.utils.getProperty(weaponDoc, "flags.world.dualRepeaters.loadedRiderKind")
    ?? foundry.utils.getProperty(ae, "flags.world.dualRepeaters.riderKind")
    ?? "",
  ).toLowerCase();

  if (riderKind === "onhitspeed" || magKey === "cryo-i") {
    await applyAeToTargets({
      name: "Cryo Magazine — Chilled",
      img: "icons/magic/water/snowflake-ice-blue.webp",
      type: "base",
      disabled: false,
      transfer: false,
      changes: [{
        key: "system.attributes.movement.walk",
        mode: 2,
        value: "-10",
        priority: 20,
      }],
      duration: { turns: 1 },
      flags: {
        dae: {
          stackable: "noneName",
          specialDuration: ["turnStartSource"],
          showIcon: true,
        },
        world: { dualRepeaters: { isMagazineRider: true, magazineKey: "cryo-i" } },
      },
    });
  }

  if (riderKind === "onhitnoreactions" || magKey === "storm-i") {
    await applyAeToTargets({
      name: "Storm Magazine — No Reactions",
      img: "icons/magic/lightning/bolt-strike-blue.webp",
      type: "base",
      disabled: false,
      transfer: false,
      changes: [],
      duration: { turns: 1 },
      statuses: [],
      flags: {
        dae: {
          stackable: "noneName",
          specialDuration: ["turnStartSource"],
          showIcon: true,
        },
        "midi-qol": { fail: { reaction: true } },
        world: { dualRepeaters: { isMagazineRider: true, magazineKey: "storm-i" } },
      },
    });
  }

  if (riderKind === "onhitadvantage" || magKey === "slime-i") {
    await applyAeToTargets({
      name: "Slime Magazine — Marked",
      img: "icons/magic/acid/dissolve-bone-white.webp",
      type: "base",
      disabled: false,
      transfer: false,
      changes: [{
        key: "flags.midi-qol.grants.attack.advantage",
        mode: 0,
        value: "1",
        priority: 20,
      }],
      duration: { turns: 1 },
      flags: {
        dae: {
          stackable: "noneName",
          specialDuration: ["isAttacked", "turnEndSource"],
          showIcon: true,
        },
        world: { dualRepeaters: { isMagazineRider: true, magazineKey: "slime-i" } },
      },
    });
  }

  if (riderKind === "onhitundead" || magKey === "dawnstar") {
    const targets = [...(workflow?.hitTargets ?? args?.[0]?.hitTargets ?? [])];
    for (const t of targets) {
      const targetActor = t.actor ?? t.document?.actor;
      if (!targetActor) continue;
      if (isUndeadActor(targetActor)) {
        const roll = await new Roll("1d6").evaluate();
        await roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
          flavor: "Dawnstar Magazine — Undead",
        });
        if (typeof targetActor.applyDamage === "function") {
          await targetActor.applyDamage(roll.total);
        } else if (globalThis.MidiQOL?.applyTokenDamage) {
          await MidiQOL.applyTokenDamage(
            [{ damage: roll.total, type: "radiant" }],
            roll.total,
            new Set([t]),
            item,
            new Set(),
          );
        }
      }
      const invisible = targetActor.effects?.some((ef) =>
        ef.statuses?.has?.("invisible") || /invisib/i.test(ef.name ?? ""),
      );
      if (invisible) {
        const revealed = {
          name: "Dawnstar Magazine — Revealed",
          img: "icons/magic/light/explosion-star-blue-small.webp",
          type: "base",
          disabled: false,
          transfer: false,
          changes: [],
          duration: { turns: 1 },
          flags: {
            dae: {
              stackable: "noneName",
              specialDuration: ["turnEndSource"],
              showIcon: true,
            },
            world: { dualRepeaters: { isMagazineRider: true, magazineKey: "dawnstar" } },
          },
        };
        await targetActor.createEmbeddedDocuments("ActiveEffect", [revealed]);
        const inv = targetActor.effects.filter((ef) =>
          ef.statuses?.has?.("invisible") || /invisib/i.test(ef.name ?? ""),
        );
        if (inv.length) {
          await targetActor.deleteEmbeddedDocuments("ActiveEffect", inv.map((e) => e.id));
        }
      }
    }
  }

  if (riderKind === "onhitnoheal" || magKey === "twilight") {
    await applyAeToTargets({
      name: "Twilight Magazine — No Healing",
      img: "icons/magic/unholy/strike-beam-blood-large-red-blue.webp",
      type: "base",
      disabled: false,
      transfer: false,
      changes: [{
        key: "flags.midi-qol.fail.heal",
        mode: 0,
        value: "1",
        priority: 20,
      }],
      duration: { turns: 1 },
      flags: {
        dae: {
          stackable: "noneName",
          specialDuration: ["turnStartSource"],
          showIcon: true,
        },
        world: { dualRepeaters: { isMagazineRider: true, magazineKey: "twilight" } },
      },
    });
  }
}

const shouldResolve =
  (isPostDamage && isHit)
  || (isPostAttack && !isHit)
  || (isPostDamage && !isHit);

if (!shouldResolve) return;

// itemUses consumption already spent 1 Charge on the Attack activity.
const refreshed = actorDoc.items.get(weaponDoc.id) ?? weaponDoc;
const remaining = weaponChargesAvailable(refreshed);
if (remaining > 0) return;

await clearLoadedMagazine();
await clearEmpowered();
await restoreWeaponDamageType(refreshed);
await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: '<div class="dnd5e2"><p>Dual Repeaters magazine empty (0 Charges left). Damage type restored to piercing.</p></div>',
});

