// Heavy Bowgun — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [preTargeting]ItemMacro,[postAttackRoll]ItemMacro,[preDamageRoll]ItemMacro
//
// Reload:
//   Dialog → pick ammo from inventory → fill Magazine → spend rounds from ammo stack.
//   Same ammo type already loaded: only top up empty slots.
//   Different ammo type: replace the magazine (remaining rounds are discarded).
// Fire activities (Normal / Pierce / Spread / Cluster / Recover / Poison / Paralysis /
//   Sticky / Slicing / Wyvern):
//   Require matching flags.world.hbg.loadedAmmoKey (and magazine rounds remaining).
// Wyvernheart:
//   Spends 1 Ignition; extra 1d8 piercing in preDamageRoll if you already hit this turn.
//   Dedicated ammo cannot be fired via Wyvernheart (only Normal).
// Guard:
//   Blocked on the same turn Wyvernheart was used. Marks usedGuardTurn.
// Wyverncounter (Rare):
//   Reaction attack. Requires Guard earlier this turn, 1 Ignition, magazine round.
//   Extra 1d8 piercing if the target is within 15 feet. No special ammo effect.
// Hits with Normal / Pierce / Cluster / Poison / Paralysis / Sticky (not Wyvernheart /
//   Wyverncounter) grant 1 Ignition (max 3). Spread / Recover / Slicing / Wyvern do not.
//
// Flags (weapon):
//   flags.world.hbg.isHeavyBowgun
//   flags.world.hbg.tier
//   flags.world.hbg.specialAmmoMax
//   flags.world.hbg.unlockedAmmo
//   flags.world.hbg.loadedAmmoKey
//   flags.world.hbg.ignition
// Flags (actor):
//   flags.world.hbg.hitThisTurn
//   flags.world.hbg.usedWyvernheartTurn
//   flags.world.hbg.usedGuardTurn
// Flags (ammo consumable):
//   flags.world.hbg.isAmmo / ammoKey / isSpecial

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

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Heavy Bowgun: actor not found.");
  return;
}

const isHbgWeapon = foundry.utils.getProperty(item, "flags.world.hbg.isHeavyBowgun") === true
  || String(item?.system?.identifier ?? "") === "heavybowgun"
  || /^heavy bowgun\b/i.test(item?.name ?? "");

if (!isHbgWeapon) return;

const STANDARD_KEYS = new Set(["normal", "pierce", "spread"]);
const SPECIAL_KEYS = new Set([
  "cluster",
  "recover",
  "poison",
  "paralysis",
  "sticky",
  "slicing",
  "wyvern",
]);

const AMMO_LABELS = {
  normal: "Normal Ammo",
  pierce: "Pierce Ammo",
  spread: "Spread Ammo",
  cluster: "Cluster Ammo",
  recover: "Recover Ammo",
  poison: "Poison Ammo",
  paralysis: "Paralysis Ammo",
  sticky: "Sticky Ammo",
  slicing: "Slicing Ammo",
  wyvern: "Wyvern Ammo",
};

const activityToAmmoKey = () => {
  if (actId.endsWith("-save") || actId.endsWith("-burst") || actName.includes(": save") || actName.includes("burst")) {
    return null;
  }
  if (actId === "normal-ammo" || actName === "normal ammo" || actName === "attack") return "normal";
  if (actId === "pierce-ammo" || actName.includes("pierce ammo")) return "pierce";
  if (actId === "spread-ammo" || actName.includes("spread ammo")) return "spread";
  if (actId === "cluster-ammo" || actName.includes("cluster ammo")) return "cluster";
  if (actId === "recover-ammo" || actName.includes("recover ammo")) return "recover";
  if (actId === "poison-ammo" || actName.includes("poison ammo")) return "poison";
  if (actId === "paralysis-ammo" || actName.includes("paralysis ammo")) return "paralysis";
  if (actId === "sticky-ammo" || actName.includes("sticky ammo")) return "sticky";
  if (actId === "slicing-ammo" || actName.includes("slicing ammo")) return "slicing";
  if (actId === "wyvern-ammo" || actName.includes("wyvern ammo")) return "wyvern";
  return null;
};

