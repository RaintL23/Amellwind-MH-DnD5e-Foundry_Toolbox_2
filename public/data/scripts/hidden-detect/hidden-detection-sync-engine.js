// Hidden Detection Sync engine — Amellwind (Foundry v12 / dnd5e 4.4)
// Shared by the Sync macro, the Hidden Detection Feature Item Macro, and the
// module client script. Registers proximity hooks, Configure dialog, and
// skill check / Passive Perception resolution.
//
// Resource Node actors intentionally strip Item Macro from embedded features
// (payload size). Configure still works via this engine: module activity hook,
// Resource Node Configure button, or Sync / standalone Item Macro.

const NS = "__amellwindHiddenDetect";
const FLAG = "flags.world.hiddenDetect";

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

const escHtml = (value) => {
  const s = String(value ?? "");
  if (globalThis.Handlebars?.Utils?.escapeExpression) return Handlebars.Utils.escapeExpression(s);
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const measureDistanceFt = (tokenA, tokenB, { wallsBlock = false } = {}) => {
  if (!tokenA || !tokenB) return Infinity;
  if (typeof MidiQOL?.computeDistance === "function") {
    try {
      const d = Number(MidiQOL.computeDistance(tokenA, tokenB, { wallsBlock: Boolean(wallsBlock) }));
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

const gmWhisperIds = () => ChatMessage.getWhisperRecipients("GM").map((u) => u.id);

const readFeatureConfig = (featureItem) => {
  const f = foundry.utils.getProperty(featureItem, FLAG) ?? {};
  if (f.isFeature !== true && String(featureItem?.system?.identifier ?? "") !== "hidden-detection") {
    return null;
  }
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
    failedBy: Array.isArray(f.failedBy) ? [...f.failedBy] : [],
    inRangeBy: f.inRangeBy && typeof f.inRangeBy === "object" ? { ...f.inRangeBy } : {},
    visibleToUsers: Array.isArray(f.visibleToUsers) ? [...f.visibleToUsers] : [],
  };
};

const findHiddenFeature = (actorDoc) => {
  if (!actorDoc?.items) return null;
  return (
    actorDoc.items.find((i) => foundry.utils.getProperty(i, `${FLAG}.isFeature`) === true)
    ?? actorDoc.items.find((i) => String(i.system?.identifier ?? "") === "hidden-detection")
    ?? actorDoc.items.find((i) => String(i.name ?? "").toLowerCase() === "hidden detection")
    ?? null
  );
};

const isActiveGm = () => {
  if (!game.user.isGM) return false;
  if (game.users.activeGM && game.users.activeGM.id !== game.user.id) return false;
  return true;
};

const isPcToken = (tok) => {
  const a = tok?.actor;
  if (!a) return false;
  if (a.type === "character") return true;
  return game.users.some((u) => !u.isGM && a.testUserPermission?.(u, "OWNER"));
};

const actorKey = (actorDoc) => actorDoc?.uuid ?? actorDoc?.id ?? null;

const getPassivePerception = (actorDoc) => {
  const direct = Number(actorDoc.system?.skills?.prc?.passive);
  if (Number.isFinite(direct)) return direct;
  const senses = Number(actorDoc.system?.attributes?.senses?.passivePerception);
  if (Number.isFinite(senses)) return senses;
  const mod = Number(actorDoc.system?.skills?.prc?.total ?? actorDoc.system?.skills?.prc?.mod ?? 0);
  return 10 + (Number.isFinite(mod) ? mod : 0);
};

const skillLabel = (skillId) => CONFIG.DND5E?.skills?.[skillId]?.label ?? String(skillId).toUpperCase();

const playersForActor = (actorDoc) => {
  const users = new Set();
  for (const u of game.users) {
    if (u.isGM) continue;
    if (u.character?.id === actorDoc.id) users.add(u);
    else if (actorDoc.testUserPermission?.(u, "OWNER")) users.add(u);
  }
  return [...users];
};

const partyPlayerUsers = () => {
  const users = new Set();
  for (const tok of canvas.tokens?.placeables ?? []) {
    if (!isPcToken(tok)) continue;
    for (const u of playersForActor(tok.actor)) users.add(u);
  }
  if (!users.size) {
    for (const u of game.users) {
      if (!u.isGM && u.character) users.add(u);
    }
  }
  return [...users];
};

const applyTokenVisibility = (token) => {
  const visibleTo = foundry.utils.getProperty(token.document, `${FLAG}.visibleToUsers`);
  if (!Array.isArray(visibleTo) || !visibleTo.length) return;
  if (game.user.isGM) return;
  if (!visibleTo.includes(game.user.id)) {
    token.visible = false;
    if (token.mesh) token.mesh.visible = false;
  }
};

const writeFeatureState = async (featureItem, cfg) => {
  await featureItem.update({
    [FLAG]: {
      isFeature: true,
      enabled: cfg.enabled,
      rangeFt: cfg.rangeFt,
      detectMode: cfg.detectMode,
      skill: cfg.skill,
      dc: cfg.dc,
      wallsBlock: cfg.wallsBlock,
      allowRetryOnFail: cfg.allowRetryOnFail,
      revealToParty: cfg.revealToParty,
      whisperToGm: cfg.whisperToGm,
      revealed: cfg.revealed,
      revealedBy: cfg.revealedBy,
      failedBy: cfg.failedBy,
      inRangeBy: cfg.inRangeBy,
      visibleToUsers: cfg.visibleToUsers,
    },
  });
};

const revealHiddenToken = async (hiddenTok, featureItem, cfg, discovererActor, resolveDetail = "") => {
  const discovererUsers = playersForActor(discovererActor).map((u) => u.id);
  const partyUsers = partyPlayerUsers().map((u) => u.id);
  let visibleToUsers = cfg.revealToParty
    ? [...new Set([...partyUsers, ...discovererUsers])]
    : [...new Set(discovererUsers)];
  if (!visibleToUsers.length) visibleToUsers = partyUsers;

  const ownership = foundry.utils.deepClone(hiddenTok.actor?.ownership ?? {});
  for (const userId of visibleToUsers) {
    ownership[userId] = Math.max(
      Number(ownership[userId] ?? 0),
      CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
    );
  }
  if (hiddenTok.actor) await hiddenTok.actor.update({ ownership });

  const tokenUpdate = { hidden: false };
  foundry.utils.setProperty(tokenUpdate, `${FLAG}.visibleToUsers`, visibleToUsers);
  await hiddenTok.document.update(tokenUpdate);

  cfg.revealed = true;
  cfg.revealedBy = actorKey(discovererActor);
  cfg.visibleToUsers = visibleToUsers;
  cfg.inRangeBy = {};
  await writeFeatureState(featureItem, cfg);

  // Players: only told on success (they found something).
  const playerIds = cfg.revealToParty ? visibleToUsers : discovererUsers;
  if (playerIds.length) {
    const how =
      cfg.detectMode === "passivePerception"
        ? "thanks to your Passive Perception"
        : "thanks to your keen senses";
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: discovererActor }),
      content: `<p>You notice something hidden nearby… ${how} revealed <em>${hiddenTok.name}</em>.</p>`,
      whisper: playerIds,
    });
  }

  // GM always gets the full audit line.
  await ChatMessage.create({
    content: `<p><strong>Hidden Detection</strong> — ${discovererActor.name} discovered <em>${hiddenTok.name}</em>${
      cfg.revealToParty ? " (party)" : ""
    }${resolveDetail ? ` (${resolveDetail})` : ""}.</p>`,
    whisper: gmWhisperIds(),
  });

  if (game.user.isGM) {
    ui.notifications?.info?.(
      `Hidden Detection: ${cfg.revealToParty ? "the party" : discovererActor.name} noticed ${hiddenTok.name}.`,
    );
  }
};

