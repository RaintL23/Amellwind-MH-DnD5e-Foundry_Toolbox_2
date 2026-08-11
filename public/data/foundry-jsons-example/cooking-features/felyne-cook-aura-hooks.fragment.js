// Felyne Cook — Kitchen Aura grant/revoke + distance sync (Foundry runtime)
// Grants "Ask for a Meal (Rank 1)" to characters within 10 ft of a cookNpc NPC.
// Wrapped in an IIFE so it can be concatenated with the token sync engine safely.

(() => {
  
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
  
  const resolveCookFromEffect = async (effect) => {
    if (!effect?.origin) return null;
    try {
      const origin = await fromUuid(effect.origin);
      if (!origin) return null;
      if (origin.documentName === "Actor") return origin;
      if (origin.documentName === "Item") return origin.actor ?? origin.parent ?? null;
      if (origin.documentName === "ActiveEffect") {
        const parent = origin.parent;
        if (!parent) return null;
        if (parent.documentName === "Actor") return parent;
        if (parent.documentName === "Item") return parent.actor ?? parent.parent ?? null;
      }
    } catch (_err) {
      return null;
    }
    return null;
  };
  
  const grantAskFeature = async (targetActor, cookActor) => {
    if (!targetActor || targetActor.type !== "character" || !cookActor) return false;
    if (targetActor.items.some((i) => foundry.utils.getProperty(i, "flags.world.cooking.playerRequest") === true)) {
      // Keep cook uuid fresh on existing feature.
      const existing = targetActor.items.find(
        (i) => foundry.utils.getProperty(i, "flags.world.cooking.playerRequest") === true,
      );
      if (existing && foundry.utils.getProperty(existing, "flags.world.cooking.cookActorUuid") !== cookActor.uuid) {
        await existing.update({ "flags.world.cooking.cookActorUuid": cookActor.uuid });
      }
      return false;
    }
  
    const template = cookActor.items.find(
      (i) => foundry.utils.getProperty(i, "flags.world.cooking.playerRequestTemplate") === true,
    );
    if (!template) {
      console.warn("Felyne Cook: Ask feature template missing on cook actor.");
      ui.notifications?.warn?.("Felyne Cook: Ask feature template missing on cook actor.");
      return false;
    }
  
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
    if (!targetActor) return false;
    const stale = targetActor.items.filter(
      (i) => foundry.utils.getProperty(i, "flags.world.cooking.fromAura") === true
        && foundry.utils.getProperty(i, "flags.world.cooking.playerRequest") === true,
    );
    if (!stale.length) return false;
    await targetActor.deleteEmbeddedDocuments("Item", stale.map((i) => i.id));
    return true;
  };
  
  const syncKitchenFeatures = async ({ notify = false } = {}) => {
    if (!game.user.isGM) return;
    if (game.users.activeGM && game.users.activeGM.id !== game.user.id) return;
    if (!canvas?.ready) return;
  
    const cookTokens = (canvas.tokens?.placeables ?? []).filter((t) => isCookActor(t.actor));
    const hunterTokens = (canvas.tokens?.placeables ?? []).filter((t) => t.actor?.type === "character");
  
    let granted = 0;
    let revoked = 0;
  
    for (const hunterTok of hunterTokens) {
      const hunter = hunterTok.actor;
      if (!hunter) continue;
  
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
      const hasAsk = hunter.items.some(
        (i) => foundry.utils.getProperty(i, "flags.world.cooking.playerRequest") === true,
      );
  
      if (inRange && !hasAsk) {
        if (await grantAskFeature(hunter, nearest)) granted += 1;
      } else if (!inRange && hasAsk) {
        if (await revokeAskFeature(hunter)) revoked += 1;
      } else if (inRange && hasAsk && nearest) {
        await grantAskFeature(hunter, nearest); // refresh cook uuid if needed
      }
    }
  
    if (notify) {
      ui.notifications.info(`Felyne Cook kitchen sync: +${granted} granted, −${revoked} removed.`);
    }
  
    // Refresh Active Auras visuals if available.
    try {
      const sceneId = canvas.scene?.id;
      if (game.modules.get("ActiveAuras")?.active && sceneId && globalThis.ActiveAuras?.CollateAuras) {
        await ActiveAuras.CollateAuras(sceneId, true, true, "felyne-cook-kitchen-sync");
      }
    } catch (_err) {
      // optional
    }
  };
  
  globalThis.__amellwindFelyneCookAura = globalThis.__amellwindFelyneCookAura || {};
  Object.assign(globalThis.__amellwindFelyneCookAura, {
    grantAskFeature,
    revokeAskFeature,
    resolveCookFromEffect,
    syncKitchenFeatures,
    RANGE_FT_AURA,
  });
  
  if (!globalThis.__amellwindFelyneCookAura.hooksReady) {
    globalThis.__amellwindFelyneCookAura.hooksReady = true;
  
    let syncTimer = null;
    const queueSync = () => {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        syncKitchenFeatures({ notify: false });
      }, 250);
    };
  
    Hooks.on("createActiveEffect", async (effect) => {
      if (!game.user.isGM) return;
      if (game.users.activeGM && game.users.activeGM.id !== game.user.id) return;
      if (foundry.utils.getProperty(effect, "flags.world.cooking.isKitchenAura") !== true) return;
  
      const targetActor = effect.parent;
      if (!targetActor || targetActor.documentName !== "Actor" || targetActor.type !== "character") return;
  
      const cookActor = (await resolveCookFromEffect(effect))
        || (canvas.tokens?.placeables ?? []).find((t) => isCookActor(t.actor))?.actor;
      if (!cookActor || cookActor.id === targetActor.id) return;
      await grantAskFeature(targetActor, cookActor);
    });
  
    Hooks.on("deleteActiveEffect", async (effect) => {
      if (!game.user.isGM) return;
      if (game.users.activeGM && game.users.activeGM.id !== game.user.id) return;
      if (foundry.utils.getProperty(effect, "flags.world.cooking.isKitchenAura") !== true) return;
      queueSync();
    });
  
    Hooks.on("canvasReady", () => queueSync());
    Hooks.on("createToken", () => queueSync());
    Hooks.on("deleteToken", () => queueSync());
    Hooks.on("updateToken", (_doc, changes) => {
      if ("x" in changes || "y" in changes || "elevation" in changes || "actorId" in changes) {
        queueSync();
      }
    });
  
    // If this fragment loads mid-session (macro use), sync immediately.
    if (canvas?.ready) queueSync();
  }

})();
