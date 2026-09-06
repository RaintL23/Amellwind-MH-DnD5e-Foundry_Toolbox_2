/**
 * Tempered Alatreon (MHW) — combat automation (Foundry v12 / dnd5e 4.4 / Midi QOL 12.x).
 * Loaded as a module script on every client; GM-only mutations run on the active GM.
 *
 * Handles: Active State machine + HP thresholds, Element Burst, Elemental Overload,
 * Horns, Escaton Judgement, Elemental Breath typing, Legendary Limit, mythic gating,
 * melee / blight riders, Scorched Earth & Frost Breath zones, Ice Shards reminders.
 */
(() => {
  const NS = "alatreon";
  const FLAG = `flags.world.${NS}`;

  const STATE_HP_THRESHOLD = 100;
  const HORN_MAX_HP = 200;
  const BURST_FORMULA = "7d6";
  const BURST_DC = 27;
  const BURST_RANGE_FT = 30;
  const ESCATON_BASE_DICE = 60;
  const ESCATON_DC = 30;
  const ESCATON_RANGE_FT = 600;
  const MELEE_DC = 27;
  const ZONE_ENTER_FORMULA = "3d6";
  const ZONE_MOVE_FORMULA = "2d6";
  const IGNITE_FORMULA = "2d6";
  const ICE_SHARD_EXPLODE = "1d8";

  const CYCLE_ORDERS = {
    fire: ["fire", "dragon", "ice", "dragon"],
    ice: ["ice", "dragon", "fire", "dragon"],
  };

  const STATE_LABEL = {
    fire: "Fire State",
    dragon: "Dragon State",
    ice: "Ice State",
  };

  const STATE_BURST_TYPE = {
    fire: "fire",
    dragon: "necrotic",
    ice: "cold",
  };

  const STATE_EFFECT_KIND = {
    fire: "fireState",
    dragon: "dragonState",
    ice: "iceState",
  };

  const BREATH_TYPES = {
    1: "fire",
    2: "cold",
    3: "necrotic",
    4: "lightning",
  };

  const MYTHIC_REQUIRED_STATE = {
    mythicMultiattack: "dragon",
    "mythic-multiattack": "dragon",
    dragonRush: "dragon",
    "dragon-rush": "dragon",
    fireball: "fire",
    fireBreathY: "fire",
    "fire-breath-y": "fire",
    scorchedEarth: "fire",
    "scorched-earth": "fire",
    frostBreath: "ice",
    "frost-breath": "ice",
    iceShards: "ice",
    "ice-shards": "ice",
  };

  const BLIGHT_BY_ROLE = {
    waterBreath: { kind: "waterblight", label: "waterblight" },
    arcLightning: { kind: "thunderblight", label: "thunderblight" },
    lightningStorm: { kind: "thunderblight", label: "thunderblight" },
    frostBreath: { kind: "iceblight", label: "iceblight" },
  };

  const recentBossHits = new Map();
  const prevTokenCenters = new Map();
  const prevBossHp = new Map();
  const zoneMoveAcc = new Map();

  // ─── Core helpers ───

  const isActiveGM = () =>
    Boolean(game.user?.isGM) &&
    (!game.users?.activeGM || game.users.activeGM.id === game.user.id);

  const getFlag = (doc, path, fallback = undefined) => {
    if (!doc) return fallback;
    const value = foundry.utils.getProperty(doc, `${FLAG}.${path}`);
    return value === undefined ? fallback : value;
  };

  const isBoss = (actor) => Boolean(actor && getFlag(actor, "bossNpc") === true);

  const bossActors = () => (game.actors?.contents ?? []).filter((a) => isBoss(a));

  const bossTokens = (actor) =>
    (canvas?.tokens?.placeables ?? []).filter(
      (t) => t.actor && (t.actor === actor || t.actor.id === actor?.id),
    );

  const speakerFor = (actor) => ChatMessage.getSpeaker({ actor });

  const chat = async (actor, html, { whisperGM = false } = {}) => {
    const data = { speaker: speakerFor(actor), content: html };
    if (whisperGM) data.whisper = game.users.filter((u) => u.isGM).map((u) => u.id);
    await ChatMessage.create(data);
  };

  const findItemByRole = (actor, role) =>
    actor?.items?.find((i) => foundry.utils.getProperty(i, `${FLAG}.role`) === role) ?? null;

  const activityIdentifier = (workflow) =>
    String(
      workflow?.activity?.midiProperties?.identifier ??
        workflow?.activity?.identifier ??
        "",
    );

  const activationType = (workflow) =>
    String(
      workflow?.activity?.activation?.type ??
        workflow?.item?.system?.activation?.type ??
        "",
    );

  const hpValue = (actor) => Number(actor?.system?.attributes?.hp?.value ?? 0);

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
    const next = foundry.utils.mergeObject(foundry.utils.deepClone(current), patch, {
      inplace: false,
    });
    await actor.update({ [`flags.world.${NS}`]: next });
  };

  const defaultHorns = () => ({
    left: { hp: HORN_MAX_HP, broken: false },
    right: { hp: HORN_MAX_HP, broken: false },
  });

  const hornsOf = (actor) => {
    const h = getFlag(actor, "horns", null);
    if (h?.left && h?.right) return foundry.utils.deepClone(h);
    return defaultHorns();
  };

  const brokenHornCount = (actor) => {
    const h = hornsOf(actor);
    return Number(Boolean(h.left?.broken)) + Number(Boolean(h.right?.broken));
  };

  const activeStateOf = (actor) => {
    const s = String(getFlag(actor, "activeState", "") || "").toLowerCase();
    return ["fire", "dragon", "ice"].includes(s) ? s : null;
  };

  const cycleOf = (actor) => {
    const c = String(getFlag(actor, "cycle", "fire") || "fire").toLowerCase();
    return c === "ice" ? "ice" : "fire";
  };

  // ─── Distance / tokens ───

  const tokenRect = (token) => {
    const size = canvas.grid?.size || 100;
    const w = token.w ?? (Number(token.document?.width) || 1) * size;
    const h = token.h ?? (Number(token.document?.height) || 1) * size;
    const c =
      token.center ?? {
        x: (token.document?.x ?? 0) + w / 2,
        y: (token.document?.y ?? 0) + h / 2,
      };
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

  const measurePointDistanceFt = (a, b) => {
    if (!a || !b) return Infinity;
    const grid = canvas.grid?.size || 100;
    const ft = canvas.grid?.distance || 5;
    return (Math.hypot(a.x - b.x, a.y - b.y) / grid) * ft;
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

  // ─── Damage helpers ───

  const evaluateRoll = async (formula) => new Roll(formula).evaluate();

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
        /* fall through */
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

  const applyDamageFormula = async ({ tokens, formula, flavor, type = "fire", item = null }) => {
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

  /** Player/NPC saves: always show the dnd5e Advantage / Normal / Disadvantage dialog. */
  const rollSave = async (actor, ability, dc) => {
    if (!actor) return { success: true, total: dc };
    const ablLabel = CONFIG.DND5E?.abilities?.[ability]?.label ?? String(ability).toUpperCase();
    let result;
    if (typeof actor.rollSavingThrow === "function") {
      result = await actor.rollSavingThrow(
        { ability, target: dc },
        { configure: true },
        { data: { flavor: `${ablLabel} saving throw (DC ${dc})` } },
      );
    } else if (typeof actor.rollAbilitySave === "function") {
      result = await actor.rollAbilitySave(ability, {
        targetValue: dc,
        fastForward: false,
        chatMessage: true,
      });
    }
    if (result == null) return { success: true, total: dc, cancelled: true };
    const roll = Array.isArray(result) ? result[0] : result;
    if (!roll) return { success: true, total: dc, cancelled: true };
    const total = Number(roll?.total ?? roll?._total ?? 0);
    return { success: total >= dc, total, roll };
  };

  const failedSaveTokens = (workflow) => {
    const failed = [...(workflow.failedSaves ?? [])];
    if (failed.length) return failed;
    const saved = new Set([...(workflow.saves ?? [])].map((t) => t.id ?? t.document?.id));
    return [...(workflow.targets ?? [])].filter((t) => !saved.has(t.id ?? t.document?.id));
  };

  const hitTokens = (workflow) => {
    const hits = [...(workflow.hitTargets ?? [])];
    if (hits.length) return hits;
    return [...(workflow.targets ?? [])];
  };

  const applyProne = async (tokens) => {
    for (const token of tokens) {
      const actor = token.actor;
      if (!actor || typeof actor.toggleStatusEffect !== "function") continue;
      await actor.toggleStatusEffect("prone", { active: true });
    }
  };

  const cloneEffectData = (effect, overrides = {}) => {
    const data = effect.toObject();
    delete data._id;
    foundry.utils.mergeObject(data, overrides);
    data.origin = effect.uuid;
    data.disabled = false;
    data.transfer = false;
    return data;
  };

  const applyEffectKindToActor = async (sourceActor, targetActor, kind, { durationSeconds = 60 } = {}) => {
    if (!sourceActor || !targetActor || !kind) return false;
    const api = globalThis.__amellwindConditions;
    if (api?.applyToActor && api.afflictions?.some((a) => a.id === kind)) {
      await api.applyToActor(targetActor, kind, {
        durationSeconds,
        origin: sourceActor.uuid,
      });
      return true;
    }
    const template = findEffect(sourceActor, kind);
    if (!template) {
      await chat(
        sourceActor,
        `<p><em>GM:</em> no item effect with kind <code>${kind}</code> found — apply manually to ${targetActor.name}.</p>`,
        { whisperGM: true },
      );
      return false;
    }
    const existing = targetActor.effects?.find(
      (ef) => foundry.utils.getProperty(ef, `${FLAG}.kind`) === kind,
    );
    if (existing) await existing.delete().catch(() => null);
    const data = cloneEffectData(template, {
      duration: { seconds: durationSeconds, startTime: game.time?.worldTime ?? 0 },
      name: template.name || kind,
    });
    await targetActor.createEmbeddedDocuments("ActiveEffect", [data]);
    return true;
  };

  const applyIgnited = async (token, boss) => {
    const actor = token?.actor;
    if (!actor || isBoss(actor)) return;
    const existing = actor.effects?.find(
      (ef) => foundry.utils.getProperty(ef, `${FLAG}.kind`) === "ignited",
    );
    if (existing) return;
    const template = findEffect(boss, "ignited");
    if (template) {
      await applyEffectKindToActor(boss, actor, "ignited", { durationSeconds: 600 });
      return;
    }
    await actor.createEmbeddedDocuments("ActiveEffect", [
      {
        name: "Ignited (Scorched Earth)",
        img: "icons/magic/fire/flame-burning-creature.webp",
        disabled: false,
        duration: { seconds: 600, startTime: game.time?.worldTime ?? 0 },
        flags: { world: { [NS]: { kind: "ignited" } } },
        description:
          "Takes 2d6 fire damage at the start of each of its turns until a creature uses an action to douse the fire.",
      },
    ]);
  };

  // ─── Damage extraction ───

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
    const activity = payload?.activity ?? payload?.workflow?.activity ?? null;
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

  const extractElementalAmount = (payload, actor) => {
    const elemental = new Set(["fire", "cold", "lightning"]);
    const rows = [
      ...(Array.isArray(payload?.damageItem?.damageDetail) ? payload.damageItem.damageDetail : []),
      ...(Array.isArray(payload?.damageDetail) ? payload.damageDetail : []),
      ...(Array.isArray(payload?.damageList) ? payload.damageList : []),
    ];
    let total = 0;
    for (const row of rows) {
      const t = String(row?.type ?? row?.damageType ?? "").toLowerCase();
      if (!elemental.has(t)) continue;
      total += Number(row.appliedDamage ?? row.hpDamage ?? row.damage ?? row.value ?? 0);
    }
    if (total > 0) return total;
    const types = extractDamageTypes(payload).filter((t) => elemental.has(t));
    if (!types.length) return 0;
    if (extractDamageTypes(payload).every((t) => elemental.has(t))) {
      return extractAppliedDamage(payload, actor);
    }
    return 0;
  };

  const isDuplicateBossHit = (actor, amount, types) => {
    const hp = hpValue(actor);
    const sig = `${hp}|${amount}`;
    const prev = recentBossHits.get(actor.id);
    const now = Date.now();
    // Ignore type differences so updateActor + midi-qol do not double-count
    if (prev && prev.sig === sig && now - prev.t < 900) return true;
    if (prev && now - prev.t < 400 && Math.abs(prev.amount - Number(amount || 0)) < 1) return true;
    recentBossHits.set(actor.id, { sig, amount: Number(amount) || 0, t: now, types });
    return false;
  };

  // ─── Templates / hazards ───

  const placeHazardTemplate = async ({
    x,
    y,
    t = "circle",
    distance = 30,
    direction = 0,
    angle = 0,
    width = 0,
    fillColor = "#ff5500",
    borderColor = "#aa2200",
    hazard = "scorchedEarth",
    until = null,
    label = "Hazard",
    ownerId = null,
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
              ownerId,
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
        if (obj.center && shape.contains(point.x - obj.center.x, point.y - obj.center.y)) {
          return true;
        }
      }
    } catch {
      /* fall through */
    }
    const dx = point.x - template.x;
    const dy = point.y - template.y;
    const grid = canvas.grid?.size || 100;
    const ft = canvas.grid?.distance || 5;
    const distFt = (Math.hypot(dx, dy) / grid) * ft;
    const radius = Number(template.distance) || 5;
    return distFt <= radius + 2.5;
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
    return tokenSamplePoints(token, center ?? token.center).some((point) =>
      pointInTemplate(point, template),
    );
  };

  const expireHazards = async (hazard, predicate) => {
    const scene = canvas.scene;
    if (!scene) return;
    const ids = hazardTemplates(hazard)
      .filter((tpl) => (predicate ? predicate(tpl) : true))
      .map((tpl) => tpl.id);
    if (ids.length) await scene.deleteEmbeddedDocuments("MeasuredTemplate", ids);
  };

  const expireBossHazards = async (actor) => {
    const id = actor?.id;
    const pred = (tpl) => {
      const owner = foundry.utils.getProperty(tpl, `${FLAG}.ownerId`);
      return !owner || owner === id;
    };
    await expireHazards("scorchedEarth", pred);
    await expireHazards("frostBreath", pred);
    await expireHazards("iceShard", pred);
  };

  const zoneTickKey = (token) => {
    const c = game.combat;
    return `${c?.id ?? "n"}-${c?.round ?? 0}-${c?.turn ?? 0}-${token.id}`;
  };

  // ─── Active State machine ───

  const setActiveState = async (actor, state, { announce = true } = {}) => {
    const next = String(state || "").toLowerCase();
    if (!["fire", "dragon", "ice"].includes(next)) {
      ui.notifications?.warn(`Alatreon: unknown state "${state}"`);
      return;
    }
    await patchState(actor, {
      activeState: next,
      stateHpLost: 0,
    });
    for (const [key, kind] of Object.entries(STATE_EFFECT_KIND)) {
      await setEffectDisabled(actor, kind, key !== next);
    }
    if (announce) {
      await chat(
        actor,
        `<p><strong>Tempered Alatreon</strong> enters <strong>${STATE_LABEL[next]}</strong>.</p>
         <p>${
           next === "fire"
             ? "Immune to fire; vulnerable to cold."
             : next === "ice"
               ? "Immune to cold; vulnerable to fire."
               : "Resistant to all damage except necrotic, poison, and psychic."
         }</p>`,
      );
    }
  };

  const revertToPreviousState = async (actor) => {
    const prev = String(getFlag(actor, "previousState", "") || "").toLowerCase();
    if (!["fire", "dragon", "ice"].includes(prev)) {
      await chat(
        actor,
        `<p>A horn breaks, but no previous active state is recorded.</p>`,
        { whisperGM: true },
      );
      return;
    }
    await chat(
      actor,
      `<p>Horn shattered — Alatreon reverts to its previous <strong>${STATE_LABEL[prev]}</strong>.</p>`,
    );
    await setActiveState(actor, prev);
  };

  const elementBurst = async (actor, state) => {
    const damageType = STATE_BURST_TYPE[state] ?? "fire";
    const origin = bossTokens(actor)[0];
    const item = findItemByRole(actor, "elementBurst");
    const targets = origin ? tokensInRange(origin, BURST_RANGE_FT) : [];

    if (!targets.length) {
      await chat(
        actor,
        `<p><strong>Element Burst</strong> (${damageType}, DC ${BURST_DC} Dex half) — special reaction; no creatures in ${BURST_RANGE_FT} ft.</p>`,
      );
      return;
    }

    const roll = await evaluateDamageRoll(BURST_FORMULA, damageType);
    await roll.toMessage({
      speaker: speakerFor(actor),
      flavor: `Element Burst (${damageType})`,
    });
    const full = Number(roll.total) || 0;

    for (const token of targets) {
      const save = await rollSave(token.actor, "dex", BURST_DC);
      const amount = save.success ? Math.floor(full / 2) : full;
      await applyTypedDamageToTokens({
        tokens: [token],
        amount,
        type: damageType,
        item,
      });
    }

    await chat(
      actor,
      `<p><strong>Element Burst</strong> releases ${damageType} energy (DC ${BURST_DC} Dexterity, half on success). Special reaction — does not consume the reaction.</p>`,
    );
  };

  const advanceState = async (actor) => {
    if (!isBoss(actor)) return;
    const cycle = cycleOf(actor);
    const order = CYCLE_ORDERS[cycle] ?? CYCLE_ORDERS.fire;
    const currentIndex = Number(getFlag(actor, "cycleIndex", 0)) || 0;
    const nextIndex = (currentIndex + 1) % order.length;
    const wrapped = nextIndex === 0;
    const nextState = order[nextIndex];
    const previousState = activeStateOf(actor) ?? order[currentIndex];

    let escaton = foundry.utils.deepClone(getFlag(actor, "escaton", {}) ?? {});
    if (wrapped) {
      escaton.dragonStateCount = 0;
      escaton.usedThisCycle = false;
      escaton.ready = false;
      escaton.charging = false;
    }

    if (nextState === "dragon") {
      escaton.dragonStateCount = Number(escaton.dragonStateCount ?? 0) + 1;
      if (escaton.dragonStateCount >= 2 && !escaton.usedThisCycle) {
        escaton.ready = true;
      }
    }

    await patchState(actor, {
      cycle,
      cycleIndex: nextIndex,
      previousState,
      escaton,
    });
    await setActiveState(actor, nextState);
    await elementBurst(actor, nextState);

    if (escaton.ready && nextState === "dragon") {
      await chat(
        actor,
        `<p><em>Escaton Judgement</em> is available during this second Dragon State (once this cycle).</p>`,
        { whisperGM: true },
      );
    }
  };

  const startCycle = async (actor, cycle) => {
    const next = cycle === "ice" ? "ice" : "fire";
    const startState = next === "ice" ? "ice" : "fire";
    await patchState(actor, {
      cycle: next,
      cycleIndex: 0,
      previousState: null,
      stateHpLost: 0,
      overloadCharges: Number(getFlag(actor, "overloadCharges", 0)) || 0,
      horns: hornsOf(actor),
      escaton: {
        dragonStateCount: 0,
        ready: false,
        charging: false,
        usedThisCycle: false,
      },
      legendaryUsedThisRound: {},
    });
    await setActiveState(actor, startState);
    await chat(
      actor,
      `<p>Active State cycle set to <strong>${next}</strong> (order: ${CYCLE_ORDERS[next].join(" → ")}).</p>`,
    );
  };

  // ─── HP threshold / overload ───

  const applyOverload = async (actor, elementalAmount) => {
    const amount = Number(elementalAmount) || 0;
    const gained = Math.floor(amount / 10);
    if (gained <= 0) return 0;
    const charges = (Number(getFlag(actor, "overloadCharges", 0)) || 0) + gained;
    await patchState(actor, { overloadCharges: charges });
    await chat(
      actor,
      `<p><strong>Elemental Overload:</strong> +${gained} (now <strong>${charges}</strong> charge${charges === 1 ? "" : "s"}).</p>`,
      { whisperGM: true },
    );
    return charges;
  };

  const tallyStateHp = async (actor, amount) => {
    let lost = (Number(getFlag(actor, "stateHpLost", 0)) || 0) + (Number(amount) || 0);
    let advanced = 0;
    while (lost >= STATE_HP_THRESHOLD) {
      lost -= STATE_HP_THRESHOLD;
      advanced += 1;
      // advanceState → setActiveState resets stateHpLost to 0; keep residual in local `lost`
      await advanceState(actor);
    }
    await patchState(actor, { stateHpLost: lost });
    return advanced;
  };

  const onBossDamaged = async (actor, amount, types, elementalAmount = 0) => {
    if (!isBoss(actor) || !isActiveGM()) return;
    const dmg = Number(amount) || 0;
    if (dmg <= 0) return;
    const uniq = [...new Set((types ?? []).map((t) => String(t).toLowerCase()))];
    if (isDuplicateBossHit(actor, dmg, uniq)) return;

    const elemental =
      Number(elementalAmount) > 0
        ? Number(elementalAmount)
        : uniq.filter((t) => ["fire", "cold", "lightning"].includes(t)).length
          ? dmg
          : 0;
    // Only count pure/partial elemental from extract when provided; avoid full HP if mixed unknown
    if (Number(elementalAmount) > 0) await applyOverload(actor, elementalAmount);
    else if (uniq.length && uniq.every((t) => ["fire", "cold", "lightning"].includes(t))) {
      await applyOverload(actor, dmg);
    }

    await tallyStateHp(actor, dmg);
  };

  // ─── Horns ───

  const damageHorn = async (actor, side, amount) => {
    if (!isBoss(actor)) return;
    const key = String(side || "").toLowerCase() === "right" ? "right" : "left";
    const horns = hornsOf(actor);
    const horn = horns[key];
    if (!horn || horn.broken) {
      ui.notifications?.info(`Alatreon ${key} horn is already broken.`);
      return;
    }
    const dmg = Math.max(0, Number(amount) || 0);
    const nextHp = Math.max(0, Number(horn.hp ?? HORN_MAX_HP) - dmg);
    horn.hp = nextHp;
    let broke = false;
    if (nextHp <= 0) {
      horn.broken = true;
      horn.hp = 0;
      broke = true;
    }
    await patchState(actor, { horns });
    await chat(
      actor,
      `<p><strong>${key === "left" ? "Left" : "Right"} Horn:</strong> ${dmg} damage → <strong>${horn.hp}/${HORN_MAX_HP}</strong>${
        broke ? " — <strong>broken!</strong>" : ""
      }</p>`,
    );
    if (broke) await revertToPreviousState(actor);
  };

  const promptDamageHorn = async (actor) => {
    const horns = hornsOf(actor);
    const content = `
      <p>Which horn takes damage? (AC 30; ${HORN_MAX_HP} HP; does not damage Alatreon.)</p>
      <p>Left: ${horns.left.broken ? "BROKEN" : `${horns.left.hp}/${HORN_MAX_HP}`} · Right: ${
        horns.right.broken ? "BROKEN" : `${horns.right.hp}/${HORN_MAX_HP}`
      }</p>
      <div class="form-group"><label>Damage</label><input type="number" name="amount" value="10" min="0" step="1"/></div>
    `;
    const amountFrom = (html) => Number(html.find('[name="amount"]').val()) || 0;

    await new Promise((resolve) => {
      new Dialog({
        title: "Alatreon — Horn Damage",
        content,
        buttons: {
          left: {
            label: "Left",
            callback: async (html) => {
              await damageHorn(actor, "left", amountFrom(html));
              resolve();
            },
          },
          right: {
            label: "Right",
            callback: async (html) => {
              await damageHorn(actor, "right", amountFrom(html));
              resolve();
            },
          },
          cancel: { label: "Cancel", callback: () => resolve() },
        },
        default: "left",
        close: () => resolve(),
      }).render(true);
    });
  };

  // ─── Escaton Judgement ───

  const startEscatonCharge = async (actor) => {
    const escaton = foundry.utils.deepClone(getFlag(actor, "escaton", {}) ?? {});
    if (escaton.usedThisCycle) {
      ui.notifications?.warn("Escaton Judgement was already used this active-state cycle.");
      return;
    }
    if (!escaton.ready && Number(escaton.dragonStateCount ?? 0) < 2) {
      ui.notifications?.warn("Escaton Judgement is only available during the second Dragon State of a cycle.");
      return;
    }
    escaton.charging = true;
    escaton.ready = true;
    await patchState(actor, { escaton });
    await setEffectDisabled(actor, "escatonCharging", false);
    await chat(
      actor,
      `<p><strong>Escaton Judgement</strong> — Alatreon swoops down (no opportunity attacks) and begins gathering energy until the start of its next turn.</p>
       <p>While charging: immune to incapacitated, stunned, paralyzed, and unconscious.</p>`,
    );
  };

  const releaseEscaton = async (actor) => {
    const escaton = foundry.utils.deepClone(getFlag(actor, "escaton", {}) ?? {});
    if (!escaton.charging && !escaton.ready) {
      ui.notifications?.warn("Escaton Judgement is not charging / ready.");
      return;
    }
    const overload = Number(getFlag(actor, "overloadCharges", 0)) || 0;
    const hornsBroken = brokenHornCount(actor);
    const dice = Math.max(0, ESCATON_BASE_DICE - 10 * hornsBroken - overload);
    const origin = bossTokens(actor)[0];
    const item = findItemByRole(actor, "escatonJudgement");

    escaton.charging = false;
    escaton.ready = false;
    escaton.usedThisCycle = true;
    await patchState(actor, { escaton, overloadCharges: 0 });
    await setEffectDisabled(actor, "escatonCharging", true);

    if (dice <= 0) {
      await chat(
        actor,
        `<p><strong>Escaton Release</strong> — energy collapses to nothing (0d6 after horns/overload). Overload charges reset to 0.</p>`,
      );
      return;
    }

    const targets = origin ? tokensInRange(origin, ESCATON_RANGE_FT) : [];
    const roll = await evaluateDamageRoll(`${dice}d6`, "force");
    await roll.toMessage({
      speaker: speakerFor(actor),
      flavor: `Escaton Judgement Release (${dice}d6 force)`,
    });
    const full = Number(roll.total) || 0;

    for (const token of targets) {
      const save = await rollSave(token.actor, "dex", ESCATON_DC);
      const amount = save.success ? Math.floor(full / 2) : full;
      await applyTypedDamageToTokens({
        tokens: [token],
        amount,
        type: "force",
        item,
      });
    }

    await chat(
      actor,
      `<p><strong>Escaton Judgement</strong> detonates (${dice}d6 force, DC ${ESCATON_DC} Dex half, ${ESCATON_RANGE_FT} ft). Horns broken: ${hornsBroken}; overload spent: ${overload}. Charges reset to 0.</p>
       <p><em>GM:</em> obliterate terrain above ground level in the area.</p>`,
    );
  };

  // ─── Zones ───

  const placeStateZone = async (actor, hazard, { label, fillColor, borderColor } = {}) => {
    const origin = bossTokens(actor)[0];
    if (!origin) {
      ui.notifications?.warn("Alatreon token not found for zone placement.");
      return null;
    }
    const combat = game.combat;
    const until = combat
      ? { combatId: combat.id, round: combat.round, restoreOnBossTurnStart: true }
      : { ts: Date.now() + 6000 };
    const doc = await placeHazardTemplate({
      x: origin.center.x,
      y: origin.center.y,
      t: "circle",
      distance: 30,
      fillColor: fillColor ?? (hazard === "frostBreath" ? "#88ccff" : "#ff6600"),
      borderColor: borderColor ?? (hazard === "frostBreath" ? "#2266aa" : "#aa2200"),
      hazard,
      until,
      label: label ?? hazard,
      ownerId: actor.id,
    });
    return doc;
  };

  const applyScorchedEnter = async (token, { reason = "enter" } = {}) => {
    if (!token?.actor || isBoss(token.actor)) return;
    const tpls = hazardTemplates("scorchedEarth");
    if (!tpls.length || !tpls.some((tpl) => tokenInTemplate(token, tpl))) return;
    const turnKey = zoneTickKey(token);
    const ticks = { ...(foundry.utils.getProperty(token.actor, `${FLAG}.zoneTicks`) ?? {}) };
    const key = `scorched-${turnKey}`;
    if (ticks[key] === true && reason !== "move") return;
    ticks[key] = true;
    await token.actor.update({ [`${FLAG}.zoneTicks`]: ticks });
    const boss = bossActors()[0];
    await applyDamageFormula({
      tokens: [token],
      formula: ZONE_ENTER_FORMULA,
      type: "fire",
      flavor: "Scorched Earth",
      item: findItemByRole(boss, "scorchedEarth"),
    });
    await applyIgnited(token, boss);
  };

  const applyFrostEnterOrMove = async (token, { formula = ZONE_MOVE_FORMULA, flavor = "Frost Breath (area)" } = {}) => {
    if (!token?.actor || isBoss(token.actor)) return;
    const tpls = hazardTemplates("frostBreath");
    if (!tpls.length || !tpls.some((tpl) => tokenInTemplate(token, tpl))) return;
    const boss = bossActors()[0];
    await applyDamageFormula({
      tokens: [token],
      formula,
      type: "cold",
      flavor,
      item: findItemByRole(boss, "frostBreath"),
    });
  };

  const applyZoneMovement = async (token, prevCenter, nextCenter) => {
    if (!token?.actor || isBoss(token.actor)) return;
    const movedFt = measurePointDistanceFt(prevCenter, nextCenter);
    if (!Number.isFinite(movedFt) || movedFt < 1) return;

    const scorched = hazardTemplates("scorchedEarth").filter((tpl) =>
      tokenInTemplate(token, tpl, nextCenter),
    );
    const frost = hazardTemplates("frostBreath").filter((tpl) =>
      tokenInTemplate(token, tpl, nextCenter),
    );

    if (scorched.length) {
      const wasIn = prevCenter
        ? hazardTemplates("scorchedEarth").some((tpl) => tokenInTemplate(token, tpl, prevCenter))
        : false;
      if (!wasIn) await applyScorchedEnter(token, { reason: "enter" });
      const accKey = `${token.id}-scorched`;
      const acc = (zoneMoveAcc.get(accKey) ?? 0) + movedFt;
      const steps = Math.floor(acc / 5);
      zoneMoveAcc.set(accKey, acc - steps * 5);
      if (steps > 0) {
        const boss = bossActors()[0];
        for (let i = 0; i < steps; i += 1) {
          await applyDamageFormula({
            tokens: [token],
            formula: ZONE_MOVE_FORMULA,
            type: "fire",
            flavor: "Scorched Earth (per 5 ft)",
            item: findItemByRole(boss, "scorchedEarth"),
          });
        }
      }
    }

    if (frost.length) {
      const wasIn = prevCenter
        ? hazardTemplates("frostBreath").some((tpl) => tokenInTemplate(token, tpl, prevCenter))
        : false;
      if (!wasIn) {
        await applyFrostEnterOrMove(token, {
          formula: ZONE_MOVE_FORMULA,
          flavor: "Frost Breath (enter)",
        });
      }
      const accKey = `${token.id}-frost`;
      const acc = (zoneMoveAcc.get(accKey) ?? 0) + movedFt;
      const steps = Math.floor(acc / 5);
      zoneMoveAcc.set(accKey, acc - steps * 5);
      if (steps > 0) {
        for (let i = 0; i < steps; i += 1) {
          await applyFrostEnterOrMove(token, {
            formula: ZONE_MOVE_FORMULA,
            flavor: "Frost Breath (per 5 ft)",
          });
        }
      }
    }
  };

  const frostStartOfTurn = async (token) => {
    if (!token?.actor || isBoss(token.actor)) return;
    const tpls = hazardTemplates("frostBreath");
    if (!tpls.length || !tpls.some((tpl) => tokenInTemplate(token, tpl))) return;
    const boss = bossActors()[0];
    const save = await rollSave(token.actor, "con", MELEE_DC);
    const roll = await evaluateDamageRoll("5d6", "cold");
    await roll.toMessage({
      speaker: speakerFor(boss ?? token.actor),
      flavor: "Frost Breath (start of turn)",
    });
    const full = Number(roll.total) || 0;
    const amount = save.success ? Math.floor(full / 2) : full;
    await applyTypedDamageToTokens({
      tokens: [token],
      amount,
      type: "cold",
      item: findItemByRole(boss, "frostBreath"),
    });
    if (!save.success && boss) {
      await applyEffectKindToActor(boss, token.actor, "iceblight", { durationSeconds: 60 });
    }
  };

  const ignitedStartOfTurn = async (token) => {
    if (!token?.actor || isBoss(token.actor)) return;
    const ignited = token.actor.effects?.find(
      (ef) => foundry.utils.getProperty(ef, `${FLAG}.kind`) === "ignited" && !ef.disabled,
    );
    if (!ignited) return;
    const boss = bossActors()[0];
    await applyDamageFormula({
      tokens: [token],
      formula: IGNITE_FORMULA,
      type: "fire",
      flavor: "Ignited (Scorched Earth)",
      item: findItemByRole(boss, "scorchedEarth"),
    });
  };

  const onScorchedEarth = async (workflow) => {
    const actor = workflow.actor;
    await placeStateZone(actor, "scorchedEarth", { label: "Scorched Earth" });
    await chat(
      actor,
      `<p><strong>Scorched Earth</strong> burns a 30-ft radius until the start of Alatreon's next turn. Entering or starting a turn: 3d6 fire + ignite; 2d6 fire per 5 ft moved within.</p>`,
    );
  };

  const onFrostBreath = async (workflow) => {
    const actor = workflow.actor;
    await placeStateZone(actor, "frostBreath", {
      label: "Frost Breath",
      fillColor: "#88ccff",
      borderColor: "#2266aa",
    });
    for (const token of failedSaveTokens(workflow)) {
      await applyEffectKindToActor(actor, token.actor, "iceblight", { durationSeconds: 60 });
    }
    await chat(
      actor,
      `<p><strong>Frost Breath</strong> coats a 30-ft radius until the start of Alatreon's next turn. Start of turn: DC ${MELEE_DC} Con (5d6 cold + iceblight). Movement: 2d6 cold per 5 ft.</p>`,
    );
  };

  // ─── Melee / blight riders ───

  const onBiteOrClaws = async (workflow) => {
    const actor = workflow.actor;
    for (const token of hitTokens(workflow)) {
      if (!token.actor) continue;
      const save = await rollSave(token.actor, "con", MELEE_DC);
      if (save.success) continue;
      await applyEffectKindToActor(actor, token.actor, "dragonblight", { durationSeconds: 60 });
      await chat(
        actor,
        `<p>${token.name} fails DC ${MELEE_DC} Con and is afflicted with <strong>dragonblight</strong> (1 minute).</p>`,
      );
    }
  };

  const onTail = async (workflow) => {
    for (const token of hitTokens(workflow)) {
      if (!token.actor) continue;
      const save = await rollSave(token.actor, "str", MELEE_DC);
      if (save.success) continue;
      await applyProne([token]);
    }
  };

  const onBlightSaveAction = async (workflow, role) => {
    const meta = BLIGHT_BY_ROLE[role];
    if (!meta) return;
    const actor = workflow.actor;
    for (const token of failedSaveTokens(workflow)) {
      await applyEffectKindToActor(actor, token.actor, meta.kind, { durationSeconds: 60 });
    }
  };

  const onIceShards = async (workflow) => {
    const actor = workflow.actor;
    const failed = failedSaveTokens(workflow);
    await applyProne(failed);
    for (const token of failed) {
      await chat(
        actor,
        `<p>${token.name} is knocked prone under an <strong>ice chunk</strong> (AC 10; 10 HP; vulnerable to fire; immune to cold/poison/psychic). If it takes necrotic damage, it explodes for ${ICE_SHARD_EXPLODE} piercing in 15 ft.</p>`,
        { whisperGM: true },
      );
      // Best-effort small markers at failed-save tokens
      try {
        await placeHazardTemplate({
          x: token.center.x,
          y: token.center.y,
          t: "circle",
          distance: 2.5,
          fillColor: "#cceeff",
          borderColor: "#6699cc",
          hazard: "iceShard",
          label: "Ice Shard",
          ownerId: actor.id,
          until: game.combat
            ? { combatId: game.combat.id, round: game.combat.round, restoreOnBossTurnStart: true }
            : null,
        });
      } catch {
        /* ignore placement failures */
      }
    }
    await chat(
      actor,
      `<p><strong>Ice Shards</strong> land. Chunks remain until the start of Alatreon's next turn. <em>GM:</em> necrotic damage on a chunk → ${ICE_SHARD_EXPLODE} piercing (15 ft).</p>`,
    );
  };

  const markLegendaryUsed = async (actor, key) => {
    if (!key) return;
    const used = {
      ...(getFlag(actor, "legendaryUsedThisRound", {}) ?? {}),
      [key]: true,
    };
    await patchState(actor, { legendaryUsedThisRound: used });
  };

  const mythicStateOk = (actor, role, identifier) => {
    const required =
      MYTHIC_REQUIRED_STATE[identifier] ??
      MYTHIC_REQUIRED_STATE[role] ??
      null;
    if (!required) return true;
    const current = activeStateOf(actor);
    return current === required;
  };

  // ─── Elemental Breath typing ───

  const mutateBreathDamageType = async (workflow) => {
    const roll = await new Roll("1d4").evaluate();
    const type = BREATH_TYPES[roll.total] ?? "fire";
    workflow.defaultDamageType = type;
    if (workflow.activity?.damage?.parts) {
      for (const part of workflow.activity.damage.parts) {
        if (part?.types) {
          if (part.types instanceof Set) {
            part.types.clear();
            part.types.add(type);
          } else if (Array.isArray(part.types)) {
            part.types.length = 0;
            part.types.push(type);
          } else {
            part.types = [type];
          }
        }
        if (part && "type" in part) part.type = type;
      }
    }
    if (workflow.item?.system?.damage?.parts) {
      /* legacy shape — best effort */
    }
    await chat(
      workflow.actor,
      `<p><strong>Elemental Breath</strong> element roll: <strong>${roll.total}</strong> → <strong>${type}</strong> damage.</p>`,
    );
    return type;
  };

  // ─── onUse ───

  const onUse = async (payload) => {
    if (!isActiveGM()) return;
    const workflow = payload?.workflow ?? payload;
    const item = workflow?.item ?? null;
    if (!item) return;
    const actor = workflow.actor ?? item.actor;
    if (!isBoss(actor)) return;

    const role = foundry.utils.getProperty(item, `${FLAG}.role`);
    const identifier = activityIdentifier(workflow);
    const activation = activationType(workflow);

    if (activation === "legendary") {
      const key = identifier || role || item.id;
      await markLegendaryUsed(actor, key);
    }

    if (!mythicStateOk(actor, role, identifier)) {
      const need =
        MYTHIC_REQUIRED_STATE[identifier] ?? MYTHIC_REQUIRED_STATE[role];
      ui.notifications?.warn(
        `Mythic action requires ${STATE_LABEL[need] ?? need} (currently ${STATE_LABEL[activeStateOf(actor)] ?? "none"}).`,
      );
    }

    switch (role) {
      case "activeState":
        if (identifier === "start-ice-cycle") await startCycle(actor, "ice");
        else if (identifier === "start-fire-cycle") await startCycle(actor, "fire");
        else if (identifier === "advance-state") await advanceState(actor);
        break;
      case "horns":
        await promptDamageHorn(actor);
        break;
      case "elementBurst":
        await elementBurst(actor, activeStateOf(actor) ?? "fire");
        break;
      case "escatonJudgement":
        if (identifier === "release" || identifier === "escaton-release") {
          await releaseEscaton(actor);
        } else {
          await startEscatonCharge(actor);
        }
        break;
      case "elementalBreath":
        // Typing handled in preItemRoll; announce already sent there.
        break;
      case "bite":
      case "claws":
        await onBiteOrClaws(workflow);
        break;
      case "tail":
        await onTail(workflow);
        break;
      case "waterBreath":
      case "arcLightning":
      case "lightningStorm":
        await onBlightSaveAction(workflow, role);
        break;
      case "frostBreath":
        await onFrostBreath(workflow);
        break;
      case "scorchedEarth":
        await onScorchedEarth(workflow);
        break;
      case "iceShards":
        await onIceShards(workflow);
        break;
      case "dragonRush":
        await applyProne(failedSaveTokens(workflow));
        break;
      default:
        break;
    }
  };

  // ─── Combat turns ───

  const onBossTurnStart = async (actor) => {
    await patchState(actor, { legendaryUsedThisRound: {} });
    await expireBossHazards(actor);
    const escaton = getFlag(actor, "escaton", {});
    if (escaton?.charging) {
      await chat(
        actor,
        `<p><em>Escaton Judgement</em> is charged — Alatreon may use its action to <strong>Release</strong>.</p>`,
        { whisperGM: true },
      );
    }
  };

  const onOtherTurnStart = async (combatant) => {
    const tokenDoc = combatant?.token;
    const token =
      tokenDoc?.object ??
      canvas.tokens.get(combatant?.tokenId ?? tokenDoc?.id) ??
      null;
    if (!token) return;
    await applyScorchedEnter(token, { reason: "turnStart" });
    await frostStartOfTurn(token);
    await ignitedStartOfTurn(token);
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

  // ─── Hooks ───

  let hooksArmed = false;

  const ensureHooks = () => {
    if (hooksArmed) return;
    hooksArmed = true;

    Hooks.on("preUpdateActor", (actor, changed) => {
      if (!isBoss(actor)) return;
      if (changed.system?.attributes?.hp?.value === undefined) return;
      prevBossHp.set(actor.id, hpValue(actor));
    });

    Hooks.on("updateActor", (actor, changed) => {
      if (!isBoss(actor) || !isActiveGM()) return;
      const nextHp = changed.system?.attributes?.hp?.value;
      if (nextHp === undefined) return;
      const before = prevBossHp.get(actor.id);
      prevBossHp.delete(actor.id);
      if (before === undefined) return;
      const delta = Math.max(0, Number(before) - Number(nextHp));
      // Fallback when Midi QOL is not the damage path; skip if a midi hit was just recorded
      if (delta > 0) {
        onBossDamaged(actor, delta, ["untyped"], 0).catch((err) =>
          console.error("Alatreon | hp update", err),
        );
      }
    });

    const damageHook = (first, second) => {
      try {
        let actor = null;
        let payload = second ?? first;
        if (first?.actor) actor = first.actor;
        else if (first?.documentName === "Actor") actor = first;
        else if (second?.actor) actor = second.actor;
        if (!actor && payload?.actorUuid) actor = fromUuidSync(payload.actorUuid);
        if (!isBoss(actor)) return;
        const amount = extractAppliedDamage(payload, actor) || extractAppliedDamage(first, actor);
        const types = [...extractDamageTypes(payload), ...extractDamageTypes(first)];
        const elemental =
          extractElementalAmount(payload, actor) || extractElementalAmount(first, actor);
        onBossDamaged(actor, amount, types, elemental).catch((err) =>
          console.error("Alatreon | damaged", err),
        );
      } catch (err) {
        console.error("Alatreon | damage hook", err);
      }
    };

    Hooks.on("midi-qol.DamageApplied", damageHook);
    Hooks.on("midi-qol.RollComplete", (workflow) => {
      if (!workflow) return;
      const hitBoss = [...(workflow.hitTargets ?? [])].find((t) => isBoss(t.actor));
      if (hitBoss) {
        const types = extractDamageTypes(workflow);
        const amount =
          extractAppliedDamage(workflow, hitBoss.actor) ||
          Number(workflow.totalDamage ?? workflow.damageTotal ?? 0);
        const elemental = extractElementalAmount(workflow, hitBoss.actor);
        onBossDamaged(hitBoss.actor, amount, types, elemental).catch((err) =>
          console.error("Alatreon | roll complete", err),
        );
      }
      // Failed-save blight for save-based workflows if onUse ran early
      const actor = workflow.actor;
      if (isBoss(actor) && isActiveGM()) {
        const role = foundry.utils.getProperty(workflow.item, `${FLAG}.role`);
        if (BLIGHT_BY_ROLE[role] && failedSaveTokens(workflow).length) {
          onBlightSaveAction(workflow, role).catch((err) =>
            console.error("Alatreon | blight", err),
          );
        }
      }
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
      applyZoneMovement(token, prevCenter, nextCenter).catch((err) =>
        console.error("Alatreon | zone move", err),
      );
    });

    Hooks.on("combatTurnChange", (combat, prior, current) => {
      handleCombatTurn(combat, prior, current).catch((err) =>
        console.error("Alatreon | turn", err),
      );
    });

    Hooks.on("midi-qol.preItemRoll", async (workflow) => {
      const actor = workflow?.actor;
      if (!isBoss(actor)) return true;

      const role = foundry.utils.getProperty(workflow.item, `${FLAG}.role`);
      const identifier = activityIdentifier(workflow);
      const activation = activationType(workflow);

      if (activation === "legendary") {
        const key = identifier || role || workflow.item?.id;
        const used = getFlag(actor, "legendaryUsedThisRound", {}) ?? {};
        if (key && used[key]) {
          ui.notifications?.warn(
            `Legendary Limit: "${workflow.item?.name ?? key}" was already used this round.`,
          );
          return false;
        }
      }

      if (!mythicStateOk(actor, role, identifier)) {
        const need = MYTHIC_REQUIRED_STATE[identifier] ?? MYTHIC_REQUIRED_STATE[role];
        ui.notifications?.warn(
          `Requires ${STATE_LABEL[need] ?? need} (current: ${
            STATE_LABEL[activeStateOf(actor)] ?? "none"
          }).`,
        );
        return false;
      }

      if (role === "elementalBreath") {
        await mutateBreathDamageType(workflow);
      }

      if (role === "escatonJudgement") {
        const id = identifier || "charge";
        if (id === "release" || id === "escaton-release") {
          const escaton = getFlag(actor, "escaton", {}) ?? {};
          if (!escaton.charging && !escaton.ready) {
            ui.notifications?.warn("Escaton Release requires a charge / ready state.");
            return false;
          }
        }
      }

      return true;
    });
  };

  globalThis.__amellwindAlatreon = {
    NS,
    FLAG,
    isBoss,
    onUse,
    ensureHooks,
    setActiveState,
    advanceState,
    startCycle,
    damageHorn,
    revertToPreviousState,
    applyOverload,
    elementBurst,
    startEscatonCharge,
    releaseEscaton,
    placeHazardTemplate,
    getFlag,
    patchState,
  };
})();
