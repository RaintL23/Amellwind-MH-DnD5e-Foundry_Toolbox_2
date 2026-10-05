// Heavy Bowgun — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use:
//   [preTargeting]ItemMacro,[preambleComplete]ItemMacro,[preDamageRoll]ItemMacro,[postActiveEffects]ItemMacro
//
// Reload (Action or Bonus Action):
//   Dialog → pick unlocked ammo → fill Magazine → spend quantity from the stack.
//   Same type: top up empty slots only. Other type: replace the magazine (leftovers are discarded).
//   Special ammo fills only up to flags.world.hbg.specialAmmoMax.
// Fire activities require flags.world.hbg.loadedAmmoKey and a round in the magazine.
// Wyvernheart / Wyverncounter / Wyvernpiercer fire the weapon's normal damage (no special ammo rider).
// Wyvernheart bonus dice (if you already hit earlier this turn): 1d6 / 1d8 / 1d10 by tier.
//   The bonus is decided in preDamageRoll from the previous hit flag. postActiveEffects records this hit.
// Guard: roll 1d4 (1d6 from Rare) and apply +AC with dae.specialDuration isAttacked.
//   On a miss, offers Wyverncounter (no extra action) when that activity exists.
// Wyvernpiercer: 2 Ignition + 1 round, then blocks Guard until the start of your next turn.
// Ignition Mode (Legendary): while the AE is up, hits grant 2 Ignition and Wyvernpiercer can be a Bonus Action.
//   Guard and Wyverncounter are blocked. Uses are the activity's PB / Long Rest pool.
//
// Flags (weapon): flags.world.hbg.*
// Flags (actor, turn): flags.world.hbg.hitThisTurn / usedWyvernheartTurn / usedGuardTurn / guardCausedMiss

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
  "cluster", "recover", "poison", "paralysis", "sticky", "slicing", "wyvern",
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
  if (actId.endsWith("-save") || actId.endsWith("-burst") || actId === "sticky-escape") return null;
  if (actName.includes(": save") || actName.includes("burst") || actName.includes("escape")) return null;
  if (actId === "normal-ammo" || actName === "normal ammo") return "normal";
  if (actId === "pierce-ammo" || actName.includes("pierce ammo")) return "pierce";
  if (actId === "spread-ammo" || actName.includes("spread ammo")) return "spread";
  if (actId === "cluster-ammo" || actName.includes("cluster ammo")) return "cluster";
  if (actId === "recover-ammo" || actName.includes("recover ammo")) return "recover";
  if (actId === "poison-ammo" || actName.includes("poison ammo")) return "poison";
  if (actId === "paralysis-ammo" || actName.includes("paralysis ammo")) return "paralysis";
  if (actId === "sticky-ammo" || actName.includes("sticky ammo")) return "sticky";
  if (actId === "slicing-ammo" || actName.includes("slicing ammo")) return "slicing";
  if (actId === "wyvern-ammo" || (actName.includes("wyvern ammo") && !actName.includes("wyvernpiercer"))) return "wyvern";
  return null;
};

const isReload = actId === "reload" || actName === "reload" || actName.startsWith("reload");
const isWyvernheart = actId === "wyvernheart" || actName.includes("wyvernheart");
const isWyverncounter = actId === "wyverncounter" || actName.includes("wyverncounter");
const isWyvernpiercer = actId === "wyvernpiercer" || actId === "wyvernpiercer-bonus" || actName.includes("wyvernpiercer");
const isGuard = actId === "guard" || actName === "guard";
const isIgnitionMode = actId === "ignition-mode" || actName === "ignition mode";
const isStickyEscape = actId === "sticky-escape" || actName.includes("sticky ammo: escape");
const isPoisonSave = actId === "poison-ammo-save" || actName.includes("poison ammo: save");
const isParalysisSave = actId === "paralysis-ammo-save" || actName.includes("paralysis ammo: save");
const isClusterBurst = actId === "cluster-burst" || actName.includes("cluster burst");
const isCluster = actId === "cluster-ammo" || (actName.includes("cluster ammo") && !actName.includes("burst"));
const isPierce = actId === "pierce-ammo" || actName.includes("pierce ammo");
const isSlicing = actId === "slicing-ammo" || actName.includes("slicing ammo");
const fireAmmoKey = activityToAmmoKey();
const isPlainShot = isWyvernheart || isWyverncounter || isWyvernpiercer;
const isFireActivity = Boolean(fireAmmoKey) || isPlainShot;
const noIgnitionAmmo = new Set(["spread", "recover", "slicing", "wyvern"]);

