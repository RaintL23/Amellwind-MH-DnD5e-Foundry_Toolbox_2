// Hidden Detection — Item Macro (Foundry v12 / dnd5e 4.4 / MidiQOL + Item Macro)
// On Use: [preItemRoll]ItemMacro,[postActiveEffects]ItemMacro
// Activity identifier: configure-hidden-detection
//
// Suppresses the usage chat card, then opens Configure via the sync engine.
// Prefer the module script hook (dnd5e.preUseActivity) when Amellwind-MH-RaintDM-module
// is enabled — that path also covers Resource Node actors that strip Item Macro.

/* @@SYNC_ENGINE@@ */

(async () => {
  const macroPass = String(
    (typeof args !== "undefined" ? args?.[0]?.macroPass : "") ??
      (typeof workflow !== "undefined" ? workflow?.macroPass : "") ??
      "",
  ).toLowerCase();

  const wf =
    (typeof workflow !== "undefined" && workflow) ||
    (typeof args !== "undefined" ? args?.[0]?.workflow : null) ||
    null;

  const suppressChatCard = async () => {
    try {
      if (wf) {
        foundry.utils.setProperty(wf, "options.createMessage", false);
        foundry.utils.setProperty(wf, "workflowOptions.createMessage", false);
      }
      const uuid = wf?.itemCardUuid ?? args?.[0]?.itemCardUuid;
      const id = wf?.itemCardId ?? args?.[0]?.itemCardId;
      if (uuid) {
        const msg = await fromUuid(uuid);
        if (msg) {
          await msg.delete();
          return;
        }
      }
      if (id) await game.messages.get(id)?.delete();
    } catch (_err) {
      // optional
    }
  };

  if (macroPass.includes("preitemroll")) {
    await suppressChatCard();
    return;
  }

  if (macroPass && !macroPass.includes("postactiveeffects")) return;

  await suppressChatCard();
  setTimeout(() => {
    suppressChatCard();
  }, 50);
  setTimeout(() => {
    suppressChatCard();
  }, 250);

  try {
    const recent = [...game.messages].slice(-8);
    for (const msg of recent) {
      const content = String(msg.content ?? "");
      const flavor = String(msg.flavor ?? "");
      if (/Configure Hidden Detection/i.test(content) || /Configure Hidden Detection/i.test(flavor)) {
        if (msg.isAuthor || game.user.isGM) await msg.delete().catch(() => null);
      }
    }
  } catch (_err) {
    // optional
  }

  const featureItem =
    (typeof item !== "undefined" && item) ||
    wf?.item ||
    null;
  if (!featureItem) {
    ui.notifications.warn("Hidden Detection: feature item not found.");
    return;
  }

  await openConfigureDialog(featureItem);
})();
