// Resource Node Sync engine — Amellwind (Foundry v12 / dnd5e 4.4)
// Shared by the Sync macro and the Resource Node Feature Item Macro.
// Arms token-interaction hooks and resolves harvest → 1dN loot copy.

const NS = "__amellwindResourceNode";
const FLAG = "flags.world.resourceNode";
const PC_ATTEMPTS_FLAG = "flags.world.resourceNodeAttempts";
const MODULE_ID = "Amellwind-MH-RaintDM-module";

const CATEGORY_DEFS = {
  Plants: {
    skills: [
      ["nat", "Nature"],
      ["sur", "Survival"],
    ],
    toolPatterns: [/herbalism\s*kit/i],
    toolLabel: "Herbalism Kit",
    disadvantageWithoutTool: true,
    requireToolDefault: true,
  },
  Mushrooms: {
    skills: [
      ["nat", "Nature"],
      ["sur", "Survival"],
    ],
    toolPatterns: [/herbalism\s*kit/i],
    toolLabel: "Herbalism Kit",
    disadvantageWithoutTool: true,
    requireToolDefault: true,
  },
  Fish: {
    skills: [
      ["ath", "Athletics"],
      ["slt", "Sleight of Hand"],
    ],
    toolPatterns: [/fishing\s*tackle/i],
    toolLabel: "Fishing Tackle",
    disadvantageWithoutTool: false,
    requireToolDefault: true,
  },
  Insects: {
    skills: [
      ["slt", "Sleight of Hand"],
      ["nat", "Nature"],
    ],
    toolPatterns: [/bug\s*net/i],
    toolLabel: "Bug Net",
    disadvantageWithoutTool: false,
    requireToolDefault: true,
  },
  Minerals: {
    skills: [["ath", "Athletics"]],
    toolPatterns: [/miner['’]?s?\s*pick/i],
    toolLabel: "Miner's Pick",
    disadvantageWithoutTool: false,
    requireToolDefault: true,
  },
  Bonepiles: {
    skills: [
      ["nat", "Nature"],
      ["his", "History"],
    ],
    toolPatterns: [],
    toolLabel: null,
    disadvantageWithoutTool: false,
    requireToolDefault: false,
  },
};

const CATEGORY_KEYS = Object.keys(CATEGORY_DEFS);

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

const gmWhisperIds = () => ChatMessage.getWhisperRecipients("GM").map((u) => u.id);

const skillLabel = (skillId) => CONFIG.DND5E?.skills?.[skillId]?.label ?? String(skillId).toUpperCase();

const actorKey = (actorDoc) => actorDoc?.uuid ?? actorDoc?.id ?? null;

const isPcActor = (actorDoc) => {
  if (!actorDoc) return false;
  if (actorDoc.type === "character") return true;
  return game.users.some((u) => !u.isGM && actorDoc.testUserPermission?.(u, "OWNER"));
};

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

const normalizeNodeConfig = (f = {}) => {
  const category = CATEGORY_KEYS.includes(f.category) ? f.category : "Plants";
  const def = CATEGORY_DEFS[category];
  return {
    isFeature: true,
    isNode: true,
    enabled: f.enabled !== false,
    category,
    dc: Number.isFinite(Number(f.dc)) ? Number(f.dc) : 10,
    requireTool: typeof f.requireTool === "boolean" ? f.requireTool : def.requireToolDefault,
    interactionDistance: Number.isFinite(Number(f.interactionDistance))
      ? Number(f.interactionDistance)
      : 5,
    attemptedBy: Array.isArray(f.attemptedBy) ? [...f.attemptedBy] : [],
    featureUuid: f.featureUuid ?? null,
  };
};

const readFeatureConfig = (featureItem) => {
  const f = foundry.utils.getProperty(featureItem, FLAG) ?? {};
  if (f.isFeature !== true && String(featureItem?.system?.identifier ?? "") !== "resource-node") {
    return null;
  }
  return normalizeNodeConfig(f);
};

/** Actor / TokenDocument flag — readable by players who can see the token. */
const readDocNodeFlag = (doc) => {
  if (!doc) return null;
  const f = foundry.utils.getProperty(doc, FLAG);
  if (!f || typeof f !== "object") return null;
  if (f.isNode === true || f.isFeature === true) return normalizeNodeConfig(f);
  return null;
};

const findResourceFeature = (actorDoc) => {
  if (!actorDoc?.items) return null;
  return (
    actorDoc.items.find((i) => foundry.utils.getProperty(i, `${FLAG}.isFeature`) === true)
    ?? actorDoc.items.find((i) => String(i.system?.identifier ?? "") === "resource-node")
    ?? actorDoc.items.find((i) => String(i.name ?? "").toLowerCase() === "resource node")
    ?? null
  );
};

/**
 * Prefer TokenDocument flags (available without Actor sheet permission), then
 * Actor flags, then the embedded Feature item.
 */
const resolveNodeContext = (tokenPlaceable) => {
  const tokenDoc = tokenPlaceable?.document ?? null;
  const actorDoc = tokenPlaceable?.actor ?? null;
  const feature = findResourceFeature(actorDoc);
  const cfg =
    readDocNodeFlag(tokenDoc)
    ?? readDocNodeFlag(actorDoc)
    ?? (feature ? readFeatureConfig(feature) : null);
  return { tokenDoc, actorDoc, feature, cfg };
};

const isResourceNodeToken = (tokenPlaceable) => Boolean(resolveNodeContext(tokenPlaceable).cfg?.enabled);

const limitedOwnershipLevel = () => CONST.DOCUMENT_OWNERSHIP_LEVELS?.LIMITED ?? 1;

/**
 * Publish a player-readable marker on Actor + TokenDocuments and raise default
 * ownership to LIMITED so loot resolves on player clients (not OWNER).
 */
const syncPublicMarkers = async (nodeActor, cfg, featureItem) => {
  if (!nodeActor || !(game.user.isGM || nodeActor.isOwner)) return;
  const marker = {
    isNode: true,
    isFeature: false,
    enabled: cfg.enabled !== false,
    category: cfg.category,
    dc: cfg.dc,
    requireTool: cfg.requireTool === true,
    interactionDistance: cfg.interactionDistance,
    attemptedBy: Array.isArray(cfg.attemptedBy) ? [...cfg.attemptedBy] : [],
    featureUuid: featureItem?.uuid ?? null,
  };

  const patch = { [FLAG]: marker };
  const limited = limitedOwnershipLevel();
  if ((nodeActor.ownership?.default ?? 0) < limited) {
    patch["ownership.default"] = limited;
  }
  await nodeActor.update(patch);

  const tokenDocs = [];
  for (const tok of nodeActor.getActiveTokens?.(false) ?? []) {
    if (tok?.document) tokenDocs.push(tok.document);
  }
  for (const tok of canvas.tokens?.placeables ?? []) {
    if (tok.actor?.id === nodeActor.id && tok.document) tokenDocs.push(tok.document);
  }
  const seen = new Set();
  for (const doc of tokenDocs) {
    if (!doc?.id || seen.has(doc.id)) continue;
    seen.add(doc.id);
    try {
      await doc.update({ [FLAG]: marker });
    } catch (_err) {
      // optional
    }
  }
};

const writeFeatureConfig = async (featureItem, cfg) => {
  await featureItem.update({
    [FLAG]: {
      isFeature: true,
      enabled: cfg.enabled !== false,
      category: cfg.category,
      dc: cfg.dc,
      requireTool: cfg.requireTool === true,
      interactionDistance: cfg.interactionDistance,
      attemptedBy: Array.isArray(cfg.attemptedBy) ? cfg.attemptedBy : [],
    },
  });
  const nodeActor = featureItem.actor ?? featureItem.parent;
  if (nodeActor) await syncPublicMarkers(nodeActor, cfg, featureItem);
};

const getLootStacks = (nodeActor, featureItem) => {
  if (!nodeActor?.items) return [];
  const featureId = featureItem?.id;
  return [...nodeActor.items].filter((i) => {
    if (featureId && i.id === featureId) return false;
    if (foundry.utils.getProperty(i, `${FLAG}.isFeature`) === true) return false;
    if (foundry.utils.getProperty(i, "flags.world.hiddenDetect.isFeature") === true) return false;
    const identifier = String(i.system?.identifier ?? "");
    if (identifier === "resource-node" || identifier === "hidden-detection") return false;
    // Automation feats on the prop actor are never gather loot.
    if (i.type === "feat") return false;
    return true;
  });
};

const readPcAttempts = (pcActor) => {
  const raw = foundry.utils.getProperty(pcActor, PC_ATTEMPTS_FLAG) ?? {};
  return raw && typeof raw === "object" ? { ...raw } : {};
};

const hasAttempted = (pcActor, nodeActor, cfg) => {
  const key = actorKey(pcActor);
  if (!key) return false;
  if (cfg.attemptedBy.includes(key)) return true;
  const attempts = readPcAttempts(pcActor);
  return Boolean(attempts[nodeActor.uuid] || attempts[nodeActor.id]);
};

const markAttempted = async (pcActor, nodeActor, featureItem, cfg) => {
  const key = actorKey(pcActor);
  if (!key) return cfg;

  const nextAttempted = cfg.attemptedBy.includes(key) ? [...cfg.attemptedBy] : [...cfg.attemptedBy, key];
  cfg.attemptedBy = nextAttempted;

  const pcMap = readPcAttempts(pcActor);
  pcMap[nodeActor.uuid] = true;
  try {
    await pcActor.update({ [PC_ATTEMPTS_FLAG]: pcMap });
  } catch (_err) {
    console.warn("Resource Node: could not write attempt flag on PC", _err);
  }

  try {
    if (featureItem.isOwner || game.user.isGM) {
      await writeFeatureConfig(featureItem, cfg);
    }
  } catch (_err) {
    console.warn("Resource Node: could not write attemptedBy on feature", _err);
  }

  return cfg;
};

const clearAttemptForActor = async (featureItem, cfg, targetActor) => {
  const key = actorKey(targetActor);
  if (!key) return cfg;
  const nodeActor = featureItem.actor ?? featureItem.parent;
  cfg.attemptedBy = cfg.attemptedBy.filter((id) => id !== key);
  const pcMap = readPcAttempts(targetActor);
  if (nodeActor?.uuid) delete pcMap[nodeActor.uuid];
  if (nodeActor?.id) delete pcMap[nodeActor.id];
  try {
    if (targetActor.isOwner || game.user.isGM) {
      await targetActor.update({ [PC_ATTEMPTS_FLAG]: pcMap });
    }
  } catch (_err) {
    // optional
  }
  await writeFeatureConfig(featureItem, cfg);
  return cfg;
};

const clearAllAttempts = async (featureItem, cfg, nodeActor) => {
  const keys = [...cfg.attemptedBy];
  cfg.attemptedBy = [];
  await writeFeatureConfig(featureItem, cfg);

  const candidates = new Map();
  for (const a of game.actors ?? []) {
    if (isPcActor(a)) candidates.set(a.uuid, a);
  }
  for (const tok of canvas.tokens?.placeables ?? []) {
    if (tok.actor && isPcActor(tok.actor)) candidates.set(tok.actor.uuid, tok.actor);
  }
  for (const key of keys) {
    try {
      const doc = await fromUuid(key);
      if (doc) candidates.set(doc.uuid, doc);
    } catch (_err) {
      // optional
    }
  }

  for (const actorDoc of candidates.values()) {
    const pcMap = readPcAttempts(actorDoc);
    if (!pcMap[nodeActor.uuid] && !pcMap[nodeActor.id]) continue;
    delete pcMap[nodeActor.uuid];
    delete pcMap[nodeActor.id];
    try {
      if (actorDoc.isOwner || game.user.isGM) {
        await actorDoc.update({ [PC_ATTEMPTS_FLAG]: pcMap });
      }
    } catch (_err) {
      // optional
    }
  }
  return cfg;
};

const actorHasTool = (actorDoc, patterns) => {
  if (!patterns?.length) return true;
  return [...(actorDoc.items ?? [])].some((i) => patterns.some((re) => re.test(String(i.name ?? ""))));
};

const resolveHarvesterActor = (nodeActor = null, nodeToken = null) => {
  const nodeId = nodeActor?.id ?? null;

  // Item Piles–style: double-click selects the node, so do NOT rely on controlled tokens.
  // Prefer an owned PC token already on the canvas (closest to the resource node).
  const ownedTokens = (canvas.tokens?.placeables ?? []).filter(
    (t) => t?.actor && isPcActor(t.actor) && t.actor.isOwner && t.actor.id !== nodeId,
  );

  if (ownedTokens.length >= 1) {
    if (game.user.character) {
      const assigned = ownedTokens.find((t) => t.actor.id === game.user.character.id);
      if (assigned) return assigned.actor;
    }
    if (ownedTokens.length === 1 || !nodeToken) {
      return ownedTokens[0].actor;
    }
    let best = ownedTokens[0];
    let bestDist = measureDistanceFt(best, nodeToken);
    for (let i = 1; i < ownedTokens.length; i++) {
      const t = ownedTokens[i];
      const d = measureDistanceFt(t, nodeToken);
      if (d < bestDist) {
        best = t;
        bestDist = d;
      }
    }
    return best.actor;
  }

  // No owned PC token on the scene — fall back to User Character assignment.
  if (game.user.character && isPcActor(game.user.character) && game.user.character.id !== nodeId) {
    return game.user.character;
  }

  // Gather activity / GM testing while a PC token is still selected.
  const controlled = (canvas.tokens?.controlled ?? [])
    .map((t) => t.actor)
    .filter((a) => a && isPcActor(a) && a.id !== nodeId);
  if (controlled.length >= 1) {
    return controlled.find((a) => a.isOwner) ?? (game.user.isGM ? controlled[0] : null);
  }

  return null;
};

const rollSkillCheck = async (actorDoc, skillId, dc, { disadvantage = false, flavor = "" } = {}) => {
  const opts = {
    event: null,
    configure: false,
    targetValue: dc,
    disadvantage: disadvantage === true,
    flavor: flavor || `Resource Node — ${skillLabel(skillId)} (DC ${dc})`,
  };
  let roll;
  try {
    roll = await actorDoc.rollSkill(skillId, opts);
  } catch (_err) {
    roll = await actorDoc.rollSkill({ skill: skillId, ...opts });
  }
  const total = Number(roll?.total ?? roll?.dice?.[0]?.total ?? roll?.rolls?.[0]?.total ?? roll?._total);
  if (!Number.isFinite(total)) {
    return { success: false, total: null, detail: "roll failed" };
  }
  return { success: total >= dc, total, detail: `${total} vs DC ${dc}${disadvantage ? " (disadvantage)" : ""}` };
};

const copyLootItem = async (pcActor, sourceItem) => {
  const data = sourceItem.toObject();
  delete data._id;
  data.folder = null;
  if (data.system && Object.prototype.hasOwnProperty.call(data.system, "quantity")) {
    // Preserve table "Name xN" quantities from the node's loot stack.
    const fromStack = Number(sourceItem.system?.quantity);
    const qty = Number.isFinite(fromStack) && fromStack > 0 ? Math.floor(fromStack) : 1;
    foundry.utils.setProperty(data, "system.quantity", qty);
  }
  const created = await pcActor.createEmbeddedDocuments("Item", [data]);
  return created?.[0] ?? null;
};

const openGatherDialog = async ({ nodeToken, harvesterActor, featureItem } = {}) => {
  const ctx = nodeToken ? resolveNodeContext(nodeToken) : null;
  const nodeActor = nodeToken?.actor ?? featureItem?.actor ?? featureItem?.parent ?? ctx?.actorDoc;
  let feature = featureItem ?? ctx?.feature ?? findResourceFeature(nodeActor);
  if (!feature && ctx?.cfg?.featureUuid) {
    try {
      feature = await fromUuid(ctx.cfg.featureUuid);
    } catch (_err) {
      // optional
    }
  }
  const cfg = (feature ? readFeatureConfig(feature) : null) ?? ctx?.cfg ?? null;
  if (!nodeActor || !cfg) {
    ui.notifications.warn(
      "Resource Node: node data not available yet. GM: open Configure and Save once to publish markers.",
    );
    return false;
  }
  if (!cfg.enabled) {
    ui.notifications.warn("Resource Node: this node is disabled.");
    return false;
  }
  if (!feature) {
    ui.notifications.warn(
      "Resource Node: feature item not visible. GM: Save Configure (grants players LIMITED view of the node).",
    );
    return false;
  }

  const pc = harvesterActor ?? resolveHarvesterActor(nodeActor, nodeToken);
  if (!pc) {
    ui.notifications.warn(
      "Resource Node: place your character token on the scene (or assign a User Character).",
    );
    return false;
  }
  if (!pc.isOwner && !game.user.isGM) {
    ui.notifications.warn("Resource Node: you do not own that character.");
    return false;
  }

  if (hasAttempted(pc, nodeActor, cfg)) {
    ui.notifications.warn(`Resource Node: ${pc.name} has already attempted this node.`);
    return false;
  }

  const pcToken =
    (canvas.tokens?.placeables ?? []).find((t) => t.actor?.id === pc.id && t.actor?.isOwner)
    ?? pc.getActiveTokens?.(true)?.[0]
    ?? null;
  if (nodeToken && pcToken && cfg.interactionDistance > 0) {
    const dist = measureDistanceFt(pcToken, nodeToken);
    if (dist > cfg.interactionDistance + 1e-6) {
      ui.notifications.warn(
        `Resource Node: too far away (${Math.round(dist)} ft; need ≤ ${cfg.interactionDistance} ft).`,
      );
      return false;
    }
  }

  const loot = getLootStacks(nodeActor, feature);
  if (!loot.length) {
    ui.notifications.warn("Resource Node: this node has no loot items in its inventory.");
    return false;
  }

  const catDef = CATEGORY_DEFS[cfg.category] ?? CATEGORY_DEFS.Plants;
  const hasTool = actorHasTool(pc, catDef.toolPatterns);
  if (cfg.requireTool && catDef.toolPatterns.length && !hasTool && !catDef.disadvantageWithoutTool) {
    ui.notifications.warn(`Resource Node: you need a ${catDef.toolLabel} to gather here.`);
    return false;
  }

  const disadvantage = Boolean(
    cfg.requireTool && catDef.disadvantageWithoutTool && catDef.toolPatterns.length && !hasTool,
  );

  const skillOptionsHtml = catDef.skills
    .map(
      ([id, label], idx) =>
        `<option value="${escHtml(id)}" ${idx === 0 ? "selected" : ""}>${escHtml(label)} (${escHtml(id)})</option>`,
    )
    .join("");

  const lootPreview = loot.map((i) => escHtml(i.name)).join(", ");
  const content = `
    <form class="flexcol" style="gap:8px;">
      <p style="margin:0;opacity:0.9;">
        Harvest <strong>${escHtml(nodeActor.name)}</strong> as <strong>${escHtml(pc.name)}</strong>.
      </p>
      <p style="margin:0;font-size:12px;opacity:0.8;">
        Category: <strong>${escHtml(cfg.category)}</strong> · DC <strong>${escHtml(cfg.dc)}</strong>
        · Loot pool: <strong>${escHtml(loot.length)}</strong> → roll 1d${escHtml(loot.length)}
      </p>
      <p style="margin:0;font-size:12px;opacity:0.75;">Items: ${lootPreview}</p>
      <div class="form-group">
        <label>Skill</label>
        <select name="skill">${skillOptionsHtml}</select>
      </div>
      <p style="margin:0;font-size:12px;opacity:0.8;">
        Tool (${escHtml(catDef.toolLabel ?? "none")}):
        ${
          !catDef.toolPatterns.length
            ? "not required"
            : hasTool
              ? "<strong>equipped / in inventory</strong>"
              : disadvantage
                ? "<strong>missing — rolling with disadvantage</strong>"
                : "<strong>missing — required</strong>"
        }
      </p>
      <p style="margin:0;font-size:12px;opacity:0.75;">One attempt only (success or fail).</p>
    </form>
  `;

  return await new Promise((resolve) => {
    new Dialog({
      title: `Gather — ${nodeActor.name}`,
      content,
      buttons: {
        gather: {
          icon: '<i class="fas fa-hand-holding"></i>',
          label: "Gather",
          callback: async (html) => {
            const skill = String(html[0].querySelector('[name="skill"]')?.value || catDef.skills[0][0]);
            const result = await rollSkillCheck(pc, skill, cfg.dc, {
              disadvantage,
              flavor: `Resource Node (${cfg.category}) — ${skillLabel(skill)} (DC ${cfg.dc})`,
            });

            await markAttempted(pc, nodeActor, feature, cfg);

            if (!result.success) {
              await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: pc }),
                content: `<p><strong>Resource Node</strong> — ${escHtml(pc.name)} failed to gather from <em>${escHtml(
                  nodeActor.name,
                )}</em> (${escHtml(result.detail)}).</p>`,
              });
              ui.notifications.info("Resource Node: gathering failed.");
              resolve(false);
              return;
            }

            const n = loot.length;
            const die = await new Roll(`1d${n}`).evaluate();
            if (die?.toMessage) {
              await die.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: pc }),
                flavor: `Resource Node loot (1d${n})`,
              });
            }
            const idx = Math.max(0, Math.min(n - 1, Number(die.total) - 1));
            const picked = loot[idx];
            let granted = null;
            try {
              granted = await copyLootItem(pc, picked);
            } catch (err) {
              console.error(err);
              ui.notifications.error("Resource Node: could not copy the item to your inventory.");
              resolve(false);
              return;
            }

            await ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: pc }),
              content: `<p><strong>Resource Node</strong> — ${escHtml(pc.name)} gathered <strong>${escHtml(
                granted?.name ?? picked.name,
              )}</strong> from <em>${escHtml(nodeActor.name)}</em> (${escHtml(result.detail)}; d${n}=${escHtml(
                die.total,
              )}).</p>`,
            });
            ui.notifications.info(`Resource Node: obtained ${granted?.name ?? picked.name}.`);
            resolve(true);
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => resolve(false),
        },
      },
      default: "gather",
      close: () => resolve(false),
    }, { width: 460 }).render(true);
  });
};