const tierKey = () => String(
  foundry.utils.getProperty(item, "flags.world.hbg.tier") ?? "",
).toLowerCase().replace(/\s+/g, "");

const abort = (msg) => {
  if (msg) ui.notifications.warn(msg);
  if (workflow) workflow.aborted = true;
  return false;
};

const turnMark = () => {
  const combat = game.combat;
  if (!combat?.started) return null;
  return `${combat.id}:${combat.round}:${combat.turn}:${actorDoc.id}`;
};

const bowItem = () => actorDoc.items.get(item.id) ?? item;

const magazineMax = () => {
  const n = Number(item.system?.uses?.max);
  if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  return 4;
};

const magazineSpent = () => Math.max(0, Number(item.system?.uses?.spent ?? 0));
const magazineAvailable = () => Math.max(0, magazineMax() - magazineSpent());

const specialMax = () => {
  const n = Number(foundry.utils.getProperty(item, "flags.world.hbg.specialAmmoMax"));
  if (!Number.isFinite(n)) return 2;
  return Math.max(0, Math.trunc(n));
};

const ignitionMax = () => Math.max(
  1,
  Number(foundry.utils.getProperty(item, "flags.world.hbg.ignitionMax") ?? 3),
);

const ignitionValue = () => Math.max(
  0,
  Number(foundry.utils.getProperty(item, "flags.world.hbg.ignition") ?? 0),
);

const ignitionEnabled = () => tierKey() !== "common"
  && foundry.utils.getProperty(item, "flags.world.hbg.ignitionOnHit") !== false;

const heartDie = () => {
  const flagged = foundry.utils.getProperty(item, "flags.world.hbg.wyvernheartBonus");
  if (flagged) return String(flagged);
  const tier = tierKey();
  if (tier === "veryrare" || tier === "legendary") return "1d10";
  if (tier === "rare") return "1d8";
  return "1d6";
};

const guardDie = () => {
  const flagged = foundry.utils.getProperty(item, "flags.world.hbg.guardDie");
  if (flagged) return String(flagged);
  const tier = tierKey();
  if (tier === "rare" || tier === "veryrare" || tier === "legendary") return "1d6";
  return "1d4";
};

const ammoDc = () => {
  const prof = Number(actorDoc.system?.attributes?.prof ?? 0);
  const dex = Number(actorDoc.system?.abilities?.dex?.mod ?? 0);
  return 8 + prof + dex;
};

const effectList = (doc) => {
  const list = doc?.appliedEffects ?? doc?.effects?.contents ?? doc?.effects ?? [];
  return Array.from(list);
};

const hasIgnitionMode = () => effectList(actorDoc).some((ef) =>
  !ef.disabled && foundry.utils.getProperty(ef, "flags.world.hbg.isIgnitionMode") === true,
);

const guardLocked = () => effectList(actorDoc).some((ef) =>
  !ef.disabled && foundry.utils.getProperty(ef, "flags.world.hbg.guardLocked") === true,
);

const unlockedAmmo = () => {
  const listed = foundry.utils.getProperty(item, "flags.world.hbg.unlockedAmmo");
  if (Array.isArray(listed) && listed.length) return listed.map((k) => String(k).toLowerCase());
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

const workflowToken = () => token
  ?? workflow?.token
  ?? canvas?.tokens?.get(workflow?.tokenId)
  ?? actorDoc.getActiveTokens?.()?.[0]
  ?? null;

const asToken = (t) => t?.object ?? t;

const firstTargetToken = () => {
  const targets = workflow?.targets;
  const first = targets?.first ? targets.first() : targets?.values?.()?.next?.()?.value;
  return asToken(first);
};

const distanceFt = (fromTok, toTok) => {
  const a = asToken(fromTok);
  const b = asToken(toTok);
  if (!a || !b) return Infinity;
  if (typeof MidiQOL?.computeDistance === "function") {
    const d = Number(MidiQOL.computeDistance(a, b, { wallsBlock: false }));
    if (Number.isFinite(d)) return d;
  }
  if (canvas?.grid?.measureDistance && a.center && b.center) {
    const d = Number(canvas.grid.measureDistance(a.center, b.center));
    if (Number.isFinite(d)) return d;
  }
  return Infinity;
};

const hitCount = () => {
  const ht = workflow?.hitTargets;
  if (ht instanceof Set) return ht.size;
  if (Array.isArray(ht)) return ht.length;
  const n = Number(ht?.size ?? workflow?.hits ?? 0);
  if (Number.isFinite(n) && n > 0) return n;
  return 0;
};

const hitTokens = () => {
  const ht = workflow?.hitTargets;
  const list = ht instanceof Set || Array.isArray(ht) ? [...ht] : [];
  return list.map(asToken).filter(Boolean);
};

const addDamageBonus = (formula) => {
  const prior = String(workflow?.damageBonus ?? "").trim();
  workflow.damageBonus = prior ? `${prior} + ${formula}` : formula;
};

const spendIgnition = async (amount) => {
  const next = Math.max(0, ignitionValue() - amount);
  await bowItem().update({ "flags.world.hbg.ignition": next });
  return next;
};

const gainIgnition = async (hits) => {
  if (!ignitionEnabled() || hits <= 0) return;
  const per = hasIgnitionMode() ? 2 : 1;
  const next = Math.min(ignitionMax(), ignitionValue() + (hits * per));
  await bowItem().update({ "flags.world.hbg.ignition": next });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: `<div class="dnd5e2"><p><strong>Ignition</strong> ${esc(actorDoc.name)}: <strong>${next}/${ignitionMax()}</strong> (+${hits * per}).</p></div>`,
  });
};