const isReload = actId === "reload" || actName === "reload";
const isWyvernheart = actId === "wyvernheart" || actName.includes("wyvernheart");
const isWyverncounter = actId === "wyverncounter" || actName.includes("wyverncounter");
const isGuard = actId === "guard" || actName === "guard";
const fireAmmoKey = activityToAmmoKey();
const isFireActivity = Boolean(fireAmmoKey) || isWyvernheart || isWyverncounter;
const dedicatedAmmo = new Set([
  "pierce",
  "spread",
  "recover",
  "cluster",
  "poison",
  "paralysis",
  "sticky",
  "slicing",
  "wyvern",
]);
const noIgnitionAmmo = new Set(["spread", "recover", "slicing", "wyvern"]);

const abort = (msg) => {
  if (msg) ui.notifications.warn(msg);
  if (workflow) workflow.aborted = true;
  return false;
};

const turnKey = () => {
  const combat = game.combat;
  if (!combat?.started) return null;
  return `${combat.id}:${combat.round}:${combat.turn}:${actorDoc.id}`;
};

const magazineMax = () => {
  const raw = item.system?.uses?.max;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  return 6;
};

const magazineSpent = () => Math.max(0, Number(item.system?.uses?.spent ?? 0));
const magazineAvailable = () => Math.max(0, magazineMax() - magazineSpent());

const specialMax = () => Math.max(
  1,
  Number(foundry.utils.getProperty(item, "flags.world.hbg.specialAmmoMax") ?? 2),
);

const ignitionMax = () => Math.max(
  1,
  Number(foundry.utils.getProperty(item, "flags.world.hbg.ignitionMax") ?? 3),
);

const ignitionValue = () => Math.max(
  0,
  Number(foundry.utils.getProperty(item, "flags.world.hbg.ignition") ?? 0),
);

const unlockedAmmo = () => {
  const listed = foundry.utils.getProperty(item, "flags.world.hbg.unlockedAmmo");
  if (Array.isArray(listed) && listed.length) {
    return listed.map((k) => String(k).toLowerCase());
  }
  return ["normal", "pierce", "spread", "cluster", "recover"];
};

const isAmmoItem = (i) => {
  if (foundry.utils.getProperty(i, "flags.world.hbg.isAmmo") === true) return true;
  const id = String(i.system?.identifier ?? "").toLowerCase();
  if (id.endsWith("-ammo")) return true;
  if (i.type === "consumable" && /ammo$/i.test(i.name ?? "")) return true;
  return false;
};

const ammoKeyOf = (i) => {
  const flagged = foundry.utils.getProperty(i, "flags.world.hbg.ammoKey");
  if (flagged) return String(flagged).toLowerCase();
  const id = String(i.system?.identifier ?? "").toLowerCase().replace(/-ammo$/, "");
  if (id) return id;
  return String(i.name ?? "")
    .toLowerCase()
    .replace(/\s+ammo.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const isSpecialAmmoKey = (key) => {
  if (SPECIAL_KEYS.has(key)) return true;
  if (STANDARD_KEYS.has(key)) return false;
  return foundry.utils.getProperty(
    actorDoc.items.find((i) => isAmmoItem(i) && ammoKeyOf(i) === key),
    "flags.world.hbg.isSpecial",
  ) === true;
};

const capacityFor = (key) => (isSpecialAmmoKey(key) ? specialMax() : magazineMax());

const inventoryAmmoOptions = () => {
  const unlocked = new Set(unlockedAmmo());
  const byKey = new Map();
  for (const i of actorDoc.items) {
    if (!isAmmoItem(i)) continue;
    const key = ammoKeyOf(i);
    if (!unlocked.has(key)) continue;
    const qty = Math.max(0, Number(i.system?.quantity ?? 0));
    if (qty <= 0) continue;
    const prev = byKey.get(key);
    if (!prev || qty > prev.qty) {
      byKey.set(key, { key, item: i, qty, label: AMMO_LABELS[key] ?? i.name });
    }
  }
  return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label));
};

const loadedKey = () => String(
  foundry.utils.getProperty(item, "flags.world.hbg.loadedAmmoKey") ?? "",
).toLowerCase() || null;

const bowItem = () => actorDoc.items.get(item.id) ?? item;

const workflowToken = () => token
  ?? workflow?.token
  ?? canvas?.tokens?.get(workflow?.tokenId)
  ?? canvas?.tokens?.controlled?.[0]
  ?? null;

const firstTargetToken = () => {
  const targets = workflow?.targets;
  if (targets?.first) return targets.first();
  const iter = targets?.values?.();
  return iter ? iter.next().value : null;
};

