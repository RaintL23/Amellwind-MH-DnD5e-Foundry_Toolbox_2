// Import this Macro into Foundry and enable it to run as GM on world load
// (Advanced Macros / similar), OR just execute it once as GM after placing the cook.
//
// Grants/removes "Ask for a Meal (Rank 1)" for PCs within 10 ft of any Felyne Cook.

const RANGE_FT_AURA = 10;

const measureDistanceFtAura = (tokenA, tokenB) => {
  if (!tokenA || !tokenB) return Infinity;
  if (typeof MidiQOL?.computeDistance === "function") {
    const d = Number(MidiQOL.computeDistance(tokenA, tokenB, { wallsBlock: false }));
    if (Number.isFinite(d)) return d;
  }
  if (typeof canvas.grid?.measurePath === "function") {
    const path = canvas.grid.measurePath([tokenA.center, tokenB.center]);
    const d = Number(path?.distance ?? path?.spaces);
    if (Number.isFinite(d)) return d;
  }
  const d = Number(canvas.grid.measureDistance(tokenA.center, tokenB.center, { gridSpaces: true }));
  return Number.isFinite(d) ? d : Infinity;
};

const isCookActor = (actorDoc) => {
  if (!actorDoc) return false;
  if (foundry.utils.getProperty(actorDoc, "flags.world.cooking.cookNpc") === true) return true;
  return actorDoc.items?.some?.(
    (i) => foundry.utils.getProperty(i, "flags.world.cooking.isKitchenAuraItem") === true
      || foundry.utils.getProperty(i, "flags.world.cooking.playerRequestTemplate") === true,
  ) === true;
};

const grantAskFeature = async (targetActor, cookActor) => {
  if (!targetActor || targetActor.type !== "character" || !cookActor) return false;
  if (targetActor.items.some((i) => foundry.utils.getProperty(i, "flags.world.cooking.playerRequest") === true)) {
    return false;
  }
  const template = cookActor.items.find(
    (i) => foundry.utils.getProperty(i, "flags.world.cooking.playerRequestTemplate") === true,
  );
  if (!template) return false;
  const data = template.toObject();
  delete data._id;
  data.name = "Ask for a Meal (Rank 1)";
  data.effects = [];
  foundry.utils.setProperty(data, "flags.world.cooking.playerRequestTemplate", false);
  foundry.utils.setProperty(data, "flags.world.cooking.playerRequest", true);
  foundry.utils.setProperty(data, "flags.world.cooking.fromAura", true);
  foundry.utils.setProperty(data, "flags.world.cooking.cookActorUuid", cookActor.uuid);
  foundry.utils.setProperty(data, "system.identifier", "ask-for-a-meal-rank-1");
  await targetActor.createEmbeddedDocuments("Item", [data]);
  return true;
};

const revokeAskFeature = async (targetActor) => {
  const stale = targetActor.items.filter(
    (i) => foundry.utils.getProperty(i, "flags.world.cooking.fromAura") === true
      && foundry.utils.getProperty(i, "flags.world.cooking.playerRequest") === true,
  );
  if (!stale.length) return false;
  await targetActor.deleteEmbeddedDocuments("Item", stale.map((i) => i.id));
  return true;
};

const syncKitchenFeatures = async ({ notify = true } = {}) => {
  if (!game.user.isGM || !canvas?.ready) return;
  const cookTokens = canvas.tokens.placeables.filter((t) => isCookActor(t.actor));
  const hunterTokens = canvas.tokens.placeables.filter((t) => t.actor?.type === "character");
  let granted = 0;
  let revoked = 0;
  for (const hunterTok of hunterTokens) {
    const hunter = hunterTok.actor;
    let nearest = null;
    let nearestDist = Infinity;
    for (const cookTok of cookTokens) {
      const dist = measureDistanceFtAura(hunterTok, cookTok);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = cookTok.actor;
      }
    }
    const inRange = Boolean(nearest) && nearestDist <= RANGE_FT_AURA + 1e-6;
    const hasAsk = hunter.items.some((i) => foundry.utils.getProperty(i, "flags.world.cooking.playerRequest") === true);
    if (inRange && !hasAsk) {
      if (await grantAskFeature(hunter, nearest)) granted += 1;
    } else if (!inRange && hasAsk) {
      if (await revokeAskFeature(hunter)) revoked += 1;
    }
  }
  if (notify) ui.notifications.info(`Felyne Cook kitchen sync: +${granted} granted, −${revoked} removed.`);
};

if (!globalThis.__amellwindFelyneCookAura?.hooksReady) {
  // Load full hook suite from a sync-only registration
  globalThis.__amellwindFelyneCookAura = globalThis.__amellwindFelyneCookAura || {};
  globalThis.__amellwindFelyneCookAura.syncKitchenFeatures = syncKitchenFeatures;
}

await syncKitchenFeatures({ notify: true });

// Keep syncing on token moves for this session.
if (!globalThis.__amellwindFelyneCookAura?.bootMacroReady) {
  globalThis.__amellwindFelyneCookAura.bootMacroReady = true;
  let timer = null;
  const queue = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => syncKitchenFeatures({ notify: false }), 250);
  };
  Hooks.on("updateToken", (_d, ch) => {
    if ("x" in ch || "y" in ch || "elevation" in ch) queue();
  });
  Hooks.on("createToken", queue);
  Hooks.on("deleteToken", queue);
  Hooks.on("canvasReady", queue);
}
