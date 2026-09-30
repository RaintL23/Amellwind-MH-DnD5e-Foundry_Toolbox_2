/**
 * Jin Dahaad — combat automation (Foundry v12 / dnd5e 4.4 / Midi QOL 12.x).
 * Loaded as a module script on every client; GM-only mutations run on the active GM.
 *
 * Handles: Hunters Quantity HP scaling, Armored Plate tokens, phase thresholds
 * (4 areas), Subzero Shockwave charge/detonation (+ iceblight / Frozen), head-plate
 * Bite window, and Item Macro onUse dispatch.
 */
(() => {
  const NS = "jinDahaad";
  const FLAG = `flags.world.${NS}`;
  const CONDITIONS_NS = "amellwindConditions";

  /**
   * Fallback only — the actor JSON carries `flags.world.jinDahaad.baseline`
   * (written by build-jin-dahaad-actor.mjs), which wins when present.
   */
  const DEFAULT_BASELINE = Object.freeze({
    bossHp: 480,
    plateHp: 40,
    ac: 25,
    plateBreakHpLoss: 10,
    hunterMultipliers: Object.freeze({ 1: 1, 2: 1, 3: 1, 4: 1.5, 5: 2, 6: 2.5 }),
  });
  const PLATE_AC = 20;
  const PLATE_KEYS = Object.freeze(["legs", "tail", "back", "head"]);
  const PLATE_LABEL = Object.freeze({
    legs: "Legs / Claws Plate",
    tail: "Tail Plate",
    back: "Back Plate",
    head: "Head Plate",
  });
  const BACK_ELEVATION_FT = 15;
  const HEAD_ELEVATION_FT = 5;
  const PLATE_IMG = "icons/magic/water/barrier-ice-crystal-wall-blue.webp";
  const ICE_BLOCK_IMG = "icons/magic/water/barrier-ice-crystal-wall-blue.webp";
  /** Restrain-by-ice object (Frost Breath / Mist / Flash Freeze). */
  const ICE_BLOCK_AC = 18;
  const ICE_BLOCK_HP = 20;
  /** Frozen encasement (Subzero fail-by-5 / Frozen condition). */
  const FROZEN_SHELL_AC = 10;
  const FROZEN_SHELL_HP = 15;
  const SUBZERO_RANGE_FT = 80;
  const SUBZERO_DC = 21;
  const SUBZERO_PULL_FT = 10;
  const BREATH_DC = 21;
  const BODY_SLAM_PUSH_FT = 10;
  const CHARGE_PUSH_FT = 15;
  const CLAW_SPLASH_FT = 5;
  const PHASE_AREAS = Object.freeze([
    "Cliff Approach",
    "Frozen Basin",
    "Vertical Spire",
    "Rime Crater (Absolute Zero)",
  ]);

  let hooksArmed = false;
  let lastTurnKey = null;
  const suppressPlateSync = new Set();
  const suppressIceBlockSync = new Set();
  const prevPlateHp = new Map();
  const prevIceBlockHp = new Map();

  const hpValue = (actor) => Number(actor?.system?.attributes?.hp?.value) || 0;

  const isActiveGM = () =>
    Boolean(game.user?.isGM) &&
    (!game.users?.activeGM || game.users.activeGM.id === game.user.id);

  const getFlag = (doc, path, fallback = undefined) => {
    if (!doc) return fallback;
    const value = foundry.utils.getProperty(doc, `${FLAG}.${path}`);
    return value === undefined ? fallback : value;
  };

  const patchState = async (actor, data) => {
    if (!actor) return;
    const update = {};
    for (const [key, value] of Object.entries(data)) {
      update[`${FLAG}.${key}`] = value;
    }
    await actor.update(update);
  };

  const isBoss = (actor) => Boolean(actor && getFlag(actor, "bossNpc") === true);
  const isPlateActor = (actor) => Boolean(actor && getFlag(actor, "plateToken") === true);
  const isIceBlockActor = (actor) => Boolean(actor && getFlag(actor, "iceBlockToken") === true);
  const isProxyActor = (actor) => isPlateActor(actor) || isIceBlockActor(actor);

  const huntersQuantityOf = (actor) => {
    const n = Math.floor(Number(getFlag(actor, "huntersQuantity", 3)) || 3);
    return Math.min(6, Math.max(1, n));
  };

  const baselineOf = (actor) => {
    const raw = getFlag(actor, "baseline", null) || {};
    const num = (value, fallback) => {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };
    return {
      bossHp: num(raw.bossHp, DEFAULT_BASELINE.bossHp),
      plateHp: num(raw.plateHp, DEFAULT_BASELINE.plateHp),
      ac: num(raw.ac, DEFAULT_BASELINE.ac),
      plateBreakHpLoss: num(raw.plateBreakHpLoss, DEFAULT_BASELINE.plateBreakHpLoss),
      hunterMultipliers: { ...DEFAULT_BASELINE.hunterMultipliers, ...(raw.hunterMultipliers || {}) },
    };
  };

  const scalingOf = (actor) => {
    const base = baselineOf(actor);
    const hunters = huntersQuantityOf(actor);
    const mult = Number(base.hunterMultipliers[hunters]) || 1;
    const bossMaxHp = Math.round(base.bossHp * mult);
    const plateMaxHp = Math.max(1, Math.round(base.plateHp * mult));
    const plateBreakHpLoss = Math.max(1, Math.round(base.plateBreakHpLoss * mult));
    return { hunters, mult, bossMaxHp, plateMaxHp, plateBreakHpLoss, baseAc: base.ac };
  };

  const bossActors = () => (game.actors?.contents ?? []).filter((a) => isBoss(a));

  const bossTokens = (actor) =>
    (canvas?.tokens?.placeables ?? []).filter(
      (t) => t.actor && (t.actor === actor || t.actor.id === actor?.id) && !isProxyActor(t.actor),
    );

  const bossTokenOf = (actor, workflow = null) => {
    const fromWorkflow = workflow?.token?.object ?? workflow?.token ?? null;
    if (fromWorkflow?.actor && isBoss(fromWorkflow.actor)) return fromWorkflow;
    return bossTokens(actor)[0] ?? null;
  };

  /** Edge-to-edge distance in feet (Midi when available; center approximation otherwise). */
  const distanceFt = (a, b) => {
    if (!a || !b) return Infinity;
    if (typeof MidiQOL?.computeDistance === "function") {
      const d = Number(MidiQOL.computeDistance(a, b, { wallsBlock: false }));
      if (Number.isFinite(d) && d >= 0) return d;
    }
    const ppf = pixelsPerFoot();
    const centerFt = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y) / ppf;
    const halfA = Math.max(a.w ?? 0, a.h ?? 0) / 2 / ppf;
    const halfB = Math.max(b.w ?? 0, b.h ?? 0) / 2 / ppf;
    return Math.max(0, centerFt - halfA - halfB);
  };

  const pixelsPerFoot = () => {
    const perUnit = Number(canvas?.dimensions?.distancePixels);
    if (Number.isFinite(perUnit) && perUnit > 0) return perUnit;
    const size = canvas?.grid?.size || 100;
    const distance = Number(canvas?.scene?.grid?.distance) || 5;
    return size / distance;
  };

  /**
   * Move a token along the line from `fromCenter`. Positive feet = away, negative = toward.
   * Returns false when blocked by a wall (token stays put; GM resolves manually).
   */
  const shoveToken = async (token, fromCenter, feet) => {
    if (!token?.document || !fromCenter || !feet) return false;
    const dx = token.center.x - fromCenter.x;
    const dy = token.center.y - fromCenter.y;
    const len = Math.hypot(dx, dy);
    if (!len) return false;
    const px = feet * pixelsPerFoot();
    const dest = { x: token.center.x + (dx / len) * px, y: token.center.y + (dy / len) * px };
    if (token.checkCollision?.(dest, { type: "move", mode: "any" })) return false;
    const topLeft = { x: dest.x - token.w / 2, y: dest.y - token.h / 2 };
    const snapped = token.getSnappedPosition?.(topLeft) ?? topLeft;
    await token.document.update({ x: snapped.x, y: snapped.y });
    return true;
  };

  const creatureTokensNear = (origin, feet, { exclude = [] } = {}) =>
    (canvas?.tokens?.placeables ?? []).filter(
      (t) =>
        t.actor &&
        t !== origin &&
        !exclude.includes(t) &&
        !isBoss(t.actor) &&
        !isProxyActor(t.actor) &&
        distanceFt(origin, t) <= feet,
    );

  const speakerFor = (actor) => ChatMessage.getSpeaker({ actor });

  const chat = async (actor, html, { whisperGM = true } = {}) => {
    const data = { speaker: speakerFor(actor), content: html };
    if (whisperGM) {
      data.whisper = game.users.filter((u) => u.isGM).map((u) => u.id);
    }
    await ChatMessage.create(data);
  };

  const findItemByRole = (actor, role) =>
    actor?.items?.find((i) => foundry.utils.getProperty(i, `${FLAG}.role`) === role) ?? null;

  const activitiesOf = (item) => {
    const raw = item?.system?.activities;
    if (!raw) return [];
    if (typeof raw.contents !== "undefined") return [...raw.contents];
    if (typeof raw === "object") return Object.values(raw);
    return [];
  };

  const activityIdentifier = (workflow) => {
    const activity = workflow?.activity ?? workflow?.item?.system?.activities?.contents?.[0];
    return String(
      activity?.midiProperties?.identifier ?? activity?.identifier ?? activity?.id ?? "",
    );
  };

  const emptyPlates = (plateMaxHp) => {
    const out = {};
    for (const key of PLATE_KEYS) {
      out[key] = { hp: plateMaxHp, broken: false };
    }
    return out;
  };

  const platesOf = (actor) => {
    const raw = getFlag(actor, "plates", null);
    const { plateMaxHp } = scalingOf(actor);
    if (!raw || typeof raw !== "object") return emptyPlates(plateMaxHp);
    const out = emptyPlates(plateMaxHp);
    for (const key of PLATE_KEYS) {
      const p = raw[key];
      if (!p) continue;
      out[key] = {
        hp: Math.max(0, Number(p.hp ?? plateMaxHp) || 0),
        broken: Boolean(p.broken),
      };
      if (out[key].broken) out[key].hp = 0;
    }
    return out;
  };

  const plateRefsOf = (actor) => getFlag(actor, "plateRefs", {}) || {};

  const brokenPlateCount = (actor) =>
    PLATE_KEYS.filter((k) => Boolean(platesOf(actor)[k]?.broken)).length;

  const syncBossAc = async (actor) => {
    const broken = brokenPlateCount(actor);
    const ac = Math.max(1, scalingOf(actor).baseAc - broken);
    const current = Number(actor.system?.attributes?.ac?.flat);
    if (current === ac) return ac;
    await actor.update({ "system.attributes.ac.flat": ac, "system.attributes.ac.calc": "flat" });
    return ac;
  };

  const isHeadVulnerable = (actor) => {
    if (getFlag(actor, "headVulnerable", false)) return true;
    return Boolean(
      actor?.effects?.some(
        (ef) =>
          !ef.disabled &&
          foundry.utils.getProperty(ef, `${FLAG}.kind`) === "headVulnerable",
      ),
    );
  };

  const phaseOf = (actor) => Math.min(4, Math.max(1, Number(getFlag(actor, "phase", 1)) || 1));

  const phaseFromHp = (actor) => {
    const max = Number(actor.system?.attributes?.hp?.max) || scalingOf(actor).bossMaxHp;
    const rawValue = Number(actor.system?.attributes?.hp?.value);
    const value = Number.isFinite(rawValue) ? rawValue : max;
    const ratio = max > 0 ? value / max : 1;
    if (ratio > 0.75) return 1;
    if (ratio > 0.5) return 2;
    if (ratio > 0.25) return 3;
    return 4;
  };

  const readySubzero = async (actor) => {
    const item = findItemByRole(actor, "subzeroShockwave");
    if (!item) return;
    const spent = Number(item.system?.uses?.spent) || 0;
    if (spent > 0) {
      await item.update({ "system.uses.spent": 0 });
    }
  };

  const enterPhase = async (actor, phase, { reason = "" } = {}) => {
    const next = Math.min(4, Math.max(1, phase));
    const prev = phaseOf(actor);
    if (next === prev && !reason) return;
    await patchState(actor, { phase: next });
    const area = PHASE_AREAS[next - 1] ?? `Phase ${next}`;
    await chat(
      actor,
      `<p><strong>Jin Dahaad — Phase ${next}/4:</strong> <em>${area}</em>${
        reason ? ` <span>(${reason})</span>` : ""
      }</p>
       <p>Relocate the hunt to the next area on the canvas. Redeploy unbroken plates with <strong>Deploy Armored Plates</strong> if needed.</p>`,
    );
    if (next === 4 && prev < 4) {
      await readySubzero(actor);
      await chat(
        actor,
        `<p><strong>Absolute Zero:</strong> <strong>Subzero Shockwave</strong> is charged and ready.</p>`,
      );
    }
  };

  const syncPhaseFromHp = async (actor) => {
    if (!isBoss(actor)) return;
    const next = phaseFromHp(actor);
    const prev = phaseOf(actor);
    if (next > prev) await enterPhase(actor, next, { reason: "HP threshold" });
  };

  const applyAffliction = async (sourceActor, targetActor, kind, durationSeconds = 60) => {
    if (!sourceActor || !targetActor || !kind) return false;
    const api = globalThis.__amellwindConditions;
    if (api?.applyToActor && api.afflictions?.some((a) => a.id === kind)) {
      await api.applyToActor(targetActor, kind, {
        durationSeconds,
        origin: sourceActor.uuid,
      });
      return true;
    }
    await chat(
      sourceActor,
      `<p><em>GM:</em> apply <strong>${kind}</strong> to ${targetActor.name} (conditions API not armed).</p>`,
      { whisperGM: true },
    );
    return false;
  };

  /**
   * Player-owner save with Foundry configure dialog (Advantage / Normal / Disadvantage)
   * when that UI is enabled — never force Midi/Core fast-forward.
   */
  const requestSave = async (actor, ability, dc, flavor) => {
    const api = globalThis.__amellwindPlayerSaves;
    if (api?.rollSave) {
      return api.rollSave(actor, ability, dc, {
        flavor,
        configure: true,
      });
    }
    // Fallback: local roll with configure dialog (no fastForward).
    if (typeof actor?.rollSavingThrow === "function") {
      const result = await actor.rollSavingThrow(
        { ability, target: dc },
        { configure: true, fastForward: false },
        { data: { flavor } },
      );
      const roll = Array.isArray(result) ? result[0] : result;
      const total = Number(roll?.total ?? roll?._total);
      if (!Number.isFinite(total)) return { success: true, total: dc, cancelled: true };
      return { success: total >= dc, total, roll };
    }
    return { success: true, total: dc, cancelled: true };
  };

  /**
   * Apply typed damage without ignoring resistances / immunities / vulnerabilities.
   * Prefer Midi applyTokenDamage (respects traits); never pass ignore:true.
   */
  const applyTypedDamageToTokens = async ({ tokens, amount, type, item = null }) => {
    const list = (tokens ?? [])
      .map((t) => t?.object ?? t)
      .filter((t) => t?.actor && !isBoss(t.actor));
    const total = Number(amount) || 0;
    if (!list.length || total <= 0) return;

    if (typeof MidiQOL?.applyTokenDamage === "function") {
      const midiDetail = [{ damage: total, type, value: total, damageType: type }];
      try {
        await MidiQOL.applyTokenDamage(
          midiDetail,
          total,
          new Set(list),
          item ?? null,
          new Set(),
        );
        return;
      } catch (err) {
        console.warn("Jin Dahaad | MidiQOL.applyTokenDamage failed", err);
      }
    }

    const damages = [{ value: total, type }];
    for (const token of list) {
      const target = token.actor;
      if (typeof target.applyDamage === "function") {
        try {
          await target.applyDamage(damages);
          continue;
        } catch {
          try {
            await target.applyDamage(total, { type });
            continue;
          } catch {
            /* fall through */
          }
        }
      }
      // Last resort only — still prefer not to bypass traits when applyDamage exists.
      const cur = Number(target.system?.attributes?.hp?.value ?? 0);
      await target.update({ "system.attributes.hp.value": Math.max(0, cur - total) });
    }
  };

  const failedSaveTokens = (workflow) => {
    const failed = [...(workflow.failedSaves ?? [])];
    if (failed.length) return failed;
    const saved = new Set([...(workflow.saves ?? [])].map((t) => t.id ?? t.document?.id));
    return [...(workflow.targets ?? [])].filter((t) => !saved.has(t.id ?? t.document?.id));
  };

  /**
   * Save total rolled by `token` in a Midi workflow, or null when unreadable.
   * Midi 12 exposes per-target totals on `saveDisplayData` ({ target, rollTotal });
   * the other shapes are older / alternative layouts.
   */
  const saveTotalForToken = (workflow, token) => {
    const tid = token?.id ?? token?.document?.id;
    const tuuid = token?.document?.uuid ?? token?.uuid;
    const sameToken = (t) =>
      Boolean(t) && ((t.id ?? t.document?.id) === tid || (t.document?.uuid ?? t.uuid) === tuuid);

    for (const row of workflow?.saveDisplayData ?? []) {
      if (!sameToken(row?.target) && row?.tokenUuid !== tuuid) continue;
      const total = Number(row?.rollTotal ?? row?.total);
      if (Number.isFinite(total)) return total;
    }
    const rolls = workflow?.saveRolls ?? [];
    for (const row of Array.isArray(rolls) ? rolls : []) {
      const rowTokenUuid = row?.options?.tokenUuid ?? row?.data?.tokenUuid;
      if (!sameToken(row?.target ?? row?.token) && rowTokenUuid !== tuuid) continue;
      const total = Number(row?.total ?? row?.roll?.total);
      if (Number.isFinite(total)) return total;
    }
    return null;
  };

  const warnUnreadableSaves = async (boss, tokens, what) => {
    if (!tokens.length) return;
    const names = tokens.map((t) => t?.name ?? t?.actor?.name ?? "?").join(", ");
    await chat(
      boss,
      `<p><em>GM:</em> could not read the save total for <strong>${names}</strong>. Check <strong>${what}</strong> (fail by 5 or more) manually.</p>`,
    );
  };

  // ─── Ice blocks (restrain / Frozen shells) ───

  const buildIceBlockActorData = (boss, victimToken, { mode = "restrain" } = {}) => {
    const isFrozen = mode === "frozen";
    const ac = isFrozen ? FROZEN_SHELL_AC : ICE_BLOCK_AC;
    const maxHp = isFrozen ? FROZEN_SHELL_HP : ICE_BLOCK_HP;
    const label = isFrozen ? "Frozen Ice Shell" : "Ice Block";
    const victimName = victimToken?.actor?.name ?? "target";
    return {
      name: `${label} (${victimName})`,
      type: "npc",
      img: ICE_BLOCK_IMG,
      system: {
        abilities: {
          str: { value: 1 },
          dex: { value: 1 },
          con: { value: 10 },
          int: { value: 1 },
          wis: { value: 1 },
          cha: { value: 1 },
        },
        attributes: {
          ac: { flat: ac, calc: "flat", formula: "" },
          hp: { value: maxHp, max: maxHp, temp: 0, tempmax: 0, formula: "" },
          movement: { walk: 0, units: "ft", hover: false },
        },
        details: {
          biography: {
            value: `<p>${label} encasing <strong>${victimName}</strong>. AC ${ac}; ${maxHp} HP. <strong>Vulnerable to fire</strong>. Immune to piercing, cold, poison, and psychic. Destroying it ends the ${isFrozen ? "Frozen" : "restrained"} condition on the creature.</p>`,
            public: "",
          },
          alignment: "Unaligned",
          type: { value: "", subtype: "", swarm: "", custom: label },
          cr: 0,
          source: { custom: "Amellwind MH (RaintDM)" },
        },
        traits: {
          size: "sm",
          di: { value: ["piercing", "cold", "poison", "psychic"], bypasses: [], custom: "" },
          dr: { value: [], bypasses: [], custom: "" },
          dv: { value: ["fire"], bypasses: [], custom: "" },
          ci: {
            value: [
              "charmed",
              "frightened",
              "poisoned",
              "paralyzed",
              "petrified",
              "prone",
              "restrained",
              "stunned",
              "unconscious",
            ],
            custom: "",
          },
          languages: { value: [], custom: "" },
        },
      },
      prototypeToken: {
        name: `${label} (${victimName})`,
        displayName: 40,
        actorLink: true,
        width: 1,
        height: 1,
        texture: { src: ICE_BLOCK_IMG, fit: "contain", scaleX: 1, scaleY: 1 },
        disposition: -1,
        displayBars: 40,
        bar1: { attribute: "attributes.hp" },
      },
      flags: {
        world: {
          [NS]: {
            iceBlockToken: true,
            iceBlockMode: mode,
            bossId: boss.id,
            victimActorId: victimToken?.actor?.id ?? null,
            victimTokenId: victimToken?.id ?? victimToken?.document?.id ?? null,
          },
        },
      },
    };
  };

  const spawnIceBlockForToken = async (boss, victimToken, { mode = "restrain" } = {}) => {
    if (!boss || !victimToken?.actor || !canvas?.scene) return null;
    if (isBoss(victimToken.actor) || isProxyActor(victimToken.actor)) return null;

    const [blockActor] = await Actor.createDocuments([
      buildIceBlockActorData(boss, victimToken, { mode }),
    ]);
    if (!blockActor) return null;

    const size = canvas.grid?.size || 100;
    const cx = victimToken.center?.x ?? (victimToken.document?.x ?? 0) + size / 2;
    const cy = victimToken.center?.y ?? (victimToken.document?.y ?? 0) + size / 2;
    await canvas.scene.createEmbeddedDocuments("Token", [
      {
        name: blockActor.name,
        actorId: blockActor.id,
        actorLink: true,
        x: cx - size / 2,
        y: cy - size / 2,
        width: 1,
        height: 1,
        elevation: victimToken.document?.elevation ?? 0,
        texture: { src: ICE_BLOCK_IMG, fit: "contain", scaleX: 1, scaleY: 1 },
        disposition: -1,
        displayBars: 40,
        displayName: 40,
        bar1: { attribute: "attributes.hp" },
        flags: {
          world: {
            [NS]: {
              iceBlockToken: true,
              iceBlockMode: mode,
              bossId: boss.id,
              victimActorId: victimToken.actor.id,
              victimTokenId: victimToken.id,
            },
          },
        },
      },
    ]);

    if (mode === "restrain") await ensureRestrainedIce(boss, victimToken.actor);

    return blockActor;
  };

  const isRestrainedIceEffect = (ef) => foundry.utils.getProperty(ef, `${FLAG}.kind`) === "restrainedIce";

  /** Same "Restrained (Ice)" AE the save activities apply, so shattering can remove it. */
  const ensureRestrainedIce = async (boss, victim) => {
    if (!victim) return;
    const already =
      victim.effects?.some((ef) => isRestrainedIceEffect(ef)) || victim.statuses?.has?.("restrained");
    if (already) return;
    let template = null;
    for (const item of boss?.items ?? []) {
      template = item.effects?.find((ef) => isRestrainedIceEffect(ef)) ?? null;
      if (template) break;
    }
    if (template) {
      const data = template.toObject();
      delete data._id;
      data.transfer = false;
      data.origin = template.uuid;
      await victim.createEmbeddedDocuments("ActiveEffect", [data]);
    } else if (typeof victim.toggleStatusEffect === "function") {
      await victim.toggleStatusEffect("restrained", { active: true });
    }
  };

  const victimActorOf = (blockActor) => {
    const tokenId = getFlag(blockActor, "victimTokenId");
    const fromToken = tokenId ? canvas?.scene?.tokens?.get(tokenId)?.actor : null;
    if (fromToken) return fromToken;
    const actorId = getFlag(blockActor, "victimActorId");
    return actorId ? game.actors?.get(actorId) ?? null : null;
  };

  const clearIceBlockVictimCondition = async (blockActor) => {
    const mode = getFlag(blockActor, "iceBlockMode", "restrain");
    const victim = victimActorOf(blockActor);
    if (!victim) return;
    const statusId = mode === "frozen" ? "frozen" : "restrained";
    const toDelete = (victim.effects?.contents ?? []).filter((ef) => {
      if (mode === "frozen") {
        return (
          ef.statuses?.has?.("frozen") ||
          foundry.utils.getProperty(ef, `flags.world.${CONDITIONS_NS}.kind`) === "frozen"
        );
      }
      return isRestrainedIceEffect(ef);
    });
    if (toDelete.length) {
      await victim.deleteEmbeddedDocuments("ActiveEffect", toDelete.map((ef) => ef.id)).catch(() => null);
    }
    if (victim.statuses?.has?.(statusId) && typeof victim.toggleStatusEffect === "function") {
      await victim.toggleStatusEffect(statusId, { active: false }).catch(() => null);
    }
  };

  const onIceBlockHpChanged = async (blockActor, beforeHp, afterHp) => {
    if (!isActiveGM() || !isIceBlockActor(blockActor)) return;
    if (suppressIceBlockSync.has(blockActor.id)) return;
    const next = Math.max(0, Number(afterHp) || 0);
    if (next > 0) return;
    const dmg = Math.max(0, (Number(beforeHp) || 0) - next);
    const bossId = getFlag(blockActor, "bossId");
    const boss = bossId ? game.actors?.get(bossId) : null;
    await clearIceBlockVictimCondition(blockActor);
    await chat(
      boss ?? blockActor,
      `<p><strong>${blockActor.name}</strong> shattered${dmg ? ` (${dmg} damage)` : ""}. The encased creature is freed.</p>`,
    );
    const tokenDocs = (canvas?.tokens?.placeables ?? [])
      .filter((t) => t.actor?.id === blockActor.id)
      .map((t) => t.id);
    if (canvas?.scene && tokenDocs.length) {
      await canvas.scene.deleteEmbeddedDocuments("Token", tokenDocs).catch(() => null);
    }
    suppressIceBlockSync.add(blockActor.id);
    try {
      await blockActor.delete();
    } finally {
      suppressIceBlockSync.delete(blockActor.id);
    }
  };

  const applyIceRestraintsFromWorkflow = async (boss, workflow, { mode = "restrain", onlyFailBy5 = false, dc = BREATH_DC } = {}) => {
    const failed = failedSaveTokens(workflow);
    const unreadable = [];
    let spawned = 0;
    for (const token of failed) {
      if (!token?.actor || isBoss(token.actor) || isProxyActor(token.actor)) continue;
      if (onlyFailBy5) {
        const total = saveTotalForToken(workflow, token);
        if (total == null) {
          unreadable.push(token);
          continue;
        }
        if (total > dc - 5) continue;
      }
      await spawnIceBlockForToken(boss, token, { mode });
      spawned += 1;
    }
    await warnUnreadableSaves(boss, unreadable, "restrained by ice");
    if (spawned) {
      const ac = mode === "frozen" ? FROZEN_SHELL_AC : ICE_BLOCK_AC;
      const hp = mode === "frozen" ? FROZEN_SHELL_HP : ICE_BLOCK_HP;
      await chat(
        boss,
        `<p><strong>${spawned}</strong> ice block${spawned === 1 ? "" : "s"} placed (AC ${ac}; ${hp} HP; <em>vulnerable to fire</em>). Destroying a block frees the creature.</p>`,
      );
    }
  };

  // ─── Hunters Quantity ───

  const applyHuntersQuantity = async (actor, huntersRaw) => {
    if (!isBoss(actor)) return;
    const hunters = Math.min(6, Math.max(1, Math.floor(Number(huntersRaw) || 3)));
    const old = scalingOf(actor);
    const oldBossMax = Number(actor.system?.attributes?.hp?.max) || old.bossMaxHp;
    const rawBossValue = Number(actor.system?.attributes?.hp?.value);
    const oldBossValue = Number.isFinite(rawBossValue) ? rawBossValue : oldBossMax;
    const ratio = oldBossMax > 0 ? oldBossValue / oldBossMax : 1;

    const plates = platesOf(actor);
    const plateRatios = {};
    for (const key of PLATE_KEYS) {
      const p = plates[key];
      plateRatios[key] = p.broken ? 0 : old.plateMaxHp > 0 ? p.hp / old.plateMaxHp : 1;
    }

    await patchState(actor, { huntersQuantity: hunters });
    const next = scalingOf(actor);
    const newValue = oldBossValue <= 0 ? 0 : Math.max(1, Math.round(next.bossMaxHp * ratio));
    await actor.update({
      "system.attributes.hp.max": next.bossMaxHp,
      "system.attributes.hp.value": Math.min(newValue, next.bossMaxHp),
    });

    const nextPlates = emptyPlates(next.plateMaxHp);
    for (const key of PLATE_KEYS) {
      if (plates[key]?.broken) {
        nextPlates[key] = { hp: 0, broken: true };
      } else {
        nextPlates[key] = {
          hp: Math.max(0, Math.min(next.plateMaxHp, Math.round(next.plateMaxHp * plateRatios[key]))),
          broken: false,
        };
      }
    }
    await patchState(actor, { plates: nextPlates, huntersQuantity: hunters });
    await syncBossAc(actor);

    for (const key of PLATE_KEYS) {
      await syncPlateTokenHp(actor, key, nextPlates[key].hp, { broken: nextPlates[key].broken });
    }

    const multLabel =
      hunters <= 3 ? "×1 (max HP)" : hunters === 4 ? "×1.5" : hunters === 5 ? "×2" : "×2.5";
    await chat(
      actor,
      `<p><strong>Hunters Quantity:</strong> <strong>${hunters}</strong> (${multLabel}).</p>
       <ul>
         <li>Boss HP → <strong>${Math.min(newValue, next.bossMaxHp)}/${next.bossMaxHp}</strong></li>
         <li>Plate HP → <strong>${next.plateMaxHp}</strong> each</li>
         <li>Plate break body loss → <strong>${next.plateBreakHpLoss}</strong> HP</li>
       </ul>`,
    );
    await syncPhaseFromHp(actor);
  };

  // ─── Plate tokens ───

  const buildPlateActorData = (boss, key, { hp, broken } = {}) => {
    const { plateMaxHp } = scalingOf(boss);
    const label = PLATE_LABEL[key] ?? key;
    const elevation = key === "back" ? BACK_ELEVATION_FT : key === "head" ? HEAD_ELEVATION_FT : 0;
    return {
      name: `Jin Dahaad — ${label}`,
      type: "npc",
      img: PLATE_IMG,
      system: {
        abilities: {
          str: { value: 10 },
          dex: { value: 10 },
          con: { value: 10 },
          int: { value: 1 },
          wis: { value: 1 },
          cha: { value: 1 },
        },
        attributes: {
          ac: { flat: PLATE_AC, calc: "flat", formula: "" },
          hp: {
            value: broken ? 0 : Math.max(0, Number(hp ?? plateMaxHp) || 0),
            max: plateMaxHp,
            temp: 0,
            tempmax: 0,
            formula: "",
          },
          movement: {
            walk: 0,
            units: "ft",
            hover: elevation > 0,
          },
        },
        details: {
          biography: {
            value: `<p>Armored plate of Jin Dahaad. AC ${PLATE_AC}; ${plateMaxHp} HP. Immune to poison and psychic. Destroying it reduces Jin Dahaad's AC by 1 and deals scaled HP loss to the body.</p>
<p><strong>Head plate</strong> is only damageable on rounds when Jin Dahaad used Bite.</p>`,
            public: "",
          },
          alignment: "Unaligned",
          type: { value: "", subtype: "", swarm: "", custom: "Armored Plate" },
          cr: 0,
          source: { custom: "Amellwind MH (RaintDM)" },
        },
        traits: {
          size: "med",
          di: { value: ["poison", "psychic"], bypasses: [], custom: "" },
          dr: { value: [], bypasses: [], custom: "" },
          dv: { value: [], bypasses: [], custom: "" },
          ci: {
            value: [
              "charmed",
              "frightened",
              "poisoned",
              "paralyzed",
              "petrified",
              "prone",
              "restrained",
              "stunned",
              "unconscious",
            ],
            custom: "",
          },
          languages: { value: [], custom: "" },
        },
      },
      prototypeToken: {
        name: `Jin Dahaad — ${label}`,
        displayName: 40,
        actorLink: true,
        width: 1,
        height: 1,
        elevation,
        texture: { src: PLATE_IMG, fit: "contain", scaleX: 1, scaleY: 1 },
        disposition: -1,
        displayBars: 40,
        bar1: { attribute: "attributes.hp" },
      },
      flags: {
        world: {
          [NS]: {
            plateToken: true,
            plateKey: key,
            bossId: boss.id,
          },
        },
      },
    };
  };

  const plateSpawnOffset = (bossToken, key) => {
    const size = canvas.grid?.size || 100;
    const w = bossToken.w ?? (Number(bossToken.document?.width) || 4) * size;
    const h = bossToken.h ?? (Number(bossToken.document?.height) || 4) * size;
    const c = bossToken.center ?? {
      x: (bossToken.document?.x ?? 0) + w / 2,
      y: (bossToken.document?.y ?? 0) + h / 2,
    };
    const gap = size * 0.9;
    const offsets = {
      legs: { x: -w / 2 - gap, y: h / 4 },
      tail: { x: 0, y: h / 2 + gap },
      back: { x: 0, y: -h / 2 - gap },
      head: { x: 0, y: -h / 2 - gap * 0.35 },
    };
    const o = offsets[key] ?? { x: 0, y: 0 };
    return { x: c.x + o.x - size / 2, y: c.y + o.y - size / 2 };
  };

  const clearPlateTokens = async (actor) => {
    const refs = plateRefsOf(actor);
    const actorIds = [];
    const tokenIdsByScene = new Map();
    for (const key of PLATE_KEYS) {
      const ref = refs[key];
      if (!ref) continue;
      if (ref.actorId) actorIds.push(ref.actorId);
      if (ref.tokenId && ref.sceneId) {
        if (!tokenIdsByScene.has(ref.sceneId)) tokenIdsByScene.set(ref.sceneId, []);
        tokenIdsByScene.get(ref.sceneId).push(ref.tokenId);
      }
    }
    for (const [sceneId, ids] of tokenIdsByScene) {
      const scene = game.scenes?.get(sceneId);
      if (scene && ids.length) {
        await scene.deleteEmbeddedDocuments("Token", ids).catch(() => null);
      }
    }
    if (actorIds.length) {
      await Actor.deleteDocuments(actorIds).catch(() => null);
    }
    // Orphan plates linked to this boss
    const orphans = (game.actors?.contents ?? []).filter(
      (a) => isPlateActor(a) && getFlag(a, "bossId") === actor.id,
    );
    if (orphans.length) {
      await Actor.deleteDocuments(orphans.map((a) => a.id)).catch(() => null);
    }
    await patchState(actor, { plateRefs: {} });
  };

  const syncPlateTokenHp = async (actor, key, hp, { broken = false } = {}) => {
    const ref = plateRefsOf(actor)[key];
    if (!ref?.actorId) return;
    const plateActor = game.actors?.get(ref.actorId);
    if (!plateActor) return;
    suppressPlateSync.add(plateActor.id);
    try {
      await plateActor.update({
        "system.attributes.hp.value": broken ? 0 : Math.max(0, Number(hp) || 0),
        "system.attributes.hp.max": scalingOf(actor).plateMaxHp,
      });
      if (ref.tokenId && ref.sceneId) {
        const scene = game.scenes?.get(ref.sceneId);
        const tok = scene?.tokens?.get(ref.tokenId);
        if (tok) await tok.update({ hidden: Boolean(broken) }).catch(() => null);
      }
    } finally {
      suppressPlateSync.delete(plateActor.id);
    }
  };

  const spawnPlateTokens = async (actor) => {
    if (!isBoss(actor)) return;
    if (!canvas?.scene) {
      ui.notifications?.warn("Place Jin Dahaad on a scene before deploying plates.");
      return;
    }
    const origin = bossTokens(actor)[0];
    if (!origin) {
      ui.notifications?.warn("Jin Dahaad token not found on the current scene.");
      return;
    }

    await clearPlateTokens(actor);
    const plates = platesOf(actor);
    const created = [];

    for (const key of PLATE_KEYS) {
      const plate = plates[key];
      const [plateActor] = await Actor.createDocuments([
        buildPlateActorData(actor, key, {
          hp: plate.broken ? 0 : plate.hp,
          broken: Boolean(plate.broken),
        }),
      ]);
      created.push({ key, plateActor, plate });
    }

    const tokenPayloads = created.map(({ key, plateActor, plate }) => {
      const pos = plateSpawnOffset(origin, key);
      const elevation =
        key === "back" ? BACK_ELEVATION_FT : key === "head" ? HEAD_ELEVATION_FT : 0;
      return {
        name: plateActor.name,
        actorId: plateActor.id,
        actorLink: true,
        x: pos.x,
        y: pos.y,
        elevation,
        width: 1,
        height: 1,
        texture: { src: PLATE_IMG, fit: "contain", scaleX: 1, scaleY: 1 },
        disposition: -1,
        displayBars: 40,
        displayName: 40,
        bar1: { attribute: "attributes.hp" },
        hidden: Boolean(plate.broken),
        flags: {
          world: {
            [NS]: {
              plateToken: true,
              plateKey: key,
              bossId: actor.id,
            },
          },
        },
      };
    });

    const createdTokens = await canvas.scene.createEmbeddedDocuments("Token", tokenPayloads);
    const plateRefs = {};
    for (const { key, plateActor } of created) {
      const tokDoc =
        createdTokens.find((t) => t.actorId === plateActor.id) ??
        createdTokens.find((t) => foundry.utils.getProperty(t, `${FLAG}.plateKey`) === key) ??
        null;
      plateRefs[key] = {
        actorId: plateActor.id,
        tokenId: tokDoc?.id ?? null,
        sceneId: canvas.scene.id,
      };
    }
    await patchState(actor, { plateRefs });

    const { plateMaxHp } = scalingOf(actor);
    const lines = PLATE_KEYS.map((key) => {
      const p = plates[key];
      return `<li><strong>${PLATE_LABEL[key]}:</strong> ${
        p.broken ? "BROKEN" : `${p.hp}/${plateMaxHp}`
      }</li>`;
    }).join("");
    await chat(
      actor,
      `<p><strong>Armored Plates deployed</strong> (AC ${PLATE_AC}). Back at ${BACK_ELEVATION_FT} ft; Head at ${HEAD_ELEVATION_FT} ft (damageable only after Bite).</p>
       <ul>${lines}</ul>
       <p>Destroying a plate: AC −1 and scaled HP loss to Jin Dahaad.</p>`,
    );
  };

  const onPlateBroken = async (boss, key) => {
    const { plateBreakHpLoss } = scalingOf(boss);
    const hp = Number(boss.system?.attributes?.hp?.value) || 0;
    const nextHp = Math.max(0, hp - plateBreakHpLoss);
    await boss.update({ "system.attributes.hp.value": nextHp });
    const ac = await syncBossAc(boss);
    await chat(
      boss,
      `<p><strong>${PLATE_LABEL[key]} shattered!</strong> Jin Dahaad loses <strong>${plateBreakHpLoss}</strong> HP. AC now <strong>${ac}</strong>.</p>`,
    );
    await syncPhaseFromHp(boss);
  };

  const onPlateHpChanged = async (plateActor, beforeHp, afterHp) => {
    if (!isActiveGM() || !isPlateActor(plateActor)) return;
    if (suppressPlateSync.has(plateActor.id)) return;
    const key = String(getFlag(plateActor, "plateKey", "") || "").toLowerCase();
    const bossId = getFlag(plateActor, "bossId");
    if (!PLATE_KEYS.includes(key) || !bossId) return;
    const boss = game.actors?.get(bossId);
    if (!isBoss(boss)) return;

    const plates = platesOf(boss);
    const plate = plates[key];
    if (!plate || plate.broken) return;

    if (key === "head" && !isHeadVulnerable(boss)) {
      suppressPlateSync.add(plateActor.id);
      try {
        await plateActor.update({ "system.attributes.hp.value": beforeHp });
      } finally {
        suppressPlateSync.delete(plateActor.id);
      }
      await chat(
        boss,
        `<p><em>Head Plate</em> ignored damage — only targetable on rounds when Jin Dahaad used <strong>Bite</strong>.</p>`,
      );
      return;
    }

    const nextHp = Math.max(0, Number(afterHp) || 0);
    const dmg = Math.max(0, (Number(beforeHp) || 0) - nextHp);
    plate.hp = nextHp;
    const broke = nextHp <= 0;
    if (broke) {
      plate.broken = true;
      plate.hp = 0;
    }
    await patchState(boss, { plates });
    if (dmg > 0 || broke) {
      await chat(
        boss,
        `<p><strong>${PLATE_LABEL[key]}:</strong> ${
          dmg > 0 ? `${dmg} damage → ` : ""
        }<strong>${plate.hp}/${scalingOf(boss).plateMaxHp}</strong>${
          broke ? " — <strong>broken!</strong>" : ""
        }</p>`,
      );
    }
    if (broke) {
      await syncPlateTokenHp(boss, key, 0, { broken: true });
      await onPlateBroken(boss, key);
    }
  };

  // ─── Subzero Shockwave ───

  const clearSubzeroChargeEffects = async (actor) => {
    const toRemove = (actor.effects?.contents ?? []).filter(
      (ef) => foundry.utils.getProperty(ef, `${FLAG}.kind`) === "subzeroCharge",
    );
    if (toRemove.length) {
      // DAE turnStart may delete the same AE concurrently.
      await actor
        .deleteEmbeddedDocuments(
          "ActiveEffect",
          toRemove.map((e) => e.id),
        )
        .catch(() => null);
    }
  };

  const namesOf = (tokens) => tokens.map((t) => t?.name ?? t?.actor?.name ?? "?").join(", ");

  /** Push each failed-save creature away from the boss; whisper the GM when a wall blocks it. */
  const pushFailedSaves = async (boss, workflow, feet, label) => {
    const bossTok = bossTokenOf(boss, workflow);
    if (!bossTok) return;
    const blocked = [];
    for (const raw of failedSaveTokens(workflow)) {
      const token = raw?.object ?? raw;
      if (!token?.actor || isBoss(token.actor) || isProxyActor(token.actor)) continue;
      const moved = await shoveToken(token, bossTok.center, feet).catch(() => false);
      if (!moved) blocked.push(token);
    }
    if (blocked.length) {
      await chat(
        boss,
        `<p><em>GM:</em> ${label} push (${feet} ft) blocked for <strong>${namesOf(blocked)}</strong> — move manually.</p>`,
      );
    }
  };

  const restoreLegendaryActions = async (actor) => {
    const legMax = Number(actor.system?.resources?.legact?.max) || 3;
    await actor.update({ "system.resources.legact.value": legMax });
  };

  const startSubzeroCharge = async (actor, workflow) => {
    // Native Charge activity applies the Subzero Charging AE (speed 0 / no LA).
    // Module tracks the charging flag for wind-pressure hooks, shoves adjacent creatures, and chats.
    await patchState(actor, {
      subzero: { charging: true, detonationDue: false, chargedRound: game.combat?.round ?? null },
    });
    const bossTok = bossTokenOf(actor, workflow);
    if (bossTok) {
      for (const token of creatureTokensNear(bossTok, 5)) {
        await shoveToken(token, bossTok.center, 5).catch(() => false);
      }
    }
    await chat(
      actor,
      `<p><strong>Subzero Shockwave — Charge.</strong> Ice walls rise; creatures within 5 ft are pushed 5 ft away (native AE: speed 0, no legendary actions).</p>
       <p>Creatures that start their turn within ${SUBZERO_RANGE_FT} ft: DC ${SUBZERO_DC} Strength save or prone (fail by 5+ → pulled ${SUBZERO_PULL_FT} ft). Saves use the player Adv/Disadv dialog.</p>
       <p>At the start of Jin Dahaad's next turn, use <strong>Subzero Shockwave: Detonate</strong>.</p>`,
      { whisperGM: false },
    );
  };

  /** Charge lasts until the start of the boss's next turn; then detonation is due. */
  const onBossTurnStart = async (actor) => {
    const sub = getFlag(actor, "subzero", {}) || {};
    if (sub.charging) {
      await patchState(actor, { subzero: { charging: false, detonationDue: true, chargedRound: null } });
      await clearSubzeroChargeEffects(actor);
      await restoreLegendaryActions(actor);
      await chat(
        actor,
        `<p><strong>Subzero Shockwave:</strong> the charge is complete — use <strong>Subzero Shockwave: Detonate</strong> now (start of Jin Dahaad's turn).</p>`,
      );
      return;
    }
    if (sub.detonationDue) {
      await patchState(actor, { subzero: { charging: false, detonationDue: false, chargedRound: null } });
      await chat(
        actor,
        `<p><em>GM:</em> Subzero Shockwave was charged but never detonated last turn. Hunt state cleared.</p>`,
      );
    }
  };

  const resolveSubzeroDetonation = async (actor, workflow) => {
    const wasCharging = Boolean(getFlag(actor, "subzero.charging", false));
    await patchState(actor, { subzero: { charging: false, detonationDue: false, chargedRound: null } });
    await clearSubzeroChargeEffects(actor);
    if (wasCharging) await restoreLegendaryActions(actor);

    // Damage is native Midi save activity. Module adds Amellwind riders + ice shells.
    const failed = failedSaveTokens(workflow);
    const unreadable = [];
    for (const token of failed) {
      const target = token?.actor;
      if (!target || isBoss(target) || isProxyActor(target)) continue;
      await applyAffliction(actor, target, "iceblight", 60);
      const total = saveTotalForToken(workflow, token);
      if (total == null) {
        unreadable.push(token);
        continue;
      }
      if (total <= SUBZERO_DC - 5) {
        await applyAffliction(actor, target, "frozen", 60);
        await spawnIceBlockForToken(actor, token, { mode: "frozen" });
      }
    }
    await warnUnreadableSaves(actor, unreadable, "Frozen + ice shell");

    await chat(
      actor,
      `<p><strong>Subzero Shockwave detonates!</strong> Failed saves: <strong>Iceblight</strong>. Fail by 5 or more: also <strong>Frozen</strong> + ice shell (AC ${FROZEN_SHELL_AC}; ${FROZEN_SHELL_HP} HP; vulnerable to fire).</p>`,
      { whisperGM: false },
    );
  };

  const windPressureOnTurnStart = async (combatant) => {
    if (!isActiveGM()) return;
    const token = canvas?.tokens?.get(combatant?.tokenId);
    const actor = token?.actor ?? combatant?.actor;
    if (!actor || isBoss(actor) || isProxyActor(actor)) return;

    for (const boss of bossActors()) {
      const sub = getFlag(boss, "subzero", {}) || {};
      if (!sub.charging) continue;
      const bossTok = bossTokens(boss)[0];
      if (!bossTok || !token) continue;
      const dist = distanceFt(token, bossTok);
      if (!Number.isFinite(dist) || dist > SUBZERO_RANGE_FT) continue;

      const result = await requestSave(
        actor,
        "str",
        SUBZERO_DC,
        `Jin Dahaad — Subzero Wind Pressure (DC ${SUBZERO_DC} Strength)`,
      );
      if (result?.cancelled) continue;
      const total = Number(result?.total);
      if (!Number.isFinite(total)) continue;
      if (result.success !== false && total >= SUBZERO_DC) continue;

      if (typeof actor.toggleStatusEffect === "function") {
        await actor.toggleStatusEffect("prone", { active: true });
      }
      if (total <= SUBZERO_DC - 5) {
        // Never pull into the boss's space: stop adjacent (5 ft).
        const pull = Math.min(SUBZERO_PULL_FT, dist - 5);
        if (pull > 0) {
          const moved = await shoveToken(token, bossTok.center, -pull).catch(() => false);
          if (!moved) {
            await chat(
              boss,
              `<p><em>GM:</em> Wind Pressure pull blocked for <strong>${token.name}</strong> — move ${pull} ft toward Jin Dahaad manually.</p>`,
            );
          }
        }
      }
    }
  };

  // ─── Claw cold splash ───

  const coldDamageOf = (workflow) => {
    const rolls = workflow?.damageRolls ?? (workflow?.damageRoll ? [workflow.damageRoll] : []);
    return rolls.reduce((sum, roll) => {
      const type = String(roll?.options?.type ?? "").toLowerCase();
      return type === "cold" ? sum + (Number(roll?.total) || 0) : sum;
    }, 0);
  };

  /** Each creature within 5 ft of the Claw target takes the cold damage dealt (traits respected). */
  const resolveClawSplash = async (boss, workflow) => {
    const cold = coldDamageOf(workflow);
    if (cold <= 0) return;
    const hits = [...(workflow?.hitTargets ?? [])].map((t) => t?.object ?? t).filter((t) => t?.actor);
    const splashed = new Set();
    for (const target of hits) {
      for (const token of creatureTokensNear(target, CLAW_SPLASH_FT, { exclude: hits })) {
        splashed.add(token);
      }
    }
    if (!splashed.size) return;
    const tokens = [...splashed];
    await applyTypedDamageToTokens({ tokens, amount: cold, type: "cold", item: workflow?.item ?? null });
    await chat(
      boss,
      `<p><strong>Claw — cold splash:</strong> ${cold} cold damage to <strong>${namesOf(tokens)}</strong> (within ${CLAW_SPLASH_FT} ft of the target).</p>`,
      { whisperGM: false },
    );
  };

  // ─── onUse ───

  const onUse = async (payload) => {
    if (!isActiveGM()) {
      if (game.user?.isGM) {
        ui.notifications?.warn("Jin Dahaad automations run on the active GM client only.");
      }
      return;
    }
    const workflow = payload?.workflow ?? payload;
    const item = workflow?.item ?? null;
    if (!item) return;
    const actor = workflow.actor ?? item.actor;
    if (!isBoss(actor)) return;

    const role = foundry.utils.getProperty(item, `${FLAG}.role`);
    const identifier = activityIdentifier(workflow);

    switch (role) {
      case "huntersQuantity": {
        const match = String(identifier).match(/hunters-([1-6])/);
        if (match) await applyHuntersQuantity(actor, Number(match[1]));
        break;
      }
      case "armoredPlates":
        if (identifier === "clear-plates") await clearPlateTokens(actor);
        else await spawnPlateTokens(actor);
        break;
      case "phaseShift": {
        const match = String(identifier).match(/phase-([1-4])/);
        if (match) await enterPhase(actor, Number(match[1]), { reason: "manual Phase Shift" });
        break;
      }
      case "subzeroShockwave":
        if (identifier === "subzero-detonate" || identifier === "detonate") {
          await resolveSubzeroDetonation(actor, workflow);
        } else {
          await startSubzeroCharge(actor, workflow);
        }
        break;
      case "claw":
        await resolveClawSplash(actor, workflow);
        break;
      case "legendaryAttack":
        if (identifier === "legendary-claw") await resolveClawSplash(actor, workflow);
        break;
      case "bodySlam":
        await pushFailedSaves(actor, workflow, BODY_SLAM_PUSH_FT, "Body Slam");
        break;
      case "charge":
        await pushFailedSaves(actor, workflow, CHARGE_PUSH_FT, "Charge");
        break;
      case "frostBreath":
        // Native Midi handles damage (+ optional restrain AE). Module: ice-block tokens on fail-by-5.
        await applyIceRestraintsFromWorkflow(actor, workflow, {
          mode: "restrain",
          onlyFailBy5: true,
          dc: BREATH_DC,
        });
        break;
      case "frostMist":
      case "flashFreeze":
        // Native Midi applies Restrained AE on fail. Module: ice-block tokens.
        await applyIceRestraintsFromWorkflow(actor, workflow, {
          mode: "restrain",
          onlyFailBy5: false,
          dc: BREATH_DC,
        });
        break;
      default:
        break;
    }
  };

  // ─── Hooks ───

  const onCombatTurnChange = async (combat) => {
    if (!isActiveGM()) return;
    const c = combat?.combatant;
    if (!c) return;
    const turnKey = `${combat.id}:${combat.round}:${combat.turn}`;
    if (turnKey === lastTurnKey) return;
    lastTurnKey = turnKey;

    if (isBoss(c.actor)) {
      await onBossTurnStart(c.actor);
      return;
    }
    await windPressureOnTurnStart(c);
  };

  const ensureHooks = () => {
    if (hooksArmed) return;
    hooksArmed = true;

    Hooks.on("preUpdateActor", (actor, changed) => {
      if (changed.system?.attributes?.hp?.value === undefined) return;
      if (isPlateActor(actor)) {
        prevPlateHp.set(actor.id, hpValue(actor));
        return;
      }
      if (isIceBlockActor(actor)) {
        prevIceBlockHp.set(actor.id, hpValue(actor));
      }
    });

    Hooks.on("updateActor", (actor, changed) => {
      if (!isActiveGM()) return;
      const nextHp = changed.system?.attributes?.hp?.value;
      if (nextHp === undefined) return;

      if (isIceBlockActor(actor)) {
        const before = prevIceBlockHp.get(actor.id);
        prevIceBlockHp.delete(actor.id);
        if (before === undefined) return;
        onIceBlockHpChanged(actor, before, nextHp).catch((err) =>
          console.error("Jin Dahaad | ice block hp", err),
        );
        return;
      }

      if (isPlateActor(actor)) {
        const before = prevPlateHp.get(actor.id);
        prevPlateHp.delete(actor.id);
        if (before === undefined) return;
        onPlateHpChanged(actor, before, nextHp).catch((err) =>
          console.error("Jin Dahaad | plate hp", err),
        );
        return;
      }

      if (isBoss(actor)) {
        syncPhaseFromHp(actor).catch((err) => console.error("Jin Dahaad | phase", err));
      }
    });

    // combatTurnChange already covers round changes; do not also listen to updateCombat.
    Hooks.on("combatTurnChange", (combat) => {
      onCombatTurnChange(combat).catch((err) =>
        console.error("Jin Dahaad | combatTurnChange", err),
      );
    });

    // Boss AoEs hit "each creature": plates / ice blocks are objects, never boss targets.
    Hooks.on("midi-qol.preambleComplete", (workflow) => {
      if (!isBoss(workflow?.actor) || !(workflow?.targets instanceof Set)) return;
      for (const token of [...workflow.targets]) {
        if (isProxyActor(token?.actor)) workflow.targets.delete(token);
      }
    });
  };

  globalThis.__amellwindJinDahaad = {
    NS,
    FLAG,
    ensureHooks,
    onUse,
    scalingOf,
    applyHuntersQuantity,
    spawnPlateTokens,
    clearPlateTokens,
    enterPhase,
    syncPhaseFromHp,
    startSubzeroCharge,
    readySubzero,
    platesOf,
    bossActors,
    requestSave,
    applyTypedDamageToTokens,
    spawnIceBlockForToken,
  };
})();
