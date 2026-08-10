// Resource Node — Item Macro (Foundry v12 / dnd5e 4.4 / MidiQOL + Item Macro)
// On Use: [preItemRoll]ItemMacro,[postActiveEffects]ItemMacro
// Activities:
//   configure-resource-node — GM configuration dialog
//   gather-resource — open gather UI for a selected PC
//
// Saving Configure / running Sync arms token double-click hooks.

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

  const rolled =
    (typeof args !== "undefined" ? args?.[0]?.activity : null)
    || wf?.activity
    || null;

  const actMidi = rolled?.midiProperties ?? wf?.activity?.midiProperties ?? {};
  const actId = String(
    rolled?.identifier
      ?? actMidi?.identifier
      ?? wf?.activity?.identifier
      ?? rolled?.name
      ?? wf?.activity?.name
      ?? "",
  )
    .toLowerCase()
    .trim();
  const actName = String(rolled?.name ?? wf?.activity?.name ?? "").toLowerCase();

  const isConfigure =
    actId.includes("configure-resource-node")
    || actId.includes("configure")
    || actName.includes("configure resource node");
  const isGather =
    actId.includes("gather-resource")
    || actId.includes("gather")
    || actName.includes("gather resource");

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
      if (
        /Configure Resource Node/i.test(content)
        || /Configure Resource Node/i.test(flavor)
        || /Gather Resource/i.test(content)
        || /Gather Resource/i.test(flavor)
      ) {
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
    ui.notifications.warn("Resource Node: feature item not found.");
    return;
  }

  ensureResourceNodeHooks();

  if (isGather && !isConfigure) {
    const nodeActor = featureItem.actor ?? featureItem.parent;
    const nodeToken =
      nodeActor?.getActiveTokens?.(true)?.[0]
      ?? (typeof token !== "undefined" ? token : null)
      ?? null;
    await openGatherDialog({ nodeToken, featureItem });
    return;
  }

  // Default / Configure activity
  await openConfigureDialog(featureItem);
})();