const resolveSkillCheck = async (actorDoc, cfg) => {
  const skill = cfg.skill || "prc";
  const rollMode = cfg.whisperToGm ? CONST.DICE_ROLL_MODES.BLIND : game.settings.get("core", "rollMode");
  let roll;
  try {
    roll = await actorDoc.rollSkill(skill, {
      event: null,
      configure: false,
      targetValue: cfg.dc,
      rollMode,
      flavor: `Hidden Detection — ${skillLabel(skill)} (DC ${cfg.dc})`,
    });
  } catch (_err) {
    roll = await actorDoc.rollSkill({
      skill,
      event: null,
      configure: false,
      targetValue: cfg.dc,
      rollMode,
      flavor: `Hidden Detection — ${skillLabel(skill)} (DC ${cfg.dc})`,
    });
  }

  const total = Number(roll?.total ?? roll?.dice?.[0]?.total ?? roll?.rolls?.[0]?.total ?? roll?._total);
  if (!Number.isFinite(total)) {
    console.warn("Hidden Detection: could not read skill roll total", roll);
    return { success: false, total: null, detail: "roll failed" };
  }
  return { success: total >= cfg.dc, total, detail: `${total} vs DC ${cfg.dc}` };
};

const resolvePassive = async (actorDoc, cfg) => {
  const passive = getPassivePerception(actorDoc);
  const success = passive >= cfg.dc;
  const detail = `Passive Perception ${passive} vs DC ${cfg.dc}`;
  // Failures (and all passive attempts) are GM-only. Players only learn on success
  // via revealHiddenToken.
  await ChatMessage.create({
    content: `<p><strong>Hidden Detection</strong> — ${actorDoc.name}: ${detail} → <strong>${
      success ? "Success" : "Failure"
    }</strong></p>`,
    whisper: gmWhisperIds(),
  });
  return { success, total: passive, detail };
};