const activityValues = () => {
  const list = bowItem().system?.activities;
  if (!list) return [];
  if (typeof list.values === "function") return [...list.values()];
  return Object.values(list);
};

const findActivity = (identifier) => activityValues().find((a) => {
  const id = String(a.identifier ?? a.midiProperties?.identifier ?? "").toLowerCase();
  return id === identifier;
});

const confirmDialog = (title, content, yesLabel, noLabel) => new Promise((resolve) => {
  let settled = false;
  const done = (v) => { if (!settled) { settled = true; resolve(v); } };
  new Dialog({
    title,
    content: `<p>${content}</p>`,
    buttons: {
      yes: { icon: '<i class="fas fa-check"></i>', label: yesLabel, callback: () => done(true) },
      no: { icon: '<i class="fas fa-times"></i>', label: noLabel, callback: () => done(false) },
    },
    default: "yes",
    close: () => done(false),
  }).render(true);
});

const blankDuration = () => ({
  startTime: null,
  seconds: null,
  combat: null,
  rounds: null,
  turns: null,
  startRound: null,
  startTurn: null,
});

const speedZeroChanges = () => ["walk", "fly", "swim", "climb", "burrow"].map((move) => ({
  key: `system.attributes.movement.${move}`,
  mode: CONST?.ACTIVE_EFFECT_MODES?.OVERRIDE ?? 5,
  value: "0",
  priority: 20,
}));

const createEffect = async (targetActor, data) => {
  const [created] = await targetActor.createEmbeddedDocuments("ActiveEffect", [data]);
  return created;
};

const deleteNamed = async (targetActor, predicate) => {
  const stale = effectList(targetActor).filter(predicate);
  if (!stale.length) return;
  await targetActor.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
};

const applyGuardLock = async () => {
  await deleteNamed(actorDoc, (ef) => foundry.utils.getProperty(ef, "flags.world.hbg.guardLocked") === true);
  await createEffect(actorDoc, {
    name: "Wyvernpiercer (Guard locked)",
    img: item.img,
    origin: item.uuid,
    transfer: false,
    disabled: false,
    duration: blankDuration(),
    changes: [],
    flags: {
      dae: {
        specialDuration: ["turnStartSource"],
        stackable: "noneName",
        showIcon: true,
      },
      world: { hbg: { guardLocked: true } },
    },
  });
};

const applySlow = async (targets) => {
  const applied = [];
  for (const tok of targets) {
    const targetActor = tok.actor;
    if (!targetActor) continue;
    const already = effectList(targetActor).some((ef) =>
      !ef.disabled && foundry.utils.getProperty(ef, "flags.world.hbg.isSlow") === true,
    );
    if (already) continue;
    await createEffect(targetActor, {
      name: "Slowed (Heavy Bowgun)",
      img: "icons/skills/movement/feet-bladed-boots-fire.webp",
      origin: item.uuid,
      transfer: false,
      disabled: false,
      duration: blankDuration(),
      changes: [{
        key: "system.attributes.movement.walk",
        mode: CONST?.ACTIVE_EFFECT_MODES?.ADD ?? 2,
        value: "-10",
        priority: 20,
      }],
      flags: {
        dae: {
          specialDuration: ["turnStartSource"],
          stackable: "noneName",
          showIcon: true,
        },
        world: { hbg: { isSlow: true } },
      },
    });
    applied.push(targetActor.name);
  }
  if (!applied.length) return;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: `<div class="dnd5e2"><p><strong>Mastery (Slow):</strong> ${esc(applied.join(", "))} speed is reduced by 10 feet until the start of your next turn. Dismiss the effect if you choose not to slow them.</p></div>`,
  });
};

