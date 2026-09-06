// Felyne Cook — Kitchen Sync
// Arms token double-click + aura grant sync for this session.
// Prefer enabling the Amellwind module (auto-arms on all clients).

/* @@PLAYER_FLOW@@ */

/* @@SYNC_ENGINE@@ */

/* @@AURA_HOOKS@@ */

try {
  globalThis.__amellwindFelyneCook?.ensureFelyneCookHooks?.();
} catch (err) {
  console.error("Felyne Cook | failed to arm token hooks", err);
}

if (game.user.isGM) {
  try {
    const n = await globalThis.__amellwindFelyneCook?.publishAllCookMarkers?.();
    if (n > 0) {
      console.log(`Felyne Cook | published markers for ${n} cook actor(s)`);
    }
  } catch (err) {
    console.error("Felyne Cook | marker publish failed", err);
  }

  try {
    await globalThis.__amellwindFelyneCookAura?.syncKitchenFeatures?.({ notify: true });
  } catch (err) {
    console.error("Felyne Cook | kitchen aura sync failed", err);
    ui.notifications.warn("Felyne Cook: aura sync failed (see console).");
  }
} else {
  ui.notifications.info("Felyne Cook: kitchen hooks armed on this client.");
}