const distanceFt = (fromTok, toTok) => {
  if (!fromTok || !toTok) return Infinity;
  if (typeof MidiQOL?.computeDistance === "function") {
    return Number(MidiQOL.computeDistance(fromTok, toTok, { wallsBlock: false })) || Infinity;
  }
  if (canvas?.grid?.measureDistance) {
    return Number(canvas.grid.measureDistance(fromTok.center, toTok.center)) || Infinity;
  }
  return Infinity;
};

const addDamageBonus = (formula) => {
  const prior = String(workflow?.damageBonus ?? "").trim();
  workflow.damageBonus = prior ? `${prior} + ${formula}` : formula;
};

// ── preDamageRoll: Wyvernheart ramp / Wyverncounter close range ─────────────
if (macroPass.includes("predamageroll")) {
  if (isWyvernheart) {
    const lastHit = foundry.utils.getProperty(actorDoc, "flags.world.hbg.hitThisTurn");
    if (lastHit && lastHit === turnKey()) {
      addDamageBonus("1d8[piercing]");
    }
    return;
  }
  if (isWyverncounter) {
    if (distanceFt(workflowToken(), firstTargetToken()) <= 15) {
      addDamageBonus("1d8[piercing]");
    }
    return;
  }
  return;
}

// ── postAttackRoll: Ignition + hitThisTurn ──────────────────────────────────
if (macroPass.includes("postattackroll")) {
  const hits = Number(workflow?.hitTargets?.size ?? workflow?.hits ?? 0);
  if (hits <= 0) return;
  const key = turnKey();
  if (key) {
    await actorDoc.setFlag("world", "hbg.hitThisTurn", key);
  }
  if (isWyvernheart || isWyverncounter || isGuard || isReload) return;
  if (noIgnitionAmmo.has(fireAmmoKey)) return;
  const next = Math.min(ignitionMax(), ignitionValue() + 1);
  await bowItem().update({ "flags.world.hbg.ignition": next });
  return;
}

// Only gate / dialog before the activity resolves.
if (macroPass && !macroPass.includes("pretargeting") && !macroPass.includes("preitemroll")) {
  return;
}

// ── Guard ──────────────────────────────────────────────────────────────────
if (isGuard) {
  const used = foundry.utils.getProperty(actorDoc, "flags.world.hbg.usedWyvernheartTurn");
  const key = turnKey();
  if (key && used === key) {
    return abort("Heavy Bowgun: Guard cannot be used on a turn you used Wyvernheart.");
  }
  if (key) {
    await actorDoc.setFlag("world", "hbg.usedGuardTurn", key);
  }
  return;
}

// ── Fire gate ───────────────────────────────────────────────────────────────
if (isFireActivity && !isReload) {
  const avail = magazineAvailable();
  if (avail <= 0) {
    return abort("Heavy Bowgun: magazine empty — Reload first.");
  }
  const loaded = loadedKey();
  if (!loaded) {
    return abort("Heavy Bowgun: no ammo type loaded — use Reload.");
  }
  if (isWyverncounter) {
    const key = turnKey();
    const usedHeart = foundry.utils.getProperty(actorDoc, "flags.world.hbg.usedWyvernheartTurn");
    if (key && usedHeart === key) {
      return abort("Heavy Bowgun: Wyverncounter cannot be used on a turn you used Wyvernheart.");
    }
    const usedGuard = foundry.utils.getProperty(actorDoc, "flags.world.hbg.usedGuardTurn");
    if (!key || usedGuard !== key) {
      return abort("Heavy Bowgun: Wyverncounter requires Guard earlier this turn (and the attack to miss).");
    }
    if (ignitionValue() < 1) {
      return abort("Heavy Bowgun: no Ignition — land a hit first.");
    }
    await bowItem().update({
      "flags.world.hbg.ignition": Math.max(0, ignitionValue() - 1),
    });
    return;
  }
  if (isWyvernheart) {
    if (ignitionValue() < 1) {
      return abort("Heavy Bowgun: no Ignition — land a hit first.");
    }
    if (dedicatedAmmo.has(loaded)) {
      return abort(
        `Heavy Bowgun: ${AMMO_LABELS[loaded] ?? loaded} is loaded — use that ammo activity (not Wyvernheart).`,
      );
    }
    const key = turnKey();
    if (key) {
      await actorDoc.setFlag("world", "hbg.usedWyvernheartTurn", key);
    }
    await bowItem().update({
      "flags.world.hbg.ignition": Math.max(0, ignitionValue() - 1),
    });
    return;
  }
  if (fireAmmoKey && fireAmmoKey !== loaded) {
    return abort(
      `Heavy Bowgun: magazine is loaded with ${AMMO_LABELS[loaded] ?? loaded}, not ${AMMO_LABELS[fireAmmoKey] ?? fireAmmoKey}. Reload to switch.`,
    );
  }
  return;
}