const clusterFormula = () => {
  const burst = findActivity("cluster-burst");
  const part = burst?.damage?.parts?.[0];
  const n = Number(part?.number ?? (tierKey() === "veryrare" || tierKey() === "legendary" ? 3 : 2));
  const den = Number(part?.denomination ?? 6);
  return `${Number.isFinite(n) && n > 0 ? n : 2}d${Number.isFinite(den) && den > 0 ? den : 6}`;
};

const tokensNear = (center) => {
  const origin = asToken(center);
  const found = new Map();
  if (origin?.id) found.set(origin.id, origin);
  const pool = canvas?.tokens?.placeables ?? [];
  for (const tok of pool) {
    if (!tok?.actor || !tok.id) continue;
    if (distanceFt(origin, tok) <= 5) found.set(tok.id, tok);
  }
  return [...found.values()];
};

const applyClusterBurst = async (centers) => {
  const formula = clusterFormula();
  const roll = await new Roll(`${formula}[fire]`).evaluate();
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    flavor: `Cluster Ammo — ${formula} fire (5 ft)`,
  });
  const damaged = new Map();
  for (const center of centers) {
    for (const tok of tokensNear(center)) damaged.set(tok.id, tok);
  }
  const tokens = [...damaged.values()];
  const total = Number(roll.total ?? 0);
  try {
    if (typeof MidiQOL?.applyTokenDamage === "function") {
      await MidiQOL.applyTokenDamage(
        [{ type: "fire", damage: total }],
        total,
        new Set(tokens),
        item,
        new Set(),
      );
    } else {
      for (const tok of tokens) {
        if (tok.actor?.applyDamage) await tok.actor.applyDamage(total, { type: "fire" });
      }
    }
  } catch (err) {
    console.error("Heavy Bowgun cluster burst", err);
    for (const tok of tokens) {
      if (tok.actor?.applyDamage) await tok.actor.applyDamage(total, { type: "fire" });
    }
  }
  const names = tokens.map((t) => t.name).filter(Boolean).join(", ");
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: `<div class="dnd5e2"><p><strong>Cluster Ammo</strong> explodes for <strong>${total}</strong> fire (${esc(formula)}) — ${esc(names || "no creatures")}.</p></div>`,
  });
};

const saveTotalFor = (tok) => {
  const tid = tok?.id ?? tok?.document?.id;
  const tuuid = tok?.document?.uuid ?? tok?.uuid;
  const same = (t) => Boolean(t) && ((t.id ?? t.document?.id) === tid || (t.document?.uuid ?? t.uuid) === tuuid);
  for (const row of workflow?.saveDisplayData ?? []) {
    if (!same(row?.target) && row?.tokenUuid !== tuuid) continue;
    const total = Number(row?.rollTotal ?? row?.total);
    if (Number.isFinite(total)) return total;
  }
  for (const row of workflow?.saveRolls ?? []) {
    const rowUuid = row?.options?.tokenUuid ?? row?.data?.tokenUuid;
    if (!same(row?.target ?? row?.token) && rowUuid !== tuuid) continue;
    const total = Number(row?.total ?? row?.roll?.total);
    if (Number.isFinite(total)) return total;
  }
  return null;
};

const failedSaveTokens = () => {
  const failed = [...(workflow?.failedSaves ?? [])].map(asToken).filter(Boolean);
  if (failed.length) return failed;
  const saved = new Set([...(workflow?.saves ?? [])].map((t) => t.id ?? t.document?.id));
  return [...(workflow?.targets ?? [])].map(asToken).filter((t) => t && !saved.has(t.id));
};

