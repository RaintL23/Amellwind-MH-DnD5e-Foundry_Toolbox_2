// Ask the Felyne Cook — player-owned feature (granted by kitchen aura)
// MidiQOL 12.4 / Foundry v12 / dnd5e 4.4
// On Use: [postActiveEffects]ItemMacro
// Activity identifier: ask-felyne-cook

/* @@AURA_HOOKS@@ */

const ASK_RANGE_FT = 10;
const HANDOFF_MACRO_ID = "";

const measureAskDistanceFt = (tokenA, tokenB) => {
  if (!tokenA || !tokenB) return Infinity;
  if (typeof MidiQOL?.computeDistance === "function") {
    const d = Number(MidiQOL.computeDistance(tokenA, tokenB, { wallsBlock: false }));
    if (Number.isFinite(d)) return d;
  }
  if (typeof canvas.grid.measurePath === "function") {
    const path = canvas.grid.measurePath([tokenA.center, tokenB.center]);
    const d = Number(path?.distance ?? path?.spaces);
    if (Number.isFinite(d)) return d;
  }
  const d = Number(canvas.grid.measureDistance(tokenA.center, tokenB.center, { gridSpaces: true }));
  return Number.isFinite(d) ? d : Infinity;
};

const findActorToken = (actorDoc) => {
  if (typeof token !== "undefined" && token?.actor?.id === actorDoc.id) return token;
  const controlled = canvas.tokens?.controlled?.find((t) => t.actor?.id === actorDoc.id);
  if (controlled) return controlled;
  return canvas.tokens?.placeables?.find((t) => t.actor?.id === actorDoc.id) ?? null;
};

const findNearestCook = (fromToken) => {
  let best = null;
  for (const t of canvas.tokens?.placeables ?? []) {
    const a = t.actor;
    const tokenFlag = foundry.utils.getProperty(t.document, "flags.world.cooking") ?? {};
    const actorFlag = foundry.utils.getProperty(a, "flags.world.cooking") ?? {};
    const isCook =
      tokenFlag.cookNpc === true
      || tokenFlag.isCookToken === true
      || actorFlag.cookNpc === true
      || actorFlag.isCookToken === true
      || /^felyne cook$/i.test(String(t.document?.name ?? a?.name ?? "").trim());
    if (!isCook) continue;
    if (a && a.type && a.type !== "npc" && a.type !== "character") continue;
    const dist = measureAskDistanceFt(fromToken, t);
    if (dist <= ASK_RANGE_FT + 1e-6 && (!best || dist < best.distance)) {
      best = { token: t, actor: a, distance: dist };
    }
  }
  return best;
};

const macroPass = String(
  args?.[0]?.macroPass
  ?? workflow?.macroPass
  ?? "",
).toLowerCase();

if (macroPass && !macroPass.includes("postactiveeffects")) return;

const rolled = (typeof rolledActivity !== "undefined" && rolledActivity)
  ? rolledActivity
  : (workflow?.activity ?? args?.[0]?.activity ?? null);

const actName = (rolled?.name ?? workflow?.activity?.name ?? "").toLowerCase();
const actId = String(rolled?.identifier ?? workflow?.activity?.identifier ?? "").toLowerCase();

const isAsk =
  actId === "ask-for-a-meal-rank-1"
  || actId === "ask-felyne-cook"
  || actName === "ask for a meal (rank 1)"
  || actName.includes("ask for a meal")
  || actName.includes("ask the felyne cook");

if (!isAsk && macroPass) return;

const caller = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!caller) {
  ui.notifications.warn("Felyne Cook: your character was not found.");
  return;
}

if (!(caller.isOwner || game.user.isGM)) {
  ui.notifications.warn("Felyne Cook: only the hunter's owner can ask for a meal.");
  return;
}

const callerToken = findActorToken(caller);
if (!callerToken) {
  ui.notifications.warn("Felyne Cook: place your token on the scene first.");
  return;
}

let cookActor = null;
const cookUuid = foundry.utils.getProperty(item, "flags.world.cooking.cookActorUuid");
if (cookUuid) cookActor = await fromUuid(cookUuid);

let cookToken = cookActor ? findActorToken(cookActor) : null;
if (!cookActor || !cookToken) {
  const near = findNearestCook(callerToken);
  if (!near) {
    ui.notifications.warn(`Felyne Cook: no cook within ${ASK_RANGE_FT} ft.`);
    return;
  }
  cookActor = near.actor;
  cookToken = near.token;
}

const dist = measureAskDistanceFt(callerToken, cookToken);
if (dist > ASK_RANGE_FT + 1e-6) {
  ui.notifications.warn(`Felyne Cook: you must stay within ${ASK_RANGE_FT} ft of the cook (currently ${Math.round(dist * 10) / 10} ft), nya!`);
  return;
}

// Paid Ask-for-a-Meal path (Rank 1 camp kitchen).
const MEAL_PRICE_GP = 2;
const CHARGE_FOR_MEAL = true;

/* @@PLAYER_FLOW_BODY@@ */
