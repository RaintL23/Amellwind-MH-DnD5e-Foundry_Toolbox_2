// Hidden Detection — Item Macro (Foundry v12 / dnd5e 4.4 / MidiQOL + Item Macro)
// On Use: [preItemRoll]ItemMacro,[postActiveEffects]ItemMacro
// Activity identifier: configure-hidden-detection
//
// Opens a GM configuration dialog. Suppresses the usage chat card.
// Also arms Hidden Detection Sync hooks so proximity works without a separate macro.

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
        if (typeof wf.whisperCard === "function") {
          // no-op: just keep self/gm
        }
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

  // Kill the card as early as possible, then again after it may have been created.
  if (macroPass.includes("preitemroll")) {
    await suppressChatCard();
    // Continue so Midi can still fire postActiveEffects for the dialog.
    return;
  }

  if (macroPass && !macroPass.includes("postactiveeffects")) return;

  await suppressChatCard();
  // Chat card is often created just after preItemRoll — delete once more next tick.
  setTimeout(() => {
    suppressChatCard();
  }, 50);
  setTimeout(() => {
    suppressChatCard();
  }, 250);

  // Also scrub any recent public "Configure Hidden Detection" cards (safety net).
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

  if (!game.user.isGM) {
    ui.notifications.warn("Hidden Detection: only the GM can configure this feature.");
    return;
  }

  // Ensure flags exist even if the item was duplicated without world flags.
  if (foundry.utils.getProperty(featureItem, "flags.world.hiddenDetect.isFeature") !== true) {
    await featureItem.update({
      "flags.world.hiddenDetect": {
        isFeature: true,
        enabled: true,
        rangeFt: 30,
        detectMode: "skillCheck",
        skill: "prc",
        dc: 15,
        wallsBlock: false,
        allowRetryOnFail: false,
        revealToParty: false,
        whisperToGm: true,
        revealed: false,
        revealedBy: null,
        failedBy: [],
        inRangeBy: {},
        visibleToUsers: [],
      },
    });
  }

  ensureHiddenDetectHooks();

  const FLAG_PATH = "flags.world.hiddenDetect";
  const SKILL_OPTIONS = [
    ["prc", "Perception"],
    ["inv", "Investigation"],
    ["sur", "Survival"],
    ["nat", "Nature"],
    ["arc", "Arcana"],
    ["his", "History"],
    ["ins", "Insight"],
    ["med", "Medicine"],
    ["rel", "Religion"],
    ["ani", "Animal Handling"],
    ["ath", "Athletics"],
    ["acr", "Acrobatics"],
    ["slt", "Sleight of Hand"],
    ["ste", "Stealth"],
    ["dec", "Deception"],
    ["itm", "Intimidation"],
    ["per", "Persuasion"],
    ["prf", "Performance"],
  ];

  const readConfig = () => {
    const f = foundry.utils.getProperty(featureItem, FLAG_PATH) ?? {};
    return {
      enabled: f.enabled !== false,
      rangeFt: Number.isFinite(Number(f.rangeFt)) ? Number(f.rangeFt) : 30,
      detectMode: f.detectMode === "passivePerception" ? "passivePerception" : "skillCheck",
      skill: typeof f.skill === "string" && f.skill ? f.skill : "prc",
      dc: Number.isFinite(Number(f.dc)) ? Number(f.dc) : 15,
      wallsBlock: f.wallsBlock === true,
      allowRetryOnFail: f.allowRetryOnFail === true,
      revealToParty: f.revealToParty === true,
      whisperToGm: f.whisperToGm !== false,
      revealed: f.revealed === true,
      revealedBy: f.revealedBy ?? null,
      failedBy: Array.isArray(f.failedBy) ? f.failedBy : [],
      inRangeBy: f.inRangeBy && typeof f.inRangeBy === "object" ? f.inRangeBy : {},
      visibleToUsers: Array.isArray(f.visibleToUsers) ? f.visibleToUsers : [],
    };
  };

  const cfg = readConfig();
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

  const skillOptionsHtml = SKILL_OPTIONS.map(
    ([id, label]) =>
      `<option value="${esc(id)}" ${cfg.skill === id ? "selected" : ""}>${esc(label)} (${esc(id)})</option>`,
  ).join("");

  const hooksArmed = Boolean(globalThis.__amellwindHiddenDetect?.hooksReady);
  const content = `
    <form class="flexcol" style="gap:8px;">
      <p style="margin:0 0 4px;opacity:0.85;font-size:12px;">
        Hide this actor's token, configure below, then <strong>Save</strong>.
        Saving arms proximity detection for this session
        ${hooksArmed ? "(hooks already active)" : "(will arm hooks now)"}.
      </p>
      <div class="form-group">
        <label><input type="checkbox" name="enabled" ${cfg.enabled ? "checked" : ""}/> Enabled</label>
      </div>
      <div class="form-group">
        <label>Detection range (ft)</label>
        <input type="number" name="rangeFt" value="${esc(cfg.rangeFt)}" min="1" step="1"/>
      </div>
      <div class="form-group">
        <label>Detection mode</label>
        <select name="detectMode">
          <option value="skillCheck" ${cfg.detectMode === "skillCheck" ? "selected" : ""}>Skill check (roll)</option>
          <option value="passivePerception" ${cfg.detectMode === "passivePerception" ? "selected" : ""}>Passive Perception only</option>
        </select>
      </div>
      <div class="form-group">
        <label>Skill (skill-check mode)</label>
        <select name="skill">${skillOptionsHtml}</select>
      </div>
      <div class="form-group">
        <label>DC</label>
        <input type="number" name="dc" value="${esc(cfg.dc)}" min="1" step="1"/>
      </div>
      <div class="form-group">
        <label><input type="checkbox" name="wallsBlock" ${cfg.wallsBlock ? "checked" : ""}/> Walls block detection</label>
      </div>
      <div class="form-group">
        <label><input type="checkbox" name="allowRetryOnFail" ${cfg.allowRetryOnFail ? "checked" : ""}/> Allow retry after fail (leave &amp; re-enter)</label>
      </div>
      <div class="form-group">
        <label><input type="checkbox" name="revealToParty" ${cfg.revealToParty ? "checked" : ""}/> Reveal to whole party on first success</label>
      </div>
      <div class="form-group">
        <label><input type="checkbox" name="whisperToGm" ${cfg.whisperToGm ? "checked" : ""}/> Whisper skill checks to GM</label>
      </div>
      <p style="margin:6px 0 0;font-size:12px;opacity:0.8;">
        Status: ${cfg.revealed ? "<strong>Revealed</strong>" : "Hidden"}
        · Failed PCs: ${cfg.failedBy.length}
      </p>
    </form>
  `;

  const writeFlags = async (patch) => {
    const next = { ...readConfig(), ...patch, isFeature: true };
    await featureItem.update({ [FLAG_PATH]: next });
  };

  const parseForm = (html) => {
    const form = html[0].querySelector("form");
    const fd = new FormData(form);
    const rangeFt = Math.max(1, Number(fd.get("rangeFt")) || 30);
    const dc = Math.max(1, Number(fd.get("dc")) || 15);
    const detectMode = fd.get("detectMode") === "passivePerception" ? "passivePerception" : "skillCheck";
    const skill = String(fd.get("skill") || "prc");
    return {
      enabled: form.querySelector('[name="enabled"]')?.checked === true,
      rangeFt,
      detectMode,
      skill,
      dc,
      wallsBlock: form.querySelector('[name="wallsBlock"]')?.checked === true,
      allowRetryOnFail: form.querySelector('[name="allowRetryOnFail"]')?.checked === true,
      revealToParty: form.querySelector('[name="revealToParty"]')?.checked === true,
      whisperToGm: form.querySelector('[name="whisperToGm"]')?.checked === true,
    };
  };

  const rehideTokens = async () => {
    const actorDoc = featureItem.actor ?? featureItem.parent;
    if (!actorDoc) return;
    const tokens = actorDoc.getActiveTokens?.(true) ?? [];
    for (const tok of tokens) {
      const updates = { hidden: true };
      foundry.utils.setProperty(updates, "flags.world.hiddenDetect.visibleToUsers", []);
      await tok.document.update(updates);
    }
  };

  const armAndSync = async () => {
    ensureHiddenDetectHooks();
    const result = await syncHiddenDetection({ notify: true });
    return result;
  };

  // Arm hooks as soon as Configure opens (even before Save).
  await armAndSync();

  await new Promise((resolve) => {
    new Dialog({
      title: `Hidden Detection — ${featureItem.actor?.name ?? featureItem.name}`,
      content,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: "Save",
          callback: async (html) => {
            const formCfg = parseForm(html);
            await writeFlags({
              ...formCfg,
              revealed: cfg.revealed,
              revealedBy: cfg.revealedBy,
              failedBy: cfg.failedBy,
              inRangeBy: {},
              visibleToUsers: cfg.visibleToUsers,
            });
            await armAndSync();
            ui.notifications.info("Hidden Detection: saved and proximity sync armed.");
            resolve(true);
          },
        },
        resetAttempts: {
          icon: '<i class="fas fa-undo"></i>',
          label: "Reset attempts",
          callback: async (html) => {
            const formCfg = parseForm(html);
            await writeFlags({
              ...formCfg,
              revealed: cfg.revealed,
              revealedBy: cfg.revealedBy,
              failedBy: [],
              inRangeBy: {},
              visibleToUsers: cfg.visibleToUsers,
            });
            await armAndSync();
            ui.notifications.info("Hidden Detection: attempts reset.");
            resolve(true);
          },
        },
        resetReveal: {
          icon: '<i class="fas fa-eye-slash"></i>',
          label: "Reset reveal",
          callback: async (html) => {
            const formCfg = parseForm(html);
            await writeFlags({
              ...formCfg,
              revealed: false,
              revealedBy: null,
              failedBy: [],
              inRangeBy: {},
              visibleToUsers: [],
            });
            await rehideTokens();
            await armAndSync();
            ui.notifications.info("Hidden Detection: reveal reset; token(s) hidden again.");
            resolve(true);
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => resolve(false),
        },
      },
      default: "save",
      close: () => resolve(false),
    }, { width: 460 }).render(true);
  });
})();