const findAttackTotal = () => {
  const opts = args?.[0]?.workflowOptions ?? workflow?.workflowOptions ?? {};
  const direct = Number(opts.attackTotal ?? opts.attackRollTotal ?? args?.[0]?.attackTotal);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const srcId = opts.triggeredWorkflowId ?? opts.sourceWorkflowId ?? opts.workflowId ?? opts.attackWorkflowId;
  if (srcId && globalThis.MidiQOL?.Workflow?.getWorkflow) {
    const atk = MidiQOL.Workflow.getWorkflow(srcId);
    const t = Number(atk?.attackTotal ?? atk?.attackRoll?.total);
    if (Number.isFinite(t) && t > 0) return t;
  }
  const reacted = Number(workflow?.attackTotal ?? workflow?.attackRoll?.total);
  if (Number.isFinite(reacted) && reacted > 0) return reacted;
  return null;
};

const poisonOvertime = (dc) => ({
  turn: "end",
  label: "Poison Ammo",
  saveAbility: "con",
  saveDC: String(dc),
  saveRemove: true,
});

const stampPoison = async () => {
  const dc = ammoDc();
  for (const tok of failedSaveTokens()) {
    const targetActor = tok.actor;
    if (!targetActor) continue;
    let ef = effectList(targetActor).find((e) =>
      e.name === "Ammo: Poisoned" || foundry.utils.getProperty(e, "flags.world.hbg.isPoisonAmmo") === true,
    );
    if (!ef) {
      ef = await createEffect(targetActor, {
        name: "Ammo: Poisoned",
        img: "systems/dnd5e/icons/svg/statuses/poisoned.svg",
        origin: item.uuid,
        transfer: false,
        disabled: false,
        statuses: ["poisoned"],
        duration: { ...blankDuration(), seconds: 60, rounds: 10 },
        changes: [],
        flags: {
          dae: { specialDuration: [], stackable: "noneName", showIcon: true },
          world: { hbg: { isPoisonAmmo: true } },
          "midi-qol": { overtime: poisonOvertime(dc) },
        },
      });
      continue;
    }
    await ef.update({
      "flags.world.hbg.isPoisonAmmo": true,
      "flags.midi-qol.overtime": poisonOvertime(dc),
    });
  }
};

const upgradeParalysis = async () => {
  const dc = Number(workflow?.saveDC ?? ammoDc());
  for (const tok of failedSaveTokens()) {
    const targetActor = tok.actor;
    if (!targetActor) continue;
    const total = saveTotalFor(tok);
    const hasIncap = effectList(targetActor).some((ef) =>
      ef.name === "Ammo: Incapacitated" || foundry.utils.getProperty(ef, "flags.world.hbg.isParalysisIncap") === true,
    );
    if (!hasIncap && !Number.isFinite(total)) {
      await createEffect(targetActor, {
        name: "Ammo: Incapacitated",
        img: "systems/dnd5e/icons/svg/statuses/incapacitated.svg",
        origin: item.uuid,
        transfer: false,
        disabled: false,
        statuses: ["incapacitated"],
        duration: blankDuration(),
        changes: speedZeroChanges(),
        flags: {
          dae: { specialDuration: ["turnEndSource"], stackable: "noneName", showIcon: true },
          world: { hbg: { isParalysisIncap: true } },
        },
      });
    }
    if (!Number.isFinite(total)) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
        content: `<div class="dnd5e2"><p><em>Paralysis Ammo:</em> could not read the save for ${esc(targetActor.name)}. If it failed by 5 or more, replace Incapacitated with Paralyzed.</p></div>`,
      });
      continue;
    }
    if (dc - total < 5) continue;
    await deleteNamed(targetActor, (ef) =>
      ef.name === "Ammo: Incapacitated" || foundry.utils.getProperty(ef, "flags.world.hbg.isParalysisIncap") === true,
    );
    await createEffect(targetActor, {
      name: "Ammo: Paralyzed",
      img: "systems/dnd5e/icons/svg/statuses/paralyzed.svg",
      origin: item.uuid,
      transfer: false,
      disabled: false,
      statuses: ["paralyzed"],
      duration: blankDuration(),
      changes: speedZeroChanges(),
      description: "<p>Paralyzed until the end of the attacker's next turn.</p>",
      flags: {
        dae: { specialDuration: ["turnEndSource"], stackable: "noneName", showIcon: true },
        world: { hbg: { isParalysisParalyzed: true } },
      },
    });
  }
};

