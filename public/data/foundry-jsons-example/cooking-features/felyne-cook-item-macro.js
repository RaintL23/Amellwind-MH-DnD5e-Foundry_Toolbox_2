// Felyne Cook — Request Meal (Rank 1) — GM handoff entry
// MidiQOL 12.4 / Foundry v12 / dnd5e 4.4
// On Use: [postActiveEffects]ItemMacro
// Activity identifier: request-meal
//
// Also registers kitchen-aura hooks (grant Ask feature to nearby PCs).

/* @@AURA_HOOKS@@ */

const RANGE_FT = 10;
const PLAYER_FLOW_SOURCE = /* @@PLAYER_FLOW_JSON@@ */ "";

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

const dialogForm = (title, content, okLabel = "Continue") => new Promise((resolve) => {
  let settled = false;
  const finish = (value) => {
    if (settled) return;
    settled = true;
    resolve(value);
  };

  new Dialog({
    title,
    content,
    buttons: {
      ok: {
        icon: '<i class="fas fa-check"></i>',
        label: okLabel,
        callback: (html) => finish(html[0].querySelector("form")),
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => finish(null),
      },
    },
    default: "ok",
    close: () => finish(null),
  }, { width: 460 }).render(true);
});

const measureDistanceFt = (tokenA, tokenB) => {
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

const getCookToken = (cookActor, workflowToken) => {
  if (workflowToken?.actor?.id === cookActor.id) return workflowToken;
  const controlled = canvas.tokens?.controlled?.find((t) => t.actor?.id === cookActor.id);
  if (controlled) return controlled;
  return canvas.tokens?.placeables?.find((t) => t.actor?.id === cookActor.id) ?? null;
};

const getNearbyHunters = (cookToken) => {
  const list = [];
  for (const t of canvas.tokens?.placeables ?? []) {
    if (t.id === cookToken.id) continue;
    const a = t.actor;
    if (!a || a.type !== "character") continue;
    const dist = measureDistanceFt(cookToken, t);
    if (dist <= RANGE_FT + 1e-6) {
      list.push({ token: t, actor: a, distance: Math.round(dist * 10) / 10 });
    }
  }
  list.sort((x, y) => x.distance - y.distance || x.actor.name.localeCompare(y.actor.name));
  return list;
};

const getOwnerUserIds = (actorDoc) => {
  const ids = new Set();
  for (const user of game.users ?? []) {
    if (user.isGM) continue;
    if (actorDoc.testUserPermission?.(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) {
      ids.add(user.id);
    }
  }
  return [...ids];
};

const buildPlayerMacroCommand = ({ cookActorUuid, callerUuid, handoffMacroId }) => `
// Felyne Cook — player handoff (auto-generated)
const COOK_UUID = ${JSON.stringify(cookActorUuid)};
const CALLER_UUID = ${JSON.stringify(callerUuid)};
const HANDOFF_MACRO_ID = ${JSON.stringify(handoffMacroId ?? "")};
// GM handoff: complimentary cook-in (no pouch charge).
const MEAL_PRICE_GP = 2;
const CHARGE_FOR_MEAL = false;

const cookActor = await fromUuid(COOK_UUID);
const caller = await fromUuid(CALLER_UUID);
if (!cookActor || !caller) {
  ui.notifications.error("Felyne Cook: could not resolve cook or hunter, nya…");
  return;
}

const isCallerOwner = caller.isOwner || game.user.isGM;
if (!isCallerOwner) {
  ui.notifications.warn("Felyne Cook: only the chosen hunter (or GM) can run this handoff, meow!");
  return;
}

${PLAYER_FLOW_SOURCE}
`.trim();

// ── Activity entry (GM starts the handoff) ───────────────────────────────────
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

const isRequestMeal =
  actId === "request-meal"
  || actName === "request meal"
  || actName.includes("request meal")
  || actName.includes("cook a meal");

if (!isRequestMeal && macroPass) return;

const cookActor = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!cookActor) {
  ui.notifications.warn("Felyne Cook: cook actor not found.");
  return;
}

if (!game.user.isGM) {
  ui.notifications.warn("Felyne Cook: the GM chooses which nearby hunter may cook.");
  return;
}

// Ensure nearby PCs have Ask for a Meal before handing off.
try {
  await globalThis.__amellwindFelyneCookAura?.syncKitchenFeatures?.({ notify: false });
} catch (_err) {
  // non-fatal
}

const workflowToken = typeof token !== "undefined" ? token : (workflow?.token ?? null);
const cookToken = getCookToken(cookActor, workflowToken);
if (!cookToken) {
  ui.notifications.warn("Felyne Cook: place the cook's token on the scene first.");
  return;
}

const nearby = getNearbyHunters(cookToken);
if (!nearby.length) {
  ui.notifications.warn(`Felyne Cook: no hunters within ${RANGE_FT} ft.`);
  return;
}

const options = nearby.map(({ actor: a, distance, token: t }) => (
  `<option value="${esc(t.id)}">${esc(a.name)} — ${distance} ft</option>`
)).join("");

const form = await dialogForm(
  "Felyne Cook — Who's helpin' in the kitchen, nya?",
  `<form class="flexcol">
    <p><em>Hehe~ pick a buddy-pal within <strong>${RANGE_FT} ft</strong> to finish the cookin'!</em></p>
    <p>GM: that player continues the remaining steps (no gold charge on handoff).</p>
    <div class="form-group">
      <label>Hunter (within ${RANGE_FT} ft)</label>
      <select name="tokenId">${options}</select>
    </div>
  </form>`,
  "Hand off to player",
);
if (!form) return;

const selected = nearby.find((n) => n.token.id === form.tokenId.value);
if (!selected) {
  ui.notifications.warn("Felyne Cook: selected hunter not found.");
  return;
}

const meals = cookActor.items.filter((i) => {
  const cooking = foundry.utils.getProperty(i, "flags.world.cooking") ?? {};
  return Number(cooking.rank) === 1 && Boolean(cooking.mealKey);
});
if (!meals.length) {
  ui.notifications.error("Felyne Cook: no Rank 1 meals loaded on this NPC.");
  return;
}

const ownerUserIds = getOwnerUserIds(selected.actor);
const ownership = { default: 0 };
for (const u of game.users.filter((user) => user.isGM)) ownership[u.id] = 3;
for (const id of ownerUserIds) ownership[id] = 3;

const handoffMacro = await Macro.create({
  name: `Felyne Cook → ${selected.actor.name}`,
  type: "script",
  img: "icons/environment/settlement/tavern.webp",
  command: "// pending",
  ownership,
  flags: {
    world: {
      cooking: {
        handoff: true,
        cookActorUuid: cookActor.uuid,
        callerUuid: selected.actor.uuid,
      },
    },
  },
});

await handoffMacro.update({
  command: buildPlayerMacroCommand({
    cookActorUuid: cookActor.uuid,
    callerUuid: selected.actor.uuid,
    handoffMacroId: handoffMacro.id,
  }),
});

const whisperUsers = [
  ...ownerUserIds.map((id) => game.users.get(id)).filter(Boolean),
  ...game.users.filter((u) => u.isGM),
];

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: cookActor, token: cookToken.document }),
  whisper: whisperUsers.map((u) => u.id),
  content: `
    <div class="dnd5e2">
      <h3>${esc(cookActor.name)} — Ready to cook, nya!</h3>
      <p><em>Alrighty, buddy-pal <strong>${esc(selected.actor.name)}</strong> (${selected.distance} ft)! Let's get grill-cooking!</em></p>
      <p><em>${ownerUserIds.length
    ? "Player: open the handoff macro below, pick a meal, then roll the three checks."
    : "No player owner found — GM can run the handoff macro for this hunter."}</em></p>
      <p>@UUID[${handoffMacro.uuid}]{Continue cooking as ${esc(selected.actor.name)}}</p>
    </div>
  `,
});

ui.notifications.info(`Felyne Cook: handed off to ${selected.actor.name}, nya! Player should run the whispered macro.`);