const resolveAttemptLabel = async (uuid) => {
  try {
    const doc = await fromUuid(uuid);
    if (doc?.name) return doc.name;
  } catch (_err) {
    // optional
  }
  return uuid;
};

const openConfigureDialog = async (featureItem) => {
  if (!game.user.isGM) {
    ui.notifications.warn("Resource Node: only the GM can configure this feature.");
    return false;
  }
  if (!featureItem) {
    ui.notifications.warn("Resource Node: feature item not found.");
    return false;
  }

  if (foundry.utils.getProperty(featureItem, `${FLAG}.isFeature`) !== true) {
    await featureItem.update({
      [FLAG]: {
        isFeature: true,
        enabled: true,
        category: "Plants",
        dc: 10,
        requireTool: true,
        interactionDistance: 5,
        attemptedBy: [],
      },
    });
  }

  ensureResourceNodeHooks();

  const nodeActor = featureItem.actor ?? featureItem.parent;
  let cfg = readFeatureConfig(featureItem);
  if (!cfg) {
    ui.notifications.error("Resource Node: invalid feature config.");
    return false;
  }

  const loot = getLootStacks(nodeActor, featureItem);
  const categoryOptions = CATEGORY_KEYS.map(
    (c) => `<option value="${escHtml(c)}" ${cfg.category === c ? "selected" : ""}>${escHtml(c)}</option>`,
  ).join("");

  const attemptLabels = [];
  for (const uuid of cfg.attemptedBy) {
    attemptLabels.push({ uuid, label: await resolveAttemptLabel(uuid) });
  }
  const attemptsHtml = attemptLabels.length
    ? `<ul style="margin:4px 0 0;padding-left:18px;font-size:12px;">${attemptLabels
        .map(
          (a) =>
            `<li>${escHtml(a.label)} <label style="margin-left:6px;"><input type="checkbox" name="resetUuid" value="${escHtml(
              a.uuid,
            )}"/> reset</label></li>`,
        )
        .join("")}</ul>`
    : `<p style="margin:4px 0 0;font-size:12px;opacity:0.75;">No attempts yet.</p>`;

  const hooksArmed = Boolean(globalThis[NS]?.hooksReady);
  const content = `
    <form class="flexcol" style="gap:8px;">
      <p style="margin:0 0 4px;opacity:0.85;font-size:12px;">
        Put loot items in this actor's inventory, then configure below.
        Hooks ${hooksArmed ? "are active" : "arm on Save"}.
        <br/><strong>GM:</strong> double-click token (no PC) or Shift+double-click → Configure.
        Alt+double-click → actor sheet (GM). Players gather with a PC token on the scene;
        Save publishes token markers + LIMITED view (no sheet / no OWNER needed).
      </p>
      <div class="form-group">
        <label><input type="checkbox" name="enabled" ${cfg.enabled ? "checked" : ""}/> Enabled</label>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select name="category">${categoryOptions}</select>
      </div>
      <div class="form-group">
        <label>Resource DC</label>
        <input type="number" name="dc" value="${escHtml(cfg.dc)}" min="1" step="1"/>
      </div>
      <div class="form-group">
        <label><input type="checkbox" name="requireTool" ${cfg.requireTool ? "checked" : ""}/> Require Amellwind tool rules</label>
      </div>
      <div class="form-group">
        <label>Interaction distance (ft)</label>
        <input type="number" name="interactionDistance" value="${escHtml(cfg.interactionDistance)}" min="0" step="1"/>
      </div>
      <p style="margin:6px 0 0;font-size:12px;opacity:0.85;">
        Loot pool: <strong>${escHtml(loot.length)}</strong> item stack(s) → roll <strong>1d${escHtml(
          Math.max(1, loot.length),
        )}</strong> on success.
      </p>
      <div>
        <strong style="font-size:12px;">Attempts</strong>
        <div data-rn-attempts>${attemptsHtml}</div>
      </div>
    </form>
  `;

  const parseForm = (html) => {
    const form = html[0].querySelector("form");
    const fd = new FormData(form);
    const category = CATEGORY_KEYS.includes(String(fd.get("category")))
      ? String(fd.get("category"))
      : "Plants";
    return {
      enabled: form.querySelector('[name="enabled"]')?.checked === true,
      category,
      dc: Math.max(1, Number(fd.get("dc")) || 10),
      requireTool: form.querySelector('[name="requireTool"]')?.checked === true,
      interactionDistance: Math.max(0, Number(fd.get("interactionDistance")) || 0),
      resetUuids: [...form.querySelectorAll('[name="resetUuid"]:checked')].map((el) => el.value),
    };
  };

  const applyFormToCfg = (formCfg) => ({
    ...cfg,
    enabled: formCfg.enabled,
    category: formCfg.category,
    dc: formCfg.dc,
    requireTool: formCfg.requireTool,
    interactionDistance: formCfg.interactionDistance,
  });

  // Classic Dialog closes on every footer button. Keep only Save/Cancel as Dialog
  // buttons; inject Open sheet / Reset all so they can run without dismissing.
  return await new Promise((resolve) => {
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    new Dialog(
      {
        title: `Resource Node — ${nodeActor?.name ?? featureItem.name}`,
        content,
        buttons: {
          save: {
            icon: '<i class="fas fa-save"></i>',
            label: "Save",
            callback: async (html) => {
              const formCfg = parseForm(html);
              let next = applyFormToCfg(formCfg);
              for (const uuid of formCfg.resetUuids) {
                try {
                  const target = await fromUuid(uuid);
                  if (target) next = await clearAttemptForActor(featureItem, next, target);
                  else next.attemptedBy = next.attemptedBy.filter((id) => id !== uuid);
                } catch (_err) {
                  next.attemptedBy = next.attemptedBy.filter((id) => id !== uuid);
                }
              }
              cfg = next;
              await writeFeatureConfig(featureItem, next);
              ensureResourceNodeHooks();
              ui.notifications.info("Resource Node: configuration saved.");
              settle(true);
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => settle(false),
          },
        },
        default: "save",
        render: (html) => {
          const $buttons = html.closest(".app").find(".dialog-buttons");
          if ($buttons.find("[data-rn-action]").length) return;

          const $open = $(
            `<button type="button" data-rn-action="open-sheet"><i class="fas fa-scroll"></i> Open sheet</button>`,
          );
          const $reset = $(
            `<button type="button" data-rn-action="reset-all"><i class="fas fa-undo"></i> Reset all attempts</button>`,
          );
          // Visual order: Save | Open sheet | Reset all | Cancel
          $buttons.find('[data-button="save"]').after($open);
          $open.after($reset);

          $open.on("click", async (event) => {
            event.preventDefault();
            const formCfg = parseForm(html);
            cfg = applyFormToCfg(formCfg);
            await writeFeatureConfig(featureItem, cfg);
            nodeActor?.sheet?.render(true);
          });

          $reset.on("click", async (event) => {
            event.preventDefault();
            const formCfg = parseForm(html);
            cfg = applyFormToCfg(formCfg);
            await clearAllAttempts(featureItem, cfg, nodeActor);
            ensureResourceNodeHooks();
            ui.notifications.info("Resource Node: all attempts cleared.");
            const attemptsBox = html[0].querySelector("[data-rn-attempts]");
            if (attemptsBox) {
              attemptsBox.innerHTML =
                `<p style="margin:4px 0 0;font-size:12px;opacity:0.75;">No attempts yet.</p>`;
            }
          });
        },
        close: () => settle(false),
      },
      { width: 520 },
    ).render(true);
  });
};

const isEnabledResourceNodeToken = (tokenPlaceable) => isResourceNodeToken(tokenPlaceable);

/**
 * Item Piles–style: Foundry blocks clickLeft / clickLeft2 unless the user can
 * "view" or "control" the token. Resource nodes should be double-clickable by
 * any player who can see them, without OWNER on the node actor.
 */
const applyResourceNodeClickPermissions = (tokenPlaceable) => {
  const mim = tokenPlaceable?.mouseInteractionManager;
  if (!mim?.permissions || !isResourceNodeToken(tokenPlaceable)) return;
  mim.permissions.clickLeft = () => true;
  mim.permissions.clickLeft2 = () => true;
};

const refreshAllResourceNodeClickPermissions = () => {
  for (const tok of canvas.tokens?.placeables ?? []) {
    applyResourceNodeClickPermissions(tok);
  }
};

const handleTokenInteract = async (tokenPlaceable, event) => {
  const { actorDoc, feature, cfg } = resolveNodeContext(tokenPlaceable);
  if (!cfg?.enabled) return false;

  // Alt+double-click → normal actor sheet for GM only.
  if (event?.altKey) return false;

  // GM Shift+double-click always opens Configure.
  if (game.user.isGM && event?.shiftKey) {
    const feat = feature ?? findResourceFeature(actorDoc);
    if (feat) await openConfigureDialog(feat);
    return true;
  }

  const pc = resolveHarvesterActor(actorDoc, tokenPlaceable);
  // GM without a harvester PC: open Configure so setup / loot / reset stays reachable.
  if (!pc && game.user.isGM) {
    const feat = feature ?? findResourceFeature(actorDoc);
    if (feat) await openConfigureDialog(feat);
    return true;
  }

  await openGatherDialog({
    nodeToken: tokenPlaceable,
    featureItem: feature,
    harvesterActor: pc,
  });
  return true;
};

/** GM: publish token/actor markers + LIMITED for nodes that still lack them. */
const publishAllResourceNodeMarkers = async () => {
  if (!game.user.isGM) return 0;
  let count = 0;
  for (const actor of game.actors ?? []) {
    const feature = findResourceFeature(actor);
    if (!feature) continue;
    const cfg = readFeatureConfig(feature);
    if (!cfg) continue;
    const limited = limitedOwnershipLevel();
    const needsOwnership = (actor.ownership?.default ?? 0) < limited;
    const needsActorFlag = !readDocNodeFlag(actor)?.isNode;
    let needsTokenFlag = false;
    for (const tok of actor.getActiveTokens?.(false) ?? []) {
      if (!readDocNodeFlag(tok.document)?.isNode) {
        needsTokenFlag = true;
        break;
      }
    }
    if (needsOwnership || needsActorFlag || needsTokenFlag) {
      await syncPublicMarkers(actor, cfg, feature);
      count += 1;
    }
  }
  return count;
};

const ensureResourceNodeHooks = () => {
  globalThis[NS] = globalThis[NS] || {};
  Object.assign(globalThis[NS], {
    ensureResourceNodeHooks,
    openGatherDialog,
    openConfigureDialog,
    findResourceFeature,
    readFeatureConfig,
    resolveNodeContext,
    syncPublicMarkers,
    publishAllResourceNodeMarkers,
    getLootStacks,
    measureDistanceFt,
    CATEGORY_DEFS,
  });

  if (globalThis[NS].hooksReady) return globalThis[NS];
  globalThis[NS].hooksReady = true;

  const wrapWithLibOrPatch = (target, method, handler) => {
    if (typeof libWrapper?.register === "function") {
      try {
        libWrapper.register(MODULE_ID, target, handler, "MIXED");
        return true;
      } catch (_err) {
        // fall through to prototype patch
      }
    }
    const proto = CONFIG.Token?.objectClass?.prototype;
    if (!proto) return false;
    const original = proto[method];
    proto[method] = function patchedResourceNodeMethod(...args) {
      return handler.call(
        this,
        typeof original === "function" ? original.bind(this) : undefined,
        ...args,
      );
    };
    return true;
  };

  const wrapClick = () => {
    if (globalThis[NS].clickWrapped) return;
    const TokenClass = CONFIG.Token?.objectClass;
    if (!TokenClass?.prototype) return;

    const clickHandler = function resourceNodeClickLeft2(wrapped, event) {
      try {
        if (isResourceNodeToken(this)) {
          // Only GM Alt opens the default actor sheet.
          if (event?.altKey && game.user.isGM) {
            return typeof wrapped === "function" ? wrapped.call(this, event) : undefined;
          }
          // Players: never fall through to ActorSheet (permission error).
          event?.preventDefault?.();
          event?.stopPropagation?.();
          Promise.resolve(handleTokenInteract(this, event)).catch((err) => {
            console.error("Resource Node click handler error", err);
          });
          return false;
        }
      } catch (err) {
        console.error("Resource Node click handler error", err);
      }
      return typeof wrapped === "function" ? wrapped.call(this, event) : undefined;
    };

    // Do NOT force _canView true — that makes Foundry try to open the sheet and
    // then show "insufficient permission". Clicks are allowed via MIM permissions.
    wrapWithLibOrPatch("CONFIG.Token.objectClass.prototype._onClickLeft2", "_onClickLeft2", clickHandler);
    globalThis[NS].clickWrapped = true;
  };

  wrapClick();
  refreshAllResourceNodeClickPermissions();
  Hooks.on("canvasReady", () => {
    wrapClick();
    refreshAllResourceNodeClickPermissions();
  });
  Hooks.on("refreshToken", (token) => {
    applyResourceNodeClickPermissions(token);
  });

  Hooks.on("renderActorSheet", (app) => {
    try {
      const actorDoc = app.actor;
      const feature = findResourceFeature(actorDoc);
      const marker = readDocNodeFlag(actorDoc);
      if (!feature && !marker) return;
      const cfg = feature ? readFeatureConfig(feature) : marker;
      if (!cfg?.enabled) return;
      if (game.user.isGM) return;
      // Players opening the node sheet are redirected to Gather.
      setTimeout(() => {
        app.close?.();
        const tok = actorDoc.getActiveTokens?.(true)?.[0] ?? null;
        openGatherDialog({ nodeToken: tok, featureItem: feature });
      }, 0);
    } catch (_err) {
      // optional
    }
  });

  return globalThis[NS];
};

ensureResourceNodeHooks();