const handleStickyEscape = async () => {
  const tok = firstTargetToken();
  const targetActor = tok?.actor;
  if (!targetActor) return abort("Heavy Bowgun: select the restrained creature.");
  const ef = effectList(targetActor).find((e) =>
    !e.disabled && (
      e.name === "Ammo: Restrained"
      || foundry.utils.getProperty(e, "flags.world.hbg.isStickyAmmo") === true
    ),
  );
  if (!ef) return abort(`${targetActor.name} is not restrained by Sticky Ammo.`);
  const dc = ammoDc();
  const mod = Number(targetActor.system?.abilities?.str?.mod ?? 0);
  const roll = await new Roll(`1d20 + ${mod}`).evaluate();
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: targetActor }),
    flavor: `Escape Sticky Ammo (DC ${dc}) — uses the creature's action`,
  });
  if (Number(roll.total) >= dc) {
    await targetActor.deleteEmbeddedDocuments("ActiveEffect", [ef.id]);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: `<div class="dnd5e2"><p>${esc(targetActor.name)} breaks free of Sticky Ammo.</p></div>`,
    });
  }
  return true;
};

const handleGuard = async () => {
  const die = guardDie();
  const roll = await new Roll(die).evaluate();
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    flavor: `Guard — ${die} AC`,
  });
  const bonus = Number(roll.total ?? 0);
  await deleteNamed(actorDoc, (ef) => foundry.utils.getProperty(ef, "flags.world.hbg.isGuardAc") === true);
  await createEffect(actorDoc, {
    name: `Guard (+${bonus} AC)`,
    img: "icons/skills/melee/shield-block-gray-orange.webp",
    origin: item.uuid,
    transfer: false,
    disabled: false,
    duration: blankDuration(),
    changes: [{
      key: "system.attributes.ac.bonus",
      mode: CONST?.ACTIVE_EFFECT_MODES?.ADD ?? 2,
      value: String(bonus),
      priority: 20,
    }],
    flags: {
      dae: {
        specialDuration: ["isAttacked"],
        stackable: "noneName",
        showIcon: true,
      },
      world: { hbg: { isGuardAc: true } },
    },
  });
  const mark = turnMark() ?? "nocombat";
  await actorDoc.setFlag("world", "hbg.usedGuardTurn", mark);
  const attackTotal = findAttackTotal();
  const ac = Number(actorDoc.system?.attributes?.ac?.value);
  let causedMiss = false;
  if (Number.isFinite(attackTotal) && Number.isFinite(ac)) {
    causedMiss = attackTotal < ac;
  } else {
    causedMiss = await confirmDialog(
      "Guard",
      "Did Guard cause the triggering attack to miss?",
      "It missed",
      "It still hit",
    );
  }
  await actorDoc.setFlag("world", "hbg.guardCausedMiss", causedMiss ? mark : null);
  const missText = causedMiss
    ? "The attack misses."
    : (Number.isFinite(attackTotal) ? `The attack still hits (total ${attackTotal} vs AC ${ac}).` : "The attack still hits.");
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: `<div class="dnd5e2"><p><strong>${esc(actorDoc.name)}</strong> Guards: <strong>+${bonus} AC</strong> against the triggering attack. ${esc(missText)}</p></div>`,
  });

  const counter = findActivity("wyverncounter");
  if (!causedMiss || !counter || hasIgnitionMode()) return;
  if (foundry.utils.getProperty(actorDoc, "flags.world.hbg.usedWyvernheartTurn") === mark) return;
  if (ignitionValue() < 1 || magazineAvailable() < 1) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: `<div class="dnd5e2"><p>Wyverncounter is available only with 1 Ignition and 1 loaded round.</p></div>`,
    });
    return;
  }
  const fire = await confirmDialog(
    "Wyverncounter",
    "Guard caused the attack to miss. Spend 1 Ignition and 1 loaded round to attack that creature? This does not apply a special ammo effect. Within 15 feet it deals an extra 1d8 piercing.",
    "Wyverncounter",
    "Decline",
  );
  if (!fire) return;
  if (typeof counter.use === "function") await counter.use();
};

const requireLoadedRound = () => {
  if (magazineAvailable() <= 0) return abort("Heavy Bowgun: magazine empty — Reload first.");
  if (!loadedKey()) return abort("Heavy Bowgun: no ammo type loaded — use Reload.");
  return true;
};

const blockGuard = () => {
  const mark = turnMark();
  if (mark && foundry.utils.getProperty(actorDoc, "flags.world.hbg.usedWyvernheartTurn") === mark) {
    return abort("Heavy Bowgun: Guard cannot be used on a turn you used Wyvernheart.");
  }
  if (hasIgnitionMode()) return abort("Heavy Bowgun: Guard cannot be used during Ignition Mode.");
  if (guardLocked()) return abort("Heavy Bowgun: Guard is locked until the start of your next turn (Wyvernpiercer).");
  return true;
};