const processEntry = async (pcTok, hiddenTok, featureItem, cfg) => {
  const pc = pcTok.actor;
  if (!pc || !isPcToken(pcTok)) return;
  if (!cfg.enabled || cfg.revealed) return;

  const key = actorKey(pc);
  if (!key) return;
  if (!cfg.allowRetryOnFail && cfg.failedBy.includes(key)) return;

  let result;
  if (cfg.detectMode === "passivePerception") {
    result = await resolvePassive(pc, cfg);
  } else {
    result = await resolveSkillCheck(pc, cfg);
  }

  if (result.success) {
    await revealHiddenToken(hiddenTok, featureItem, cfg, pc, result.detail);
    return;
  }

  if (!cfg.failedBy.includes(key)) cfg.failedBy.push(key);
  await writeFeatureState(featureItem, cfg);
};

const syncHiddenDetection = async ({ notify = false } = {}) => {
  if (!isActiveGm()) return;
  if (!canvas?.ready) return;

  const pcTokens = (canvas.tokens?.placeables ?? []).filter((t) => isPcToken(t));
  const hiddenEntries = [];

  for (const tok of canvas.tokens?.placeables ?? []) {
    const feature = findHiddenFeature(tok.actor);
    if (!feature) continue;
    const cfg = readFeatureConfig(feature);
    if (!cfg || !cfg.enabled) continue;
    hiddenEntries.push({ tok, feature, cfg });
  }

  let checks = 0;
  for (const { tok: hiddenTok, feature, cfg } of hiddenEntries) {
    if (cfg.revealed) continue;
    const nextInRange = { ...cfg.inRangeBy };
    let dirty = false;

    for (const pcTok of pcTokens) {
      const key = actorKey(pcTok.actor);
      if (!key) continue;
      const dist = measureDistanceFt(pcTok, hiddenTok, { wallsBlock: cfg.wallsBlock });
      const inRange = dist <= cfg.rangeFt + 1e-6;
      const wasInRange = nextInRange[key] === true;

      if (!inRange) {
        if (wasInRange) {
          delete nextInRange[key];
          dirty = true;
          if (cfg.allowRetryOnFail) {
            const before = cfg.failedBy.length;
            cfg.failedBy = cfg.failedBy.filter((id) => id !== key);
            if (cfg.failedBy.length !== before) dirty = true;
          }
        }
        continue;
      }

      if (!wasInRange) {
        nextInRange[key] = true;
        dirty = true;
        cfg.inRangeBy = nextInRange;
        await writeFeatureState(feature, cfg);
        checks += 1;
        await processEntry(pcTok, hiddenTok, feature, cfg);
        const refreshed = readFeatureConfig(feature);
        if (refreshed) {
          Object.assign(cfg, refreshed);
          Object.assign(nextInRange, refreshed.inRangeBy ?? nextInRange);
        }
        if (cfg.revealed) break;
      }
    }

    cfg.inRangeBy = nextInRange;
    if (dirty && !cfg.revealed) {
      await writeFeatureState(feature, cfg);
    }
  }

  if (notify && game.user.isGM) {
    ui.notifications.info(
      `Hidden Detection Sync: watching ${hiddenEntries.length} hidden object(s)${
        checks ? `, ${checks} check(s) this pass` : ""
      }.`,
    );
  }

  return { hidden: hiddenEntries.length, checks };
};

const isConfigureHiddenDetectionActivity = (activity) => {
  const midiId = String(activity?.midiProperties?.identifier ?? "").toLowerCase();
  const id = String(activity?.identifier ?? "").toLowerCase();
  const name = String(activity?.name ?? "").toLowerCase();
  return (
    midiId === "configure-hidden-detection"
    || id === "configure-hidden-detection"
    || name === "configure hidden detection"
  );
};

