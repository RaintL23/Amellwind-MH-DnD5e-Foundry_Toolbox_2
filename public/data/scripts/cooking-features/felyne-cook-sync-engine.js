// Felyne Cook Sync engine - Amellwind (Foundry v12 / dnd5e 4.4)
// Arms token double-click interaction (Item Piles-style) and exposes cooking API.
// Cooking UI lives in felyne-cook-player-flow.fragment.js (concatenated by build
// before this file when shipping the module client script).
// Wrapped in an IIFE so it can be safely concatenated into Item Macros.

(() => {
const NS = "__amellwindFelyneCook";
const FLAG = "flags.world.cooking";
const RANGE_FT = 10;
const MEAL_PRICE_GP_DEFAULT = 2;

const measureDistanceFt = (tokenA, tokenB) => {
  if (!tokenA || !tokenB) return Infinity;
  if (typeof MidiQOL?.computeDistance === "function") {
    try {
      const d = Number(MidiQOL.computeDistance(tokenA, tokenB, { wallsBlock: false }));
      if (Number.isFinite(d)) return d;
    } catch (_err) {
      // fall through
    }
  }
  if (typeof canvas.grid?.measurePath === "function") {
    const path = canvas.grid.measurePath([tokenA.center, tokenB.center]);
    const d = Number(path?.distance ?? path?.spaces);
    if (Number.isFinite(d)) return d;
  }
  const d = Number(canvas.grid.measureDistance(tokenA.center, tokenB.center, { gridSpaces: true }));
  return Number.isFinite(d) ? d : Infinity;
};

const isPcActor = (actorDoc) => {
  if (!actorDoc) return false;
  if (actorDoc.type === "character") return true;
  return game.users.some((u) => !u.isGM && actorDoc.testUserPermission?.(u, "OWNER"));
};

const isCookActor = (actorDoc) => {
  if (!actorDoc) return false;
  if (foundry.utils.getProperty(actorDoc, `${FLAG}.cookNpc`) === true) return true;
  if (foundry.utils.getProperty(actorDoc, `${FLAG}.isCookToken`) === true) return true;
  // LIMITED clients may not see items/flags — name fallback for the stock NPC.
  if (/^felyne cook$/i.test(String(actorDoc.name ?? "").trim())) return true;
  return actorDoc.items?.some?.(
    (i) => foundry.utils.getProperty(i, `${FLAG}.isKitchenAuraItem`) === true
      || foundry.utils.getProperty(i, `${FLAG}.requestMeal`) === true
      || foundry.utils.getProperty(i, `${FLAG}.playerRequestTemplate`) === true,
  ) === true;
};

const defaultCookCfg = () => ({
  cookNpc: true,
  isCookToken: true,
  enabled: true,
  interactionDistance: RANGE_FT,
  mealPriceGp: MEAL_PRICE_GP_DEFAULT,
});

const readCookFlag = (doc) => {
  if (!doc) return null;
  const f = foundry.utils.getProperty(doc, FLAG);
  if (!f || typeof f !== "object") return null;
  if (f.cookNpc === true || f.isCookToken === true) {
    return {
      cookNpc: true,
      isCookToken: true,
      enabled: f.enabled !== false,
      interactionDistance: Number.isFinite(Number(f.kitchenAuraFt ?? f.interactionDistance))
        ? Number(f.kitchenAuraFt ?? f.interactionDistance)
        : RANGE_FT,
      mealPriceGp: Number.isFinite(Number(f.mealPriceGp)) ? Number(f.mealPriceGp) : MEAL_PRICE_GP_DEFAULT,
    };
  }
  return null;
};

const resolveCookContext = (tokenPlaceable) => {
  const tokenDoc = tokenPlaceable?.document ?? null;
  const actorDoc = tokenPlaceable?.actor ?? null;
  const tokenName = String(tokenDoc?.name ?? tokenPlaceable?.name ?? "").trim();
  const cfg =
    readCookFlag(tokenDoc)
    ?? readCookFlag(actorDoc)
    ?? (isCookActor(actorDoc)
      ? {
          ...defaultCookCfg(),
          interactionDistance: Number(foundry.utils.getProperty(actorDoc, `${FLAG}.kitchenAuraFt`)) || RANGE_FT,
        }
      : null)
    // Player clients often cannot read LIMITED NPC flags/items — match token name.
    ?? (/^felyne cook$/i.test(tokenName) ? defaultCookCfg() : null);
  return { tokenDoc, actorDoc, cfg };
};

const isCookToken = (tokenPlaceable) => Boolean(resolveCookContext(tokenPlaceable).cfg?.enabled);

const limitedOwnershipLevel = () => CONST.DOCUMENT_OWNERSHIP_LEVELS?.OBSERVER
  ?? CONST.DOCUMENT_OWNERSHIP_LEVELS?.LIMITED
  ?? 2;

/**
 * Publish a player-readable cook marker on Actor + TokenDocuments and raise
 * default ownership to LIMITED so double-click works without OWNER.
 */
const syncPublicCookMarkers = async (cookActor, cfg = null) => {
  if (!cookActor || !(game.user.isGM || cookActor.isOwner)) return;
  const marker = {
    cookNpc: true,
    isCookToken: true,
    enabled: cfg?.enabled !== false,
    kitchenAuraFt: cfg?.interactionDistance ?? RANGE_FT,
    interactionDistance: cfg?.interactionDistance ?? RANGE_FT,
    mealPriceGp: cfg?.mealPriceGp ?? MEAL_PRICE_GP_DEFAULT,
  };

  const patch = { [`${FLAG}`]: marker };
  try {
    const limited = limitedOwnershipLevel();
    if ((cookActor.ownership?.default ?? 0) < limited) {
      patch.ownership = { ...(cookActor.ownership ?? {}), default: limited };
    }
    await cookActor.update(patch);
  } catch (_err) {
    // non-fatal
  }

  for (const tok of cookActor.getActiveTokens?.(false) ?? []) {
    try {
      await tok.document.update({ [FLAG]: marker });
    } catch (_err) {
      // optional
    }
  }
};

const publishAllCookMarkers = async () => {
  if (!game.user.isGM) return 0;
  let count = 0;
  for (const actor of game.actors ?? []) {
    if (!isCookActor(actor)) continue;
    const cfg = readCookFlag(actor) ?? {
      enabled: true,
      interactionDistance: Number(foundry.utils.getProperty(actor, `${FLAG}.kitchenAuraFt`)) || RANGE_FT,
      mealPriceGp: MEAL_PRICE_GP_DEFAULT,
    };
    const limited = limitedOwnershipLevel();
    const needsOwnership = (actor.ownership?.default ?? 0) < limited;
    const needsActorFlag = !readCookFlag(actor)?.isCookToken;
    let needsTokenFlag = false;
    for (const tok of actor.getActiveTokens?.(false) ?? []) {
      if (!readCookFlag(tok.document)?.isCookToken) {
        needsTokenFlag = true;
        break;
      }
    }
    if (needsOwnership || needsActorFlag || needsTokenFlag) {
      await syncPublicCookMarkers(actor, cfg);
      count += 1;
    }
  }
  return count;
};

const resolveHunterActor = (cookActor = null, cookToken = null) => {
  const cookId = cookActor?.id ?? null;

  const ownedTokens = (canvas.tokens?.placeables ?? []).filter(
    (t) => t?.actor && isPcActor(t.actor) && t.actor.isOwner && t.actor.id !== cookId,
  );

  if (ownedTokens.length >= 1) {
    if (game.user.character) {
      const assigned = ownedTokens.find((t) => t.actor.id === game.user.character.id);
      if (assigned) return assigned.actor;
    }
    if (ownedTokens.length === 1 || !cookToken) {
      return ownedTokens[0].actor;
    }
    let best = ownedTokens[0];
    let bestDist = measureDistanceFt(best, cookToken);
    for (let i = 1; i < ownedTokens.length; i += 1) {
      const t = ownedTokens[i];
      const d = measureDistanceFt(t, cookToken);
      if (d < bestDist) {
        best = t;
        bestDist = d;
      }
    }
    return best.actor;
  }

  if (game.user.character && isPcActor(game.user.character) && game.user.character.id !== cookId) {
    return game.user.character;
  }

  const controlled = (canvas.tokens?.controlled ?? [])
    .map((t) => t.actor)
    .filter((a) => a && isPcActor(a) && a.id !== cookId);
  if (controlled.length >= 1) {
    return controlled.find((a) => a.isOwner) ?? (game.user.isGM ? controlled[0] : null);
  }

  return null;
};

const openCookMenu = async ({ cookToken, hunterActor, chargeForMeal = true } = {}) => {
  const ctx = cookToken ? resolveCookContext(cookToken) : null;
  let cookActor = cookToken?.actor ?? ctx?.actorDoc ?? null;
  const cfg = ctx?.cfg;
  if (!cfg?.enabled) {
    ui.notifications.warn("Felyne Cook: this token is not a camp kitchen.");
    return false;
  }
  if (!cookActor && cookToken?.document?.actorId) {
    cookActor = game.actors.get(cookToken.document.actorId) ?? null;
  }
  if (!cookActor && cookToken?.document?.actorUuid) {
    try {
      cookActor = await fromUuid(cookToken.document.actorUuid);
    } catch (_err) {
      cookActor = null;
    }
  }
  if (!cookActor) {
    ui.notifications.warn(
      "Felyne Cook: cannot read the cook actor. GM: set default ownership to Observer and re-place the token (or run Kitchen Sync).",
    );
    return false;
  }

  const hunter = hunterActor ?? resolveHunterActor(cookActor, cookToken);
  if (!hunter) {
    ui.notifications.warn(
      "Felyne Cook: place your character token on the scene within 10 ft (or assign a User Character), then double-click the cook again.",
    );
    return false;
  }
  if (!hunter.isOwner && !game.user.isGM) {
    ui.notifications.warn("Felyne Cook: you do not own that character.");
    return false;
  }

  const hunterToken =
    (canvas.tokens?.placeables ?? []).find((t) => t.actor?.id === hunter.id && t.actor?.isOwner)
    ?? hunter.getActiveTokens?.(true)?.[0]
    ?? null;

  const maxDist = cfg.interactionDistance ?? RANGE_FT;
  if (cookToken && hunterToken && maxDist > 0) {
    const dist = measureDistanceFt(hunterToken, cookToken);
    if (dist > maxDist + 1e-6) {
      ui.notifications.warn(
        `Felyne Cook: too far away (${Math.round(dist * 10) / 10} ft; need ≤ ${maxDist} ft), nya!`,
      );
      return false;
    }
  }

  const run = globalThis[NS]?.runCookingFlow;
  if (typeof run !== "function") {
    ui.notifications.error(
      "Felyne Cook: cooking UI missing. Enable the Amellwind module or re-import the cook actor.",
    );
    return false;
  }

  return run({
    cookActor,
    caller: hunter,
    chargeForMeal,
    mealPriceGp: cfg.mealPriceGp ?? MEAL_PRICE_GP_DEFAULT,
    handoffMacroId: "",
  });
};

const applyCookClickPermissions = (tokenPlaceable) => {
  const mim = tokenPlaceable?.mouseInteractionManager;
  if (!mim?.permissions || !isCookToken(tokenPlaceable)) return;
  mim.permissions.clickLeft = () => true;
  mim.permissions.clickLeft2 = () => true;
};

const refreshAllCookClickPermissions = () => {
  for (const tok of canvas.tokens?.placeables ?? []) {
    applyCookClickPermissions(tok);
  }
};

const handleCookTokenInteract = async (tokenPlaceable, event) => {
  const { actorDoc, cfg } = resolveCookContext(tokenPlaceable);
  if (!cfg?.enabled) return false;

  // Alt+double-click → normal actor sheet for GM only.
  if (event?.altKey) return false;

  // GM Shift+double-click always opens the cook sheet (meals / templates).
  if (game.user.isGM && event?.shiftKey) {
    actorDoc?.sheet?.render?.(true);
    return true;
  }

  const hunter = resolveHunterActor(actorDoc, tokenPlaceable);
  if (!hunter && game.user.isGM) {
    actorDoc?.sheet?.render?.(true);
    return true;
  }

  await openCookMenu({
    cookToken: tokenPlaceable,
    hunterActor: hunter,
    chargeForMeal: true,
  });
  return true;
};

const ensureFelyneCookHooks = () => {
  globalThis[NS] = globalThis[NS] || {};
  Object.assign(globalThis[NS], {
    ensureFelyneCookHooks,
    openCookMenu,
    syncPublicCookMarkers,
    publishAllCookMarkers,
    resolveHunterActor,
    resolveCookContext,
    isCookActor,
    isCookToken,
    measureDistanceFt,
    RANGE_FT,
  });

  const wrapClick = () => {
    if (globalThis[NS].clickWrapped) return true;
    const proto = CONFIG.Token?.objectClass?.prototype;
    if (!proto || typeof proto._onClickLeft2 !== "function") return false;

    // Always chain via prototype patch. Resource Node already claims
    // libWrapper for this package + _onClickLeft2; a second register is a no-op/throw.
    const original = proto._onClickLeft2;
    proto._onClickLeft2 = function felyneCookOnClickLeft2(event) {
      try {
        if (isCookToken(this)) {
          if (event?.altKey && game.user.isGM) {
            return original.call(this, event);
          }
          event?.preventDefault?.();
          event?.stopPropagation?.();
          Promise.resolve(handleCookTokenInteract(this, event)).catch((err) => {
            console.error("Felyne Cook click handler error", err);
            ui.notifications?.error?.(`Felyne Cook: ${err?.message || err}`);
          });
          return false;
        }
      } catch (err) {
        console.error("Felyne Cook click handler error", err);
        ui.notifications?.error?.(`Felyne Cook: ${err?.message || err}`);
      }
      return original.call(this, event);
    };

    globalThis[NS].clickWrapped = true;
    console.log("Amellwind Felyne Cook | _onClickLeft2 wrapped");
    return true;
  };

  const armInteraction = () => {
    const wrapped = wrapClick();
    refreshAllCookClickPermissions();
    return wrapped;
  };

  if (!globalThis[NS].hooksReady) {
    globalThis[NS].hooksReady = true;

    Hooks.on("canvasReady", () => {
      armInteraction();
    });
    Hooks.on("refreshToken", (token) => {
      applyCookClickPermissions(token);
    });
    Hooks.on("createToken", (tokenDoc) => {
      const placeable = tokenDoc?.object;
      if (placeable) applyCookClickPermissions(placeable);
    });

    Hooks.on("renderActorSheet", (app) => {
      try {
        const actorDoc = app.actor;
        if (!isCookActor(actorDoc) && !readCookFlag(actorDoc)) return;
        // Opening the cook sheet also (re)arms interaction — useful after JSON import.
        armInteraction();
        if (game.user.isGM) {
          Promise.resolve(syncPublicCookMarkers(actorDoc, readCookFlag(actorDoc))).catch(() => null);
          return;
        }
        // Players opening the cook sheet are redirected to the kitchen menu.
        setTimeout(() => {
          app.close?.();
          const tok = actorDoc.getActiveTokens?.(true)?.[0] ?? null;
          openCookMenu({ cookToken: tok, chargeForMeal: true });
        }, 0);
      } catch (_err) {
        // optional
      }
    });
  }

  armInteraction();
  // Token class may not exist yet during early boot — retry shortly.
  if (!globalThis[NS].clickWrapped) {
    Hooks.once("ready", () => {
      armInteraction();
      if (canvas?.ready) armInteraction();
    });
    setTimeout(() => armInteraction(), 250);
    setTimeout(() => armInteraction(), 1500);
  }

  return globalThis[NS];
};


  ensureFelyneCookHooks();
})();