// ── preDamageRoll: bonus dice from an earlier hit / close Wyverncounter ─────
if (macroPass.includes("predamageroll")) {
  if (isWyvernheart) {
    const lastHit = foundry.utils.getProperty(actorDoc, "flags.world.hbg.hitThisTurn");
    if (lastHit && lastHit === turnMark()) addDamageBonus(`${heartDie()}[piercing]`);
  } else if (isWyverncounter && distanceFt(workflowToken(), firstTargetToken()) <= 15) {
    addDamageBonus("1d8[piercing]");
  }
  return;
}

// ── postActiveEffects: hits, conditions, guard, cluster ─────────────────────
if (macroPass.includes("postactiveeffects")) {
  if (isGuard) {
    await handleGuard();
    return;
  }
  if (isPoisonSave) {
    await stampPoison();
    return;
  }
  if (isParalysisSave) {
    await upgradeParalysis();
    return;
  }
  if (isStickyEscape || isReload || isIgnitionMode) return;

  const hits = hitCount();
  if (hits <= 0) return;
  await actorDoc.setFlag("world", "hbg.hitThisTurn", turnMark());
  await applySlow(hitTokens());
  if (isCluster) await applyClusterBurst(hitTokens());
  if (isWyvernheart || isWyverncounter || isWyvernpiercer) return;
  if (noIgnitionAmmo.has(fireAmmoKey)) return;
  await gainIgnition(hits);
  return;
}

// ── preambleComplete: spend Ignition once the shot is committed ─────────────
if (macroPass.includes("preamblecomplete")) {
  if (isSlicing) {
    const normal = Number(item.system?.range?.value ?? 100);
    const dist = distanceFt(workflowToken(), firstTargetToken());
    if (Number.isFinite(dist) && dist > normal) {
      if (workflow) {
        workflow.advantage = true;
        workflow.disadvantage = false;
        workflow.rollOptions = foundry.utils.mergeObject(workflow.rollOptions ?? {}, { advantage: true });
      }
      ui.notifications.info("Slicing Ammo: target is beyond normal range — advantage on the save.");
    }
    return;
  }
  if (isWyvernheart) {
    const mark = turnMark();
    if (mark) await actorDoc.setFlag("world", "hbg.usedWyvernheartTurn", mark);
    await spendIgnition(1);
    return;
  }
  if (isWyverncounter) {
    await spendIgnition(1);
    await actorDoc.setFlag("world", "hbg.guardCausedMiss", null);
    return;
  }
  if (isWyvernpiercer) {
    await spendIgnition(2);
    await applyGuardLock();
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: `<div class="dnd5e2"><p><strong>Wyvernpiercer:</strong> Guard cannot be used until the start of your next turn.</p></div>`,
    });
  }
  return;
}

if (macroPass && !macroPass.includes("pretargeting") && !macroPass.includes("preitemroll")) return;

if (isClusterBurst) return abort("Heavy Bowgun: the burst is applied when Cluster Ammo hits.");

// ── Sticky escape (special; the restrained creature spends its action) ──────
if (isStickyEscape) {
  await handleStickyEscape();
  return;
}

// ── Ignition Mode ───────────────────────────────────────────────────────────
if (isIgnitionMode) {
  if (hasIgnitionMode()) return abort("Heavy Bowgun: Ignition Mode is already active.");
  return;
}

// ── Guard gate ──────────────────────────────────────────────────────────────
if (isGuard) {
  if (!blockGuard()) return;
  return;
}