const isHiddenDetectionItem = (item) => {
  if (!item) return false;
  if (foundry.utils.getProperty(item, `${FLAG}.isFeature`) === true) return true;
  if (String(item.system?.identifier ?? "") === "hidden-detection") return true;
  return String(item.name ?? "").toLowerCase() === "hidden detection";
};

/**
 * GM Configure dialog. Works without Item Macro (resource-node embeds strip it).
 */
const openConfigureDialog = async (featureItem) => {
  if (!game.user.isGM) {
    ui.notifications.warn("Hidden Detection: only the GM can configure this feature.");
    return false;
  }
  if (!featureItem) {
    ui.notifications.warn("Hidden Detection: feature item not found.");
    return false;
  }

  if (foundry.utils.getProperty(featureItem, `${FLAG}.isFeature`) !== true) {
    await featureItem.update({
      [FLAG]: {
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

  let cfg = readFeatureConfig(featureItem);
  if (!cfg) {
    ui.notifications.error("Hidden Detection: invalid feature config.");
    return false;
  }

  const skillOptionsHtml = SKILL_OPTIONS.map(
    ([id, label]) =>
      `<option value="${escHtml(id)}" ${cfg.skill === id ? "selected" : ""}>${escHtml(label)} (${escHtml(id)})</option>`,
  ).join("");

  const hooksArmed = Boolean(globalThis[NS]?.hooksReady);
  const content = `
    <form class="flexcol" style="gap:8px;">
      <p style="margin:0 0 4px;opacity:0.85;font-size:12px;">
        Hide this actor's token, configure below, then <strong>Save</strong>.
        Saving arms proximity detection for this session
        ${hooksArmed ? "(hooks already active)" : "(will arm hooks now)"}.
        Resource Node actors: you can also open this from <strong>Configure Resource Node</strong>.
      </p>
      <div class="form-group">
        <label><input type="checkbox" name="enabled" ${cfg.enabled ? "checked" : ""}/> Enabled</label>
      </div>
      <div class="form-group">
        <label>Detection range (ft)</label>
        <input type="number" name="rangeFt" value="${escHtml(cfg.rangeFt)}" min="1" step="1"/>
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
        <input type="number" name="dc" value="${escHtml(cfg.dc)}" min="1" step="1"/>
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
    const current = readFeatureConfig(featureItem) ?? cfg;
    const next = { ...current, ...patch, isFeature: true };
    await writeFeatureState(featureItem, next);
    cfg = next;
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
      foundry.utils.setProperty(updates, `${FLAG}.visibleToUsers`, []);
      await tok.document.update(updates);
    }
  };

  const armAndSync = async () => {
    ensureHiddenDetectHooks();
    return syncHiddenDetection({ notify: true });
  };

  await armAndSync();

  return await new Promise((resolve) => {
    new Dialog(
      {
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
      },
      { width: 460 },
    ).render(true);
  });
};

const ensureHiddenDetectHooks = () => {
  globalThis[NS] = globalThis[NS] || {};
  Object.assign(globalThis[NS], {
    syncHiddenDetection,
    measureDistanceFt,
    findHiddenFeature,
    applyTokenVisibility,
    openConfigureDialog,
    ensureHiddenDetectHooks,
  });

  if (globalThis[NS].hooksReady) return globalThis[NS];
  globalThis[NS].hooksReady = true;

  let timer = null;
  const queue = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => syncHiddenDetection({ notify: false }), 250);
  };

  Hooks.on("updateToken", (_doc, changes) => {
    if ("x" in changes || "y" in changes || "elevation" in changes || "hidden" in changes) queue();
  });
  Hooks.on("createToken", queue);
  Hooks.on("deleteToken", queue);
  Hooks.on("canvasReady", queue);
  Hooks.on("refreshToken", (token) => applyTokenVisibility(token));
  Hooks.on("updateToken", (doc) => {
    const tok = canvas.tokens?.get(doc.id);
    if (tok) applyTokenVisibility(tok);
  });

  // Resource Node embeds strip Item Macro — intercept Configure from the sheet.
  Hooks.on("dnd5e.preUseActivity", (activity) => {
    if (!isConfigureHiddenDetectionActivity(activity)) return;
    const item = activity.item;
    if (!isHiddenDetectionItem(item)) return;
    Promise.resolve(openConfigureDialog(item)).catch((err) => {
      console.error("Hidden Detection: configure failed", err);
    });
    return false;
  });

  // If canvas is already up (ready fired after first canvasReady), sync now.
  if (canvas?.ready) queue();

  return globalThis[NS];
};

ensureHiddenDetectHooks();