// ── Reload ──────────────────────────────────────────────────────────────────
if (!isReload) return;

const options = inventoryAmmoOptions();
if (!options.length) {
  return abort("Heavy Bowgun: no unlocked ammo in inventory (quantity > 0).");
}

const title = "Reload — Magazine";
const currentLoaded = loadedKey();
const magMax = magazineMax();
const magAvail = magazineAvailable();

const optsHtml = options.map((o) => {
  const cap = capacityFor(o.key);
  const targetAvail = cap;
  const sameType = Boolean(currentLoaded && currentLoaded === o.key);
  const need = sameType
    ? Math.max(0, targetAvail - magAvail)
    : targetAvail;
  const selected = currentLoaded === o.key ? " selected" : "";
  const special = isSpecialAmmoKey(o.key) ? " [Special]" : "";
  const loadHint = sameType
    ? (need > 0 ? `top up ${need}/${cap}` : `full ${magAvail}/${cap}`)
    : `load ${targetAvail}/${cap}`;
  return `<option value="${esc(o.key)}"${selected}>${esc(o.label)}${special} — pack ${o.qty}, ${loadHint}</option>`;
}).join("");

const content = `
<form class="flexcol">
  <p>Magazine: <strong>${magAvail}/${magMax}</strong>${
    currentLoaded ? ` · loaded <em>${esc(AMMO_LABELS[currentLoaded] ?? currentLoaded)}</em>` : ""
  } · Ignition <strong>${ignitionValue()}/${ignitionMax()}</strong></p>
  <p>Reload fills up to the chosen ammo capacity (standard Magazine or Special Ammo limit).</p>
  <p>Reloading the <strong>same</strong> ammo type only spends rounds for empty slots. Switching ammo replaces the magazine.</p>
  <div class="form-group">
    <label>Ammunition</label>
    <div class="form-fields">
      <select name="hbg-ammo">${optsHtml}</select>
    </div>
  </div>
</form>`;

const chosenKey = await new Promise((resolve) => {
  let settled = false;
  const done = (v) => { if (!settled) { settled = true; resolve(v); } };
  new Dialog({
    title,
    content,
    buttons: {
      ok: {
        icon: '<i class="fas fa-sync"></i>',
        label: "Reload",
        callback: (html) => {
          const $h = html?.find ? html : $(html);
          done($h.find('select[name="hbg-ammo"]').val() || null);
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

if (!chosenKey) {
  return abort("Heavy Bowgun: reload cancelled.");
}

const pick = options.find((o) => o.key === chosenKey);
if (!pick) {
  return abort("Heavy Bowgun: invalid ammo selection.");
}

const cap = capacityFor(chosenKey);
const targetAvail = cap;
if (targetAvail <= 0) {
  return abort("Heavy Bowgun: load amount is 0 for this capacity.");
}

const sameType = Boolean(currentLoaded && currentLoaded === chosenKey);
const need = sameType
  ? Math.max(0, targetAvail - magAvail)
  : targetAvail;

if (sameType && need <= 0) {
  return abort("Heavy Bowgun: magazine already full for this ammo.");
}

const loadAmt = Math.min(need, pick.qty);
if (loadAmt <= 0) {
  return abort(`Heavy Bowgun: no rounds left in ${pick.label}.`);
}

const finalAvail = sameType ? magAvail + loadAmt : loadAmt;
const max = magazineMax();
const newSpent = Math.max(0, max - finalAvail);
const newQty = Math.max(0, Number(pick.item.system?.quantity ?? 0) - loadAmt);

await pick.item.update({ "system.quantity": newQty });
await bowItem().update({
  "system.uses.spent": newSpent,
  "flags.world.hbg.loadedAmmoKey": chosenKey,
});

const specialNote = isSpecialAmmoKey(chosenKey)
  ? ` Special Ammo capacity ${cap}.`
  : "";
const topUpNote = sameType ? " (top-up)" : "";

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: `<div class="dnd5e2"><p><strong>${esc(actorDoc.name)}</strong> reloads the Heavy Bowgun with <em>${esc(pick.label)}</em>${topUpNote}.</p><p>Magazine <strong>${finalAvail}/${max}</strong> · spent ${loadAmt} from inventory (${newQty} left).${specialNote}</p></div>`,
});

return;