// ── Fire gate ───────────────────────────────────────────────────────────────
if (isFireActivity) {
  if (!requireLoadedRound()) return;
  if (isWyverncounter) {
    const mark = turnMark() ?? "nocombat";
    if (turnMark() && foundry.utils.getProperty(actorDoc, "flags.world.hbg.usedWyvernheartTurn") === mark) {
      return abort("Heavy Bowgun: Wyverncounter cannot be used on a turn you used Wyvernheart.");
    }
    if (hasIgnitionMode()) return abort("Heavy Bowgun: Wyverncounter cannot be used during Ignition Mode.");
    if (foundry.utils.getProperty(actorDoc, "flags.world.hbg.usedGuardTurn") !== mark
      || foundry.utils.getProperty(actorDoc, "flags.world.hbg.guardCausedMiss") !== mark) {
      return abort("Heavy Bowgun: Wyverncounter requires Guard to have caused the attack to miss this turn.");
    }
    if (ignitionValue() < 1) return abort("Heavy Bowgun: no Ignition — land a hit first.");
    return;
  }
  if (isWyvernpiercer) {
    if (actId === "wyvernpiercer-bonus" && !hasIgnitionMode()) {
      return abort("Heavy Bowgun: Wyvernpiercer as a Bonus Action requires Ignition Mode.");
    }
    if (ignitionValue() < 2) return abort("Heavy Bowgun: Wyvernpiercer spends 2 Ignition.");
    return;
  }
  if (isWyvernheart) {
    if (ignitionValue() < 1) return abort("Heavy Bowgun: no Ignition — land a hit first.");
    return;
  }
  if (fireAmmoKey && fireAmmoKey !== loadedKey()) {
    return abort(
      `Heavy Bowgun: magazine is loaded with ${AMMO_LABELS[loadedKey()] ?? loadedKey()}, not ${AMMO_LABELS[fireAmmoKey] ?? fireAmmoKey}. Reload to switch.`,
    );
  }
  return;
}

if (!isReload) return;

// ── Reload ──────────────────────────────────────────────────────────────────
const options = inventoryAmmoOptions();
if (!options.length) return abort("Heavy Bowgun: no unlocked ammo in inventory (quantity > 0).");

const currentLoaded = loadedKey();
const magMax = magazineMax();
const magAvail = magazineAvailable();

const optsHtml = options.map((o) => {
  const cap = capacityFor(o.key);
  const sameType = Boolean(currentLoaded && currentLoaded === o.key);
  const need = sameType ? Math.max(0, cap - magAvail) : cap;
  const selected = currentLoaded === o.key ? " selected" : "";
  const special = isSpecialAmmoKey(o.key) ? " [Special]" : "";
  const loadHint = sameType
    ? (need > 0 ? `top up ${need}/${cap}` : `full ${magAvail}/${cap}`)
    : `load ${Math.min(cap, o.qty)}/${cap}`;
  return `<option value="${esc(o.key)}"${selected}>${esc(o.label)}${special} — pack ${o.qty}, ${loadHint}</option>`;
}).join("");

const content = `
<form class="flexcol">
  <p>Magazine: <strong>${magAvail}/${magMax}</strong>${
    currentLoaded ? ` · loaded <em>${esc(AMMO_LABELS[currentLoaded] ?? currentLoaded)}</em>` : ""
  }${ignitionEnabled() ? ` · Ignition <strong>${ignitionValue()}/${ignitionMax()}</strong>` : ""}</p>
  <p>Same ammo type only spends rounds for empty slots. Switching ammo replaces the magazine.</p>
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
    title: "Reload — Magazine",
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

if (!chosenKey) return abort("Heavy Bowgun: reload cancelled.");

const pick = options.find((o) => o.key === chosenKey);
if (!pick) return abort("Heavy Bowgun: invalid ammo selection.");

const cap = capacityFor(chosenKey);
if (cap <= 0) return abort("Heavy Bowgun: this ammo cannot be loaded at this tier.");

const sameType = Boolean(currentLoaded && currentLoaded === chosenKey);
const need = sameType ? Math.max(0, cap - magAvail) : cap;
if (sameType && need <= 0) return abort("Heavy Bowgun: magazine already full for this ammo.");

const loadAmt = Math.min(need, pick.qty);
if (loadAmt <= 0) return abort(`Heavy Bowgun: no rounds left in ${pick.label}.`);

const finalAvail = sameType ? magAvail + loadAmt : loadAmt;
const newSpent = Math.max(0, magMax - finalAvail);
const newQty = Math.max(0, Number(pick.item.system?.quantity ?? 0) - loadAmt);

await pick.item.update({ "system.quantity": newQty });
await bowItem().update({
  "system.uses.spent": newSpent,
  "flags.world.hbg.loadedAmmoKey": chosenKey,
});

const specialNote = isSpecialAmmoKey(chosenKey) ? ` Special Ammo capacity ${cap}.` : "";
const topUpNote = sameType ? " (top-up)" : "";
await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: `<div class="dnd5e2"><p><strong>${esc(actorDoc.name)}</strong> reloads the Heavy Bowgun with <em>${esc(pick.label)}</em>${topUpNote}.</p><p>Magazine <strong>${finalAvail}/${magMax}</strong> · spent ${loadAmt} from inventory (${newQty} left).${specialNote}</p></div>`,
});
