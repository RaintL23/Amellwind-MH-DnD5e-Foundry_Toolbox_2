// Resource Node Sync — Amellwind (Foundry v12 / dnd5e 4.4)
// Run once as GM after placing resource nodes (or on world load via Advanced Macros).
// Prefer: open Configure on a Resource Node feature — that also arms hooks.

/* @@SYNC_ENGINE@@ */

ensureResourceNodeHooks();
if (game.user.isGM) {
  ui.notifications.info("Resource Node Sync: token interaction hooks armed for this session.");
}
