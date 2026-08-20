/**
 * Dire Miralis — combat automation (Foundry v12 / dnd5e 4.4 / Midi QOL 12.x).
 * Loaded as a module script on every client; GM-only mutations run on the active GM.
 *
 * Handles: Magma Armor (70% HP / cracks / shatter / reform via feature), stance reach, Boiling Presence,
 * lava + tainted-water hazards, Calamity Rain charge/interrupt/detonation
 * (Sequencer/JB2A fireball volley), Scorching Hide fallback, quadruped advantage vs prone,
 * lair-action cooldown.
 */
(() => {
  const NS = "direMiralis";
  const FLAG = `flags.world.${NS}`;
  const MAGMA_HP_FRACTION = 0.7;
  const MAGMA_COLD_HITS_TO_SHATTER = 6;
  const CALAMITY_INTERRUPT_COLD = 40;
  const LAVA_DAMAGE = "2d10";
  const BOILING_DAMAGE = "1d10";
  const STEAM_DAMAGE = "2d6";
  const FIREBALL_DAMAGE = "11d6";
  const FIREBALL_DC = 17;
  const FIREBALL_RADIUS_FT = 25;
  const FIREBALL_STAGGER_MS = 200;
  const pendingUntagged = [];
  const prevTokenCenters = new Map();

  const isActiveGM = () =>
    Boolean(game.user?.isGM) &&
    (!game.users?.activeGM || game.users.activeGM.id === game.user.id);

  const getFlag = (doc, path, fallback = undefined) => {
    if (!doc) return fallback;
    const value = foundry.utils.getProperty(doc, `${FLAG}.${path}`);
    return value === undefined ? fallback : value;
  };

  const isBoss = (actor) => Boolean(actor && getFlag(actor, "bossNpc") === true);

  const bossActors = () =>
    (game.actors?.contents ?? []).filter((a) => isBoss(a));

  const bossTokens = (actor) =>
    (canvas?.tokens?.placeables ?? []).filter((t) => t.actor && (t.actor === actor || t.actor.id === actor?.id));

  const speakerFor = (actor) => ChatMessage.getSpeaker({ actor });

  const chat = async (actor, html, { whisperGM = false } = {}) => {
    const data = {
      speaker: speakerFor(actor),
      content: html,
    };
    if (whisperGM) {
      data.whisper = game.users.filter((u) => u.isGM).map((u) => u.id);
    }
    await ChatMessage.create(data);
  };

  const tokenRect = (token) => {
    const size = canvas.grid?.size || 100;
    const w = token.w ?? (Number(token.document?.width) || 1) * size;
    const h = token.h ?? (Number(token.document?.height) || 1) * size;
    const c = token.center ?? { x: (token.document?.x ?? 0) + w / 2, y: (token.document?.y ?? 0) + h / 2 };
    return { x: c.x - w / 2, y: c.y - h / 2, w, h };
  };

  const rectGapPx = (a, b) => {
    const dx = Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w));
    const dy = Math.max(0, a.y - (b.y + b.h), b.y - (a.y + a.h));
    return Math.hypot(dx, dy);
  };

  const measureDistanceFt = (tokenA, tokenB) => {
    if (!tokenA || !tokenB) return Infinity;
    if (typeof MidiQOL?.computeDistance === "function") {
      const d = Number(MidiQOL.computeDistance(tokenA, tokenB, { wallsBlock: false }));
      if (Number.isFinite(d)) return d;
    }
    const grid = canvas.grid?.size || 100;
    const ft = canvas.grid?.distance || 5;
    const gapFt = (rectGapPx(tokenRect(tokenA), tokenRect(tokenB)) / grid) * ft;
    if (Number.isFinite(gapFt)) return gapFt;
    if (typeof canvas.grid?.measurePath === "function") {
      const path = canvas.grid.measurePath([tokenA.center, tokenB.center]);
      const d = Number(path?.distance ?? path?.spaces);
      if (Number.isFinite(d)) return d;
    }
    const dx = tokenA.center.x - tokenB.center.x;
    const dy = tokenA.center.y - tokenB.center.y;
    return (Math.hypot(dx, dy) / grid) * ft;
  };

  const tokenCenterFromDoc = (tokenDoc, changed = {}) => {
    const x = changed.x ?? tokenDoc.x;
    const y = changed.y ?? tokenDoc.y;
    if (typeof tokenDoc.getCenterPoint === "function") {
      return tokenDoc.getCenterPoint({ x, y });
    }
    const size = canvas.grid?.size || 100;
    const w = (Number(tokenDoc.width) || 1) * size;
    const h = (Number(tokenDoc.height) || 1) * size;
    return { x: x + w / 2, y: y + h / 2 };
  };

  const tokensInRange = (origin, rangeFt, { excludeSelf = true } = {}) => {
    if (!origin) return [];
    return (canvas.tokens?.placeables ?? []).filter((t) => {
      if (!t.visible && !game.user.isGM) return false;
      if (!t.actor) return false;
      if (excludeSelf && (t.id === origin.id || t.actor.id === origin.actor?.id)) return false;
      if (t.actor.system?.attributes?.hp?.value <= 0) return false;
      return measureDistanceFt(origin, t) <= rangeFt + 0.5;
    });
  };

  const evaluateRoll = async (formula) => {
    const roll = await new Roll(formula).evaluate();
    return roll;
  };

  const typedDamageFormula = (formula, type) => {
    const base = String(formula ?? "").trim();
    if (!type || /\[[^\]]+\]/.test(base)) return base;
    return `${base}[${type}]`;
  };

  const evaluateDamageRoll = async (formula, type = "fire") => {
    const flavored = typedDamageFormula(formula, type);
    const DamageRoll = CONFIG.Dice?.DamageRoll ?? globalThis.dnd5e?.dice?.DamageRoll;
    if (typeof DamageRoll === "function") {
      try {
        const roll = new DamageRoll(flavored, {}, { type, types: [type] });
        return roll.evaluate();
      } catch {
        /* fall through to a flavored Roll */
      }
    }
    return evaluateRoll(flavored);
  };

  const applyTypedDamageToTokens = async ({ tokens, amount, type = "fire", item = null }) => {
    const list = (tokens ?? []).filter((t) => t?.actor);
    const total = Number(amount) || 0;
    if (!list.length || total <= 0) return;
    const damages = [{ value: total, type, properties: new Set() }];
    const midiDetail = [{ damage: total, type, value: total, damageType: type }];
    for (const token of list) {
      const actor = token.actor;
      let applied = false;
      if (typeof actor.applyDamage === "function") {
        try {
          await actor.applyDamage(damages);
          applied = true;
        } catch {
          try {
            await actor.applyDamage(total, { type });
            applied = true;
          } catch {
            applied = false;
          }
        }
      }
      if (!applied && typeof MidiQOL?.applyTokenDamage === "function") {
        await MidiQOL.applyTokenDamage(midiDetail, total, new Set([token]), item, new Set());
      }
    }
  };

  const applyFireDamage = async ({ tokens, formula, flavor, type = "fire", item = null }) => {
    const list = (tokens ?? []).filter((t) => t?.actor);
    if (!list.length) return null;
    const roll = await evaluateDamageRoll(formula, type);
    await roll.toMessage({
      speaker: speakerFor(item?.actor ?? list[0]?.actor),
      flavor,
    });
    await applyTypedDamageToTokens({
      tokens: list,
      amount: Number(roll.total) || 0,
      type,
      item,
    });
    return roll;
  };

  const rollSave = async (actor, ability, dc) => {
    if (!actor) return { success: true, total: dc };
    let result;
    if (typeof actor.rollSavingThrow === "function") {
      result = await actor.rollSavingThrow({ ability, target: dc, chatMessage: true });
    } else if (typeof actor.rollAbilitySave === "function") {
      result = await actor.rollAbilitySave(ability, { targetValue: dc });
    }
    const roll = Array.isArray(result) ? result[0] : result;
    const total = Number(roll?.total ?? roll?._total ?? 0);
    return { success: total >= dc, total, roll };
  };

  const hpMax = (actor) =>
    Number(actor?.system?.attributes?.hp?.max ?? 0) || 1;
  const hpValue = (actor) =>
    Number(actor?.system?.attributes?.hp?.value ?? 0);

  const magmaThreshold = (actor) => Math.floor(hpMax(actor) * MAGMA_HP_FRACTION);

  const recentBossHits = new Map();

  const findEffect = (actor, kind) => {
    if (!actor) return null;
    const match = (ef) => foundry.utils.getProperty(ef, `${FLAG}.kind`) === kind;
    const onActor = actor.effects?.find(match);
    if (onActor) return onActor;
    for (const item of actor.items ?? []) {
      const ef = item.effects?.find(match);
      if (ef) return ef;
    }
    return null;
  };

  const setEffectDisabled = async (actor, kind, disabled) => {
    const ef = findEffect(actor, kind);
    if (!ef || ef.disabled === disabled) return;
    await ef.update({ disabled });
  };

  const patchState = async (actor, patch) => {
    const current = foundry.utils.getProperty(actor, FLAG) ?? {};
    const next = foundry.utils.mergeObject(foundry.utils.deepClone(current), patch, { inplace: false });
    await actor.update({ [`flags.world.${NS}`]: next });
  };

  const stanceOf = (actor) => getFlag(actor, "stance", "biped");

  const updateClawReach = async (actor, stance) => {
    const claw = actor.items.find((i) => foundry.utils.getProperty(i, `${FLAG}.role`) === "claw");
    if (!claw) return;
    const reach = stance === "biped" ? 15 : 10;
    if (Number(claw.system?.range?.reach) === reach) return;
    await claw.update({ "system.range.reach": reach });
  };

  const setStance = async (actor, stance) => {
    const next = stance === "quadruped" ? "quadruped" : "biped";
    await patchState(actor, { stance: next });
    await setEffectDisabled(actor, "stanceBiped", next !== "biped");
    await setEffectDisabled(actor, "stanceQuadruped", next !== "quadruped");
    await updateClawReach(actor, next);
    await chat(
      actor,
      `<p><strong>Dire Miralis</strong> shifts to <strong>${next === "biped" ? "Biped" : "Quadruped"}</strong> stance.</p>
       <p>${next === "biped"
         ? "Melee reach 15 ft. Crush is available."
         : "Melee reach 10 ft. Tail Sweep is available. Advantage on saves against being knocked prone."}</p>`,
    );
  };

  const activateMagmaArmor = async (actor) => {
    const state = getFlag(actor, "magmaArmor", {});
    if (state.shattered || state.unlocked) return;
    await patchState(actor, {
      magmaArmor: { ...state, unlocked: true, cracked: false, cracks: state.cracks ?? 0 },
    });
    await setEffectDisabled(actor, "magmaArmor", false);
    await setEffectDisabled(actor, "crackedShell", true);
    await chat(
      actor,
      `<p>The Dire Miralis's hide hardens into a <strong>slag shell</strong> (Magma Armor).</p>
       <p>AC becomes <strong>22</strong> and it gains resistance to bludgeoning, piercing, and slashing.</p>`,
    );
  };

  const restoreMagmaArmor = async (actor) => {
    const state = getFlag(actor, "magmaArmor", {});
    if (!state.unlocked || state.shattered || !state.cracked) return;
    await patchState(actor, { magmaArmor: { ...state, cracked: false } });
    await setEffectDisabled(actor, "magmaArmor", false);
    await setEffectDisabled(actor, "crackedShell", true);
    await chat(actor, `<p>The slag shell <strong>reseals</strong>. Magma Armor is active again (AC 22).</p>`);
  };

  const shatterMagmaArmor = async (actor) => {
    const state = getFlag(actor, "magmaArmor", {});
    await patchState(actor, {
      magmaArmor: { ...state, shattered: true, cracked: false, unlocked: true, coldHits: MAGMA_COLD_HITS_TO_SHATTER, cracks: MAGMA_COLD_HITS_TO_SHATTER },
    });
    await setEffectDisabled(actor, "magmaArmor", true);
    await setEffectDisabled(actor, "crackedShell", true);
    await chat(
      actor,
      `<p>The slag shell <strong>shatters</strong> after six cold hits. Magma Armor ends until it is reformed with the <strong>Magma Armor</strong> feature.</p>`,
    );
  };

  const reformMagmaArmor = async (actor) => {
    const state = getFlag(actor, "magmaArmor", {});
    if (state.unlocked && !state.shattered && !state.cracked) {
      ui.notifications?.info("Magma Armor is already active.");
      return;
    }
    if (state.cracked && !state.shattered) {
      await restoreMagmaArmor(actor);
      return;
    }
    const reforming = Boolean(state.shattered);
    await patchState(actor, {
      magmaArmor: {
        ...state,
        unlocked: true,
        shattered: false,
        cracked: false,
        restoreOnTurnEnd: false,
        coldHits: 0,
        cracks: 0,
      },
    });
    await setEffectDisabled(actor, "magmaArmor", false);
    await setEffectDisabled(actor, "crackedShell", true);
    await chat(
      actor,
      reforming
        ? `<p>The slag shell <strong>reforms</strong>. Magma Armor is active again (AC 22). Cold hits reset to <strong>0/${MAGMA_COLD_HITS_TO_SHATTER}</strong>.</p>`
        : `<p>The Dire Miralis's hide hardens into a <strong>slag shell</strong> (Magma Armor).</p>
           <p>AC becomes <strong>22</strong> and it gains resistance to bludgeoning, piercing, and slashing.</p>`,
    );
  };

  const crackMagmaArmor = async (actor, reason = "", { countColdHit = false } = {}) => {
    const state = getFlag(actor, "magmaArmor", {});
    if (!state.unlocked || state.shattered) return false;
    const coldHits = Number(state.coldHits ?? state.cracks ?? 0) + (countColdHit ? 1 : 0);
    if (countColdHit && coldHits >= MAGMA_COLD_HITS_TO_SHATTER) {
      await shatterMagmaArmor(actor);
      return true;
    }
    if (state.cracked && countColdHit) {
      await patchState(actor, {
        magmaArmor: { ...state, coldHits, cracks: coldHits },
      });
      await chat(
        actor,
        `<p>Magma Armor takes another <strong>cold</strong> hit (<strong>${coldHits}/${MAGMA_COLD_HITS_TO_SHATTER}</strong>).</p>`,
      );
      return true;
    }
    if (state.cracked && !countColdHit) return false;
    await patchState(actor, {
      magmaArmor: { ...state, coldHits, cracks: coldHits, cracked: true, restoreOnTurnEnd: true },
    });
    await setEffectDisabled(actor, "magmaArmor", true);
    await setEffectDisabled(actor, "crackedShell", false);
    const why = reason ? ` (${reason})` : "";
    const hitLine = countColdHit
      ? `<p>Cold hits on the shell: <strong>${coldHits}/${MAGMA_COLD_HITS_TO_SHATTER}</strong></p>`
      : `<p>Cold hits on the shell remain <strong>${coldHits}/${MAGMA_COLD_HITS_TO_SHATTER}</strong>.</p>`;
    await chat(
      actor,
      `<p>The slag shell <strong>cracks</strong>${why}! AC returns to 18 and physical resistance is lost until the end of the Dire Miralis's next turn.</p>${hitLine}`,
    );
    return true;
  };

  const squareTemplateSpec = ({ x, y, sizeFt = 5 }) => ({
    t: "rect",
    x,
    y,
    distance: sizeFt * Math.SQRT2,
    direction: 45,
  });

  const snapTopLeft = (x, y) => {
    if (typeof canvas.grid?.getTopLeftPoint === "function") {
      const p = canvas.grid.getTopLeftPoint({ x, y });
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return { x: p.x, y: p.y };
    }
    if (typeof canvas.grid?.getTopLeft === "function") {
      const result = canvas.grid.getTopLeft(x, y);
      if (Array.isArray(result) && result.length >= 2) return { x: result[0], y: result[1] };
      if (result && Number.isFinite(result.x)) return { x: result.x, y: result.y };
    }
    const size = canvas.grid?.size || 100;
    return { x: Math.floor(x / size) * size, y: Math.floor(y / size) * size };
  };

  const gridSquareSpec = (x, y) => squareTemplateSpec({ ...snapTopLeft(x, y), sizeFt: 5 });

  const templateCenter = (tpl) => {
    const size = canvas.grid?.size || 100;
    if (tpl?.t === "rect" || tpl?.t === "square") {
      const origin = snapTopLeft(tpl.x, tpl.y);
      return { x: origin.x + size / 2, y: origin.y + size / 2 };
    }
    return { x: Number(tpl?.x) || 0, y: Number(tpl?.y) || 0 };
  };

  const tokenSpaceSpec = (token) => {
    const doc = token.document ?? token;
    const sizeFt = Math.max(Number(doc.width) || 1, 1) * (canvas.grid?.distance || 5);
    return squareTemplateSpec({ x: doc.x, y: doc.y, sizeFt });
  };

  const placeHazardTemplate = async ({
    x,
    y,
    t = "circle",
    distance = 5,
    direction = 0,
    angle = 0,
    width = 0,
    fillColor = "#ff5500",
    borderColor = "#aa2200",
    hazard = "lava",
    until = null,
    label = "Lava",
  }) => {
    const scene = canvas.scene;
    if (!scene) return null;
    const [doc] = await scene.createEmbeddedDocuments("MeasuredTemplate", [
      {
        t,
        user: game.user.id,
        x,
        y,
        direction,
        angle,
        distance,
        width,
        borderColor,
        fillColor,
        hidden: false,
        flags: {
          world: {
            [NS]: {
              hazard,
              until,
              label,
            },
          },
        },
      },
    ]);
    return doc;
  };

  const hazardTemplates = (hazard) =>
    (canvas.scene?.templates ?? []).filter(
      (tpl) => foundry.utils.getProperty(tpl, `${FLAG}.hazard`) === hazard,
    );

  const pointInTemplate = (point, template) => {
    if (!point || !template) return false;
    try {
      const obj = template.object;
      const shape = obj?.shape;
      if (shape && typeof shape.contains === "function") {
        if (shape.contains(point.x - template.x, point.y - template.y)) return true;
        if (obj.center && shape.contains(point.x - obj.center.x, point.y - obj.center.y)) return true;
      }
    } catch {
      /* fall through */
    }
    if (typeof canvas.grid?.getOffset === "function") {
      const tokenCell = canvas.grid.getOffset(point);
      const originCell = canvas.grid.getOffset({ x: template.x, y: template.y });
      if (tokenCell && originCell && tokenCell.i === originCell.i && tokenCell.j === originCell.j) {
        return true;
      }
      if (template.t === "rect") {
        const size = canvas.grid?.size || 100;
        const inside = canvas.grid.getOffset({
          x: template.x + size / 2,
          y: template.y + size / 2,
        });
        if (tokenCell && inside && tokenCell.i === inside.i && tokenCell.j === inside.j) return true;
      }
    }
    const dx = point.x - template.x;
    const dy = point.y - template.y;
    const grid = canvas.grid?.size || 100;
    const ft = canvas.grid?.distance || 5;
    const distFt = (Math.hypot(dx, dy) / grid) * ft;
    const radius = Number(template.distance) || 5;
    return distFt <= Math.min(radius, 5) + 2.5;
  };

  const tokenSamplePoints = (token, center) => {
    const c = center ?? token?.center;
    if (!token || !c) return [];
    const doc = token.document ?? token;
    const size = canvas.grid?.size || 100;
    const nw = Math.max(1, Number(doc.width) || 1);
    const nh = Math.max(1, Number(doc.height) || 1);
    const topLeft = { x: c.x - (nw * size) / 2, y: c.y - (nh * size) / 2 };
    const points = [c];
    for (let i = 0; i < nw; i += 1) {
      for (let j = 0; j < nh; j += 1) {
        points.push({
          x: topLeft.x + (i + 0.5) * size,
          y: topLeft.y + (j + 0.5) * size,
        });
      }
    }
    return points;
  };

  const tokenInTemplate = (token, template, center = null) => {
    if (!token || !template) return false;
    const points = tokenSamplePoints(token, center ?? token.center);
    if (points.some((point) => pointInTemplate(point, template))) return true;
    if (typeof canvas.grid?.getOffset !== "function") return false;
    const size = canvas.grid?.size || 100;
    const origin = snapTopLeft(template.x, template.y);
    const tplCell = canvas.grid.getOffset({ x: origin.x + size / 2, y: origin.y + size / 2 });
    if (!tplCell) return false;
    return points.some((point) => {
      const cell = canvas.grid.getOffset(point);
      return Boolean(cell) && cell.i === tplCell.i && cell.j === tplCell.j;
    });
  };

  const tokensInHazard = (hazard) => {
    const tpls = hazardTemplates(hazard);
    if (!tpls.length) return [];
    const seen = new Set();
    const out = [];
    for (const token of canvas.tokens?.placeables ?? []) {
      if (!token.actor || token.actor.system?.attributes?.hp?.value <= 0) continue;
      if (isBoss(token.actor)) continue;
      if (tpls.some((tpl) => tokenInTemplate(token, tpl))) {
        if (!seen.has(token.id)) {
          seen.add(token.id);
          out.push(token);
        }
      }
    }
    return out;
  };

  const expireHazards = async (hazard, predicate) => {
    const scene = canvas.scene;
    if (!scene) return;
    const ids = hazardTemplates(hazard)
      .filter((tpl) => (predicate ? predicate(tpl) : true))
      .map((tpl) => tpl.id);
    if (ids.length) await scene.deleteEmbeddedDocuments("MeasuredTemplate", ids);
  };

  const expireItemOriginTemplates = async (actor, roles) => {
    const scene = canvas.scene;
    if (!scene || !actor) return;
    const origins = (roles ?? [])
      .map((role) => actor.items.find((i) => foundry.utils.getProperty(i, `${FLAG}.role`) === role)?.uuid)
      .filter(Boolean);
    if (!origins.length) return;
    const ids = (scene.templates ?? [])
      .filter((tpl) => {
        if (foundry.utils.getProperty(tpl, `${FLAG}.hazard`)) return false;
        const src = String(tpl.flags?.dnd5e?.origin ?? tpl.flags?.dnd5e?.itemOrigin ?? "");
        if (!src) return false;
        return origins.some((id) => src === id || src.startsWith(`${id}.`));
      })
      .map((tpl) => tpl.id);
    if (ids.length) await scene.deleteEmbeddedDocuments("MeasuredTemplate", ids).catch(() => null);
  };

  const lavaTickKey = (token) => {
    const c = game.combat;
    return `${c?.id ?? "n"}-${c?.round ?? 0}-${c?.turn ?? 0}-${token.id}`;
  };

  const applyLavaIfNeeded = async (token, { reason = "lava", center = null, prevCenter = null } = {}) => {
    if (!token?.actor || isBoss(token.actor)) return;
    const tpls = [
      ...hazardTemplates("lava"),
      ...hazardTemplates("taintedWater"),
      ...hazardTemplates("ventLava"),
    ];
    if (!tpls.length) return;
    const nowPt = center ?? token.center;
    const entered = tpls.filter((tpl) => {
      if (!tokenInTemplate(token, tpl, nowPt)) return false;
      if (!prevCenter) return true;
      return !tokenInTemplate(token, tpl, prevCenter);
    });
    if (!entered.length) return;
    const turnKey = lavaTickKey(token);
    const ticks = { ...(foundry.utils.getProperty(token.actor, `${FLAG}.lavaTicks`) ?? {}) };
    const fresh = entered.filter((tpl) => ticks[tpl.id] !== turnKey);
    if (!fresh.length) return;
    for (const tpl of fresh) ticks[tpl.id] = turnKey;
    await token.actor.update({ [`${FLAG}.lavaTicks`]: ticks });
    const origin = bossActors()[0];
    const item = origin?.items.find((i) => foundry.utils.getProperty(i, `${FLAG}.role`) === "magmaGlob") ?? null;
    const tainted = fresh.some((tpl) => foundry.utils.getProperty(tpl, `${FLAG}.hazard`) === "taintedWater");
    await applyFireDamage({
      tokens: [token],
      formula: LAVA_DAMAGE,
      flavor: tainted || reason === "tainted"
        ? "Tainted Sea Presence — boiling water"
        : "Lava — Magma Glob / Volcanic Vents",
      item,
    });
  };

  const applySteamIfNeeded = async (token, { center = null, prevCenter = null } = {}) => {
    if (!token?.actor || isBoss(token.actor)) return;
    const tpls = hazardTemplates("steam");
    const inside = (pt) => tpls.some((tpl) => tokenInTemplate(token, tpl, pt));
    if (!inside(center ?? token.center)) return;
    if (prevCenter && inside(prevCenter)) return;
    const key = `steam-${lavaTickKey(token)}`;
    const last = foundry.utils.getProperty(token.actor, `${FLAG}.lastSteamTick`);
    if (last === key) return;
    await token.actor.update({ [`${FLAG}.lastSteamTick`]: key });
    await applyFireDamage({
      tokens: [token],
      formula: STEAM_DAMAGE,
      flavor: "Blood-Red Steam",
    });
  };

  const boilingPresence = async (actor) => {
    const token = bossTokens(actor)[0];
    if (!token) return;
    const targets = tokensInRange(token, 10);
    if (!targets.length) return;
    const item = actor.items.find((i) => foundry.utils.getProperty(i, `${FLAG}.role`) === "boilingPresence");
    await applyFireDamage({
      tokens: targets,
      formula: BOILING_DAMAGE,
      flavor: "Boiling Presence (10 ft)",
      item,
    });
  };

  const placeLavaOnTargets = async (tokens, { hazard = "lava", until = null } = {}) => {
    const placed = [];
    for (const token of tokens) {
      const spec = tokenSpaceSpec(token);
      const doc = await placeHazardTemplate({
        ...spec,
        hazard,
        until,
        label: hazard === "ventLava" ? "Volcanic Vent Lava" : "Lava",
      });
      if (doc) placed.push(doc);
    }
    return placed;
  };

  const nearestUnoccupiedOffset = (originToken, targetToken) => {
    const grid = canvas.grid?.size || 100;
    const dirs = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1],
    ];
    const occupied = new Set(
      (canvas.tokens?.placeables ?? []).map((t) => `${Math.round(t.document.x / grid)},${Math.round(t.document.y / grid)}`),
    );
    for (const [dx, dy] of dirs) {
      const x = targetToken.document.x + dx * grid;
      const y = targetToken.document.y + dy * grid;
      const key = `${Math.round(x / grid)},${Math.round(y / grid)}`;
      if (!occupied.has(key)) return { x: x + targetToken.w / 2, y: y + targetToken.h / 2 };
    }
    const ox = originToken?.center?.x ?? targetToken.center.x;
    const oy = originToken?.center?.y ?? targetToken.center.y;
    return { x: targetToken.center.x + Math.sign(targetToken.center.x - ox) * grid, y: targetToken.center.y };
  };

  const onMagmaGlob = async (workflow) => {
    const actor = workflow.actor;
    const origin = bossTokens(actor)[0];
    const hits = [...(workflow.hitTargets ?? [])];
    const targets = [...(workflow.targets ?? [])];
    const until = Date.now() + 60 * 60 * 1000;
    if (hits.length) {
      await placeLavaOnTargets(hits, { hazard: "lava", until });
      await chat(actor, `<p>Magma Glob splatters — the target's space becomes <strong>lava</strong> for 1 hour.</p>`);
      return;
    }
    const missTarget = targets[0];
    if (!missTarget) return;
    const spot = nearestUnoccupiedOffset(origin, missTarget);
    const size = canvas.grid?.size || 100;
    await placeHazardTemplate({
      ...squareTemplateSpec({ x: spot.x - size / 2, y: spot.y - size / 2, sizeFt: 5 }),
      hazard: "lava",
      until,
      label: "Lava (miss scatter)",
    });
    await chat(actor, `<p>Magma Glob misses — lava erupts in an unoccupied space within 5 feet of the target.</p>`);
  };

  const recentAoETemplates = [];
  const rememberAoETemplate = (doc) => {
    if (!doc || foundry.utils.getProperty(doc, `${FLAG}.hazard`)) return;
    const dist = Number(doc.distance) || 0;
    const row = {
      id: doc.id,
      x: doc.x,
      y: doc.y,
      t: doc.t,
      distance: doc.distance,
      direction: doc.direction,
      ts: Date.now(),
    };
    if (dist > 0 && dist <= 15) pendingUntagged.push(row);
    if (dist < 3 || dist > 15) return;
    recentAoETemplates.push(row);
    while (recentAoETemplates.length > 12) recentAoETemplates.shift();
  };

  const asTemplateLike = (value) => {
    if (!value) return null;
    if (typeof value === "string") {
      const fromScene = canvas.scene?.templates?.get(value);
      if (fromScene) return fromScene;
      try {
        return fromUuidSync(value);
      } catch {
        return null;
      }
    }
    if (Number.isFinite(Number(value.x)) && Number.isFinite(Number(value.y))) return value;
    return null;
  };

  const collectWorkflowTemplates = (workflow) => {
    const out = [];
    const seen = new Set();
    const add = (raw) => {
      const tpl = asTemplateLike(raw);
      if (!tpl) return;
      const id = tpl.id ?? tpl._id ?? `${tpl.x},${tpl.y},${tpl.distance ?? ""}`;
      if (seen.has(id)) return;
      seen.add(id);
      out.push(tpl);
    };
    add(workflow?.templateId);
    add(workflow?.templateUuid);
    if (Array.isArray(workflow?.templateData)) {
      for (const row of workflow.templateData) add(row);
    } else {
      add(workflow?.templateData);
    }
    for (const tpl of workflow?.templates ?? []) add(tpl);
    for (const tpl of workflow?.placedTemplates ?? []) add(tpl);
    for (const uuid of workflow?.templateUuids ?? []) add(uuid);
    const origin = workflow?.item?.uuid;
    if (origin) {
      for (const tpl of canvas.scene?.templates ?? []) {
        const src = String(
          tpl.flags?.dnd5e?.origin ?? tpl.flags?.dnd5e?.itemOrigin ?? "",
        );
        if (src && (src === origin || src.startsWith(`${origin}.`))) add(tpl);
      }
    }
    return out;
  };

  const collectPlacementTemplates = (workflow) => {
    const out = [];
    const seen = new Set();
    const add = (raw) => {
      const tpl = raw && Number.isFinite(Number(raw.x)) && Number.isFinite(Number(raw.y))
        ? (asTemplateLike(raw) ?? raw)
        : asTemplateLike(raw);
      if (!tpl || !Number.isFinite(Number(tpl.x))) return;
      const origin = snapTopLeft(tpl.x, tpl.y);
      const cellKey = `${origin.x},${origin.y}`;
      if (seen.has(cellKey)) return;
      if (tpl.id && seen.has(tpl.id)) return;
      seen.add(cellKey);
      if (tpl.id) seen.add(tpl.id);
      out.push(tpl);
    };
    for (const tpl of collectWorkflowTemplates(workflow)) add(tpl);
    const now = Date.now();
    for (const row of pendingUntagged) {
      if (now - row.ts > 20000) continue;
      const doc = canvas.scene?.templates?.get(row.id);
      if (doc && !foundry.utils.getProperty(doc, `${FLAG}.hazard`)) add(doc);
      else if (!doc) add(row);
    }
    pendingUntagged.length = 0;
    for (const row of [...recentAoETemplates].reverse()) {
      if (now - row.ts > 20000) continue;
      add(row);
    }
    return out;
  };

  const adoptSquareHazards = async (templates, {
    hazard,
    until,
    label,
    fillColor = "#ff5500",
    borderColor = "#aa2200",
    max = templates.length,
  } = {}) => {
    const scene = canvas.scene;
    const adopted = [];
    const deleteIds = [];
    const seen = new Set();
    for (const tpl of templates) {
      const spec = gridSquareSpec(tpl.x, tpl.y);
      const cellKey = `${spec.x},${spec.y}`;
      const live = tpl.id && scene?.templates?.get(tpl.id);
      if (live && !foundry.utils.getProperty(live, `${FLAG}.hazard`)) deleteIds.push(live.id);
      if (adopted.length >= max || seen.has(cellKey)) continue;
      seen.add(cellKey);
      const created = await placeHazardTemplate({
        ...spec,
        fillColor,
        borderColor,
        hazard,
        until,
        label,
      });
      if (created) adopted.push(created);
    }
    const unique = [...new Set(deleteIds)].filter((id) => !adopted.some((doc) => doc.id === id));
    if (unique.length && scene) {
      await scene.deleteEmbeddedDocuments("MeasuredTemplate", unique).catch(() => null);
    }
    return adopted;
  };

  const waitCanvasPick = () => new Promise((resolve) => {
    const view = canvas.app?.view ?? canvas.app?.renderer?.view;
    if (!view) {
      resolve({ done: true });
      return;
    }
    const finish = (value) => {
      view.removeEventListener("mouseup", onMouseUp);
      view.removeEventListener("contextmenu", onContext);
      window.removeEventListener("keydown", onKey, true);
      resolve(value);
    };
    const onKey = (ev) => {
      if (ev.key === "Escape" || ev.key === "Enter") {
        ev.preventDefault();
        finish({ done: true });
      }
    };
    const onContext = (ev) => {
      ev.preventDefault();
      finish({ done: true });
    };
    const onMouseUp = (ev) => {
      if (ev.button === 2) {
        ev.preventDefault();
        finish({ done: true });
        return;
      }
      if (ev.button !== 0) return;
      const pos = canvas.mousePosition;
      if (!pos) return;
      finish({ done: false, ...snapTopLeft(pos.x, pos.y) });
    };
    view.addEventListener("mouseup", onMouseUp);
    view.addEventListener("contextmenu", onContext);
    window.addEventListener("keydown", onKey, true);
  });

  const pickAndPlaceSquares = async ({
    max,
    hazard,
    until,
    label,
    fillColor,
    borderColor,
    hint,
    stillActive = () => true,
  }) => {
    if (max < 1) return [];
    const placed = [];
    const view = canvas.app?.view ?? canvas.app?.renderer?.view;
    const prevCursor = view?.style?.cursor;
    if (view) view.style.cursor = "crosshair";
    ui.notifications?.info(hint);
    await new Promise((r) => setTimeout(r, 250));
    try {
      while (placed.length < max) {
        if (!stillActive()) break;
        const pick = await waitCanvasPick();
        if (pick.done) break;
        if (!stillActive()) break;
        const doc = await placeHazardTemplate({
          ...gridSquareSpec(pick.x, pick.y),
          fillColor,
          borderColor,
          hazard,
          until,
          label,
        });
        if (doc) placed.push(doc);
        const n = placed.length;
        if (n < max) {
          ui.notifications?.info(`${label}: ${n}/${max} spaces. Click another, or right-click / Enter to finish.`);
        }
      }
    } finally {
      if (view) view.style.cursor = prevCursor || "";
    }
    return placed;
  };

  const onVolcanicVents = async (workflow, { spaces = 2 } = {}) => {
    const actor = workflow.actor;
    const combat = game.combat;
    const until = combat
      ? { combatId: combat.id, round: combat.round, restoreOnBossTurnStart: true }
      : { ts: Date.now() + 6000 };
    const templates = collectPlacementTemplates(workflow);
    const targets = [...(workflow.targets ?? [])];
    let placed = await adoptSquareHazards(templates, {
      hazard: "ventLava",
      until,
      label: "Volcanic Vent Lava",
      max: spaces,
    });
    if (!placed.length && targets.length) {
      placed = await placeLavaOnTargets(targets.slice(0, spaces), { hazard: "ventLava", until });
    }
    if (!placed.length) {
      const extra = await pickAndPlaceSquares({
        max: spaces,
        hazard: "ventLava",
        until,
        label: "Volcanic Vent Lava",
        fillColor: "#ff5500",
        borderColor: "#aa2200",
        hint: `Volcanic Vents: click up to ${spaces} spaces (empty or occupied). Right-click / Enter to finish.`,
      });
      placed.push(...extra);
    }
    if (!placed.length) {
      ui.notifications?.warn(`Volcanic Vents: place up to ${spaces} spaces (empty or occupied).`);
      return;
    }
    await chat(
      actor,
      `<p>Volcanic Vents open under ${placed.length} space(s). Those spaces are <strong>lava</strong> until the start of the Dire Miralis's next turn. Entering <em>any</em> of them deals lava damage.</p>`,
    );
  };

  const pushToken = async (token, fromToken, distanceFt) => {
    if (!token?.document || !fromToken) return;
    const dx = token.center.x - fromToken.center.x;
    const dy = token.center.y - fromToken.center.y;
    const len = Math.hypot(dx, dy) || 1;
    const grid = canvas.grid?.size || 100;
    const ft = canvas.grid?.distance || 5;
    const distPx = (distanceFt / ft) * grid;
    await token.document.update({
      x: token.document.x + (dx / len) * distPx,
      y: token.document.y + (dy / len) * distPx,
    });
  };

  const failedSaveTokens = (workflow) => {
    const failed = [...(workflow.failedSaves ?? [])];
    if (failed.length) return failed;
    const saved = new Set([...(workflow.saves ?? [])].map((t) => t.id ?? t.document?.id));
    return [...(workflow.targets ?? [])].filter((t) => !saved.has(t.id ?? t.document?.id));
  };

  const successfulSaveTokens = (workflow) => {
    const saved = [...(workflow.saves ?? [])];
    if (saved.length) return saved;
    const failed = new Set(failedSaveTokens(workflow).map((t) => t.id ?? t.document?.id));
    return [...(workflow.targets ?? [])].filter((t) => !failed.has(t.id ?? t.document?.id));
  };

  const applyProne = async (tokens) => {
    for (const token of tokens) {
      const actor = token.actor;
      if (!actor || typeof actor.toggleStatusEffect !== "function") continue;
      await actor.toggleStatusEffect("prone", { active: true });
    }
  };

  const onCrush = async (workflow) => {
    const origin = bossTokens(workflow.actor)[0];
    await applyProne(failedSaveTokens(workflow));
    const survivors = successfulSaveTokens(workflow);
    if (survivors.length && origin) {
      await chat(
        workflow.actor,
        `<p>Crush: creatures that succeeded are pushed to the nearest unoccupied space outside the area (resolve remaining movement if needed).</p>`,
        { whisperGM: true },
      );
    }
  };

  const onTailSweep = async (workflow) => {
    const origin = bossTokens(workflow.actor)[0];
    for (const token of failedSaveTokens(workflow)) {
      await pushToken(token, origin, 10);
    }
  };

  const onTremor = async (workflow) => {
    await applyProne(failedSaveTokens(workflow));
  };

  const onWreckCollapse = async (workflow) => {
    await applyProne([]);
    for (const token of failedSaveTokens(workflow)) {
      if (typeof token.actor?.toggleStatusEffect === "function") {
        await token.actor.toggleStatusEffect("restrained", { active: true });
      }
    }
    const targets = [...(workflow.targets ?? [])];
    if (targets[0]) {
      await placeHazardTemplate({
        x: targets[0].center.x,
        y: targets[0].center.y,
        t: "rect",
        distance: 15,
        fillColor: "#6b4a2b",
        borderColor: "#3a2414",
        hazard: "wreckage",
        label: "Wreck Collapse (difficult terrain, half cover)",
      });
    }
  };

  const onBloodRedSteam = async (workflow) => {
    const combat = game.combat;
    const until = combat
      ? { combatId: combat.id, round: (combat.round ?? 0) + 1, init20: true }
      : { ts: Date.now() + 6000 };
    const target = [...(workflow.targets ?? [])][0];
    const origin = bossTokens(workflow.actor)[0];
    const x = target?.center?.x ?? origin?.center?.x;
    const y = target?.center?.y ?? origin?.center?.y;
    if (x == null) return;
    await placeHazardTemplate({
      x,
      y,
      t: "rect",
      distance: 20,
      fillColor: "#ff8899",
      borderColor: "#aa3344",
      hazard: "steam",
      until,
      label: "Blood-Red Steam (heavily obscured)",
    });
  };

  const onRisingMagmaTide = async (workflow) => {
    const target = [...(workflow.targets ?? [])][0];
    const origin = bossTokens(workflow.actor)[0];
    const x = target?.center?.x ?? origin?.center?.x;
    const y = target?.center?.y ?? origin?.center?.y;
    if (x == null) return;
    await placeHazardTemplate({
      x,
      y,
      t: "rect",
      distance: 40,
      fillColor: "#ff6600",
      borderColor: "#aa2200",
      hazard: "taintedWater",
      label: "Rising Magma Tide (boiling water / lava)",
    });
    await chat(
      workflow.actor,
      `<p>Rising Magma Tide: boiling water or lava spreads 10 feet inland along a 40-foot-wide front. Reposition the template to the waterline.</p>`,
      { whisperGM: true },
    );
  };

  const markLairUsed = async (actor, key) => {
    const round = game.combat?.round ?? 0;
    await patchState(actor, { lastLair: { key, round } });
  };

  const assertLairNotRepeat = (actor, key) => {
    const last = getFlag(actor, "lastLair", {});
    const round = game.combat?.round ?? 0;
    if (last?.key === key && last?.round === round - 1) {
      ui.notifications?.warn("Lair Action: cannot use the same effect two rounds in a row.");
      return false;
    }
    return true;
  };

  const startCalamityCharge = async (workflow) => {
    const actor = workflow.actor;
    await patchState(actor, {
      calamity: {
        charging: true,
        interrupted: false,
        damageByTurn: {},
        coldTaken: 0,
        markerIds: [],
        startedRound: game.combat?.round ?? 0,
      },
    });
    await setEffectDisabled(actor, "calamityCharging", false);

    const placed = await pickAndPlaceSquares({
      max: 6,
      hazard: "calamityMarker",
      until: { restoreOnBossTurnStart: true },
      label: "Calamity Rain marker",
      fillColor: "#ffdd33",
      borderColor: "#ffaa00",
      hint: "Calamity Rain is charging — click up to 6 spaces on the map. Right-click / Enter to finish. No token needed.",
      stillActive: () => {
        const current = game.actors.get(actor.id) ?? actor;
        const state = getFlag(current, "calamity", {});
        return state.charging === true && state.interrupted !== true;
      },
    });

    const live = game.actors.get(actor.id) ?? actor;
    const calamity = getFlag(live, "calamity", {});
    if (!calamity.charging || calamity.interrupted) {
      await expireHazards("calamityMarker");
      await expireItemOriginTemplates(live, ["calamityRain"]);
      return;
    }

    const markerIds = placed.map((tpl) => tpl.id).filter(Boolean);
    await patchState(live, {
      calamity: {
        ...calamity,
        charging: true,
        interrupted: false,
        markerIds,
      },
    });
    await chat(
      live,
      `<p>The Dire Miralis <strong>coils and glows</strong> — Calamity Rain is charging.</p>
       <p>${markerIds.length} detonation zone(s) marked. If it takes <strong>${CALAMITY_INTERRUPT_COLD} cumulative cold damage</strong> before detonation, the nova fails and the markers vanish.</p>
       <p>It cannot take reactions while charging. At the start of its next turn, Greater Fireball erupts on each marked space.</p>`,
    );
  };

  const sequencerDbFile = (candidates) => {
    const db = globalThis.Sequencer?.Database;
    const exists = (name) => {
      if (!name) return false;
      try {
        if (typeof db?.entryExists === "function") return Boolean(db.entryExists(name));
        if (typeof db?.getEntry === "function") return Boolean(db.getEntry(name));
      } catch {
        return false;
      }
      return false;
    };
    for (const name of candidates) {
      if (exists(name)) return name;
    }
    return candidates.find(Boolean) ?? null;
  };

  const playFireballAnimation = (originToken, x, y, delayMs = 0) => {
    if (typeof globalThis.Sequence !== "function") return Promise.resolve();
    const loc = { x, y };
    const ft = canvas.grid?.distance || 5;
    const diameterSpaces = (FIREBALL_RADIUS_FT * 2) / ft;
    const beam = sequencerDbFile([
      "jb2a.fireball.beam.orange",
      "jb2a.fireball.projectile.orange",
      "jb2a.ranged.01.projectile.01.fire.orange",
    ]);
    const boom = sequencerDbFile([
      "jb2a.fireball.explosion.orange",
      "jb2a.explosion.01.orange",
      "jb2a.explosion.02.orange",
      "jb2a.explosion.orange",
    ]);
    if (!beam && !boom) return Promise.resolve();
    try {
      const seq = new Sequence();
      if (delayMs > 0) seq.wait(delayMs);
      if (originToken && beam) {
        seq.effect()
          .file(beam)
          .atLocation(originToken)
          .stretchTo(loc)
          .waitUntilFinished(-400);
      }
      if (boom) {
        seq.effect()
          .file(boom)
          .atLocation(loc)
          .size(diameterSpaces, { gridUnits: true })
          .anchor({ x: 0.5, y: 0.5 })
          .zIndex(1000);
      }
      return seq.play();
    } catch (err) {
      console.warn("Dire Miralis | fireball animation", err);
      return Promise.resolve();
    }
  };

  const interruptCalamity = async (actor) => {
    const calamity = getFlag(actor, "calamity", {});
    if (!calamity.charging || calamity.interrupted) return;
    await patchState(actor, {
      calamity: { ...calamity, charging: false, interrupted: true, markerIds: [] },
      blockLegendaryUntilTurnEnd: true,
    });
    await setEffectDisabled(actor, "calamityCharging", true);
    if (typeof actor.toggleStatusEffect === "function") {
      await actor.toggleStatusEffect("prone", { active: true });
    }
    await crackMagmaArmor(actor, "Calamity Rain interrupted");
    await expireHazards("calamityMarker");
    await expireItemOriginTemplates(actor, ["calamityRain"]);
    await chat(
      actor,
      `<p><strong>Calamity Rain is interrupted!</strong> ${CALAMITY_INTERRUPT_COLD} cold damage was reached. Detonation zones are cleared. The Dire Miralis is knocked <strong>prone</strong>, Magma Armor cracks (if active), and it cannot use Legendary Actions until the end of its next turn.</p>`,
    );
  };

  const fireballAtPoint = async (actor, x, y) => {
    const item = actor.items.find((i) => foundry.utils.getProperty(i, `${FLAG}.role`) === "greaterFireball");
    const targets = (canvas.tokens?.placeables ?? []).filter((t) => {
      if (!t.actor || isBoss(t.actor)) return false;
      if (t.actor.system?.attributes?.hp?.value <= 0) return false;
      const grid = canvas.grid?.size || 100;
      const ft = canvas.grid?.distance || 5;
      const distFt = (Math.hypot(t.center.x - x, t.center.y - y) / grid) * ft;
      return distFt <= FIREBALL_RADIUS_FT + 2.5;
    });
    if (!targets.length) {
      await chat(actor, `<p>Greater Fireball detonates — no creatures in the 25-foot radius.</p>`);
      return;
    }
    const roll = await evaluateDamageRoll(FIREBALL_DAMAGE, "fire");
    await roll.toMessage({ speaker: speakerFor(actor), flavor: "Calamity Rain — Greater Fireball" });
    const full = Number(roll.total) || 0;
    const half = Math.floor(full / 2);
    for (const token of targets) {
      const save = await rollSave(token.actor, "dex", FIREBALL_DC);
      const dmg = save.success ? half : full;
      await applyTypedDamageToTokens({
        tokens: [token],
        amount: dmg,
        type: "fire",
        item: item ?? null,
      });
    }
  };

  const detonateCalamity = async (actor) => {
    const calamity = getFlag(actor, "calamity", {});
    if (!calamity.charging || calamity.interrupted) return;
    const templates = hazardTemplates("calamityMarker");
    const origin = bossTokens(actor)[0];
    const shots = templates.map((tpl) => templateCenter(tpl));
    await chat(
      actor,
      `<p><strong>Calamity Rain detonates!</strong> Greater Fireball erupts on each marked zone.</p>`,
    );
    shots.forEach((center, i) => {
      playFireballAnimation(origin, center.x, center.y, i * FIREBALL_STAGGER_MS);
    });
    if (shots.length) {
      await new Promise((r) => setTimeout(r, 450));
    }
    for (const center of shots) {
      await fireballAtPoint(actor, center.x, center.y);
    }
    await expireHazards("calamityMarker");
    await expireItemOriginTemplates(actor, ["calamityRain"]);
    await patchState(actor, {
      calamity: { charging: false, interrupted: false, damageByTurn: {}, coldTaken: 0, markerIds: [] },
    });
    await setEffectDisabled(actor, "calamityCharging", true);
    await crackMagmaArmor(actor, "heat shock from Calamity Rain");
  };

  const extractDamageTypes = (payload) => {
    const types = new Set();
    const add = (value) => {
      if (value == null || value === "") return;
      if (Array.isArray(value) || value instanceof Set) {
        for (const entry of value) add(entry);
        return;
      }
      if (typeof value === "object") {
        add(value.type ?? value.damageType);
        add(value.types);
        add(value.damageDetail);
        add(value.damageList);
        add(value.defaultDamageType);
        return;
      }
      types.add(String(value).toLowerCase());
    };
    add(payload?.damageItem);
    add(payload?.damageList);
    add(payload?.damageDetail);
    add(payload?.defaultDamageType);
    add(payload?.item?.system?.damage?.base?.types);
    const activity = payload?.activity
      ?? payload?.workflow?.activity
      ?? null;
    if (activity?.damage?.parts) {
      for (const part of activity.damage.parts) add(part?.types);
    }
    return [...types];
  };

  const extractAppliedDamage = (payload, actor) => {
    const list = payload?.damageList ?? payload?.damageItem ?? null;
    if (Array.isArray(list)) {
      const row = list.find((r) => r.actorId === actor.id || r.tokenId === actor.token?.id);
      if (row) return Number(row.appliedDamage ?? row.hpDamage ?? row.totalDamage ?? 0);
      return list.reduce((n, r) => n + Number(r.appliedDamage ?? r.hpDamage ?? 0), 0);
    }
    return Number(payload?.appliedDamage ?? payload?.totalDamage ?? payload?.damageTotal ?? 0);
  };

  const extractColdAmount = (payload, actor) => {
    const rows = [
      ...(Array.isArray(payload?.damageItem?.damageDetail) ? payload.damageItem.damageDetail : []),
      ...(Array.isArray(payload?.damageDetail) ? payload.damageDetail : []),
      ...(Array.isArray(payload?.damageList) ? payload.damageList : []),
    ];
    let cold = 0;
    for (const row of rows) {
      const t = String(row?.type ?? row?.damageType ?? "").toLowerCase();
      if (t !== "cold") continue;
      cold += Number(row.appliedDamage ?? row.hpDamage ?? row.damage ?? row.value ?? 0);
    }
    if (cold > 0) return cold;
    const types = extractDamageTypes(payload);
    if (!types.includes("cold")) return 0;
    if (types.every((t) => t === "cold")) return extractAppliedDamage(payload, actor);
    return 0;
  };

  const isDuplicateBossHit = (actor, amount, types) => {
    const hp = hpValue(actor);
    const sig = `${hp}|${amount}|${[...types].sort().join(",")}`;
    const prev = recentBossHits.get(actor.id);
    const now = Date.now();
    if (prev && prev.sig === sig && now - prev.t < 750) return true;
    recentBossHits.set(actor.id, { sig, t: now });
    return false;
  };

  const tallyCalamityCold = async (actor, coldAmount) => {
    const calamity = getFlag(actor, "calamity", {});
    if (!calamity.charging || calamity.interrupted) return;
    const amount = Number(coldAmount || 0);
    if (amount <= 0) return;
    const coldTaken = Number(calamity.coldTaken ?? 0) + amount;
    await patchState(actor, { calamity: { ...calamity, coldTaken } });
    await chat(
      actor,
      `<p>Calamity Rain interrupt: <strong>${Math.min(coldTaken, CALAMITY_INTERRUPT_COLD)}/${CALAMITY_INTERRUPT_COLD}</strong> cold.</p>`,
      { whisperGM: true },
    );
    if (coldTaken >= CALAMITY_INTERRUPT_COLD) {
      await interruptCalamity(actor);
    }
  };

  const onBossDamaged = async (actor, amount, types, coldAmount = 0) => {
    if (!isBoss(actor) || !isActiveGM()) return;
    const uniq = [...new Set((types ?? []).map((t) => String(t).toLowerCase()))];
    if (isDuplicateBossHit(actor, amount, uniq)) return;
    if (hpValue(actor) < magmaThreshold(actor)) {
      await activateMagmaArmor(actor);
    }
    const isCold = uniq.includes("cold") && Number(amount || 0) > 0;
    if (isCold) {
      await crackMagmaArmor(actor, "cold damage", { countColdHit: true });
    }
    const cold = Number(coldAmount || 0) > 0
      ? Number(coldAmount)
      : (isCold && uniq.every((t) => t === "cold") ? Number(amount || 0) : 0);
    if (cold > 0) await tallyCalamityCold(actor, cold);
  };

  const scorchingHide = async (workflow) => {
    const attacker = workflow.token ?? [...(workflow.targets ?? [])][0];
    // When Dire Miralis is HIT, the workflow actor is the attacker.
    const hitTargets = [...(workflow.hitTargets ?? [])];
    const bossHit = hitTargets.find((t) => isBoss(t.actor));
    if (!bossHit) return;
    const attackType = String(workflow.activity?.attack?.type?.value ?? workflow.item?.system?.actionType ?? "");
    const isMelee = attackType === "melee" || ["mwak", "msak"].includes(attackType);
    if (!isMelee) return;
    const actor = bossHit.actor;
    const charging = getFlag(actor, "calamity.charging") === true;
    if (charging) return;
    const item = actor.items.find((i) => foundry.utils.getProperty(i, `${FLAG}.role`) === "scorchingHide");
    const attackerToken = workflow.token ?? canvas.tokens.get(workflow.tokenId);
    if (!attackerToken) return;
    await applyFireDamage({
      tokens: [attackerToken],
      formula: "2d8",
      flavor: "Scorching Hide",
      item,
    });
  };

  const onUse = async (payload) => {
    if (!isActiveGM()) return;
    const workflow = payload?.workflow ?? payload;
    const item = workflow?.item ?? null;
    if (!item) return;
    const actor = workflow.actor ?? item.actor;
    if (!isBoss(actor)) return;
    const role = foundry.utils.getProperty(item, `${FLAG}.role`);
    const identifier = String(
      workflow.activity?.midiProperties?.identifier ?? workflow.activity?.identifier ?? "",
    );

    switch (role) {
      case "magmaArmor":
        await reformMagmaArmor(actor);
        break;
      case "magmaGlob":
        await onMagmaGlob(workflow);
        break;
      case "volcanicVents":
        await onVolcanicVents(workflow, { spaces: 2 });
        break;
      case "ventBarrage":
        await onVolcanicVents(workflow, { spaces: 3 });
        break;
      case "crush":
        await onCrush(workflow);
        break;
      case "tailSweep":
        await onTailSweep(workflow);
        break;
      case "tremor":
        await onTremor(workflow);
        break;
      case "shiftStance":
        if (identifier === "shift-stance-move") {
          await chat(actor, `<p>The Dire Miralis repositions up to half its speed without provoking opportunity attacks.</p>`);
        } else {
          const next = stanceOf(actor) === "biped" ? "quadruped" : "biped";
          await setStance(actor, next);
        }
        break;
      case "calamityRain":
        await startCalamityCharge(workflow);
        break;
      case "wreckCollapse":
        if (!assertLairNotRepeat(actor, "wreck")) return;
        await markLairUsed(actor, "wreck");
        await onWreckCollapse(workflow);
        break;
      case "bloodRedSteam":
        if (!assertLairNotRepeat(actor, "steam")) return;
        await markLairUsed(actor, "steam");
        await onBloodRedSteam(workflow);
        break;
      case "risingMagmaTide":
        if (!assertLairNotRepeat(actor, "tide")) return;
        await markLairUsed(actor, "tide");
        await onRisingMagmaTide(workflow);
        break;
      case "lumberingAdvance":
        await chat(
          actor,
          `<p>Lumbering Advance: the Dire Miralis moves up to half its speed. This movement doesn't provoke opportunity attacks if it ends in water or adjacent to a structure or Huge or larger object.</p>`,
        );
        break;
      default:
        break;
    }
  };

  const onBossTurnStart = async (actor) => {
    const calamity = getFlag(actor, "calamity", {});
    if (calamity.charging && !calamity.interrupted) {
      await detonateCalamity(actor);
    }
    await expireHazards("ventLava", () => true);
    await expireItemOriginTemplates(actor, ["volcanicVents", "ventBarrage"]);
    await boilingPresence(actor);
  };

  const onBossTurnEnd = async (actor) => {
    const magma = getFlag(actor, "magmaArmor", {});
    if (magma.cracked && magma.restoreOnTurnEnd && !magma.shattered) {
      await restoreMagmaArmor(actor);
    }
    if (getFlag(actor, "blockLegendaryUntilTurnEnd") === true) {
      await patchState(actor, { blockLegendaryUntilTurnEnd: false });
      await chat(actor, `<p>The Dire Miralis can use Legendary Actions again.</p>`);
    }
    const vents = actor.items.find((i) => foundry.utils.getProperty(i, `${FLAG}.role`) === "volcanicVents");
    await chat(
      actor,
      `<p><em>End of turn — Volcanic Vents:</em> choose up to two spaces within 60 feet${vents ? ` and use <strong>${vents.name}</strong>` : ""}.</p>`,
      { whisperGM: true },
    );
  };

  const onOtherTurnStart = async (combatant) => {
    const tokenDoc = combatant?.token;
    const token =
      tokenDoc?.object
      ?? canvas.tokens.get(combatant?.tokenId ?? tokenDoc?.id)
      ?? (tokenDoc?.center ? tokenDoc : null);
    if (!token) return;
    await applyLavaIfNeeded(token, { reason: "lava" });
    await applySteamIfNeeded(token);
  };

  const resolveTurnCombatant = (combat, ref) => {
    if (ref?.actor) return ref;
    const id = ref?.combatantId;
    if (id && combat?.combatants?.get(id)) return combat.combatants.get(id);
    if (ref?.tokenId) {
      return combat?.combatants?.find((c) => c.tokenId === ref.tokenId) ?? combat?.combatant ?? null;
    }
    return combat?.combatant ?? null;
  };

  const handleCombatTurn = async (combat, _prior, current) => {
    if (!isActiveGM()) return;
    const combatant = resolveTurnCombatant(combat, current);
    const actor = combatant?.actor;
    if (isBoss(actor)) {
      await onBossTurnStart(actor);
      return;
    }
    await onOtherTurnStart(combatant);
  };

  const handleCombatUpdate = async (combat, changed) => {
    if (!isActiveGM()) return;
    if (changed.turn === undefined && changed.round === undefined) return;
    const prevTurn = combat.previous?.turn;
    if (prevTurn === undefined) return;
    const prev = combat.turns?.[prevTurn];
    if (prev?.actor && isBoss(prev.actor)) {
      await onBossTurnEnd(prev.actor);
    }
  };

  let hooksArmed = false;

  const ensureHooks = () => {
    if (hooksArmed) return;
    hooksArmed = true;

    Hooks.on("updateActor", (actor, changed) => {
      if (!isBoss(actor) || !isActiveGM()) return;
      const nextHp = changed.system?.attributes?.hp?.value;
      if (nextHp === undefined) return;
      if (Number(nextHp) < magmaThreshold(actor)) {
        activateMagmaArmor(actor).catch((err) => console.error("Dire Miralis | magma armor", err));
      }
    });

    const damageHook = (first, second) => {
      try {
        let actor = null;
        let payload = second ?? first;
        if (first?.actor) actor = first.actor;
        else if (first?.documentName === "Actor") actor = first;
        else if (second?.actor) actor = second.actor;
        if (!actor && payload?.actorUuid) {
          actor = fromUuidSync(payload.actorUuid);
        }
        if (!isBoss(actor)) {
          // Attack workflows: Dire Miralis may be the hit target (Scorching Hide).
          if (first?.hitTargets) {
            scorchingHide(first).catch((err) => console.error("Dire Miralis | hide", err));
          }
          return;
        }
        const amount = extractAppliedDamage(payload, actor) || extractAppliedDamage(first, actor);
        const types = [...extractDamageTypes(payload), ...extractDamageTypes(first)];
        const coldAmount = extractColdAmount(payload, actor) || extractColdAmount(first, actor);
        onBossDamaged(actor, amount, types, coldAmount).catch((err) => console.error("Dire Miralis | damaged", err));
      } catch (err) {
        console.error("Dire Miralis | damage hook", err);
      }
    };

    Hooks.on("midi-qol.DamageApplied", damageHook);
    Hooks.on("midi-qol.RollComplete", (workflow) => {
      if (!workflow) return;
      scorchingHide(workflow).catch((err) => console.error("Dire Miralis | hide", err));
      const hitBoss = [...(workflow.hitTargets ?? [])].find((t) => isBoss(t.actor));
      if (!hitBoss) return;
      const types = extractDamageTypes(workflow);
      if (String(workflow.defaultDamageType ?? "").toLowerCase() === "cold") types.push("cold");
      const amount = extractAppliedDamage(workflow, hitBoss.actor)
        || Number(workflow.totalDamage ?? workflow.damageTotal ?? 0);
      const coldAmount = extractColdAmount(workflow, hitBoss.actor);
      onBossDamaged(hitBoss.actor, amount, types, coldAmount).catch((err) => console.error("Dire Miralis | roll complete", err));
    });

    Hooks.on("createMeasuredTemplate", (doc) => {
      rememberAoETemplate(doc);
    });

    Hooks.on("preUpdateToken", (tokenDoc, changed) => {
      if (changed.x === undefined && changed.y === undefined) return;
      prevTokenCenters.set(tokenDoc.id, tokenCenterFromDoc(tokenDoc, {}));
    });

    Hooks.on("updateToken", (tokenDoc, changed) => {
      if (!isActiveGM()) return;
      if (changed.x === undefined && changed.y === undefined) return;
      const token = tokenDoc.object ?? canvas.tokens.get(tokenDoc.id);
      if (!token) return;
      const prevCenter = prevTokenCenters.get(tokenDoc.id) ?? null;
      prevTokenCenters.delete(tokenDoc.id);
      const nextCenter = tokenCenterFromDoc(tokenDoc, changed);
      applyLavaIfNeeded(token, { reason: "enter", center: nextCenter, prevCenter }).catch((err) => console.error("Dire Miralis | lava enter", err));
      applySteamIfNeeded(token, { center: nextCenter, prevCenter }).catch((err) => console.error("Dire Miralis | steam enter", err));
    });

    Hooks.on("combatTurnChange", (combat, prior, current) => {
      handleCombatTurn(combat, prior, current).catch((err) => console.error("Dire Miralis | turn", err));
    });
    Hooks.on("updateCombat", (combat, changed) => {
      handleCombatUpdate(combat, changed).catch((err) => console.error("Dire Miralis | combat", err));
    });

    Hooks.on("dnd5e.preRollSavingThrowV2", (config) => {
      const actor = config?.subject ?? config?.actor;
      if (!isBoss(actor) || stanceOf(actor) !== "quadruped") return;
      const flavor = String(config?.flavor ?? config?.title ?? config?.dialogOptions?.title ?? "").toLowerCase();
      const isProne = /prone/.test(flavor);
      if (isProne) {
        config.advantage = true;
        if (config.rolls?.[0]) config.rolls[0].advantage = true;
      }
    });

    Hooks.on("midi-qol.preItemRoll", (workflow) => {
      const actor = workflow?.actor;
      if (!isBoss(actor)) return true;
      if (getFlag(actor, "calamity.charging") !== true) return true;
      const activation = String(workflow?.activity?.activation?.type ?? workflow?.item?.system?.activation?.type ?? "");
      if (activation === "reaction") {
        ui.notifications?.warn("Calamity Rain is charging — the Dire Miralis cannot take reactions.");
        return false;
      }
      return true;
    });

    Hooks.on("midi-qol.preItemRoll", (workflow) => {
      const actor = workflow?.actor;
      if (!isBoss(actor)) return true;
      if (getFlag(actor, "blockLegendaryUntilTurnEnd") !== true) return true;
      const activation = String(workflow?.activity?.activation?.type ?? "");
      if (activation === "legendary") {
        ui.notifications?.warn("The Dire Miralis cannot use Legendary Actions until the end of its next turn.");
        return false;
      }
      return true;
    });
  };

  globalThis.__amellwindDireMiralis = {
    NS,
    isBoss,
    onUse,
    ensureHooks,
    setStance,
    crackMagmaArmor,
    activateMagmaArmor,
    reformMagmaArmor,
    placeHazardTemplate,
  };
})();
